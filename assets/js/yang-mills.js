/* Live torus for the "Recent works" card: the Wilson-loop field from the Yang-Mills atlas
   (https://eethanshi.github.io/sym2d-atlas/), drawn with plain WebGL so the page needs no 3D library.
   Data: 8-bit grayscale PNGs with the 51 stored snapshots stacked vertically, one file per lattice. */
(function () {
  "use strict";

  var card = document.getElementById("ym-card");
  if (!card) return;

  var canvas = card.querySelector(".ym-canvas");
  var playBtn = card.querySelector(".ym-play");
  var scrub = card.querySelector(".ym-scrub");
  var readout = card.querySelector(".ym-time");
  var latticeTag = card.querySelector(".ym-lattice");
  var chips = Array.prototype.slice.call(card.querySelectorAll(".ym-chip"));

  var SPRITE = "assets/data/yang-mills/w_r0.25_traj15_N";
  var TIMES = [0, 0.000122, 0.000244, 0.000366, 0.000488, 0.00061, 0.000732, 0.000854, 0.000977, 0.001099, 0.001221,
    0.001343, 0.001465, 0.001587, 0.001709, 0.001831, 0.001953, 0.002075, 0.002197, 0.002319, 0.002441, 0.002563,
    0.002686, 0.002808, 0.00293, 0.003052, 0.003174, 0.003296, 0.003418, 0.003784, 0.004272, 0.004883, 0.005493,
    0.006226, 0.006958, 0.007935, 0.008911, 0.010132, 0.011475, 0.012939, 0.014648, 0.016602, 0.018677, 0.021118,
    0.023926, 0.026978, 0.030518, 0.034546, 0.039062, 0.044189, 0.049927];
  var LAST = TIMES.length - 1;
  // The atlas's dark sequential colour map, low to high.
  var STOPS = ["#121c2c", "#0d366b", "#184f95", "#256abf", "#3987e5", "#6da7ec", "#9ec5f4", "#d6e7fc"];

  var SNAPSHOTS_PER_SECOND = 6.25;
  var HOLD = 6;  // snapshots to rest on the last frame before looping
  var FADE = 4;  // snapshots to crossfade from the last frame back to t = 0
  var SPIN = 0.09; // radians per second

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = {
    level: 7,
    clock: reduceMotion ? 33 : 0,
    playing: !reduceMotion,
    rx: -1.0, ry: 0, rz: 0.35,
    onScreen: false,
    shownA: -1, shownB: -1, shownLevel: -1
  };

  var sprites = {};
  var gl, u, texA, texB, indexCount;
  var raf = 0, lastTime = 0, drag = null;

  // ---------- data ----------

  function loadSprite(N) {
    if (sprites[N]) return sprites[N];
    sprites[N] = new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        var ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        var rgba = ctx.getImageData(0, 0, img.width, img.height).data;
        var g = new Uint8Array(img.width * img.height);
        for (var i = 0; i < g.length; i++) g[i] = rgba[4 * i];
        resolve({ L: img.width, g: g });
      };
      img.onerror = function () { delete sprites[N]; reject(new Error("missing sprite")); };
      img.src = SPRITE + N + ".png";
    });
    return sprites[N];
  }

  // ---------- geometry and matrices ----------

  function torus(R, r, tubular, radial) {
    var pos = [], nor = [], uv = [], idx = [];
    for (var j = 0; j <= radial; j++) {
      for (var i = 0; i <= tubular; i++) {
        var a = i / tubular * 2 * Math.PI, b = j / radial * 2 * Math.PI;
        var cx = Math.cos(a), sx = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
        pos.push((R + r * cb) * cx, (R + r * cb) * sx, r * sb);
        nor.push(cb * cx, cb * sx, sb);
        uv.push(i / tubular, 1 - j / radial);
      }
    }
    for (var n = 0; n < radial; n++) {
      for (var m = 0; m < tubular; m++) {
        var p = n * (tubular + 1) + m, q = p + tubular + 1;
        idx.push(p, q, p + 1, q, q + 1, p + 1);
      }
    }
    return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), idx: new Uint16Array(idx) };
  }

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
  function rotY(t) { var c = Math.cos(t), s = Math.sin(t); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; }
  function rotZ(t) { var c = Math.cos(t), s = Math.sin(t); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }

  function perspective(tanHalf, aspect, near, far) {
    var f = 1 / tanHalf;
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0];
  }

  // ---------- WebGL ----------

  var VERT = [
    "attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUv;",
    "uniform mat4 uModel, uProj; uniform vec2 uShift;",
    "varying vec2 vUv; varying vec3 vN, vP;",
    "void main() {",
    "  vec4 p = uModel * vec4(aPos, 1.0);",
    "  vP = p.xyz; vN = (uModel * vec4(aNor, 0.0)).xyz; vUv = aUv;",
    "  vec4 clip = uProj * vec4(p.xyz - vec3(0.0, 0.0, 7.8), 1.0);",
    "  clip.xy += uShift * clip.w;",
    "  gl_Position = clip;",
    "}"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform sampler2D uA, uB, uLut; uniform float uMix;",
    "varying vec2 vUv; varying vec3 vN, vP;",
    "void main() {",
    // the stored 8-bit code q maps to m = 1 - q/255, shown on a square-root scale as in the atlas
    "  float q = mix(texture2D(uA, vUv).r, texture2D(uB, vUv).r, uMix);",
    "  float m = sqrt(max(0.0, 1.0 - q));",
    "  vec3 albedo = texture2D(uLut, vec2(m, 0.5)).rgb;",
    "  vec3 N = normalize(vN), V = normalize(vec3(0.0, 0.0, 7.8) - vP);",
    "  if (dot(N, V) < 0.0) N = -N;",
    "  vec3 key = normalize(vec3(3.0, 4.0, 5.0)), back = normalize(vec3(-4.0, -2.0, -3.0));",
    "  float hemi = 0.5 + 0.5 * N.y;",
    "  vec3 light = mix(vec3(0.33, 0.38, 0.44), vec3(1.0), hemi) * 0.9",
    "             + 0.7 * max(dot(N, key), 0.0) + 0.25 * max(dot(N, back), 0.0);",
    "  float spec = pow(max(dot(N, normalize(key + V)), 0.0), 40.0) * 0.22;",
    "  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);",
    "  vec3 c = albedo * light + spec + albedo * m * m * 0.35 + vec3(0.22, 0.53, 0.9) * fres * 0.55;",
    "  gl_FragColor = vec4(min(c, vec3(1.0)), 1.0);",
    "}"
  ].join("\n");

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function buffer(target, data) {
    var b = gl.createBuffer();
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    return b;
  }

  function attribute(prog, name, data, size) {
    var loc = gl.getAttribLocation(prog, name);
    buffer(gl.ARRAY_BUFFER, data);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return t;
  }

  function initGL() {
    gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) throw new Error("WebGL unavailable");
    var prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    var mesh = torus(1.35, 0.6, 192, 96);
    attribute(prog, "aPos", mesh.pos, 3);
    attribute(prog, "aNor", mesh.nor, 3);
    attribute(prog, "aUv", mesh.uv, 2);
    buffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idx);
    indexCount = mesh.idx.length;

    u = {};
    ["uModel", "uProj", "uShift", "uMix", "uA", "uB", "uLut"].forEach(function (n) { u[n] = gl.getUniformLocation(prog, n); });

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

    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); giveUp(); });
  }

  function upload(unit, tex, sp, frame, filter) {
    var L = sp.L, off = frame * L * L;
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
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
    // Keep the whole torus in frame on narrow canvases; push it right where the copy sits on its left.
    var tanHalf = Math.tan(15 * Math.PI / 180) * Math.max(1, 1 / aspect);
    gl.uniformMatrix4fv(u.uProj, false, new Float32Array(perspective(tanHalf, aspect, 0.1, 100)));
    gl.uniform2f(u.uShift, aspect > 1.25 ? 0.46 : 0, aspect > 1.25 ? 0.03 : 0);
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
    var filter = state.level <= 5 ? gl.NEAREST : gl.LINEAR;  // coarse lattices keep their visible cells
    if (f.a !== state.shownA || state.level !== state.shownLevel) { upload(gl.TEXTURE0, texA, sp, f.a, filter); state.shownA = f.a; }
    if (f.b !== state.shownB || state.level !== state.shownLevel) { upload(gl.TEXTURE1, texB, sp, f.b, filter); state.shownB = f.b; }
    state.shownLevel = state.level;

    var model = multiply(multiply(rotX(state.rx), rotY(state.ry)), rotZ(state.rz));
    model[13] = 0.12;
    gl.uniformMatrix4fv(u.uModel, false, model);
    gl.uniform1f(u.uMix, f.mix);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

    if (f.shown !== state.label) {
      state.label = f.shown;
      readout.textContent = "t = " + TIMES[f.shown].toFixed(4);
      scrub.value = f.shown;
    }
  }

  // ---------- animation loop: runs only while playing and on screen ----------

  function running() { return state.playing && state.onScreen && !document.hidden; }

  function tick(now) {
    raf = 0;
    var dt = Math.max(0, Math.min(now - lastTime, 100)) / 1000;  // now can precede lastTime by a frame
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
    playBtn.setAttribute("aria-label", p ? "Pause" : "Play");
    playBtn.setAttribute("aria-pressed", String(p));
    if (p && state.clock > LAST) state.clock = 0;
    wake();
  }

  function setLevel(N) {
    state.level = N;
    var L = Math.pow(2, N);
    latticeTag.textContent = "N = " + N + " · " + L + " × " + L;
    card.style.setProperty("--ym-cell", (1024 / L) + "px");
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(+c.getAttribute("data-n") === N)); });
    loadSprite(N).then(function (sp) {
      if (state.level !== N) return;
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

    loadSprite(state.level).then(function (sp) {
      state.sprite = sp;
      draw();
      card.classList.add("ym-ready");
      wake();
      [4, 5, 6].forEach(loadSprite);  // ready for the lattice buttons
    }, giveUp);

    playBtn.addEventListener("click", function () { setPlaying(!state.playing); });
    scrub.addEventListener("input", function () {
      if (state.playing) setPlaying(false);
      state.clock = +scrub.value;
      wake();
    });
    chips.forEach(function (c) {
      c.addEventListener("click", function () { setLevel(+c.getAttribute("data-n")); });
    });

    canvas.addEventListener("pointerdown", function (e) {
      drag = { x: e.clientX, y: e.clientY, rx: state.rx, ry: state.ry };
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add("is-dragging");
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      state.ry = drag.ry + (e.clientX - drag.x) * 0.01;
      state.rx = drag.rx + (e.clientY - drag.y) * 0.01;
      wake();
    });
    function endDrag() { drag = null; canvas.classList.remove("is-dragging"); wake(); }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    document.addEventListener("visibilitychange", wake);
  }

  setPlaying(state.playing);
  setLevel(state.level);

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
