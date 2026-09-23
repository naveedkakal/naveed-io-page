/* ══════════════════════════════════════════════════════════
   naveed.io — home page behavior
   terminal · the tape · reveals · nav state · card spotlight
   ══════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = matchMedia("(pointer: fine)").matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function go(id) { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }); }

  var yr = $("#yr"); if (yr) yr.textContent = new Date().getFullYear();

  /* cursor spotlight */
  if (!reduced) {
    addEventListener("pointermove", function (e) {
      document.documentElement.style.setProperty("--mx", e.clientX + "px");
      document.documentElement.style.setProperty("--my", e.clientY + "px");
    }, { passive: true });
  }

  /* ── the record ──────────────────────────────────────── */
  // One product line, one person: nkakal in Subversion (2009–2014), then git
  // without merges (2017–). Monthly, Mar 2009 → Sep 2026. Recount with
  // interviews/data/railpro-full-log.txt + `git log --no-merges --author=Naveed`.
  var COUNTS = [30,0,0,16,3,30,63,29,1,15,46,67,40,90,133,72,75,43,58,55,60,35,25,30,36,74,40,63,16,39,22,72,43,31,110,28,39,44,35,24,22,48,47,50,37,57,30,30,29,54,50,50,41,61,73,44,85,28,60,110,128,57,76,79,74,54,1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,43,19,13,11,51,8,34,34,24,35,52,72,90,52,63,64,29,108,70,32,28,79,46,19,66,71,47,19,47,33,88,109,136,104,105,77,109,185,141,182,116,138,80,41,77,59,34,33,30,63,26,41,83,83,4,65,33,21,29,68,21,14,27,15,12,48,31,18,28,26,60,27,21,25,77,49,79,29,18,19,5,33,49,44,53,44,33,11,65,105,76,18,60,170,93,70,24,55,45,55,21,0,57,434,65,22,97,33,82,50,59,329,150,50];
  var TAPE_AT = 31;          // Mar 2009, counted from Aug 2006
  var N = TAPE_AT + COUNTS.length;   // 242 months
  var SVN_END = 100, GIT_AT = 127;   // Dec 2014 · Mar 2017
  var MAX = Math.max.apply(null, COUNTS);
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function monthOf(i) { var t = 2006 * 12 + 7 + i; return MON[t % 12] + " " + Math.floor(t / 12); }
  function countOf(i) { return i < TAPE_AT ? null : COUNTS[i - TAPE_AT]; }
  function kindOf(i) { return i < TAPE_AT ? "pre" : i <= SVN_END ? "svn" : i < GIT_AT ? "gap" : "git"; }

  var PINS = [
    { i: 0,   kind: "svn", text: 'Hired at ETECH on a car-wash hunch. Version control won\'t see me for another two and a half years. <a href="writing/teaching-the-condemned.html">Case file →</a>' },
    { i: 31,  kind: "svn", text: 'First week on the record: “sorting is working?” The next week, r361: “Working on force.”' },
    { i: 38,  kind: "svn", when: "Fall 2009", text: "The new platform goes live at Angelica in Los Angeles. First night, we slept in our cars." },
    { i: 70,  kind: "svn", when: "2012", text: 'Ottawa, 1 p.m.: I dropped a running plant\'s production database. Flew out that night, brought the coffee, kept the customer for fourteen years. <a href="writing/seventeen-years-same-problem.html">Case file →</a>' },
    { i: 97,  kind: "svn", text: 'I leave for Centro, in Chicago. The tape goes quiet. <a href="writing/prank-that-brought-him-back.html">Case file →</a>' },
    { i: 127, kind: "git", text: "Back, thanks to a prank phone call. A week in, I learned Kannegiesser had bought the company." },
    { i: 158, kind: "git", text: "PLC communications move to an Elixir app I started that April." },
    { i: 231, kind: "git", text: "The busiest month on the record: the same sort, the same rails, new tools." },
    { i: 240, kind: "git", text: "Commit #10,000, on the 7th: a cursor that wouldn't land in a password field." }
  ];
  var NOTES = {
    100: "Two commits at 6:48 a.m. on the 22nd — not me. Stale environments coughing up debris after I'd gone.",
    241: "This month, so far."
  };
  var pinAt = {}; PINS.forEach(function (p) { pinAt[p.i] = p; });

  /* ── terminal ────────────────────────────────────────── */
  var APPS = [
    ["weave", "Weave", "apps/weave.html"],
    ["petalpost", "PetalPost", "apps/petalpost.html"],
    ["picpost", "PicPost", "apps/picpost.html"],
    ["mispronounced", "Mispronounced", "apps/mispronounced.html"],
    ["miscolored", "Miscolored", "apps/miscolored.html"],
    ["hushbin", "Hushbin", "apps/hushbin.html"],
    ["ourworkshop", "OurWorkshop", "apps/ourworkshop.html"],
    ["tvcal", "TV Cal", "apps/tvcal.html"],
    ["carwash", "Naperville Car Wash Reviews", "apps/carwash.html"],
    ["mh-build-studio", "MH Build Studio", "apps/mhbuild.html"],
    ["misra", "Misra", "apps/misra.html"],
    ["glow-garden", "Glow Garden", "https://glowgardenusa.com"],
    ["mf-laundry", "M&F Laundry", "https://mflaundry.com"]
  ];
  var STORIES = [
    ["1", "seventeen-years", "Seventeen years in the same problem", "writing/seventeen-years-same-problem.html"],
    ["2", "condemned", "Teaching the condemned new tricks", "writing/teaching-the-condemned.html"],
    ["3", "prank", "The prank that brought him back", "writing/prank-that-brought-him-back.html"]
  ];

  var term = $("#term"), form = $("#term-form"), input = $("#term-input");
  var PROMPT = '<span class="pr">nk@naveed.io</span> <span class="v">~ %</span> ';
  var hist = [], hIdx = 0;

  function line(html, cls) {
    var d = document.createElement("div");
    d.className = "ln" + (cls ? " " + cls : "");
    d.innerHTML = html === "" ? "&nbsp;" : html;
    term.appendChild(d);
    term.scrollTop = term.scrollHeight;
    return d;
  }
  function rows(pairs) {
    var d = document.createElement("div");
    d.className = "ln grid";
    d.innerHTML = pairs.map(function (p) { return '<span class="k">' + p[0] + '</span><span class="v">' + p[1] + "</span>"; }).join("");
    term.appendChild(d);
    term.scrollTop = term.scrollHeight;
  }
  function comment(t) { line('<span class="cm"># ' + t + "</span>"); }
  function appLink(a) {
    var ext = /^https?:/.test(a[2]);
    return '<a href="' + a[2] + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + a[0] + "</a>";
  }
  function visit(url, label) {
    line('<span class="k">opening ' + esc(label) + "…</span>");
    setTimeout(function () {
      if (/^https?:/.test(url)) window.open(url, "_blank", "noopener"); else location.href = url;
    }, reduced ? 0 : 380);
  }
  function uptime() {
    var now = new Date(), months = (now.getFullYear() - 2006) * 12 + now.getMonth() - 7;
    return Math.floor(months / 12) + "y " + (months % 12) + "m";
  }
  function findApp(q) {
    q = q.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!q) return null;
    return APPS.filter(function (a) { return a[0].replace(/-/g, "") === q; })[0] ||
           APPS.filter(function (a) { return a[0].replace(/-/g, "").indexOf(q) === 0 || a[1].toLowerCase().replace(/[^a-z0-9]/g, "").indexOf(q) === 0; })[0] || null;
  }
  function findStory(q) {
    q = (q || "").toLowerCase();
    return STORIES.filter(function (s) { return s[0] === q || (q.length > 2 && (s[1].indexOf(q) === 0 || s[2].toLowerCase().indexOf(q) > -1)); })[0] || null;
  }

  var CMDS = {
    help: function () {
      rows([
        ["whoami", "who this is"],
        ["neofetch", "the system, summarized"],
        ["ls [apps|notes]", "what's here"],
        ["open &lt;app&gt;", "open a case file"],
        ["read &lt;1-3&gt;", "read a story from the record"],
        ["story · tape · rules", "jump to a section"],
        ["work · record", "…and the rest"],
        ["contact", "open a line"],
        ["clear", "wipe the screen"]
      ]);
      comment("↑ ↓ for history · tab completes · a few easter eggs, no hints");
    },
    whoami: function () {
      line('<span class="v">Naveed Kakal — Laundry Software Assassin</span>');
      line('<span class="k">Director of Software Development · Kannegiesser ETECH</span>');
      comment("twenty years, one industry, on purpose");
    },
    neofetch: function () {
      line('<span class="ok">nk</span><span class="v">@</span><span class="ok">naveed.io</span>');
      line('<span class="cm">------------</span>');
      rows([
        ["os", "laundry-floor 20 (since Aug 2006)"],
        ["host", "Naperville, IL"],
        ["uptime", uptime()],
        ["kernel", "sling + rail"],
        ["shell", "zsh, sometimes voice"],
        ["commits", "10,134 on the record"],
        ["apps", String(APPS.length)],
        ["crew", "Zoya &amp; Maya (root)"]
      ]);
    },
    ls: function (args) {
      var what = (args[0] || "").replace(/^\.\//, "").replace(/\/$/, "");
      if (what === "apps" || what === "work") {
        line(APPS.map(appLink).join("  "));
        comment("open <name> for the case file");
      } else if (what === "notes" || what === "record" || what === "writing") {
        STORIES.forEach(function (s) { line('<span class="k">' + s[0] + '</span>  <a href="' + s[3] + '">' + s[2] + "</a>"); });
        comment("read <n> to open one");
      } else {
        line('<span class="ok">apps/</span>  <span class="ok">notes/</span>  <span class="v">story.md  rules.md  status.txt</span>');
      }
    },
    cat: function (args) {
      var f = (args[0] || "").toLowerCase();
      if (f === "status.txt" || f === "status") { status(); }
      else if (f === "story.md" || f === "story") { CMDS.story(); }
      else if (f === "rules.md" || f === "rules") { CMDS.rules(); }
      else if (!f) { line('<span class="k">cat: which file? try</span> <span class="v">cat status.txt</span>'); }
      else { line('<span class="er">cat: ' + esc(f) + ": no such file</span>"); }
    },
    open: function (args) {
      var a = findApp(args.join(""));
      if (a) return visit(a[2], a[1]);
      var s = findStory(args.join(" "));
      if (s) return visit(s[3], s[2]);
      line('<span class="er">open: ' + esc(args.join(" ") || "nothing") + " — no such app</span>");
      comment("ls apps to see what's here");
    },
    read: function (args) {
      var s = findStory(args.join(" "));
      if (s) return visit(s[3], s[2]);
      CMDS.ls(["notes"]);
    },
    story: function () { line('<span class="k">→ the story</span>'); go("story"); },
    tape: function () {
      line('<span class="k">→ the tape: 10,134 commits since March 2009. The first one asked a question:</span> <span class="v">“sorting is working?”</span>');
      go("tape");
    },
    rules: function () {
      ["Count problems solved per developer dollar.", "Remove the seams.", "Speak the floor's language.", "Let reality win.", "Trust is the infrastructure.", "Improve the condemned."]
        .forEach(function (r, i) { line('<span class="ok">R-0' + (i + 1) + '</span>  <span class="v">' + r + "</span>"); });
      go("rules");
    },
    work: function () { line('<span class="k">→ the after-hours pile</span>'); go("work"); },
    record: function () { line('<span class="k">→ on record</span>'); go("notes"); },
    contact: function () {
      rows([
        ["email", '<a href="mailto:naveed.kakal@gmail.com">naveed.kakal@gmail.com</a>'],
        ["linkedin", '<a href="https://www.linkedin.com/in/naveed-kakal-b7416417/" target="_blank" rel="noopener">in/naveed-kakal</a>'],
        ["github", '<a href="https://github.com/naveedkakal" target="_blank" rel="noopener">@naveedkakal</a>']
      ]);
    },
    cd: function (args) {
      var d = (args[0] || "~").replace(/\/$/, "");
      if (d === "~" || d === ".." || d === "/") go("top");
      else if (d === "apps" || d === "work") CMDS.work();
      else if (d === "notes" || d === "record") CMDS.record();
      else line('<span class="er">cd: no such directory: ' + esc(d) + "</span>");
    },
    pwd: function () { line('<span class="v">/home/nk/naveed.io</span>'); },
    date: function () { line('<span class="v">' + esc(new Date().toString().replace(/\(.*\)/, "").trim()) + "</span>"); },
    uptime: function () { line('<span class="v">up ' + uptime() + ", since Aug 2006 · load average: 13 apps, 3 case files, 1 industry</span>"); },
    echo: function (args) { line('<span class="v">' + esc(args.join(" ")) + "</span>"); },
    history: function () { hist.forEach(function (h, i) { line('<span class="cm">' + (i + 1) + '</span>  <span class="v">' + esc(h) + "</span>"); }); },
    clear: function () { term.innerHTML = ""; },
    sudo: function () {
      line('<span class="er">nk is not in the sudoers file.</span>');
      line('<span class="k">This incident will be reported to Zoya &amp; Maya.</span>');
    },
    coffee: function () {
      line('<span class="k">brewing a pot of apology coffee…</span>');
      setTimeout(function () { line('<span class="v">done.</span> <span class="cm"># context: Ottawa, 2012 →</span> <a href="writing/seventeen-years-same-problem.html">read 1</a>'); }, reduced ? 0 : 900);
    },
    sorting: function () { line('<span class="v">yes. seventeen years later — yes.</span>'); },
    exit: function () { line('<span class="k">there is no exit. twenty years, one industry, on purpose.</span>'); },
    rm: function () {
      line('<span class="er">not again.</span> <span class="k">I did that once — a live production database, Ottawa, 2012.</span>');
      comment("read 1 for how that went");
    },
    vim: function () { line('<span class="k">read-only filesystem. edits here go through the interview skill.</span>'); },
    hello: function () { line('<span class="v">hey.</span> <span class="k">try</span> <span class="v">help</span>'); }
  };
  var ALIAS = { "?": "help", man: "help", fetch: "neofetch", notes: "record", writing: "record", apps: "work",
    email: "contact", mail: "contact", brew: "coffee", quit: "exit", logout: "exit", nano: "vim", emacs: "vim",
    hi: "hello", hey: "hello", "sorting?": "sorting", about: "whoami", less: "cat", more: "cat", ll: "ls", dir: "ls", reset: "clear" };

  function status() {
    rows([
      ["day job", "→ making laundry plants legible"],
      ["nights", "→ shipping small apps for fun"],
      ["crew", "→ Zoya &amp; Maya, ruthless QA"],
      ["deploys", "→ after bedtime, mostly"]
    ]);
  }

  function run(raw) {
    var cmd = raw.trim();
    line(PROMPT + esc(cmd));
    if (!cmd) return;
    hist.push(cmd); hIdx = hist.length;
    if (/^sorting is working\??$/i.test(cmd)) return CMDS.sorting();
    if (/^drop (database|table)/i.test(cmd)) return CMDS.rm();
    var parts = cmd.split(/\s+/), name = parts.shift().toLowerCase();
    name = ALIAS[name] || name;
    var fn = CMDS[name];
    if (fn) return fn(parts);
    if (findApp(cmd)) return CMDS.open([cmd]);
    line('<span class="er">zsh: command not found: ' + esc(name) + "</span>");
    comment("try help");
  }

  /* boot: types itself out, skips ahead the moment someone wants the keyboard */
  var BOOT = [
    function () { line(PROMPT + "whoami"); },
    function () { line('<span class="v">Naveed Kakal — Laundry Software Assassin</span>'); },
    function () { comment("twenty years, one industry, on purpose"); },
    function () { line(""); },
    function () { line(PROMPT + "cat status.txt"); },
    status,
    function () { line(""); },
    function () { comment("this terminal is real — try help"); }
  ];
  var booted = false, bootTimer = null, bootAt = 0;
  function finishBoot() {
    if (booted) return;
    clearTimeout(bootTimer);
    while (bootAt < BOOT.length) BOOT[bootAt++]();
    booted = true;
  }
  if (term) {
    if (reduced) finishBoot();
    else (function next() {
      if (bootAt >= BOOT.length) { booted = true; return; }
      BOOT[bootAt++]();
      bootTimer = setTimeout(next, 210);
    })();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      finishBoot();
      var v = input.value; input.value = "";
      run(v);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp" && hist.length) { e.preventDefault(); hIdx = Math.max(0, hIdx - 1); input.value = hist[hIdx]; }
      else if (e.key === "ArrowDown" && hist.length) { e.preventDefault(); hIdx = Math.min(hist.length, hIdx + 1); input.value = hist[hIdx] || ""; }
      else if (e.key === "Tab") {
        var v = input.value, sp = v.indexOf(" ");
        if (!v) return;
        e.preventDefault();
        var pool, stem, pre;
        if (sp === -1) { pool = Object.keys(CMDS); stem = v.toLowerCase(); pre = ""; }
        else if (/^open\s/i.test(v)) { pool = APPS.map(function (a) { return a[0]; }); stem = v.slice(sp + 1).toLowerCase(); pre = v.slice(0, sp + 1); }
        else if (/^ls\s/i.test(v)) { pool = ["apps", "notes"]; stem = v.slice(sp + 1).toLowerCase(); pre = v.slice(0, sp + 1); }
        else return;
        var hits = pool.filter(function (c) { return c.indexOf(stem) === 0; });
        if (hits.length === 1) input.value = pre + hits[0] + (sp === -1 ? " " : "");
        else if (hits.length > 1) { line(PROMPT + esc(v)); line('<span class="k">' + hits.join("  ") + "</span>"); }
      }
      else if (e.key === "Escape") { input.blur(); }
      else if (!booted) finishBoot();
    });
    $("#terminal").addEventListener("click", function (e) {
      if (e.target.closest("a, button") || String(getSelection())) return;
      input.focus({ preventScroll: true });
    });
    $$(".term-chips [data-cmd]").forEach(function (b) {
      b.addEventListener("click", function () {
        finishBoot();
        run(b.getAttribute("data-cmd"));
        if (finePointer) input.focus({ preventScroll: true });
      });
    });
    function focusTerm() {
      $("#terminal").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      input.focus({ preventScroll: true });
    }
    $$("[data-focus-term]").forEach(function (b) { b.addEventListener("click", focusTerm); });
    addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      focusTerm();
    });
  }

  /* ── the tape ────────────────────────────────────────── */
  var fig = $("#tape"), plot = $("#tape-plot"), bars = $("#tape-bars"), pins = $("#tape-pins"),
      axis = $("#tape-axis"), bands = $("#tape-bands"), readout = $("#tape-readout"), playhead = $("#tape-playhead");
  var barEls = [], active = -1, defaultReadout = readout ? readout.innerHTML : "";

  if (fig) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < N; i++) {
      var c = countOf(i), k = kindOf(i), m = document.createElement("div");
      m.className = "m " + (c ? k : "nil");
      m.style.setProperty("--h", c ? Math.max(c / MAX, 0.025).toFixed(4) : 0);
      m.style.setProperty("--i", i);
      frag.appendChild(m); barEls.push(m);
    }
    bars.appendChild(frag);

    PINS.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "pin " + p.kind;
      b.style.left = ((p.i + 0.5) / N * 100) + "%";
      b.setAttribute("aria-label", (p.when || monthOf(p.i)) + ": " + p.text.replace(/<[^>]+>/g, ""));
      b.addEventListener("pointerenter", function () { show(p.i); });
      b.addEventListener("focus", function () { show(p.i); });
      b.addEventListener("click", function (e) { e.stopPropagation(); show(p.i); });
      pins.appendChild(b); p.el = b;
    });

    for (var y = 2008; y <= 2026; y += 2) {
      var s = document.createElement("span"), at = 12 * (y - 2006) - 7;
      s.textContent = y; s.style.left = ((at + 0.5) / N * 100) + "%";
      if ((y - 2008) % 4) s.className = "minor";
      axis.appendChild(s);
    }

    $$(".chapters .ch").forEach(function (ch) {
      var from = +ch.getAttribute("data-from"), to = +ch.getAttribute("data-to");
      var band = document.createElement("div");
      band.className = "band";
      band.style.left = (from / N * 100) + "%";
      band.style.width = ((to - from + 1) / N * 100) + "%";
      bands.appendChild(band);
      function on() {
        band.classList.add("show"); plot.classList.add("banded");
        for (var j = from; j <= to; j++) barEls[j].classList.add("in-band");
      }
      function off() {
        band.classList.remove("show"); plot.classList.remove("banded");
        for (var j = from; j <= to; j++) barEls[j].classList.remove("in-band");
      }
      ch.addEventListener("pointerenter", on); ch.addEventListener("pointerleave", off);
      ch.addEventListener("focusin", on); ch.addEventListener("focusout", off);
    });

    function show(i) {
      i = Math.max(0, Math.min(N - 1, i));
      if (active > -1) barEls[active].classList.remove("on");
      PINS.forEach(function (p) { p.el.classList.toggle("on", p.i === i); });
      active = i;
      barEls[i].classList.add("on");
      plot.classList.add("scrubbing");
      playhead.hidden = false;
      playhead.style.left = ((i + 0.5) / N * 100) + "%";
      var c = countOf(i), k = kindOf(i), p = pinAt[i];
      // a pin dated only to a season or year shouldn't borrow one month's count
      var n = c === null || (p && p.when) ? "" : '<span class="n">' + c.toLocaleString("en-US") + (c === 1 ? " commit" : " commits") + "</span>";
      var note = p ? p.text : NOTES[i] ? NOTES[i]
        : k === "pre" ? "Before version control saw me: GE 90-30s, Cimplicity screens, and a condemned system to improve."
        : k === "gap" ? "The gap: Centro, in Chicago. Better software, fewer problems per developer dollar."
        : "";
      readout.innerHTML = '<span class="when">' + ((p && p.when) || monthOf(i)) + '</span><span class="what">' + n + note + "</span>";
    }
    function clear() {
      if (active > -1) barEls[active].classList.remove("on");
      PINS.forEach(function (p) { p.el.classList.remove("on"); });
      active = -1;
      plot.classList.remove("scrubbing");
      playhead.hidden = true;
      readout.innerHTML = defaultReadout;
    }
    function fromX(x) { var r = bars.getBoundingClientRect(); return Math.floor((x - r.left) / r.width * N); }

    plot.addEventListener("pointermove", function (e) { if (!e.target.closest(".pin")) show(fromX(e.clientX)); });
    plot.addEventListener("pointerdown", function (e) { if (!e.target.closest(".pin")) show(fromX(e.clientX)); });
    plot.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && document.activeElement !== plot) clear(); });
    plot.addEventListener("blur", function () { if (!plot.matches(":hover")) clear(); });
    plot.addEventListener("keydown", function (e) {
      var step = { ArrowLeft: -1, ArrowRight: 1, PageUp: -12, PageDown: 12 }[e.key];
      if (e.key === "Home") step = -N; if (e.key === "End") step = N;
      if (!step) return;
      e.preventDefault();
      show(active < 0 ? (step > 0 ? TAPE_AT : N - 1) : active + step);
    });

    if (!reduced) fig.classList.add("armed");
  }

  /* ── reveal + count-up ───────────────────────────────── */
  function countUp(el) {
    var target = +el.getAttribute("data-count"), suffix = el.getAttribute("data-suffix") || "",
        sep = el.hasAttribute("data-sep"), start = null, dur = 1400;
    function fmt(v) { return (sep ? v.toLocaleString("en-US") : String(v)) + suffix; }
    if (reduced) { el.textContent = fmt(target); return; }
    function tick(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / dur);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add("in");
      if (el === fig) el.classList.add("playing");
      $$(".num[data-count], .big[data-count]", el).forEach(countUp);
      io.unobserve(el);
    });
  }, { rootMargin: "-8% 0px" });
  $$(".rise, .stats").forEach(function (el) { io.observe(el); });

  /* ── nav: mark the section in view ───────────────────── */
  var navLinks = $$('.nav-links a[href^="#"]');
  var spy = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      navLinks.forEach(function (a) {
        if (a.getAttribute("href") === "#" + e.target.id) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  ["top", "story", "rules", "work", "notes"].forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });

  /* ── cards: spotlight follows the pointer ────────────── */
  if (!reduced && finePointer) {
    $$(".card.spot").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--cx", (e.clientX - r.left) + "px");
        card.style.setProperty("--cy", (e.clientY - r.top) + "px");
      });
    });
  }
})();
