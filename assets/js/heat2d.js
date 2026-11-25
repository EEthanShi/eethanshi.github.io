/* Live relief for the "Recent works" card: one sample of the critical 2D stochastic heat equation (the directed-polymer
   lattice model at the critical noise strength, 4096 steps per unit time), drawn with plain WebGL like yang-mills.js.
   Data (assets/data/heat2d/): 8-bit codes c of log(field / mean) on one scale for all views, 65 snapshots stacked
   vertically, one PNG per view. A view is a set of cells: the 16 x 16, 32 x 32 or 64 x 64 equal squares of [-1, 1]^2
   (exact block averages) or the diamond cell of every single site. Each cell is a column whose height and colour are
   its code, so no value is interpolated in space; playback crossfades between neighbouring snapshots. */
(function () {
  "use strict";

  var card = document.getElementById("heat-card");
  if (!card) return;

  var canvas = card.querySelector(".ym-canvas");
  var playBtn = card.querySelector(".ym-play");
  var scrub = card.querySelector(".ym-scrub");
  var readout = card.querySelector(".ym-time");
  var viewTag = card.querySelector(".ym-lattice");
  var chips = Array.prototype.slice.call(card.querySelectorAll(".ym-chip"));

  var BASE = "assets/data/heat2d/heat_";
  var LAST = 64;                                   // snapshots at t = k / 64, k = 0..64
  // Tol's sunset scheme, positive half (low to high), as in Fig. 1 of the working note.
  var STOPS = ["#EAECCC", "#FEDA8B", "#FDB366", "#F67E4B", "#DD3D2D", "#A50026"];
  var VIEWS = {
    b16: { L: 16, tag: "16 × 16 squares", cell: 64, sum: 210021545 },
    b32: { L: 32, tag: "32 × 32 squares", cell: 32, sum: 824581321 },
    b64: { L: 64, tag: "64 × 64 squares", cell: 16, sum: 1086107591 },
    sites: { L: 131, tag: "single sites · spacing 1/64", cell: 8, sum: 73004453 }
  };
  var SITE_Z0 = -65, SITE_EDGE = 64;               // window sites z_i = -65..65; [-1, 1] is |z_i| <= 64 in site units

  var SNAPSHOTS_PER_SECOND = 6.25;
  var HOLD = 6;
  var FADE = 4;
  var SPIN = 0.09;
  var HEIGHT = 0.5, FLOOR = 0.035, SCALE = 1.28;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = {
    view: "sites",
    clock: reduceMotion ? LAST : 0,
    playing: !reduceMotion,
    rx: -0.98, rz: 0.62,
    onScreen: false,
    shownA: -1, shownB: -1, shownView: ""
  };

  var sprites = {}, meshes = {};
  var gl, prog, u, loc, texA, texB;
  var raf = 0, lastTime = 0, drag = null;

  // ---------- data ----------

  function loadSprite(name) {
    if (sprites[name]) return sprites[name];
    sprites[name] = new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var L = VIEWS[name].L;
        if (img.width !== L || img.height !== L * (LAST + 1)) { reject(new Error("sprite size")); return; }
        var c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        var ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        var rgba = ctx.getImageData(0, 0, img.width, img.height).data;
        var g = new Uint8Array(img.width * img.height);
        var sum = 0;
        for (var i = 0; i < g.length; i++) { g[i] = rgba[4 * i]; sum = (sum + g[i] * ((i % 251) + 1)) % 2147483648; }
        // Browsers that add noise to canvas readback would change the values: then draw nothing rather than wrong data.
        if (sum !== VIEWS[name].sum) { reject(new Error("sprite readback altered")); return; }
        resolve({ L: L, g: g, view: name });
      };
      img.onerror = function () { delete sprites[name]; reject(new Error("missing sprite")); };
      img.src = BASE + name + ".png";
    });
    return sprites[name];
  }

  // ---------- geometry: one column per cell ----------

  function clipToSquare(poly, e) {
    // Sutherland-Hodgman against |x| <= e, |y| <= e; keeps the counter-clockwise order.
    var planes = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var p = 0; p < 4; p++) {
      var nx = planes[p][0], ny = planes[p][1], out = [];
      for (var i = 0; i < poly.length; i++) {
        var a = poly[i], b = poly[(i + 1) % poly.length];
        var da = e - (nx * a[0] + ny * a[1]), db = e - (nx * b[0] + ny * b[1]);
        if (da >= 0) out.push(a);
        if ((da >= 0) !== (db >= 0)) {
          var s = da / (da - db);
          out.push([a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1])]);
        }
      }
      poly = out;
      if (poly.length < 3) return null;
    }
    return poly;
  }

  function area(poly) {
    var s = 0;
    for (var i = 0; i < poly.length; i++) {
      var a = poly[i], b = poly[(i + 1) % poly.length];
      s += a[0] * b[1] - b[0] * a[1];
    }
    return s / 2;
  }

  function builder() {
    var xy = [], top = [], nor = [], cell = [];
    function vert(p, t, n, c) { xy.push(p[0], p[1]); top.push(t); nor.push(n[0], n[1], n[2]); cell.push(c[0], c[1]); }
    return {
      add: function (poly, c) {      // poly: counter-clockwise polygon in plate units; c: texture coordinate of its cell
        var up = [0, 0, 1];
        for (var k = 1; k < poly.length - 1; k++) {
          vert(poly[0], 1, up, c); vert(poly[k], 1, up, c); vert(poly[k + 1], 1, up, c);
        }
        for (var i = 0; i < poly.length; i++) {
          var a = poly[i], b = poly[(i + 1) % poly.length];
          var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy);
          if (len < 1e-9) continue;
          var n = [dy / len, -dx / len, 0];               // outward for a counter-clockwise polygon
          vert(a, 1, n, c); vert(b, 1, n, c); vert(b, 0, n, c);
          vert(a, 1, n, c); vert(b, 0, n, c); vert(a, 0, n, c);
        }
      },
      done: function () {
        return { xy: new Float32Array(xy), top: new Float32Array(top), nor: new Float32Array(nor),
                 cell: new Float32Array(cell), count: top.length };
      }
    };
  }

  function squaresMesh(L) {
    var b = builder(), h = 2 / L;
    for (var i1 = 0; i1 < L; i1++) {
      for (var i2 = 0; i2 < L; i2++) {
        var x0 = -1 + i1 * h, y0 = -1 + i2 * h;
        b.add([[x0, y0], [x0 + h, y0], [x0 + h, y0 + h], [x0, y0 + h]], [(i1 + 0.5) / L, (i2 + 0.5) / L]);
      }
    }
    return b.done();
  }

  function sitesMesh() {
    // The diamond of site z is |X - z|_1 < 1 in site units X = 64 x; it is clipped to the plate [-64, 64]^2.
    var b = builder(), L = VIEWS.sites.L;
    for (var z1 = SITE_Z0; z1 < SITE_Z0 + L; z1++) {
      for (var z2 = SITE_Z0; z2 < SITE_Z0 + L; z2++) {
        if ((z1 + z2) % 2 !== 0) continue;
        var poly = clipToSquare([[z1 + 1, z2], [z1, z2 + 1], [z1 - 1, z2], [z1, z2 - 1]], SITE_EDGE);
        if (!poly || area(poly) < 1e-9) continue;
        b.add(poly.map(function (p) { return [p[0] / SITE_EDGE, p[1] / SITE_EDGE]; }),
              [(z1 - SITE_Z0 + 0.5) / L, (z2 - SITE_Z0 + 0.5) / L]);
      }
    }
    return b.done();
  }

  function mesh(name) {
    if (meshes[name]) return meshes[name];
    var m = name === "sites" ? sitesMesh() : squaresMesh(VIEWS[name].L);
    var buf = {};
    [["xy", 2], ["top", 1], ["nor", 3], ["cell", 2]].forEach(function (a) {
      buf[a[0]] = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf[a[0]]);
      gl.bufferData(gl.ARRAY_BUFFER, m[a[0]], gl.STATIC_DRAW);
      buf[a[0]].size = a[1];
    });
    meshes[name] = { buf: buf, count: m.count };
    return meshes[name];
  }

  // ---------- matrices ----------

  function multiply(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[r + 4] * b[c * 4 + 1] + a[r + 8] * b[c * 4 + 2] + a[r + 12] * b[c * 4 + 3];
      }
    }
    return o;
  }
  function rotX(t) { var c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; }
  function rotZ(t) { var c = Math.cos(t), s = Math.sin(t); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
  function perspective(tanHalf, aspect, near, far) {
    var f = 1 / tanHalf;
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0];
  }

  // ---------- WebGL ----------

  var VERT = [
    "attribute vec2 aXY; attribute float aTop; attribute vec3 aNor; attribute vec2 aCell;",
    "uniform mat4 uModel, uProj; uniform vec2 uShift; uniform sampler2D uA, uB;",
    "uniform float uMix, uHeight, uFloor, uScale;",
    "varying vec3 vN, vP; varying float vC, vTop;",
    "void main() {",
    // the cell's code, crossfaded between two snapshots; it sets both the height and the colour of the column
    "  float c = mix(texture2D(uA, aCell).r, texture2D(uB, aCell).r, uMix);",
    "  vec4 p = uModel * vec4(aXY * uScale, aTop * (uFloor + uHeight * c), 1.0);",
    "  vP = p.xyz; vN = (uModel * vec4(aNor, 0.0)).xyz; vC = c; vTop = aNor.z;",
    "  vec4 clip = uProj * vec4(p.xyz - vec3(0.0, 0.0, 7.8), 1.0);",
    "  clip.xy += uShift * clip.w;",
    "  gl_Position = clip;",
    "}"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform sampler2D uLut;",
    "varying vec3 vN, vP; varying float vC, vTop;",
    "void main() {",
    "  vec3 albedo = texture2D(uLut, vec2(vC, 0.5)).rgb;",
    "  vec3 N = normalize(vN), V = normalize(vec3(0.0, 0.0, 7.8) - vP);",
    "  if (dot(N, V) < 0.0) N = -N;",
    "  vec3 key = normalize(vec3(-2.0, 4.0, 5.0)), fill = normalize(vec3(4.0, -1.0, 2.0));",
    "  float light = 0.5 + 0.42 * max(dot(N, key), 0.0) + 0.18 * max(dot(N, fill), 0.0);",
    "  float spec = pow(max(dot(N, normalize(key + V)), 0.0), 48.0) * 0.12;",
    // top faces show the colour of the scale unchanged; only the side walls are shaded
    "  gl_FragColor = vec4(vTop > 0.5 ? albedo : min(albedo * light + spec, vec3(1.0)), 1.0);",
    "}"
  ].join("\n");

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function hexRgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }

  function colourTable() {
    var rgb = STOPS.map(hexRgb), out = new Uint8Array(256 * 3);
    for (var i = 0; i < 256; i++) {
      var p = i / 255 * (rgb.length - 1), k = Math.min(rgb.length - 2, Math.floor(p)), f = p - k;
      for (var c = 0; c < 3; c++) out[3 * i + c] = Math.round(rgb[k][c] + (rgb[k + 1][c] - rgb[k][c]) * f);
    }
    return out;
  }

  function makeTexture() {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  function initGL() {
    gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) throw new Error("WebGL unavailable");
    if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 2) throw new Error("no vertex textures");
    prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    u = {}; loc = {};
    ["uModel", "uProj", "uShift", "uMix", "uA", "uB", "uLut", "uHeight", "uFloor", "uScale"].forEach(function (n) {
      u[n] = gl.getUniformLocation(prog, n);
    });
    ["aXY", "aTop", "aNor", "aCell"].forEach(function (n) { loc[n] = gl.getAttribLocation(prog, n); });

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);

    texA = makeTexture();
    texB = makeTexture();
    var lut = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, lut);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 256, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, colourTable());
    gl.uniform1i(u.uA, 0);
    gl.uniform1i(u.uB, 1);
    gl.uniform1i(u.uLut, 2);
    gl.uniform1f(u.uHeight, HEIGHT);
    gl.uniform1f(u.uFloor, FLOOR);
    gl.uniform1f(u.uScale, SCALE);

    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); giveUp(); });
  }

  function bindMesh(m) {
    ["xy", "top", "nor", "cell"].forEach(function (k) {
      var l = loc["a" + (k === "xy" ? "XY" : k.charAt(0).toUpperCase() + k.slice(1))];
      gl.bindBuffer(gl.ARRAY_BUFFER, m.buf[k]);
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, m.buf[k].size, gl.FLOAT, false, 0, 0);
    });
  }

  function upload(unit, tex, sp, frame) {
    var L = sp.L, off = frame * L * L;
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, L, L, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, sp.g.subarray(off, off + L * L));
  }

  // ---------- drawing ----------

  function resize() {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    var aspect = r.width / r.height;
    var tanHalf = Math.tan(15 * Math.PI / 180) * Math.max(1, 1 / aspect);
    gl.uniformMatrix4fv(u.uProj, false, new Float32Array(perspective(tanHalf, aspect, 0.1, 100)));
    gl.uniform2f(u.uShift, aspect > 1.25 ? 0.4 : 0, aspect > 1.25 ? 0.02 : 0);
  }

  function frames() {
    var c = state.clock;
    if (c <= LAST) { var s = Math.min(LAST, Math.floor(c)); return { a: s, b: Math.min(LAST, s + 1), mix: c - s, shown: s }; }
    if (c <= LAST + HOLD) return { a: LAST, b: LAST, mix: 0, shown: LAST };
    return { a: LAST, b: 0, mix: (c - LAST - HOLD) / FADE, shown: LAST };
  }

  function draw() {
    var sp = state.sprite;
    if (!sp) return;
    var f = frames();
    var v = sp.view, fresh = v !== state.shownView;
    if (fresh) bindMesh(mesh(v));
    if (f.a !== state.shownA || fresh) { upload(gl.TEXTURE0, texA, sp, f.a); state.shownA = f.a; }
    if (f.b !== state.shownB || fresh) { upload(gl.TEXTURE1, texB, sp, f.b); state.shownB = f.b; }
    state.shownView = v;

    var model = multiply(rotX(state.rx), rotZ(state.rz));
    model[13] = -0.05;
    gl.uniformMatrix4fv(u.uModel, false, model);
    gl.uniform1f(u.uMix, f.mix);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, meshes[v].count);

    if (f.shown !== state.label) {
      state.label = f.shown;
      readout.textContent = "t = " + (f.shown / LAST).toFixed(4);
      scrub.value = f.shown;
    }
  }

  // ---------- animation loop: runs only while playing and on screen ----------

  function running() { return state.playing && state.onScreen && !document.hidden; }

  function tick(now) {
    raf = 0;
    var dt = Math.max(0, Math.min(now - lastTime, 100)) / 1000;
    lastTime = now;
    if (state.playing && !drag) {
      state.clock += dt * SNAPSHOTS_PER_SECOND;
      if (state.clock >= LAST + HOLD + FADE) state.clock = 0;
      state.rz += dt * SPIN;
    }
    draw();
    if (running()) raf = requestAnimationFrame(tick);
  }

  function wake() {
    if (!raf && gl) { lastTime = performance.now(); raf = requestAnimationFrame(tick); }
  }

  function setPlaying(p) {
    state.playing = p;
    playBtn.setAttribute("aria-pressed", String(p));
    if (!p) state.clock = state.clock <= LAST ? Math.round(state.clock) : LAST;   // a paused picture is a stored snapshot
    if (p && state.clock > LAST) state.clock = 0;
    wake();
  }

  function setView(name) {
    state.view = name;
    viewTag.textContent = VIEWS[name].tag;
    card.style.setProperty("--ym-cell", VIEWS[name].cell + "px");
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-view") === name)); });
    if (!gl) return;
    loadSprite(name).then(function (sp) {
      if (state.view !== name) return;
      state.sprite = sp;
      wake();
    }, giveUp);
  }

  function giveUp() {
    card.classList.add("ym-static");
    state.playing = false;
  }

  // ---------- start once the card is near the viewport ----------

  function start() {
    try { initGL(); } catch (e) { giveUp(); return; }
    resize();
    if (window.ResizeObserver) new ResizeObserver(function () { resize(); wake(); }).observe(canvas);
    else window.addEventListener("resize", function () { resize(); wake(); });

    var first = state.view;
    loadSprite(first).then(function (sp) {
      if (state.view === first) state.sprite = sp;
      draw();
      card.classList.add("ym-ready");
      wake();
      ["b16", "b32", "b64"].forEach(loadSprite);
    }, giveUp);

    playBtn.addEventListener("click", function () { setPlaying(!state.playing); });
    scrub.addEventListener("input", function () {
      if (state.playing) setPlaying(false);
      state.clock = +scrub.value;
      wake();
    });
    chips.forEach(function (c) {
      c.addEventListener("click", function () { setView(c.getAttribute("data-view")); });
    });

    canvas.addEventListener("pointerdown", function (e) {
      drag = { x: e.clientX, y: e.clientY, rx: state.rx, rz: state.rz };
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add("is-dragging");
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      state.rz = drag.rz + (e.clientX - drag.x) * 0.01;
      state.rx = Math.max(-1.45, Math.min(-0.25, drag.rx + (e.clientY - drag.y) * 0.01));   // never from below
      wake();
    });
    function endDrag() { drag = null; canvas.classList.remove("is-dragging"); wake(); }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    document.addEventListener("visibilitychange", wake);
  }

  setPlaying(state.playing);
  setView(state.view);

  if ("IntersectionObserver" in window) {
    var started = false;
    new IntersectionObserver(function (entries) {
      state.onScreen = entries[0].isIntersecting;
      if (state.onScreen && !started) { started = true; start(); }
      wake();
    }, { rootMargin: "200px" }).observe(card);
  } else {
    state.onScreen = true;
    start();
  }
})();
