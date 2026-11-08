/* Starry sky behind the page in the dark theme.
   Two canvases: .sky-field holds the Milky Way and the faint stars and is painted once;
   .sky-glints holds the brighter stars, which twinkle and drift a little on scroll.
   The field is seeded, so it looks the same on every visit. Stars are dimmer behind the
   text column. Whether the sky shows at all is decided in CSS (--sky-display). */
(function () {
  "use strict";

  var sky = document.querySelector(".sky");
  if (!sky) return;

  var fieldCanvas = sky.querySelector(".sky-field");
  var glintCanvas = sky.querySelector(".sky-glints");
  if (!fieldCanvas || !glintCanvas || !fieldCanvas.getContext) return;

  var fieldCtx = fieldCanvas.getContext("2d", { alpha: false });
  var glintCtx = glintCanvas.getContext("2d");
  if (!fieldCtx || !glintCtx) return;

  var SEED = 20261108;
  var MAX_PIXELS = 7e6;           // per canvas; lowers the resolution on very large screens
  var TWINKLE_INTERVAL = 33;      // ms; about 30 fps, enough for the fastest flicker
  var PAGE_HALF_WIDTH = 520;      // half of --page in style.css
  var SKY_CELL = 4;               // CSS px per computed point of the Milky Way

  // Blue-white stars dominate, as they do in long exposures; the last two are the warm ones.
  var STAR_COLOURS = [
    [205, 222, 255], [255, 255, 255], [226, 236, 255], [205, 222, 255],
    [255, 255, 255], [226, 236, 255], [255, 238, 210], [255, 212, 176]
  ];

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var W = 0, H = 0, dpr = 1;
  var glints = [], sprites = null, flares = null;
  var built = false, dirty = true, frame = 0, lastDraw = 0;

  function makeRandom(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussian(rand) {
    var u = Math.max(rand(), 1e-6);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  }

  function smooth(a, b, x) {
    var t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }

  function pick(list, rand) { return list[Math.floor(rand() * list.length)]; }

  function makeCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  // 0.5 behind the text column, rising to 1 in the margins.
  function textDimming(x) {
    return 0.5 + 0.5 * smooth(-40, 120, Math.abs(x - W / 2) - PAGE_HALF_WIDTH);
  }

  // Fractal value noise; returns about 0.5 on average, mostly within 0.25 to 0.75.
  function makeNoise(rand) {
    var size = 256, table = new Float32Array(size * size), i;
    for (i = 0; i < table.length; i++) table[i] = rand();

    function at(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y);
      var fx = x - xi, fy = y - yi;
      var u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      var x0 = xi & 255, x1 = (x0 + 1) & 255, y0 = yi & 255, y1 = (y0 + 1) & 255;
      var a = table[y0 * size + x0], b = table[y0 * size + x1];
      var c = table[y1 * size + x0], d = table[y1 * size + x1];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }

    return function (x, y, octaves) {
      var sum = 0, amp = 0.5, norm = 0;
      for (var o = 0; o < octaves; o++) {
        sum += amp * at(x, y);
        norm += amp;
        x = x * 2.03 + 17.3;
        y = y * 2.03 + 9.1;
        amp *= 0.5;
      }
      return sum / norm;
    };
  }

  // ---------- Milky Way ----------

  function makeBand() {
    var diagonal = Math.sqrt(W * W + H * H);
    var angle = -0.85 * Math.atan2(H, W);
    return {
      cx: W * 0.54,
      cy: H * 0.46,
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      half: diagonal * 0.56,
      sigma: diagonal * 0.065
    };
  }

  // The band is widest at its centre and narrows towards the ends.
  function bandWidth(band, t) {
    var u = t / (0.55 * band.half);
    return band.sigma * (0.6 + 0.75 * Math.exp(-u * u));
  }

  // A random point in the band.
  function bandPoint(band, rand) {
    var t = (rand() * 2 - 1) * band.half;
    var n = gaussian(rand) * bandWidth(band, t);
    return { x: band.cx + band.dx * t - band.dy * n, y: band.cy + band.dy * t + band.dx * n };
  }

  /* The background is computed point by point on a coarse grid and scaled up. Stacking many
     translucent canvas gradients instead leaves a visible grid, because the browser's ordered
     dithering lines up from one layer to the next. Peak brightness is kept low for the text. */
  function paintBackground(band, rand) {
    var cols = Math.ceil(W / SKY_CELL) + 2, rows = Math.ceil(H / SKY_CELL) + 2;
    var layer = makeCanvas(cols, rows);
    var ctx = layer.getContext("2d");
    var img = ctx.createImageData(cols, rows);
    var px = img.data;
    var fbm = makeNoise(rand);
    var f = 1 / (band.sigma * 1.5);
    var k = 0;

    for (var j = 0; j < rows; j++) {
      var y = j * SKY_CELL;
      var depth = y / H;
      for (var i = 0; i < cols; i++, k += 4) {
        var x = i * SKY_CELL;
        var r = 7 + 3 * depth, g = 10 + 6 * depth, b = 19 + 11 * depth;

        var haze = smooth(0.42, 0.72, fbm(x * f * 0.45 + 40, y * f * 0.45 + 11, 3));
        r += 5 * haze;
        g += 7 * haze;
        b += 15 * haze;

        var rx = x - band.cx, ry = y - band.cy;
        var t = rx * band.dx + ry * band.dy;
        var n = ry * band.dx - rx * band.dy;
        var s = bandWidth(band, t);
        if (Math.abs(n) < s * 3.6) {
          var warp = (fbm(x * f * 0.8 + 7, y * f * 0.8 + 3, 3) - 0.5) * s * 1.6;
          var across = (n + warp) / s;
          var glow = Math.exp(-0.5 * across * across);
          var clouds = smooth(0.34, 0.7, fbm(x * f, y * f, 5));
          var laneAt = (n + warp * 0.6) / (s * 0.34);
          var dust = Math.exp(-0.5 * laneAt * laneAt) * smooth(0.42, 0.62, fbm(x * f * 1.9 + 21, y * f * 1.9 + 5, 4));
          var density = glow * (0.3 + 0.7 * clouds) * (1 - 0.78 * dust);
          var coreAlong = t / (0.5 * band.half);
          var core = Math.exp(-0.5 * (across / 0.55) * (across / 0.55) - coreAlong * coreAlong);
          r += density * (20 + 32 * core);
          g += density * (27 + 20 * core);
          b += density * (52 + 6 * core);
        }

        // Half a level of noise keeps the very dark gradients from banding.
        px[k] = r + rand() - 0.5;
        px[k + 1] = g + rand() - 0.5;
        px[k + 2] = b + rand() - 0.5;
        px[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return { canvas: layer, width: cols * SKY_CELL, height: rows * SKY_CELL };
  }

  // ---------- Painting ----------

  function dot(ctx, x, y, radius, colour, alpha) {
    ctx.fillStyle = rgba(colour, alpha);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  function paintField(band, rand) {
    var ctx = fieldCtx;
    var area = W * H;
    var i, n, p, x, y, mag;

    var background = paintBackground(band, rand);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(background.canvas, 0, 0, background.width, background.height);

    n = Math.min(800, area / 4800);
    for (i = 0; i < n; i++) {
      x = rand() * W;
      y = rand() * H;
      mag = rand();
      dot(ctx, x, y, 0.35 + mag * mag * mag * 0.75, pick(STAR_COLOURS, rand), (0.22 + rand() * 0.58) * textDimming(x));
    }

    // The unresolved crowd of the Milky Way itself.
    n = Math.min(3200, area / 800);
    for (i = 0; i < n; i++) {
      p = bandPoint(band, rand);
      mag = rand();
      dot(ctx, p.x, p.y, 0.3 + mag * mag * mag * mag * 0.55, pick(STAR_COLOURS, rand), (0.14 + rand() * 0.46) * textDimming(p.x));
    }
  }

  function makeSprite(colour, withFlare) {
    var size = 128, mid = size / 2;
    var canvas = makeCanvas(size, size);
    var ctx = canvas.getContext("2d");
    var g = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.07, rgba(colour, 0.95));
    g.addColorStop(0.2, rgba(colour, 0.24));
    g.addColorStop(0.5, rgba(colour, 0.05));
    g.addColorStop(1, rgba(colour, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    if (withFlare) {
      var h = ctx.createLinearGradient(0, 0, size, 0);
      var v = ctx.createLinearGradient(0, 0, 0, size);
      [h, v].forEach(function (line) {
        line.addColorStop(0.12, rgba(colour, 0));
        line.addColorStop(0.5, rgba(colour, 0.34));
        line.addColorStop(0.88, rgba(colour, 0));
      });
      ctx.fillStyle = h;
      ctx.fillRect(0, mid - 0.75, size, 1.5);
      ctx.fillStyle = v;
      ctx.fillRect(mid - 0.75, 0, 1.5, size);
    }
    return canvas;
  }

  // Three unrelated sine rates per star, so that no star pulses regularly.
  function addFlicker(star, rand, amount) {
    var rate = 0.0016 + rand() * 0.0034;
    star.amount = amount * (0.6 + 0.4 * (2 * textDimming(star.x) - 1));  // a little calmer behind the text
    star.w1 = rate;
    star.w2 = rate * (1.7 + rand() * 0.9);
    star.w3 = rate * (3.1 + rand() * 1.6);
    star.p1 = rand() * 2 * Math.PI;
    star.p2 = rand() * 2 * Math.PI;
    star.p3 = rand() * 2 * Math.PI;
    return star;
  }

  function placeGlints(band, rand) {
    var area = W * H;
    var list = [];
    var i, n, x, y, tries, p;

    n = Math.min(900, area / 2000);
    for (i = 0; i < n; i++) {
      // A third of them follow the band, so the Milky Way twinkles too.
      if (i % 3 === 0) {
        p = bandPoint(band, rand);
        x = p.x;
        y = p.y;
      } else {
        x = rand() * W;
        y = rand() * H;
      }
      list.push(addFlicker({
        x: x, y: y,
        size: 3.5 + Math.pow(rand(), 2) * 8.5,
        alpha: (0.45 + rand() * 0.55) * textDimming(x),
        sprite: Math.floor(rand() * STAR_COLOURS.length),
        flare: false,
        depth: 0.02 + rand() * 0.04
      }, rand, 0.45 + rand() * 0.4));
    }

    // The few bright ones keep to the margins when there are margins.
    n = Math.min(14, area / 130000);
    for (i = 0; i < n; i++) {
      tries = 0;
      do {
        x = rand() * W;
        tries++;
      } while (textDimming(x) < 0.9 && tries < 10);
      y = rand() * H;
      list.push(addFlicker({
        x: x, y: y,
        size: 12 + rand() * 10,
        alpha: (0.72 + rand() * 0.28) * textDimming(x),
        sprite: Math.floor(rand() * STAR_COLOURS.length),
        flare: true,
        depth: 0.06 + rand() * 0.05
      }, rand, 0.3 + rand() * 0.25));
    }
    return list;
  }

  function sizeCanvas(canvas) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
  }

  function build() {
    W = window.innerWidth;
    // Full screen height, so a phone's collapsing address bar does not force a repaint.
    H = Math.max(window.innerHeight, (window.screen && window.screen.height) || 0);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (W * H * dpr * dpr > MAX_PIXELS) dpr = Math.max(1, Math.sqrt(MAX_PIXELS / (W * H)));

    sizeCanvas(fieldCanvas);
    sizeCanvas(glintCanvas);
    fieldCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var rand = makeRandom(SEED);
    var band = makeBand();
    paintField(band, rand);
    if (!sprites) {
      sprites = STAR_COLOURS.map(function (c) { return makeSprite(c, false); });
      flares = STAR_COLOURS.map(function (c) { return makeSprite(c, true); });
    }
    glints = placeGlints(band, rand);
    built = true;
    dirty = true;
    sky.classList.add("is-ready");
  }

  function drawGlints(now) {
    var ctx = glintCtx;
    var scroll = reduceMotion ? 0 : window.pageYOffset || 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, glintCanvas.width, glintCanvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (var i = 0; i < glints.length; i++) {
      var s = glints[i];
      var y = (s.y - scroll * s.depth) % H;
      if (y < 0) y += H;
      // shimmer lies in [-1, 1]; a star is brightest at 1 and dips by s.amount at -1.
      var shimmer = reduceMotion ? 0 :
        0.5 * Math.sin(now * s.w1 + s.p1) + 0.3 * Math.sin(now * s.w2 + s.p2) + 0.2 * Math.sin(now * s.w3 + s.p3);
      var size = s.size * (1 + 0.08 * shimmer);
      ctx.globalAlpha = s.alpha * (1 - s.amount * (0.5 - 0.5 * shimmer));
      ctx.drawImage((s.flare ? flares : sprites)[s.sprite], s.x - size, y - size, size * 2, size * 2);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- Running ----------

  function isShown() { return window.getComputedStyle(sky).display !== "none"; }

  function loop(now) {
    frame = 0;
    if (!isShown()) return;
    if (dirty || now - lastDraw >= TWINKLE_INTERVAL) {
      drawGlints(now);
      lastDraw = now;
      dirty = false;
    }
    if (!reduceMotion) frame = window.requestAnimationFrame(loop);
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(loop);
  }

  function sync() {
    if (!isShown()) return;
    if (!built || window.innerWidth !== W) build();
    dirty = true;
    schedule();
  }

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      if (!built || !isShown()) return;
      if (window.innerWidth !== W || window.innerHeight > H) {
        build();
        schedule();
      }
    }, 150);
  });

  window.addEventListener("scroll", function () { dirty = true; }, { passive: true });

  // The theme can change from the toggle (data-theme) or from the system setting.
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (window.matchMedia) {
    var scheme = window.matchMedia("(prefers-color-scheme: dark)");
    if (scheme.addEventListener) scheme.addEventListener("change", sync);
  }

  // Painting takes a few tens of milliseconds; let the page show first.
  window.setTimeout(sync, 0);
})();
