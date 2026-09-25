/* ══════════════════════════════════════════════════════════
   naveed.io/dice — the app
   ──────────────────────────────────────────────────────────
   Two views on one URL. No hash: load the dice and get a link.
   A hash: District 9, where the dice are neon holograms.

   Every face of every die carries a real option. A roll picks
   each winner with crypto randomness first, then spins the die
   down so that face lands toward you. Faces are only reprinted
   on the frames they point away from you, so what you see
   tumbling past is always what's actually on the die.
   ══════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var Scene = window.NeonScene;
  var $ = function (id) { return document.getElementById(id); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = matchMedia("(pointer: coarse)").matches;
  var LS_DRAFT = "dice.draft", LS_SOUND = "dice.sound";
  var NEON = ["#ff2a6d", "#05d9e8", "#f9f002", "#b967ff", "#ff8a3d", "#39ff8e", "#ff71ce", "#4d7cff"];
  var SQUARES = ["🟥", "🟦", "🟨", "🟪", "🟧", "🟩", "🟪", "🟦"];
  var SCALE = [659.25, 739.99, 880, 987.77, 1108.73, 1318.51, 1479.98, 1760];
  var GLYPHS = "▚▞▙▟▛▜█▓▒░#%&@$?ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ";

  var PRESETS = [
    { key: "dinner", name: "Dinner plans", dice: [
      { label: "Who", options: ["Neighbors", "Family", "Biryani", "Just us", "Bohri"] },
      { label: "Food", options: ["BBQ", "Pizza", "Tacos", "Order in"] },
      { label: "Where", options: ["Our place", "The park", "Their place", "City", "Library", "Mall"] } ] },
    { key: "movie", name: "Movie night", dice: [
      { label: "Genre", options: ["Comedy", "Action", "Scary", "Animated", "Rom-com"] },
      { label: "Snack", options: ["Popcorn", "Ice cream", "Nachos", "We're being good"] },
      { label: "Who picks", options: ["Me", "You", "The kids", "Whatever's trending"] } ] },
    { key: "weekend", name: "Weekend", dice: [
      { label: "Morning", options: ["Sleep in", "Pancakes out", "Farmers market", "Gym, apparently"] },
      { label: "Afternoon", options: ["Bike ride", "Museum", "The mall", "Couch"] },
      { label: "Night", options: ["Board games", "Movie", "Friends over", "Early bed"] } ] },
    { key: "coin", name: "Coin flip", dice: [ { label: "Well?", options: ["Yes", "No"] } ] },
    { key: "blank", name: "Blank", dice: [ { label: "", options: [] } ] }
  ];
  var PLACE = ["Who?", "What?", "Where?", "When?", "Why not?", "And…"];
  var QUIPS = [
    "The dice have spoken.",
    "Best two out of three, then.",
    "Best three out of five?",
    "The dice are starting to take this personally.",
    "You know what you want, don't you.",
    "The dice would like a word with management."
  ];
  var WIRE = [
    "Rain expected to continue until somebody decides",
    "Hotel sign still missing its L · management unbothered",
    "Local dice remain undefeated in arguments",
    "Tower 6 denies rigging any roll",
    "Council rules \"best two out of three\" is not a real thing",
    "Night market stall 17 out of biryani again",
    "Neon inspector: the flicker is a feature",
    "Nobody argues with dice"
  ];

  /* ── randomness: crypto for anything that decides an outcome ── */
  function rand(n) {
    if (n <= 1) return 0;
    var buf = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n;
    do { crypto.getRandomValues(buf); } while (buf[0] >= lim);
    return buf[0] % n;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function between(a, b) { return a + Math.random() * (b - a); }       // cosmetics only
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function range(n) { for (var r = [], i = 0; i < n; i++) r.push(i); return r; }
  function unit(x, y, z) { var l = Math.sqrt(x * x + y * y + z * z) || 1; return [x / l, y / l, z / l]; }

  /* ── quaternions [w, x, y, z] ─ */
  function qmul(a, b) {
    return [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
            a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  }
  function qaxis(x, y, z, ang) { var l = Math.sqrt(x * x + y * y + z * z) || 1, s = Math.sin(ang / 2) / l; return [Math.cos(ang / 2), x * s, y * s, z * s]; }
  function qslerp(a, b, t) {
    var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3], s = 1;
    if (d < 0) { d = -d; s = -1; }
    if (d > 0.9995) {
      var r = [a[0] + (s * b[0] - a[0]) * t, a[1] + (s * b[1] - a[1]) * t, a[2] + (s * b[2] - a[2]) * t, a[3] + (s * b[3] - a[3]) * t];
      var l = Math.hypot(r[0], r[1], r[2], r[3]); return [r[0] / l, r[1] / l, r[2] / l, r[3] / l];
    }
    var th = Math.acos(d), sn = Math.sin(th), wa = Math.sin((1 - t) * th) / sn, wb = s * Math.sin(t * th) / sn;
    return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb, a[3] * wa + b[3] * wb];
  }
  function qmat(q, m) {
    var w = q[0], x = q[1], y = q[2], z = q[3];
    m[0] = 1 - 2 * (y * y + z * z); m[1] = 2 * (x * y - w * z); m[2] = 2 * (x * z + w * y);
    m[3] = 2 * (x * y + w * z); m[4] = 1 - 2 * (x * x + z * z); m[5] = 2 * (y * z - w * x);
    m[6] = 2 * (x * z - w * y); m[7] = 2 * (y * z + w * x); m[8] = 1 - 2 * (x * x + y * y);
    return m;
  }
  var QI = [1, 0, 0, 0];

  /* ── small utilities ─────────────────────────────────────── */
  function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function buzz(p) {                                                    // phones only, and only after a real tap
    try { if (!coarse || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return; navigator.vibrate && navigator.vibrate(p); } catch (e) {}
  }
  function isEnter(e) { return e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter" || e.keyCode === 13; }
  function color(i) { return NEON[i % NEON.length]; }
  function canShare() { return !!navigator.share && coarse; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var toastEl = $("toast"), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 2000);
  }
  function copyText(t, msg) {
    var ok = function () { toast(msg || "Copied"); };
    var fallback = function () {
      var ta = document.createElement("textarea"); ta.value = t; ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); ok(); } catch (e) { toast("Long-press to copy"); }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fallback);
    else fallback();
  }

  /* ── url ↔ dice ────────────────────────────────────────────
     #Who=Neighbors,Family,Poker+friends&What=BBQ,Pizza,Park
     Each label/option is percent-encoded, so , = & are safe delimiters. */
  function enc(s) { return encodeURIComponent(s).replace(/%20/g, "+"); }
  function dec(s) { try { return decodeURIComponent(s.replace(/\+/g, " ")); } catch (e) { return s; } }
  function toHash(dice) {
    return dice.map(function (d) { return enc(d.label) + "=" + d.options.map(enc).join(","); }).join("&");
  }
  function fromHash(h) {
    if (!h) return null;
    var dice = h.split("&").map(function (part) {
      var i = part.indexOf("=");
      var label = i < 0 ? "" : dec(part.slice(0, i));
      var opts = (i < 0 ? part : part.slice(i + 1)).split(",").map(function (o) { return dec(o).trim(); }).filter(Boolean);
      return { label: label.trim(), options: opts };
    }).filter(function (d) { return d.options.length; }).slice(0, 8);
    return dice.some(function (d) { return d.options.length >= 2; }) ? dice : null;
  }
  function currentHash() { var i = location.href.indexOf("#"); return i < 0 ? "" : location.href.slice(i + 1); }
  function shareUrl(dice) { return location.origin + location.pathname + "#" + toHash(dice); }

  /* ── sound: rain, thunder, holograms — all synthesized ── */
  var Sfx = (function () {
    var ctx = null, out = null, noise = null, rainG = null, on = load(LS_SOUND) !== false;
    function make() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      out = ctx.createGain(); out.gain.value = on ? 0.9 : 0;
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
      out.connect(comp); comp.connect(ctx.destination);
      noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
      var d = noise.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter();
      src.buffer = noise; src.loop = true; hp.type = "highpass"; hp.frequency.value = 500; lp.type = "lowpass"; lp.frequency.value = 3200;
      rainG = ctx.createGain(); rainG.gain.value = 0;
      src.connect(hp); hp.connect(lp); lp.connect(rainG); rainG.connect(out); src.start();
    }
    function prime() {
      try {
        if (!ctx) make();
        if (ctx && ctx.state !== "running") ctx.resume();
        if (rainG && rainG.gain.value < 0.01) rainG.gain.setTargetAtTime(0.028, ctx.currentTime, 1.2);
      } catch (e) {}
    }
    function ready() { return on && !!ctx && ctx.state === "running"; }
    function env(g, t, peak, a, dec) {
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
    }
    function hiss(t, type, f, q, peak, a, dec, f2) {
      var s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noise; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
      if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + dec);
      env(g, t, peak, a, dec); s.connect(fl); fl.connect(g); g.connect(out);
      s.start(t, Math.random() * 1.2); s.stop(t + a + dec + 0.05);
    }
    function tone(t, type, f0, f1, peak, a, dec, dest) {
      var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type;
      o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + a + dec);
      env(g, t, peak, a, dec); o.connect(g); g.connect(dest || out); o.start(t); o.stop(t + a + dec + 0.05);
      return o;
    }
    function now() { return ctx.currentTime + 0.01; }
    return {
      prime: prime, ready: ready,
      isOn: function () { return on; },
      set: function (v) {
        on = v; store(LS_SOUND, v); prime();
        if (out) out.gain.setTargetAtTime(v ? 0.9 : 0, ctx.currentTime, 0.05);
      },
      rain: function (e) { if (rainG && ctx) rainG.gain.setTargetAtTime(0.028 + e * 0.11, ctx.currentTime, 0.25); },
      thunder: function () {                                  // a crack, then the rumble rolls in
        if (!ready()) return; var t = now();
        hiss(t, "highpass", 2200, 0.7, 0.28, 0.004, 0.16);
        hiss(t + 0.05, "lowpass", 220, 0.6, 0.55, 0.06, 2.4, 70);
        hiss(t + 0.32, "lowpass", 160, 0.5, 0.4, 0.2, 2.2, 60);
      },
      zap: function () {
        if (!ready()) return; var t = now();
        tone(t, "square", 150, 60, 0.05, 0.004, 0.09); hiss(t, "bandpass", 3200, 3, 0.08, 0.003, 0.06);
      },
      whine: function (dur, delay) {                          // a hologram spinning down
        if (!ready()) return; var t = now() + (delay || 0);
        var o = tone(t, "triangle", 1250, 170, 0.045, 0.04, dur * 0.9);
        var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 11; lg.gain.value = 22;
        lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.1);
        tone(t, "sine", 620, 90, 0.03, 0.04, dur * 0.9);
      },
      powerOn: function (k) {                                 // neon catching: a few ticks, a hum, a bell
        if (!ready()) return; var t = now(), f = SCALE[k % SCALE.length];
        [0, 0.07, 0.15].forEach(function (d, i) { hiss(t + d, "bandpass", 4200, 4, 0.06 + i * 0.02, 0.002, 0.018); });
        var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420; lp.connect(out);
        tone(t + 0.15, "sawtooth", 116, 0, 0.05, 0.02, 1.0, lp); tone(t + 0.15, "sawtooth", 58, 0, 0.04, 0.02, 1.0, lp);
        tone(t + 0.16, "sine", f, 0, 0.13, 0.005, 1.1); tone(t + 0.16, "sine", f * 2, 0, 0.035, 0.005, 0.5);
      },
      chord: function () {
        if (!ready()) return; var t = now() + 0.1;
        [440, 523.25, 659.25, 880].forEach(function (f, i) {
          tone(t + i * 0.06, "sine", f, 0, 0.045, 0.09, 1.9); tone(t + i * 0.06, "triangle", f * 1.003, 0, 0.012, 0.09, 1.4);
        });
      },
      crackle: function (v) {
        if (!ready()) return; hiss(now(), "highpass", 2600 + Math.random() * 2000, 0.8, 0.03 + v * 0.07, 0.002, 0.03);
      }
    };
  })();

  /* ── text on a face: the biggest condensed size that fits, measured once per label ── */
  var mctx = document.createElement("canvas").getContext("2d"), fitCache = {};
  function fitRatio(text) {
    if (fitCache[text]) return fitCache[text];
    var S = 200, maxW = S * 0.72, up = text.toUpperCase(), words = up.split(/\s+/).filter(Boolean);
    var fs = S * 0.3, min = S * 0.09, maxLines = words.length >= 3 ? 3 : 2;
    for (;;) {
      mctx.font = "700 " + fs + "px 'Barlow Condensed', 'Arial Narrow', sans-serif";
      var sp = mctx.measureText(" ").width, lines = 1, line = 0, ok = true;
      for (var i = 0; i < words.length; i++) {
        var w = mctx.measureText(words[i]).width * 1.02;
        if (w > maxW) { ok = false; break; }
        if (line && line + sp + w > maxW) { lines++; line = w; } else line = line ? line + sp + w : w;
      }
      if ((ok && lines <= maxLines && fs * 0.92 * lines <= S * 0.56) || fs <= min) break;
      fs *= 0.94;
    }
    return (fitCache[text] = Math.max(fs, min) / S);
  }
  var fontsReady = document.fonts && document.fonts.load
    ? Promise.race([Promise.all([document.fonts.load("700 40px 'Barlow Condensed'"), document.fonts.load("500 12px 'JetBrains Mono'")]),
                    new Promise(function (r) { setTimeout(r, 1800); })])
    : Promise.resolve();

  /* ── a die: a halo, a projector beam, its light on the street, and six faces ── */
  function dieDOM(i) {
    var el = document.createElement("button"); el.type = "button"; el.className = "die";
    el.style.setProperty("--c", color(i));
    var html = '<span class="halo"></span><span class="beam"></span><span class="pud"></span><div class="holo"><div class="cube"><div class="spin">';
    for (var k = 0; k < 6; k++) html += '<div class="fc k' + k + '"><div class="pr"><b class="op"></b><span class="ct"></span></div><i class="sh"></i></div>';
    el.innerHTML = html + '</div></div></div><span class="cap"></span>';
    var faces = [].map.call(el.querySelectorAll(".fc"), function (f) {
      return { el: f, op: f.querySelector(".op"), ct: f.querySelector(".ct"), sh: f.querySelector(".sh"), lab: null };
    });
    return { el: el, faces: faces, holo: el.querySelector(".holo"), spin: el.querySelector(".spin"), cap: el.querySelector(".cap") };
  }
  function faceText(d, lab) {
    if (lab.kind !== "name") return d.options[lab.idx];
    return !d.label ? "?" : /[?？!…]$/.test(d.label) ? d.label : d.label + "?";   // "Well?" stays "Well?"
  }
  function paintFace(d, f, lab) {
    var text = faceText(d, lab);
    f.lab = lab;
    f.op.textContent = text;
    f.op.style.setProperty("--fs", fitRatio(text).toFixed(4));
    f.ct.textContent = lab.kind === "opt" ? d.label : "";
    f.el.classList.toggle("nm", lab.kind === "name");
  }
  /* labels for the five faces that don't land toward you — balanced, so a Yes/No die reads 3 and 3 */
  function dealFive(n, chosen) {
    var deck = [];
    while (deck.length < 6) deck = deck.concat(shuffle(range(n)));
    deck.length = 6;
    var at = chosen < 0 ? 0 : deck.indexOf(chosen);
    deck.splice(at < 0 ? 0 : at, 1);
    return shuffle(deck);
  }
  function clock() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    var s = p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
    [].forEach.call(document.querySelectorAll(".clock"), function (c) { c.textContent = s; });
  }
  clock(); setInterval(clock, 1000);

  /* ══ setup view ═══════════════════════════════════════════ */
  var draft = load(LS_DRAFT);
  if (!Array.isArray(draft) || !draft.length) draft = clone(PRESETS[0].dice);
  draft = draft.map(function (d) {
    return { label: String(d && d.label || ""), options: Array.isArray(d && d.options) ? d.options.map(String) : [] };
  });
  function save() { store(LS_DRAFT, draft); }

  var cards = $("cards"), urlIn = $("url"), lenEl = $("len");
  var shareBtn = $("share-btn"), copyBtn = $("copy-btn"), tryBtn = $("try-btn");

  function renderSetup() {
    document.body.dataset.mode = "setup";
    $("setup").hidden = false; $("roll").hidden = true;
    teardown();
    Scene.horizon(Math.round(innerHeight * 0.86));
    document.title = "Roll for it — naveed.io";
    renderCards();
    window.scrollTo(0, 0);
  }
  function renderCards() {
    cards.innerHTML = "";
    if (!draft.length) draft.push({ label: "", options: [] });
    draft.forEach(function (d, i) { cards.appendChild(card(d, i)); });
    updateLink();
  }
  function dressMini(dom, d) {
    var n = d.options.length;
    for (var k = 0; k < 6; k++) {
      var lab = k === 4 || !n ? { kind: "name" } : { kind: "opt", idx: (k > 4 ? k - 1 : k) % n };
      paintFace(d, dom.faces[k], lab);
    }
  }
  function card(d, i) {
    var el = document.createElement("div"); el.className = "dc"; el.style.setProperty("--c", color(i));
    el.innerHTML =
      '<div class="dc-head"><span class="dc-num">Die ' + (i + 1) + '</span>' +
      '<input class="dc-label" type="text" maxlength="30" autocomplete="off" autocapitalize="words" aria-label="Name of die ' + (i + 1) + '" />' +
      '<button class="dc-del" type="button" aria-label="Remove die ' + (i + 1) + '">✕</button></div>' +
      '<div class="dc-body"><div class="chips"></div><div class="mini" aria-hidden="true"></div></div><div class="dc-hint"></div>';
    var mini = el.querySelector(".mini"), dom = dieDOM(i);
    dom.el.tabIndex = -1; dom.el.querySelector(".beam").remove(); dom.el.querySelector(".pud").remove(); dom.cap.remove();
    mini.appendChild(dom.el); dressMini(dom, d);
    dom.spin.style.animationDuration = (10 + i * 1.3) + "s";                // each spins at its own pace
    el._mini = { wrap: mini, dom: dom };
    var lab = el.querySelector(".dc-label"); lab.placeholder = PLACE[i] || "Label"; lab.value = d.label;
    lab.addEventListener("input", function () { d.label = lab.value; save(); updateLink(); dressMini(dom, d); });
    lab.addEventListener("keydown", function (e) { if (isEnter(e)) { e.preventDefault(); el.querySelector(".chip-in").focus(); } });
    el.querySelector(".dc-del").addEventListener("click", function () {
      var at = draft.indexOf(d); if (at >= 0) draft.splice(at, 1); save(); renderCards();
    });
    chips(el, d);
    return el;
  }
  function hop(el) {
    var m = el._mini; if (!m || reduced) return;
    m.wrap.classList.remove("hop"); void m.wrap.offsetWidth; m.wrap.classList.add("hop");
  }
  function chips(el, d) {
    var box = el.querySelector(".chips"); box.innerHTML = "";
    var rerender = function (focus) {
      save(); chips(el, d); updateLink(); dressMini(el._mini.dom, d); hop(el);
      if (focus) el.querySelector(".chip-in").focus();
    };
    d.options.forEach(function (o, j) {
      var c = document.createElement("span"); c.className = "chip";
      var t = document.createElement("span"); t.textContent = o;
      var x = document.createElement("button"); x.type = "button"; x.textContent = "×"; x.setAttribute("aria-label", "Remove " + o);
      x.addEventListener("click", function () { d.options.splice(j, 1); rerender(false); });
      c.appendChild(t); c.appendChild(x); box.appendChild(c);
    });
    var inp = document.createElement("input"); inp.className = "chip-in"; inp.type = "text";
    inp.autocomplete = "off"; inp.autocapitalize = "words"; inp.enterKeyHint = "done"; inp.maxLength = 60;
    inp.placeholder = d.options.length ? "Add another…" : "Type an option, hit enter";
    inp.setAttribute("aria-label", "Add an option to " + (d.label || "this die"));
    function commit(refocus) {
      var raw = inp.value; if (!raw.trim()) { inp.value = ""; return; }
      inp.value = "";
      raw.split(",").map(function (s) { return s.trim(); }).filter(Boolean)
         .forEach(function (s) { if (d.options.indexOf(s) < 0) d.options.push(s); });
      rerender(refocus);
    }
    inp.addEventListener("keydown", function (e) {
      if (isEnter(e) || e.key === ",") { e.preventDefault(); commit(true); }
      else if (e.key === "Backspace" && !inp.value && d.options.length) { e.preventDefault(); d.options.pop(); rerender(true); }
    });
    inp.addEventListener("input", function () { if (inp.value.indexOf(",") >= 0) commit(true); });
    inp.addEventListener("blur", function () { commit(false); });
    box.appendChild(inp);

    var h = el.querySelector(".dc-hint"), n = d.options.length;
    if (n === 0) { h.textContent = "Add at least two options to roll this one"; h.className = "dc-hint"; }
    else if (n === 1) { h.textContent = "One more, or it's not much of a die"; h.className = "dc-hint warn"; }
    else if (n > 6) { h.textContent = n + " options · six show at a time, all of them can win"; h.className = "dc-hint"; }
    else { h.textContent = n + " options"; h.className = "dc-hint"; }
  }

  function shareable() {
    return draft.map(function (d) { return { label: d.label.trim(), options: d.options.slice() }; })
                .filter(function (d) { return d.options.length; });
  }
  function updateLink() {
    var dice = shareable(), ok = dice.some(function (d) { return d.options.length >= 2; });
    var url = ok ? shareUrl(dice) : "";
    urlIn.value = url; lenEl.textContent = ok ? url.length + " chars" : "";
    [shareBtn, copyBtn, tryBtn].forEach(function (b) { b.disabled = !ok; });
  }
  if (!navigator.share) shareBtn.hidden = true;
  urlIn.addEventListener("focus", function () { urlIn.select(); });
  copyBtn.addEventListener("click", function () { copyText(urlIn.value, "Link copied"); });
  shareBtn.addEventListener("click", function () {
    navigator.share({ title: "Roll for it", text: "Can't decide? Shake for it 🎲", url: urlIn.value }).catch(function () {});
  });
  tryBtn.addEventListener("click", function () { Sfx.prime(); location.hash = toHash(shareable()); });

  function pristine() {
    var j = JSON.stringify(draft);
    return PRESETS.some(function (p) { return JSON.stringify(p.dice) === j; }) ||
           draft.every(function (d) { return !d.label && !d.options.length; });
  }
  var presetsEl = $("presets");
  PRESETS.forEach(function (p) {
    var b = document.createElement("button"); b.type = "button"; b.className = "preset"; b.textContent = p.name;
    b.addEventListener("click", function () {
      if (!pristine() && !confirm("Replace your current dice with “" + p.name + "”?")) return;
      draft = clone(p.dice); save(); renderCards();
      if (p.key === "blank") { var l = cards.querySelector(".dc-label"); if (l) l.focus(); }
    });
    presetsEl.appendChild(b);
  });
  $("add").addEventListener("click", function () {
    if (draft.length >= 8) { toast("Eight dice is plenty"); return; }
    draft.push({ label: "", options: [] }); save(); renderCards();
    var all = cards.querySelectorAll(".dc-label"); all[all.length - 1].focus();
  });

  /* ══ District 9: the roll view ════════════════════════════ */
  var zone = $("zone"), diceBox = $("dice"), street = $("street");
  var vlines = $("vlines"), vq = $("vq"), vhT = $("vh-t"), vhR = $("vh-r");
  var rollBtn = $("rollbtn"), rollT = $("roll-t"), shakeBtn = $("shake"), shakeSt = $("shake-st"), shakeHint = $("shakehint"), shT = $("sh-t");
  var shareRes = $("share-res"), sndBtn = $("snd"), wire = $("wire");
  var M = new Float64Array(9);
  var T = {
    dice: [], busy: false, rolls: 0, lastSig: "", raf: 0, gen: 0, t: 0, last: 0,
    tilt: [0, 0], tiltT: [0, 0], motion: false, shaking: false, shakeE: 0, relT: 0, headlines: []
  };

  function buildDice(dice) {
    diceBox.innerHTML = ""; vlines.innerHTML = "";
    T.dice = dice.map(function (d, i) {
      var dom = dieDOM(i);
      dom.cap.textContent = d.label || "Die " + (i + 1);
      dom.el.style.setProperty("--bd", (-i * 0.9) + "s");
      dom.el.addEventListener("click", function () { Sfx.prime(); rollDice([i], false); });
      diceBox.appendChild(dom.el);
      var five = dealFive(d.options.length, -1), j = 0;
      for (var k = 0; k < 6; k++) paintFace(d, dom.faces[k], k === 4 ? { kind: "name" } : { kind: "opt", idx: five[j++] });
      var line = document.createElement("div"); line.className = "vl"; line.style.setProperty("--c", color(i));
      line.innerHTML = '<span class="k"></span><span class="dots"></span><b class="v wait">- - -</b>';
      line.querySelector(".k").textContent = d.label || "Die " + (i + 1);
      vlines.appendChild(line);
      return { d: d, i: i, el: dom.el, faces: dom.faces, holo: dom.holo, spin: dom.spin, line: line, val: line.querySelector(".v"),
               mode: reduced ? "rest" : "idle", q: QI.slice(), ang: i * 1.3, ph: Math.random() * 6.3, res: null, pending: null };
    });
    vlines.classList.toggle("two", dice.length > 4);
    ariaLabels();
  }
  function ariaLabels() {
    T.dice.forEach(function (x, i) {
      x.el.setAttribute("aria-label", (x.d.label || "Die " + (i + 1)) + ": " + (x.res == null ? "not rolled yet" : x.d.options[x.res]) + ". Roll just this one.");
    });
  }

  /* fit the dice to the space between the title and the street, and aim each beam at the kerb */
  function layout() {
    if (document.body.dataset.mode !== "roll" || !T.dice.length) return;
    var z = zone.getBoundingClientRect(), N = T.dice.length, zw = z.width - 28, zh = z.height - 20;
    var cols = N <= 3 ? N : N === 4 ? (zw > 640 ? 4 : 2) : Math.ceil(N / 2), rows = Math.ceil(N / cols);
    if (zw < 520 && N === 3 && zh > zw * 1.2) cols = 3;
    var cg = clamp(zw * 0.055, 14, 46), rg = clamp(zh * 0.1, 30, 60);
    var s = Math.min((zw - cg * (cols - 1)) / cols * 0.86, (zh - rg * (rows - 1)) / rows - 44, 168);   // leave room for the sides as they turn
    s = Math.round(Math.max(54, s));
    diceBox.style.setProperty("--cg", cg + "px"); diceBox.style.setProperty("--rg", rg + "px");
    diceBox.style.maxWidth = (cols * s + (cols - 1) * cg + 2) + "px";
    T.s = s;
    T.dice.forEach(function (x) { x.el.style.setProperty("--s", s + "px"); });
    var hz = street.getBoundingClientRect().top;
    Scene.horizon(hz);
    var rects = T.dice.map(function (x) { return x.el.getBoundingClientRect(); });
    T.dice.forEach(function (x, i) {
      var r = rects[i], under = rects.some(function (o, j) { return j !== i && o.top > r.top + 4 && o.left < r.right && o.right > r.left; });
      var beam = Math.max(0, hz - (r.top + s * 0.72));
      x.el.style.setProperty("--beam", beam + "px");
      x.el.querySelector(".beam").style.display = under ? "none" : "";
      x.el.querySelector(".pud").style.display = under ? "none" : "";
    });
  }

  /* ── the animation loop: idle holograms, rolls, rest, and the rattle while you shake ── */
  function frame(now) {
    if (document.body.dataset.mode !== "roll") { T.raf = 0; return; }
    var dt = Math.min(0.05, (now - T.last) / 1000 || 0.016); T.last = now; T.t += dt;
    T.tilt[0] += (T.tiltT[0] - T.tilt[0]) * Math.min(1, dt * 5); T.tilt[1] += (T.tiltT[1] - T.tilt[1]) * Math.min(1, dt * 5);
    T.shakeE *= Math.pow(0.12, dt);
    var busy = false;
    for (var i = 0; i < T.dice.length; i++) { if (drawDie(T.dice[i], now, dt)) busy = true; }
    if (T.busy && !busy && !T.shaking) finishRoll();
    T.raf = requestAnimationFrame(frame);
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function bump(t, at, w) { var k = (t - at) / w; return Math.abs(k) >= 1 ? 0 : 1 - k * k; }

  function drawDie(x, now, dt) {
    var s = T.s || 100, q, y = 0, z = 0, jx = 0, sx = 1, sy = 1, rolling = false;
    var tiltX = -T.tilt[1] * 0.28, tiltY = T.tilt[0] * 0.38;
    if (x.mode === "roll") {
      rolling = true;
      var t = clamp((now - x.t0) / x.dur, 0, 1);
      var e = 1 - Math.pow(1 - clamp(t / 0.84, 0, 1), 3);
      var qb = qslerp(x.q0, QI, smooth(clamp(t / 0.4, 0, 1)));
      q = qmul(qaxis(x.axis[0], x.axis[1], x.axis[2], x.turns * 2 * Math.PI * (1 - e)), qb);
      var up = t < 0.72 ? Math.sin(Math.PI * t / 0.72) : t < 0.9 ? 0.14 * Math.sin(Math.PI * (t - 0.72) / 0.18) : 0;
      y = -up * s * 0.55; z = up * s * 0.3;
      var sq = bump(t, 0.72, 0.05) * 0.13 + bump(t, 0.9, 0.035) * 0.05 - (now < x.t0 ? 0.06 : 0);
      sx = 1 + sq; sy = 1 - sq;
      if (x.pending) {                                               // reprint any face that's turned away right now
        qmat(q, M);
        for (var k = 0; k < 6; k++) {
          if (!x.pending[k]) continue;
          var sg = k & 1 ? -1 : 1, nz = sg * M[6 + (k >> 1)];
          if (nz < -0.3) { paintFace(x.d, x.faces[k], x.pending[k]); x.pending[k] = null; }
        }
      }
      if (t >= 1) { land(x); q = QI; rolling = false; }
    } else if (x.mode === "idle") {
      x.ang += dt * 0.85;
      q = qmul(qaxis(1, 0, 0, -0.3 + tiltX), qaxis(0, 1, 0, x.ang + tiltY));
      y = Math.sin(T.t * 1.5 + x.ph) * s * 0.035;
    } else {
      q = qmul(qaxis(1, 0, 0, tiltX + Math.sin(T.t * 0.9 + x.ph) * 0.05), qaxis(0, 1, 0, tiltY + Math.sin(T.t * 0.7 + x.ph) * 0.07));
      y = Math.sin(T.t * 1.4 + x.ph) * s * 0.03;
    }
    if (T.shaking && x.mode !== "roll") {                           // rattling in your hand
      var a = T.shakeE;
      q = qmul(qaxis(between(-1, 1), between(-1, 1), between(-0.4, 0.4), between(-0.45, 0.45) * a), q);
      jx = between(-1, 1) * s * 0.12 * a; y += between(-1, 1) * s * 0.1 * a - a * s * 0.12; z += a * s * 0.16;
    }
    x.q = q;
    qmat(q, M);
    x.holo.style.transform = "translate3d(" + jx.toFixed(2) + "px," + y.toFixed(2) + "px," + z.toFixed(2) + "px) scale3d(" + sx.toFixed(3) + "," + sy.toFixed(3) + ",1)";
    x.spin.style.transform = "matrix3d(" + M[0].toFixed(5) + "," + M[3].toFixed(5) + "," + M[6].toFixed(5) + ",0," + M[1].toFixed(5) + "," +
      M[4].toFixed(5) + "," + M[7].toFixed(5) + ",0," + M[2].toFixed(5) + "," + M[5].toFixed(5) + "," + M[8].toFixed(5) + ",0,0,0,0,1)";
    for (var f = 0; f < 6; f++) {                                    // faces turning away dim, like glass catching less light
      var s2 = f & 1 ? -1 : 1, fz = s2 * M[6 + (f >> 1)];
      if (fz < -0.1) continue;
      var shade = 0.72 * Math.pow(1 - Math.max(0, fz), 1.4), fc = x.faces[f];
      if (fc.shade == null || Math.abs(fc.shade - shade) > 0.015) { fc.shade = shade; fc.sh.style.opacity = shade.toFixed(3); }
    }
    return rolling;
  }

  /* ── rolling ─────────────────────────────────────────────── */
  function rollDice(idx, big) {
    if (document.body.dataset.mode !== "roll" || T.busy || !idx.length) return;
    T.busy = true; T.rolls++;
    rollBtn.classList.add("busy"); rollT.textContent = "Rolling";
    vhT.textContent = "D9 · Rolling"; vhR.textContent = "Roll " + pad2(T.rolls);
    if (big) {
      Scene.strike(); Sfx.thunder();
      document.body.classList.remove("zap"); void document.body.offsetWidth; document.body.classList.add("zap");
      buzz([0, 30, 40, 60]);
    } else { Sfx.zap(); }
    var t0 = performance.now() + (big ? 140 : 40);
    idx.forEach(function (i, k) {
      var x = T.dice[i], chosen = rand(x.d.options.length), five = dealFive(x.d.options.length, chosen), j = 0, pend = [];
      for (var f = 0; f < 6; f++) pend[f] = f === 4 ? { kind: "opt", idx: chosen } : { kind: "opt", idx: five[j++] };
      var th = between(0, Math.PI * 2);
      x.chosen = chosen; x.pending = pend;
      x.q0 = x.q.slice(); x.axis = unit(Math.cos(th), Math.sin(th), between(-0.3, 0.3));
      x.turns = reduced ? 0 : 2; x.t0 = t0 + k * 90; x.dur = reduced ? 1 : 1150 + k * 160 + between(0, 180);
      x.mode = "roll"; x.el.classList.remove("lit"); x.el.classList.add("rolling");
      x.val.textContent = "▒▒▒"; x.val.className = "v wait";
      if (!reduced) Sfx.whine(x.dur / 1000, (x.t0 - performance.now()) / 1000);
    });
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function rollAll(big) { rollDice(T.dice.map(function (x) { return x.i; }), big !== false); }

  function land(x) {
    x.mode = "rest";
    if (x.pending) { for (var k = 0; k < 6; k++) if (x.pending[k]) paintFace(x.d, x.faces[k], x.pending[k]); x.pending = null; }
    x.res = x.chosen;
    x.el.classList.remove("rolling");
    x.el.classList.remove("lit"); void x.el.offsetWidth; x.el.classList.add("lit");
    Sfx.powerOn(x.i);
    var r = x.holo.getBoundingClientRect(), hz = street.getBoundingClientRect().top;
    Scene.sparks(r.left + r.width / 2, r.top + r.height * 0.55, color(x.i));
    Scene.splash(r.left + r.width / 2, hz + 8, color(x.i));
    decode(x.val, x.d.options[x.res]);
    ariaLabels();
  }
  function decode(el, text) {                                        // the value scrambles in like a terminal
    var final = text.toUpperCase(), n = final.length, start = performance.now(), dur = reduced ? 0 : 420;
    el.className = "v";
    (function step() {
      var p = dur ? (performance.now() - start) / dur : 1, out = "";
      for (var i = 0; i < n; i++) out += final[i] === " " ? " " : i < p * n ? final[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step); else el.textContent = final;
    })();
  }
  function finishRoll() {
    T.busy = false;
    rollBtn.classList.remove("busy"); rollT.textContent = "Roll again";
    var complete = T.dice.every(function (x) { return x.res != null; });
    var sig = T.dice.map(function (x) { return x.res; }).join(",");
    var same = complete && T.rolls > 1 && sig === T.lastSig;
    if (complete) T.lastSig = sig;
    vhT.textContent = complete ? "D9 · Verdict" : "D9 · Partial";
    vq.innerHTML = "// " + (!complete ? "some dice haven't spoken yet · tap them"
      : same ? "same answer twice. <b>that's a sign.</b>"
      : T.rolls <= QUIPS.length ? QUIPS[T.rolls - 1].toLowerCase() : "roll #" + T.rolls + ". nobody argues with dice. except you, apparently.");
    shareRes.disabled = !T.dice.some(function (x) { return x.res != null; });
    if (complete) {
      Sfx.chord();
      headline("<b>Breaking</b> · Dice rule — " + T.dice.map(function (x) {
        return esc((x.d.label || "Die " + (x.i + 1)).toUpperCase()) + ": <em>" + esc(x.d.options[x.res].toUpperCase()) + "</em>";
      }).join(" · ") + (T.rolls > 1 ? " · after " + T.rolls + " rolls" : ""));
    }
  }

  /* ── the D9 wire ─────────────────────────────────────────── */
  function renderWire() {
    var items = T.headlines.concat(shuffle(WIRE).map(esc));
    wire.innerHTML = items.join("<i>◆</i>");
    wire.style.animation = "none"; void wire.offsetWidth;
    var px = wire.scrollWidth;
    wire.style.setProperty("--dur", Math.max(24, px / 70).toFixed(1) + "s");
    wire.style.animation = "";
  }
  function headline(html) { T.headlines.unshift(html); T.headlines.length = Math.min(T.headlines.length, 3); renderWire(); }

  /* ── share: text and squares, like the Wordle grid ── */
  function verdictText() {
    var lines = T.dice.map(function (x, i) {
      return x.res == null ? null : SQUARES[i % SQUARES.length] + " " + (x.d.label || "Die " + (i + 1)) + " · " + x.d.options[x.res];
    }).filter(Boolean);
    return "🎲 Roll for it" + (T.rolls > 1 ? " · " + T.rolls + " rolls" : "") + "\n" + lines.join("\n");
  }
  shareRes.addEventListener("click", function () {
    var msg = verdictText();
    if (canShare()) navigator.share({ text: msg }).catch(function () {});
    else copyText(msg, "Copied · paste it anywhere");
  });

  rollBtn.addEventListener("click", function () { Sfx.prime(); rollAll(true); });
  document.addEventListener("keydown", function (e) {
    if (document.body.dataset.mode !== "roll" || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target && e.target.tagName === "BUTTON" && (e.key === " " || isEnter(e))) return;
    if (e.key === "r" || e.key === "R" || e.key === " ") { e.preventDefault(); Sfx.prime(); rollAll(true); }
  });

  function paintSound() {
    var on = Sfx.isOn();
    sndBtn.setAttribute("aria-pressed", String(on));
    sndBtn.innerHTML = "Sound <b>" + (on ? "on" : "off") + "</b>";
  }
  sndBtn.addEventListener("click", function () { Sfx.set(!Sfx.isOn()); paintSound(); });
  paintSound();

  /* ── shake to roll: the headline act ─────────────────────── */
  var motionOK = "DeviceMotionEvent" in window && coarse;
  var needsPerm = motionOK && typeof DeviceMotionEvent.requestPermission === "function";
  var prevG = null;
  function onMotion(e) {
    var a = e.acceleration, g0 = e.accelerationIncludingGravity, mag;
    if (!T.motion && ((a && a.x != null) || (g0 && g0.x != null))) { T.motion = true; paintShake(); }   // sensors are live: shake is on
    if (document.body.dataset.mode !== "roll" || (T.busy && !T.shaking)) return;
    if (a && a.x != null) mag = Math.hypot(a.x, a.y, a.z || 0);
    else {                                                           // no gravity-free reading: use the jolt between samples
      var g = e.accelerationIncludingGravity; if (!g || g.x == null) return;
      mag = prevG ? Math.hypot(g.x - prevG[0], g.y - prevG[1], (g.z || 0) - prevG[2]) * 1.6 : 0;
      prevG = [g.x, g.y, g.z || 0];
    }
    if (mag < 12) return;
    var now = performance.now();
    if (!T.shaking) {
      T.shaking = true; T.busy = true; T.shakeStart = now;
      vhT.textContent = "D9 · Shaking"; Sfx.prime();
      T.dice.forEach(function (x) { x.el.classList.add("rolling"); });   // the neon splits and the beams surge while you shake
    }
    T.shakeE = Math.min(1, Math.max(T.shakeE, (mag - 9) / 20));
    Scene.pump(0.06 + T.shakeE * 0.08); Sfx.rain(Scene.energy());
    if (Math.random() < 0.35) Sfx.crackle(T.shakeE);
    vhR.textContent = "▮▮▮▮▮".slice(0, 1 + Math.round(T.shakeE * 4)) + "▯▯▯▯▯".slice(0, 4 - Math.round(T.shakeE * 4));
    clearTimeout(T.relT); T.relT = setTimeout(endShake, 360);
  }
  function endShake() {
    if (!T.shaking) return;
    T.shaking = false; T.busy = false;
    T.dice.forEach(function (x) { x.el.classList.remove("rolling"); });
    Sfx.rain(0);
    rollAll(true);
  }
  function onTilt(e) {
    if (document.body.dataset.mode !== "roll" || e.gamma == null) return;
    var gx = clamp(e.gamma / 35, -1, 1), gy = clamp((e.beta - 45) / 35, -1, 1);
    T.tiltT = [gx, gy]; Scene.look(gx, gy);
  }
  /* listen from the start: Android delivers motion with no prompt, so shake just works there;
     iOS delivers nothing until someone taps SHAKE and allows it */
  if (motionOK) { addEventListener("devicemotion", onMotion); addEventListener("deviceorientation", onTilt); }
  function armMotion() { T.motion = true; paintShake(); }
  function paintShake() {
    shakeBtn.hidden = !motionOK;
    shakeBtn.setAttribute("aria-pressed", String(T.motion));
    shakeSt.textContent = T.motion ? "on" : "off";
    shakeHint.classList.toggle("off", !motionOK);
    shT.textContent = !motionOK ? (coarse ? "Tap roll · or tap a die for just that one" : "Space or R to roll · click a die for just that one")
      : T.motion ? "Shake your phone to roll" : "Tap shake, then shake your phone";
  }
  shakeBtn.addEventListener("click", function () {
    Sfx.prime();
    if (T.motion) { toast("Shake it · the dice are listening"); return; }
    if (needsPerm) {
      DeviceMotionEvent.requestPermission().then(function (st) {
        if (st !== "granted") { toast("Motion access was denied"); return; }
        if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") DeviceOrientationEvent.requestPermission().catch(function () {});
        armMotion(); toast("Armed · shake your phone");
      }).catch(function () { toast("Motion access was denied"); });
    } else { armMotion(); toast("Armed · shake your phone"); }
  });

  /* the camera and the dice lean toward the pointer on desktop */
  if (!coarse) addEventListener("pointermove", function (e) {
    var nx = (e.clientX / innerWidth - 0.5) * 2, ny = (e.clientY / innerHeight - 0.5) * 2;
    Scene.look(nx, ny);
    if (document.body.dataset.mode === "roll") T.tiltT = [nx, ny];
  }, { passive: true });

  var rz;
  addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { if (document.body.dataset.mode === "roll") layout(); else Scene.horizon(Math.round(innerHeight * 0.86)); }, 140); });

  /* ── switching views ── */
  function teardown() { T.gen++; T.busy = false; T.shaking = false; clearTimeout(T.relT); if (T.raf) cancelAnimationFrame(T.raf); T.raf = 0; }
  function renderRoll(dice) {
    teardown();
    document.body.dataset.mode = "roll";
    $("setup").hidden = true; $("roll").hidden = false;
    document.title = dice.map(function (d) { return d.label || "?"; }).join(" · ") + " — Roll for it";
    T.rolls = 0; T.lastSig = ""; T.headlines = [];
    buildDice(dice);
    vhT.textContent = "D9 · Standby"; vhR.textContent = "Roll 00";
    vq.textContent = "// " + (coarse ? "tap a die to roll just that one" : "click a die to roll just that one");
    rollT.textContent = "Roll"; rollBtn.classList.remove("busy");
    shareRes.disabled = true; shareRes.textContent = canShare() ? "Share" : "Copy";
    paintShake(); renderWire();
    requestAnimationFrame(function () {
      layout();
      T.last = performance.now();
      if (!T.raf) T.raf = requestAnimationFrame(frame);
    });
  }
  $("edit").addEventListener("click", function () { draft = T.dice.map(function (x) { return clone(x.d); }); save(); goSetup(); });
  $("own").addEventListener("click", goSetup);
  function goSetup() { history.pushState(null, "", location.pathname + location.search); route(); }

  var lastKey = null;
  function route() {
    var h = currentHash(), dice = fromHash(h), key = dice ? "roll:" + h : "setup";
    if (key === lastKey) return; lastKey = key;
    if (dice) renderRoll(dice); else renderSetup();
  }
  addEventListener("hashchange", route);
  addEventListener("popstate", route);
  ["pointerdown", "touchend", "click"].forEach(function (ev) {            // iOS unlocks audio on some of these and not others
    document.addEventListener(ev, function () { Sfx.prime(); }, { passive: true, capture: true });
  });

  Scene.init($("bg"), $("fg"));
  route();
  fontsReady.then(function () {                                        // re-measure once the real fonts are in
    fitCache = {}; Scene.fonts();
    if (document.body.dataset.mode === "setup") renderCards();
    else { T.dice.forEach(function (x) { x.faces.forEach(function (f) { if (f.lab) paintFace(x.d, f, f.lab); }); }); layout(); }
  });
})();
