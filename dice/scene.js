/* ══════════════════════════════════════════════════════════
   naveed.io/dice — District 9, after dark
   ──────────────────────────────────────────────────────────
   The backdrop: four parallax skylines with windows that come
   and go, neon signs that fail the way real neon fails, market
   lights on the kerb, rain, and a wet street that mirrors all
   of it. Two canvases — one behind the dice, one in front for
   the near rain, sparks and lightning.

   Homage to "Neon Rain — District 9 Night Market" (Claude
   Opus 5.5 · 100 HTML files, no. 002). Drawn from scratch.
   ══════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var JP = "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans JP', 'Noto Sans CJK JP', sans-serif";
  var COND = "'Barlow Condensed', 'Arial Narrow', sans-serif";
  var WIN = ["#ffcf7a", "#ffb86b", "#8ef6ff", "#ff9ad0", "#fff2c4"];

  var S = {
    bg: null, fg: null, b: null, f: null, W: 0, H: 0, dpr: 1, hz: 0,
    layers: [], signs: [], drops: [], rings: [], sparks: [], lights: [],
    t: 0, last: 0, energy: 0, look: [0, 0], lookT: [0, 0], flash: 0, flashT: -9, bolt: null,
    mode: "roll", hzWant: null, ready: false
  };

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ── skyline ─────────────────────────────────────────────── */
  var LAYER = [
    { par: 0.15, col: "#2c0c50", top: "#3a1262", minW: 16, maxW: 42, minH: 0.34, maxH: 0.6, win: 0.1, wa: 0.28 },
    { par: 0.35, col: "#1e0739", top: "#2a0c4c", minW: 24, maxW: 58, minH: 0.3, maxH: 0.72, win: 0.18, wa: 0.45 },
    { par: 0.62, col: "#120322", top: "#1a0630", minW: 32, maxW: 84, minH: 0.22, maxH: 0.82, win: 0.22, wa: 0.7 },
    { par: 1.0, col: "#07010f", top: "#0e0319", minW: 48, maxW: 120, minH: 0.14, maxH: 0.92, win: 0.26, wa: 0.85 }
  ];
  var MARGIN = 70;

  function buildLayer(L) {
    var cfg = LAYER[L], d = S.dpr, W = S.W + MARGIN * 2, H = Math.max(1, S.hz);
    var cv = document.createElement("canvas"); cv.width = Math.ceil(W * d); cv.height = Math.ceil(H * d);
    var g = cv.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    var x = -rnd(0, 20), wins = [], near = L === 3, mid = L >= 2;
    while (x < W) {
      var w = rnd(cfg.minW, cfg.maxW) * (S.W < 600 ? 0.8 : 1);
      var cx = (x + w / 2 - MARGIN) / S.W;
      var edge = Math.min(1, Math.abs(cx - 0.5) * 2.1);
      var hf = rnd(cfg.minH, cfg.maxH) * (mid ? 0.42 + 0.58 * Math.pow(edge, 0.8) : 1);   // keep the middle clear for the dice
      var h = hf * H, y = H - h;
      g.fillStyle = cfg.col; g.fillRect(x, y, w, h);
      g.fillStyle = cfg.top; g.fillRect(x, y, w, 2);
      if (Math.random() < 0.35) { var sw = w * rnd(0.3, 0.6); g.fillStyle = cfg.col; g.fillRect(x + (w - sw) / 2, y - h * 0.06, sw, h * 0.06 + 1); }
      if (Math.random() < 0.3) { g.fillStyle = cfg.top; g.fillRect(x + w * rnd(0.2, 0.8), y - rnd(8, 26), 1.5, 26); }
      if (near && Math.random() < 0.4) { g.fillStyle = "rgba(255,42,109,.9)"; g.fillRect(x + w * 0.5, y - 20, 2, 2); }
      if (cfg.win) {
        var cw = rnd(5, 8), rh = rnd(7, 10), ww = L === 0 ? 1.5 : rnd(2, 3.2), wh = L === 0 ? 2 : rnd(2.5, 4);
        for (var wy = y + 6; wy < H - 6; wy += rh) for (var wx = x + 4; wx < x + w - 4; wx += cw) {
          var on = Math.random() < cfg.win, c = pick(WIN);
          wins.push({ x: wx, y: wy, w: ww, h: wh, c: c, on: on });
          if (on) { g.globalAlpha = cfg.wa * rnd(0.5, 1); g.fillStyle = c; g.fillRect(wx, wy, ww, wh); g.globalAlpha = 1; }
        }
      }
      x += w + (L === 0 ? rnd(0, 6) : rnd(-2, 10));
    }
    return { cv: cv, g: g, wins: wins, cfg: cfg, L: L };
  }
  function flipWindow(layer) {
    if (!layer.wins.length) return;
    var w = pick(layer.wins), g = layer.g;
    w.on = !w.on;
    g.fillStyle = layer.cfg.col; g.fillRect(w.x - 0.5, w.y - 0.5, w.w + 1, w.h + 1);
    if (w.on) { g.globalAlpha = layer.cfg.wa * rnd(0.5, 1); g.fillStyle = w.c; g.fillRect(w.x, w.y, w.w, w.h); g.globalAlpha = 1; }
  }

  /* ── neon signs: each glyph its own sprite, so one can die on its own ── */
  function glyphSprite(ch, size, color, font) {
    var d = S.dpr, pad = size * 0.9, cv = document.createElement("canvas");
    cv.width = Math.ceil((size + pad * 2) * d); cv.height = Math.ceil((size + pad * 2) * d);
    var g = cv.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    g.font = "700 " + size + "px " + font; g.textAlign = "center"; g.textBaseline = "middle";
    var cx = (size + pad * 2) / 2, cy = cx;
    g.lineJoin = "round"; g.shadowColor = color;
    g.shadowBlur = size * 0.7; g.strokeStyle = color; g.lineWidth = size * 0.09; g.strokeText(ch, cx, cy);
    g.shadowBlur = size * 0.25; g.lineWidth = size * 0.05; g.strokeText(ch, cx, cy);
    g.shadowBlur = 0; g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = size * 0.022; g.strokeText(ch, cx, cy);
    return { cv: cv, s: size + pad * 2 };
  }
  function makeSign(o) {
    var chars = Array.from(o.text), font = o.jp ? JP : COND;
    var sp = chars.map(function (ch) { return ch === " " ? null : glyphSprite(ch, o.size, o.color, font); });
    var dead = o.dead != null ? o.dead : -1;
    return { o: o, sp: sp, chars: chars, power: 1, state: "on", until: 0, dead: dead, lit: chars.map(function () { return 1; }) };
  }
  function layoutSigns() {
    var W = S.W, hz = S.hz, small = W < 600, gs = clamp(W * 0.05, 17, 30);
    var list = small ? [
      { text: "サイコロ", jp: 1, v: 1, color: "#ff2a6d", L: 3, x: W * 0.05, y: hz * 0.33, size: gs },
      { text: "ウンメイ", jp: 1, v: 1, color: "#05d9e8", L: 3, x: W * 0.9, y: hz * 0.18, size: gs },
      { text: "HOTEL", v: 0, color: "#05d9e8", L: 2, x: W * 0.2, y: hz * 0.74, size: gs * 0.9, dead: 4 },
      { text: "ラーメン", jp: 1, v: 0, color: "#ff71ce", L: 2, x: W * 0.62, y: hz * 0.8, size: gs * 0.72 }
    ] : [
      { text: "サイコロ", jp: 1, v: 1, color: "#ff2a6d", L: 3, x: W * 0.035, y: hz * 0.4, size: gs },   // the edges: the middle is the dice's
      { text: "ウンメイ", jp: 1, v: 1, color: "#05d9e8", L: 3, x: W * 0.94, y: hz * 0.1, size: gs },
      { text: "ツイテル", jp: 1, v: 1, color: "#f9f002", L: 2, x: W * 0.875, y: hz * 0.4, size: gs * 0.8 },
      { text: "HOTEL", v: 0, color: "#05d9e8", L: 2, x: W * 0.085, y: hz * 0.88, size: gs * 0.85, dead: 4 },
      { text: "ラーメン", jp: 1, v: 0, color: "#ff71ce", L: 2, x: W * 0.8, y: hz * 0.8, size: gs * 0.75 },
      { text: "OPEN 24H", v: 0, color: "#f9f002", L: 3, x: W * 0.79, y: hz * 0.93, size: gs * 0.55 }
    ];
    S.signs = list.map(makeSign);
  }
  function stepSign(sg, dt) {
    var rate = 0.05 + S.energy * 1.4;
    if (sg.state === "on" && Math.random() < rate * dt) {
      sg.state = Math.random() < 0.65 ? "stutter" : "brown"; sg.until = S.t + rnd(0.18, 0.8);
    }
    if (sg.state !== "on" && S.t > sg.until) sg.state = "on";
    sg.power = sg.state === "stutter" ? (Math.random() < 0.5 ? 0.08 : 1) : sg.state === "brown" ? 0.4 + Math.random() * 0.08 : 0.93 + Math.random() * 0.07;
  }
  function drawSign(g, sg, ox, oy) {
    var o = sg.o, step = o.size * 1.18, n = sg.chars.length;
    if (o.v) {                                                    // a thin frame around vertical signs
      g.globalAlpha = 0.35 * sg.power; g.strokeStyle = o.color; g.lineWidth = 1.2;
      g.strokeRect(o.x + ox - o.size * 0.72, o.y + oy - o.size * 0.72, o.size * 1.44, step * n + o.size * 0.3);
    }
    for (var i = 0; i < n; i++) {
      var sp = sg.sp[i]; if (!sp) continue;
      var a = i === sg.dead ? 0.07 : sg.power;
      var cx = o.v ? o.x + ox : o.x + ox + i * o.size * 0.66, cy = o.v ? o.y + oy + i * step : o.y + oy;
      g.globalAlpha = a; g.drawImage(sp.cv, cx - sp.s / 2, cy - sp.s / 2, sp.s, sp.s);
    }
    g.globalAlpha = 1;
  }

  /* ── searchlights, kerb lights, lightning ── */
  function kerbLights() {
    S.lights = [];
    var n = Math.round(S.W / 14), cols = ["#ff2a6d", "#05d9e8", "#f9f002", "#ff71ce", "#ffb86b"];
    for (var i = 0; i < n; i++) S.lights.push({ x: (i + 0.5) * S.W / n, c: cols[i % cols.length], ph: Math.random() * 6.3, sag: Math.sin((i % 8) / 8 * Math.PI) * 5 });
  }
  function makeBolt() {
    var x = rnd(S.W * 0.15, S.W * 0.85), y = -10, pts = [[x, y]], endY = S.hz * rnd(0.3, 0.55);
    while (y < endY) { y += rnd(10, 26); x += rnd(-18, 18); pts.push([x, y]); }
    var fork = pts.slice(0, (pts.length * rnd(0.3, 0.6)) | 0), f = fork[fork.length - 1] || pts[0], branch = [f.slice()];
    var bx = f[0], by = f[1];
    for (var k = 0; k < 5; k++) { by += rnd(8, 20); bx += rnd(6, 22) * (Math.random() < 0.5 ? -1 : 1); branch.push([bx, by]); }
    return { main: pts, branch: branch };
  }

  /* ── rain ─────────────────────────────────────────────── */
  function dropFor(d) {
    var near = Math.random() < 0.36;
    d.near = near; d.len = near ? rnd(14, 26) : rnd(7, 14); d.v = near ? rnd(900, 1250) : rnd(520, 800);
    d.a = near ? rnd(0.25, 0.5) : rnd(0.12, 0.28);
    d.floor = near ? rnd(S.hz + 4, S.H) : S.hz + rnd(-4, 6);
    return d;
  }
  function seedRain() {
    S.drops = [];
    for (var i = 0; i < 640; i++) { var d = dropFor({}); d.x = rnd(-60, S.W + 60); d.y = rnd(-S.H, S.H); S.drops.push(d); }
  }
  function ring(x, y, color, big) {
    if (S.rings.length > 180) S.rings.shift();
    S.rings.push({ x: x, y: y, r: 0, max: big ? rnd(18, 34) : rnd(3, 8), life: 0, dur: big ? rnd(0.6, 0.9) : rnd(0.22, 0.4), c: color || null });
  }

  /* ── frame ─────────────────────────────────────────────── */
  function frame(now) {
    var dt = Math.min(0.05, (now - S.last) / 1000 || 0.016); S.last = now;
    if (!reduced) S.t += dt;
    S.energy = Math.max(0, S.energy - dt * 0.55);
    S.look[0] += (S.lookT[0] - S.look[0]) * Math.min(1, dt * 4); S.look[1] += (S.lookT[1] - S.look[1]) * Math.min(1, dt * 4);
    if (S.hzWant != null && Math.abs(S.hzWant - S.hz) > 1) { S.hz = S.hzWant; rebuild(); }
    for (var L = 1; L < 4; L++) if (Math.random() < dt * 5) flipWindow(S.layers[L]);
    S.signs.forEach(function (sg) { stepSign(sg, dt); });
    if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 1.9);
    drawBg(dt); drawFg(dt);
    if (!reduced) requestAnimationFrame(frame);
  }

  function flashLevel() {                                         // lightning comes in a double-strike
    var k = S.t - S.flashT;
    if (k < 0 || k > 0.9) return 0;
    return k < 0.06 ? 1 : k < 0.14 ? 0.25 : k < 0.22 ? 0.85 : Math.max(0, 0.85 * (1 - (k - 0.22) / 0.68));
  }

  function drawBg(dt) {
    var g = S.b, d = S.dpr, W = S.W, H = S.H, hz = S.hz, fl = flashLevel();
    g.setTransform(d, 0, 0, d, 0, 0);
    var sky = g.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, "#0a0119"); sky.addColorStop(0.55, "#1a0433"); sky.addColorStop(1, "#3d0d52");
    g.fillStyle = sky; g.fillRect(0, 0, W, hz + 1);
    var smog = g.createRadialGradient(W / 2, hz, 10, W / 2, hz, Math.max(W, hz) * 0.7);
    smog.addColorStop(0, "rgba(255,42,109,.22)"); smog.addColorStop(1, "rgba(255,42,109,0)");
    g.fillStyle = smog; g.fillRect(0, 0, W, hz);

    if (!reduced) {                                               // two searchlights sweeping the smog
      for (var k = 0; k < 2; k++) {
        var bx = W * (k ? 0.78 : 0.24), ang = Math.sin(S.t * (k ? 0.21 : 0.17) + k * 2) * 0.5 - Math.PI / 2;
        var len = hz * 1.1, spread = 0.07;
        g.globalAlpha = 0.07;
        var lg = g.createLinearGradient(bx, hz, bx + Math.cos(ang) * len, hz + Math.sin(ang) * len);
        lg.addColorStop(0, "rgba(190,230,255,1)"); lg.addColorStop(1, "rgba(190,230,255,0)");
        g.fillStyle = lg; g.beginPath(); g.moveTo(bx, hz);
        g.lineTo(bx + Math.cos(ang - spread) * len, hz + Math.sin(ang - spread) * len);
        g.lineTo(bx + Math.cos(ang + spread) * len, hz + Math.sin(ang + spread) * len); g.closePath(); g.fill();
        g.globalAlpha = 1;
      }
    }

    for (var L = 0; L < 4; L++) {
      var ly = S.layers[L], ox = -MARGIN + S.look[0] * ly.cfg.par * MARGIN * 0.9, oy = S.look[1] * ly.cfg.par * 8;
      g.drawImage(ly.cv, ox, oy, ly.cv.width / d, ly.cv.height / d);
      if (L === 0 && S.bolt && fl > 0.2) {
        g.save(); g.strokeStyle = "rgba(235,225,255," + fl + ")"; g.lineWidth = 2; g.shadowColor = "#b9a4ff"; g.shadowBlur = 14;
        [S.bolt.main, S.bolt.branch].forEach(function (p, i) {
          g.lineWidth = i ? 1 : 2; g.beginPath(); p.forEach(function (q, j) { if (j) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.stroke();
        });
        g.restore();
      }
      if (L >= 2) S.signs.forEach(function (sg) { if (sg.o.L === L) drawSign(g, sg, S.look[0] * ly.cfg.par * MARGIN * 0.9, oy); });
      if (L < 3) { g.fillStyle = "rgba(40,8,70," + (0.16 - L * 0.04) + ")"; g.fillRect(0, 0, W, hz); }   // haze between planes
    }

    g.fillStyle = "rgba(255,42,109,.55)"; g.fillRect(0, hz - 1, W, 1);   // kerb, catching the neon
    for (var i = 0; i < S.lights.length; i++) {
      var lt = S.lights[i], a = 0.55 + 0.45 * Math.sin(S.t * 2.2 + lt.ph);
      g.globalAlpha = a; g.fillStyle = lt.c; g.beginPath(); g.arc(lt.x, hz - 9 + lt.sag, 1.6, 0, 6.29); g.fill();
      g.globalAlpha = a * 0.18; g.beginPath(); g.arc(lt.x, hz - 9 + lt.sag, 5, 0, 6.29); g.fill();
    }
    g.globalAlpha = 1;

    var st = g.createLinearGradient(0, hz, 0, H);                 // the wet street
    st.addColorStop(0, "#0b0218"); st.addColorStop(1, "#030008");
    g.fillStyle = st; g.fillRect(0, hz, W, H - hz);
    g.setTransform(1, 0, 0, 1, 0, 0);                             // …and everything above, mirrored and rippling in it
    var hzd = Math.round(hz * d), Hd = Math.round(H * d), step = Math.max(2, Math.round(3 * d));
    for (var y = hzd; y < Hd; y += step) {
      var dd = (y - hzd) / d, src = hzd - 1 - (y - hzd) * 1.1;
      if (src < 0) break;
      var amp = (1.2 + dd * 0.05) * d, dx = Math.sin(dd * 0.11 + S.t * 3.2) * amp + Math.sin(dd * 0.031 - S.t * 1.4) * amp * 0.7;
      g.globalAlpha = 0.5 * Math.pow(1 - dd / (H - hz + 1), 1.3);
      g.drawImage(S.bg, 0, src, S.bg.width, step, dx, y, S.bg.width, step);
    }
    g.globalAlpha = 1; g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = "rgba(5,1,15,.28)"; g.fillRect(0, hz, W, H - hz);

    if (!reduced) {                                               // far rain, behind the dice
      g.strokeStyle = "rgba(170,190,255,.22)"; g.lineWidth = 1; g.beginPath();
      stepRain(dt, false, g);
      g.stroke();
    }
    if (fl > 0) { g.fillStyle = "rgba(200,180,255," + (fl * 0.22) + ")"; g.fillRect(0, 0, W, H); }
  }

  var wind = 0.2;
  function stepRain(dt, near, g) {
    var n = Math.round(clamp(S.W * S.H / 2300, 90, 330) * (1 + S.energy * 1.1)), k = 0, sp = 1 + S.energy * 0.6;
    var w = wind + Math.sin(S.t * 0.7) * 0.03 + S.energy * Math.sin(S.t * 9) * 0.18, tx = Math.tan(w);
    for (var i = 0; i < S.drops.length && k < n; i++) {
      var dp = S.drops[i]; if (dp.near !== near) continue; k++;
      dp.y += dp.v * sp * dt; dp.x += dp.v * sp * dt * tx;
      if (dp.y > dp.floor) {
        if (dp.floor > S.hz && Math.random() < (near ? 0.7 : 0.25)) ring(dp.x, dp.floor, null, false);
        dropFor(dp); dp.y = rnd(-80, -10); dp.x = rnd(-S.H * tx - 20, S.W + 20);
      }
      g.moveTo(dp.x, dp.y); g.lineTo(dp.x - dp.len * tx * 0.9, dp.y - dp.len);
    }
  }

  function drawFg(dt) {
    var g = S.f, d = S.dpr, W = S.W, H = S.H, fl = flashLevel();
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
    if (!reduced) {
      g.strokeStyle = "rgba(205,220,255,.34)"; g.lineWidth = 1.2; g.beginPath(); stepRain(dt, true, g); g.stroke();
    }
    for (var i = S.rings.length - 1; i >= 0; i--) {             // splash rings on the street
      var r = S.rings[i]; r.life += dt;
      if (r.life > r.dur) { S.rings.splice(i, 1); continue; }
      var p = r.life / r.dur; r.r = r.max * (1 - Math.pow(1 - p, 2));
      g.globalAlpha = (1 - p) * (r.c ? 0.85 : 0.45); g.strokeStyle = r.c || "rgba(200,215,255,1)"; g.lineWidth = r.c ? 1.4 : 1;
      g.beginPath(); g.ellipse(r.x, r.y, r.r, r.r * 0.28, 0, 0, 6.29); g.stroke();
    }
    g.globalAlpha = 1;
    for (var j = S.sparks.length - 1; j >= 0; j--) {             // neon sparks when a die powers on
      var s = S.sparks[j]; s.life += dt;
      if (s.life > s.dur) { S.sparks.splice(j, 1); continue; }
      s.vy += 520 * dt; s.vx *= 0.985; s.x += s.vx * dt; s.y += s.vy * dt;
      var q = 1 - s.life / s.dur;
      g.globalAlpha = q; g.strokeStyle = s.c; g.lineWidth = s.w;
      g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - s.vx * 0.025, s.y - s.vy * 0.025); g.stroke();
    }
    g.globalAlpha = 1;
    if (fl > 0) { g.fillStyle = "rgba(235,228,255," + (fl * 0.1) + ")"; g.fillRect(0, 0, W, H); }
  }

  /* ── setup / resize ─────────────────────────────────────── */
  function rebuild() {
    S.layers = [0, 1, 2, 3].map(buildLayer);
    layoutSigns(); kerbLights();
    S.drops.forEach(function (dp) { dp.floor = dp.near ? rnd(S.hz + 4, S.H) : S.hz + rnd(-4, 6); });
    if (reduced) { drawBg(0); drawFg(0); }
  }
  function resize() {
    var W = innerWidth, H = innerHeight, d = Math.min(W < 700 ? 1.5 : 1.75, window.devicePixelRatio || 1);
    S.W = W; S.H = H; S.dpr = d;
    [S.bg, S.fg].forEach(function (c) { c.width = Math.round(W * d); c.height = Math.round(H * d); c.style.width = W + "px"; c.style.height = H + "px"; });
    S.hz = S.hzWant != null ? S.hzWant : Math.round(H * 0.8);
    if (!S.drops.length) seedRain();
    rebuild();
  }

  window.NeonScene = {
    init: function (bg, fg) {
      S.bg = bg; S.fg = fg; S.b = bg.getContext("2d"); S.f = fg.getContext("2d");
      resize();
      var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 120); });
      S.last = performance.now();
      if (!reduced) requestAnimationFrame(frame);
      S.ready = true;
    },
    horizon: function (y) { y = Math.round(y); if (y !== S.hz) { S.hzWant = y; if (reduced) { S.hz = y; rebuild(); } } },
    look: function (x, y) { S.lookT = [clamp(x, -1, 1), clamp(y, -1, 1)]; },
    pump: function (e) { S.energy = clamp(S.energy + e, 0, 1); },
    energy: function () { return S.energy; },
    strike: function () {
      S.bolt = makeBolt(); S.flashT = S.t;
      if (reduced) { S.flashT = -9; }
    },
    splash: function (x, y, color) {
      for (var i = 0; i < 3; i++) setTimeout(function () { ring(x + rnd(-6, 6), y + rnd(-2, 2), color, true); }, i * 90);
    },
    sparks: function (x, y, color) {
      if (reduced) return;
      for (var i = 0; i < 26; i++) {
        var a = rnd(-Math.PI, 0), sp = rnd(90, 360);
        S.sparks.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, dur: rnd(0.35, 0.8), c: i % 3 ? color : "#ffffff", w: rnd(1, 2) });
      }
    },
    fonts: function () { if (S.ready) rebuild(); }
  };
})();
