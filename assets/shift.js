// naveed.io — page behaviour. Ported from ryan-will-love.naveed.io and re-aimed at the stack story.
(() => {
  const $ = (s, el = document) => el.querySelector(s)
  const $$ = (s, el = document) => [...el.querySelectorAll(s)]
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
  const lerp = (a, b, t) => a + (b - a) * t
  const fmt = (n) => Math.round(n).toLocaleString('en-US')
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const NS = 'http://www.w3.org/2000/svg'

  // ── reveal ───────────────────────────────────────────
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px' })
  const watchRise = (root = document) => $$('.rise:not(.in)', root).forEach((el) => reduced ? el.classList.add('in') : io.observe(el))
  watchRise()

  // ── top bar: shift clock, theme, progress, jump menu ─
  const topbar = $('#topbar'), hand = $('#hand'), clockT = $('#clock-t'), clockS = $('#clock-s'), progress = $('#progress')
  let marks = []
  function measure() {
    let prev = 0
    marks = $$('[data-clock]').map((el) => {
      let h = parseFloat(el.dataset.clock)
      while (h < prev) h += 24              // the night wraps past midnight
      prev = h
      return { y: el.getBoundingClientRect().top + scrollY - 80, h }
    })
    marks.unshift({ y: 0, h: 6 })
  }
  function hourAt(y) {
    if (y <= marks[0].y) return marks[0].h
    for (let i = 1; i < marks.length; i++) {
      if (y < marks[i].y) return lerp(marks[i - 1].h, marks[i].h, (y - marks[i - 1].y) / (marks[i].y - marks[i - 1].y))
    }
    return marks[marks.length - 1].h
  }
  function shiftAt(h) {
    const x = ((h % 24) + 24) % 24
    if (x >= 6 && x < 18) return 'day shift'
    if (x >= 5 && x < 6) return 'dawn'
    return 'night shift'
  }
  const themeMeta = $('meta[name="theme-color"]')
  let lastTheme = ''
  const setTheme = (c) => { if (themeMeta && c !== lastTheme) { themeMeta.setAttribute('content', c); lastTheme = c } }
  function themeUnderBar() {
    const el = document.elementFromPoint(innerWidth / 2, 70)
    const sec = el && el.closest('.sec, .dusk, .foot')
    if (!sec) return
    let night = sec.classList.contains('night') || sec.classList.contains('dawn')
    if (sec.classList.contains('dusk')) night = duskP > 0.5
    topbar.classList.toggle('night', night)
    topbar.classList.toggle('day', !night)
    setTheme(sec.classList.contains('dusk') ? skyAt(duskP)[0] : night ? '#07090e' : '#f1f3f6')
  }
  function onScroll() {
    const h = hourAt(scrollY)
    const x = ((h % 24) + 24) % 24
    const hh = Math.floor(x), mm = Math.floor((x - hh) * 60)
    clockT.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
    clockS.textContent = shiftAt(h)
    hand.style.transform = `rotate(${(x % 12) / 12 * 360}deg)`
    const max = document.documentElement.scrollHeight - innerHeight
    progress.style.transform = `scaleX(${clamp(scrollY / max)})`
    dusk()
    climbStep()
    themeUnderBar()
  }
  const jump = $('#jump'), clockBtn = $('#clock')
  const setJump = (open) => { jump.classList.toggle('open', open); clockBtn.setAttribute('aria-expanded', open) }
  clockBtn.addEventListener('click', (e) => { e.stopPropagation(); setJump(!jump.classList.contains('open')) })
  jump.addEventListener('click', () => setJump(false))
  document.addEventListener('click', (e) => { if (!jump.contains(e.target)) setJump(false) })
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setJump(false) })

  // ── § 01 — the climb: a tower that lights up layer by layer ──
  const LAYERS = ['I/O', 'control', 'screens', 'plant', 'cloud', 'mobile']
  const LONG = ['I/O · sensors & motors', 'machine control', 'screens & workflows', 'local reporting', 'cloud reporting', 'mobile · Pulse']
  const steps = $$('.step[data-layer]'), towerStage = $('#tower-stage'), towerAt = $('#tower-at')
  let layer = 1
  const tower = towerStage ? buildTower() : null
  function climbStep() {
    if (!steps.length) return
    const line = innerHeight * (innerWidth <= 920 ? 0.78 : 0.55)
    let n = 1
    steps.forEach((s) => { if (s.getBoundingClientRect().top < line) n = +s.dataset.layer })
    if (n === layer && steps[n - 1].classList.contains('on')) return
    layer = n
    steps.forEach((s) => s.classList.toggle('on', +s.dataset.layer === n))
    towerAt.textContent = `L${n} · ${LONG[n - 1]}`
    tower && tower.setLayer(n)
  }

  function buildTower() {
    const SENS = [0.12, 0.28, 0.44, 0.58]   // the second one is the reader that tells items apart
    const SW = 0.66                           // where the switch splits the conveyor into tracks A and B
    const CLS = ['#5bc8ff', '#f2b100']        // the two kinds of item, once the reader has seen them
    // the same sort station, configured three ways: each plant sees only what its own workflow needs
    const PROFILES = [
      ['hospital', [['gowns', '#5bc8ff'], ['sheets', '#3ddc84'], ['scrubs', '#9d8bff']]],
      ['hotel', [['towels', '#f2b100'], ['sheets', '#3ddc84'], ['robes', '#ff7694']]],
      ['airline', [['blankets', '#5bc8ff'], ['napkins', '#f2b100'], ['headrests', '#ff5a5f']]],
    ]
    const STATES = ['idle', 'ready', 'lifting', 'release']
    const NOTES = ['Dryer 4 · door open 6 min', 'Washers · 1,240 pcs/hr · on target', 'Storage 92% full', 'Shift report ready · 06:00']
    let G, svg, bags = [], spawnT = 0, last = 0, running = false, pkts = [], kpi = 0, bars = [], rate = 1240, run = 94, faults = 2, faultAt = [6, 15], noteI = 0, noteT = 0, msgT = 0, forcedT = null, state = 0, rxT = 0
    const forced = new Set()   // sensors forced ON: the controller thinks that spot is taken

    function geom() {
      const W = towerStage.clientWidth, H = towerStage.clientHeight, pad = 10, gap = 6
      const bh = (H - pad * 2 - gap * 5) / 6
      const top = (i) => H - pad - (i + 1) * bh - i * gap   // i = 0 is the floor
      const cx0 = 58, cx1 = W - 34
      return { W, H, bh, top, cx0, cx1, cw: cx1 - cx0, spine: W - 18 }
    }
    function build() {
      G = geom()
      if (G.W < 50 || G.H < 120) return
      const { W, H, bh, top, cx0, cx1, cw } = G
      let s = `<defs><marker id="tw-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1L8 5L1 9" fill="none" stroke="#8b93a3" stroke-width="1.6"/></marker></defs>`
      for (let i = 0; i < 6; i++) {
        const y = top(i)
        s += `<g class="lyr" data-l="${i + 1}"><rect class="band" x="6" y="${y}" width="${W - 12}" height="${bh}" rx="10"/>`
        s += `<text class="tag" x="16" y="${y + 18}">L${i + 1}</text><text class="ink-3" x="16" y="${y + 31}" style="font-size:9px">${LAYERS[i]}</text>`
        s += layerArt(i, y)
        s += `</g>`
      }
      // the bus: data climbs the right edge
      s += `<line class="bus" x1="${G.spine}" y1="${top(0) + bh * 0.66}" x2="${G.spine}" y2="${top(5) + bh / 2}"/><g id="tw-pkts"></g>`
      svg = document.createElementNS(NS, 'svg')
      svg.setAttribute('class', 'tw')
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      svg.setAttribute('aria-hidden', 'true')
      svg.innerHTML = s
      towerStage.innerHTML = ''
      towerStage.append(svg)
      $$('.sensor', svg).forEach((el) => {
        const k = +el.dataset.i
        const go = () => {
          const on = !forced.has(k)
          on ? forced.add(k) : forced.delete(k)
          paintForced()
          if (on) fire(k)
          forcedT = performance.now()
          towerAt.textContent = on ? `TEST FORCE ◆${k + 1} ON · line holds` : `TEST FORCE ◆${k + 1} OFF · line moves`
        }
        el.addEventListener('click', go)
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } })
      })
      bags.forEach((b) => { b.el = null; b.dot = null })
      pkts = []
      paintForced()
      paintState()
      paintProfile()
      setLayer(layer)
      draw()
    }
    const railY = () => G.top(0) + G.bh * (G.bh < 64 ? 0.5 : 0.6)
    const sx = (f) => G.cx0 + (G.cx1 - 10 - G.cx0) * f
    // where an item is at t: along the main line, then eased onto track A (up) or B (down) after the switch
    function route(t, cls, x0, x1, y0, d) {
      const x = x0 + (x1 - x0) * Math.min(t, 1)
      if (t <= SW) return [x, y0]
      const k = Math.min(1, (t - SW) / 0.08), e = k * k * (3 - 2 * k)
      return [x, y0 + (cls ? d : -d) * e]
    }
    const branch = (x0, x1, y0, dd) => { const X = (t) => x0 + (x1 - x0) * t; return `M${X(SW)} ${y0} C ${X(SW + 0.04)} ${y0}, ${X(SW + 0.04)} ${y0 + dd}, ${X(SW + 0.08)} ${y0 + dd} L${x1} ${y0 + dd}` }
    function layerArt(i, y) {
      const { bh, cx0, cx1, cw } = G, cy = y + bh / 2
      const tight = bh < 64   // phone: the bands are short, so the captions go and only the drawing stays
      if (i === 0) {
        const ry = railY(), d = Math.min(bh * 0.2, tight ? 9 : 15), x0 = sx(0), x1 = sx(1)
        G.fd = d
        let a = tight ? '' : `<text class="ink-3" x="${cx0}" y="${y + 18}" style="font-size:9.5px">sensors · a reader · a switch · two tracks</text>`
        a += `<line class="rail" x1="${x0}" y1="${ry}" x2="${sx(SW)}" y2="${ry}"/>`
        ;[-d, d].forEach((dd) => { a += `<path class="rail" d="${branch(x0, x1, ry, dd)}" style="fill:none"/>` })
        if (!tight) {
          a += `<text class="ink-3" x="${sx(SENS[1])}" y="${ry + 20}" text-anchor="middle" style="font-size:8.5px">reader</text>`
          a += `<text x="${x1 + 4}" y="${ry - d + 3}" style="font-size:8.5px;fill:${CLS[0]};font-weight:700">A</text><text x="${x1 + 4}" y="${ry + d + 3}" style="font-size:8.5px;fill:${CLS[1]};font-weight:700">B</text>`
        }
        a += `<g id="tw-gate" transform="translate(${sx(SW)} ${ry})"><line class="gate" x1="-2" y1="0" x2="${tight ? 10 : 14}" y2="0"/></g><g id="tw-bags"></g>`
        SENS.forEach((f, k) => {
          const x = sx(f)
          a += `<g class="sensor" data-i="${k}" tabindex="0" role="button" aria-label="Force sensor ${k + 1}"><circle cx="${x}" cy="${ry}" r="16" fill="transparent"/><rect class="d" x="${x - 6}" y="${ry - 6}" width="12" height="12" transform="rotate(45 ${x} ${ry})"/></g>`
        })
        return a
      }
      if (i === 1) {
        // the controller: input lights (green), output lights (red), a network port with TX/RX
        const w = Math.min(210, cw * 0.52), h = bh * 0.72, x = cx0, by = y + bh * 0.14
        let a = `<rect class="dark" x="${x}" y="${by}" width="${w}" height="${h}" rx="6"/><text x="${x + 10}" y="${by + (tight ? 11 : 15)}" style="font-size:${tight ? 8 : 9.5}px;fill:#a2a8b4">PLC · generated</text>`
        const r1 = by + h * (tight ? 0.52 : 0.5), r2 = by + h * (tight ? 0.82 : 0.78), lr = tight ? 2.8 : 3.4
        a += `<text x="${x + 10}" y="${r1 + 3}" style="font-size:8px;fill:#6b7280">in</text><text x="${x + 10}" y="${r2 + 3}" style="font-size:8px;fill:#6b7280">out</text>`
        for (let k = 0; k < 4; k++) {
          a += `<circle class="led in" data-o="${k}" cx="${x + 36 + k * 13}" cy="${r1}" r="${lr}"/>`
          a += `<circle class="led out" data-q="${k}" cx="${x + 36 + k * 13}" cy="${r2}" r="${lr}"/>`
        }
        const px = x + w - 30, py = by + h * 0.6
        a += `<rect x="${px}" y="${py - 7}" width="20" height="15" rx="2" style="fill:#151a23;stroke:#3f4a5c"/><rect x="${px + 6}" y="${py + 3}" width="8" height="5" style="fill:#3f4a5c"/>`
        a += `<circle class="led tx" cx="${px + 4}" cy="${py - 11}" r="2.2"/><circle class="led rx" cx="${px + 16}" cy="${py - 11}" r="2.2"/>`
        if (!tight) a += `<text x="${px + 10}" y="${py + 19}" text-anchor="middle" style="font-size:7.5px;fill:#6b7280">tx · rx</text>`
        // wires from each sensor on the floor up to its input light
        SENS.forEach((f, k) => { a += `<path class="wire" d="M${sx(f)} ${railY() - 9} L${x + 36 + k * 13} ${by + h}"/>` })
        // a mini state machine: one device stepping through its states as items arrive
        const s0 = x + w + 18, s1 = cx1 - 8, sw = s1 - s0
        if (sw > 70) {
          const mx = s0 + sw / 2, dx = Math.min(sw * 0.3, 58), dy = Math.min(bh * 0.24, 17), nr = tight ? 4.5 : 6
          const P = [[mx - dx, cy - dy], [mx + dx, cy - dy], [mx + dx, cy + dy], [mx - dx, cy + dy]]
          P.forEach(([x0, y0], n) => {
            const [x1, y1] = P[(n + 1) % 4], L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, g = nr + 3
            a += `<line class="smw" x1="${(x0 + ux * g).toFixed(1)}" y1="${(y0 + uy * g).toFixed(1)}" x2="${(x1 - ux * (g + 2)).toFixed(1)}" y2="${(y1 - uy * (g + 2)).toFixed(1)}" marker-end="url(#tw-arr)"/>`
          })
          P.forEach(([px0, py0], n) => {
            a += `<circle class="sm" data-s="${n}" cx="${px0}" cy="${py0}" r="${nr}"/>`
            if (!tight) a += `<text class="sml" data-s="${n}" x="${px0}" y="${n < 2 ? py0 - nr - 5 : py0 + nr + 11}" text-anchor="middle">${STATES[n]}</text>`
          })
          if (!tight) a += `<text class="ink-3" x="${mx}" y="${cy + 3}" text-anchor="middle" style="font-size:8px">lift</text>`
        }
        return a
      }
      if (i === 2) {
        // eVue: a live overview of the plant, and a station screen configured for this plant's workflow
        const w = Math.min(360, cw * 0.92), h = bh * 0.8, x = cx0, by = y + bh * 0.1
        let a = `<rect class="dark" x="${x}" y="${by}" width="${w}" height="${h}" rx="6"/>`
        if (!tight) a += `<text x="${x + 9}" y="${by + 12}" style="font-size:8.5px;fill:#6b7280">eVue · live plant view · two routes</text>`
        const ox = x + 10, oy = by + (tight ? 6 : 20), ow = w * 0.55, oh = h - (tight ? 12 : 28)
        const q0 = ox + 4, q1 = ox + ow - 34, qy = oy + oh / 2, qd = oh * 0.3, mh = Math.min(oh * 0.36, 16)
        G.scr = { x0: q0, x1: q1, y0: qy, d: qd }
        a += `<path class="route" d="M${q0} ${qy} L${q0 + (q1 - q0) * SW} ${qy}"/>`
        ;[0, 1].forEach((c) => {
          const dd = c ? qd : -qd
          a += `<path class="route" data-r="${c}" d="${branch(q0, q1, qy, dd)}"/>`
          a += `<rect class="mach" data-m="${c}" x="${q1 + 4}" y="${qy + dd - mh / 2}" width="26" height="${mh}" rx="3"/><text x="${q1 + 17}" y="${qy + dd + 3}" text-anchor="middle" style="font-size:${tight ? 7 : 8.5}px;fill:#a2a8b4;font-weight:700">${tight ? 'AB'[c] : 'W' + (c + 1)}</text>`
        })
        a += `<g id="tw-dots"></g>`
        const px = ox + ow + 10, pw = x + w - 8 - px
        a += `<rect x="${px}" y="${oy}" width="${pw}" height="${oh}" rx="5" style="fill:#151a23;stroke:#2a323f"/><g id="tw-prof" data-x="${px}" data-y="${oy}" data-w="${pw}" data-h="${oh}" data-tight="${tight ? 1 : 0}"></g>`
        return a
      }
      if (i === 3) {
        // the plant's own dashboard: four live numbers over the day's production, faults marked on it
        const w = Math.min(360, cw * 0.92), h = bh * 0.8, x = cx0, by = y + bh * 0.1
        let a = `<rect class="box" x="${x}" y="${by}" width="${w}" height="${h}" rx="6"/>`
        const th = tight ? h - 8 : Math.min(h * 0.5, 42), tw = (w - 10 - 3 * 5) / 4
        ;[['pieces today', 'ink'], ['pcs / hr', 'ink'], ['runtime', 'ink'], ['faults', 'bad']].forEach(([lab, cls], k) => {
          const tx = x + 5 + k * (tw + 5), ty = by + 4
          a += `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="4" style="fill:var(--bg);stroke:var(--line)"/>`
          a += `<text class="kv ${cls}" id="tw-k${k}" x="${tx + 6}" y="${ty + (tight ? th / 2 + 4 : th * 0.5 + 3)}" style="font:800 ${tight ? 10.5 : 15}px var(--font-display)">0</text>`
          if (!tight) a += `<text class="ink-3" x="${tx + 6}" y="${ty + th - 6}" style="font-size:7.5px">${lab}</text>`
          if (k === 2) a += `<rect x="${tx + tw - 8}" y="${ty + 4}" width="3" height="${th - 8}" rx="1.5" style="fill:var(--line)"/><rect id="tw-runbar" x="${tx + tw - 8}" y="${ty + 4}" width="3" height="${th - 8}" rx="1.5" style="fill:#3ddc84"/>`
        })
        if (!tight) a += `<g id="tw-spark" data-x="${x + 8}" data-y="${by + th + 10}" data-w="${w - 16}" data-h="${h - th - 16}"></g>`
        return a
      }
      if (i === 4) {
        const ccx = cx0 + Math.min(cw * 0.6, 250), ccy = y + bh * 0.44, r = Math.min(bh * 0.22, 19)
        let a = tight ? '' : `<text class="ink-3" x="${cx0}" y="${y + 18}" style="font-size:9.5px">400+ plants · one picture · every minute</text>`
        const n = 7, sy = y + bh * 0.76
        for (let k = 0; k < n; k++) {
          const x = cx0 + 4 + k * Math.min(26, (cw * 0.42) / n)
          a += `<path class="wire" d="M${x + 4} ${sy - 4} L${ccx - r * 0.6 + (k / (n - 1)) * r * 1.2} ${ccy + r * 0.7}"/><rect class="site" data-s="${k}" x="${x}" y="${sy - 4}" width="9" height="9" rx="2"/>`
        }
        a += `<g class="box"><circle cx="${ccx - r * 0.9}" cy="${ccy + r * 0.2}" r="${r * 0.7}"/><circle cx="${ccx}" cy="${ccy - r * 0.25}" r="${r}"/><circle cx="${ccx + r * 0.95}" cy="${ccy + r * 0.25}" r="${r * 0.62}"/><rect x="${ccx - r * 0.9}" y="${ccy + r * 0.05}" width="${r * 1.85}" height="${r * 0.82}" style="stroke:none"/></g>`
        return a
      }
      const ph = bh * 0.84, pw = Math.min(ph * 0.52, 50), x = cx0, py = y + bh * 0.08
      let a = `<rect class="dark" x="${x}" y="${py}" width="${pw}" height="${ph}" rx="8"/><rect x="${x + pw / 2 - 7}" y="${py + 3}" width="14" height="3" rx="1.5" style="fill:#2a323f"/>`
      a += `<g class="note" id="tw-note"><rect x="${x + 4}" y="${py + 12}" width="${pw - 8}" height="${Math.min(22, ph * 0.3)}" rx="4" style="fill:#5bc8ff"/><rect x="${x + 8}" y="${py + 17}" width="${(pw - 16) * 0.7}" height="3" rx="1.5" style="fill:#05121c;opacity:.6"/><rect x="${x + 8}" y="${py + 23}" width="${(pw - 16) * 0.45}" height="3" rx="1.5" style="fill:#05121c;opacity:.4"/></g>`
      a += `<text class="ink" x="${x + pw + 14}" y="${y + bh * (tight ? 0.42 : 0.4)}" style="font:800 ${tight ? 13 : 15}px var(--font-display)">Pulse</text>${tight ? '' : `<text class="ink-3" x="${x + pw + 14}" y="${y + bh * 0.4 + 14}" style="font-size:9px">plant data, out to the phone</text>`}`
      a += `<text id="tw-notetxt" class="ink-2" x="${x + pw + 14}" y="${y + bh * (tight ? 0.42 : 0.4) + (tight ? 15 : 30)}" style="font-size:${tight ? 9 : 10}px">🔔 ${NOTES[0]}</text>`
      return a
    }

    function paintForced() {
      if (!svg) return
      SENS.forEach((_, k) => {
        $(`.sensor[data-i="${k}"]`, svg).classList.toggle('forced', forced.has(k))
        $(`.led[data-o="${k}"]`, svg).classList.toggle('forced', forced.has(k))
      })
    }
    // each arrival steps the lift one state round its loop; the output light for that state is on
    function paintState() {
      if (!svg) return
      $$('.sm, .sml', svg).forEach((el) => el.classList.toggle('on', +el.dataset.s === state))
      $$('.led.out', svg).forEach((el) => el.classList.toggle('on', +el.dataset.q === state))
    }
    function setLayer(n) {
      if (!svg) return
      $$('.lyr', svg).forEach((g) => {
        const l = +g.dataset.l
        g.classList.toggle('off', l > n)
        g.classList.toggle('on', l === n)
      })
    }
    function bagShape(b) {
      b.el = document.createElementNS(NS, 'g')
      const r = Math.min(9, G.bh * 0.14)
      b.el.innerHTML = `<path d="M${-r} 0 C ${-r} ${-r * 1.2}, ${r} ${-r * 1.25}, ${r} 0 S ${-r * 0.2} ${r * 1.15}, ${-r} 0Z" fill="#8f8a7e" stroke="#11151c" stroke-width="1.1" style="transition:fill .25s"/>`
      $('#tw-bags', svg).append(b.el)
      b.dot = document.createElementNS(NS, 'circle')
      b.dot.setAttribute('r', '3.2'); b.dot.setAttribute('fill', '#eef0f4')
      $('#tw-dots', svg).append(b.dot)
    }
    function draw() {
      if (!svg) return
      const lit = [false, false]
      bags.forEach((b) => {
        if (!b.el) bagShape(b)
        const [fx, fy] = route(b.t, b.cls, sx(0), sx(1), railY(), G.fd)
        b.el.setAttribute('transform', `translate(${fx.toFixed(1)} ${(fy - 8).toFixed(1)})`)
        const c = b.seen ? CLS[b.cls] : '#8f8a7e'
        b.el.firstChild.setAttribute('fill', c)
        const { x0, x1, y0, d } = G.scr   // the same item, on the operator's live view
        const [dx, dy] = route(b.t, b.cls, x0, x1, y0, d)
        b.dot.setAttribute('cx', dx.toFixed(1)); b.dot.setAttribute('cy', dy.toFixed(1)); b.dot.setAttribute('fill', b.seen ? c : '#eef0f4')
        if (b.t > SW) lit[b.cls] = true
      })
      lit.forEach((on, c) => $(`.route[data-r="${c}"]`, svg).classList.toggle('lit', on))
      // the switch points at the track the next item needs; that is the controller's output
      const next = bags.filter((b) => b.t <= SW).sort((p, q) => q.t - p.t)[0]
      if (next) $('#tw-gate', svg).setAttribute('transform', `translate(${sx(SW)} ${railY()}) rotate(${next.cls ? 28 : -28})`)
    }
    let prof = 0
    function paintProfile() {
      const g = svg && $('#tw-prof', svg)
      if (!g) return
      const x = +g.dataset.x, y = +g.dataset.y, w = +g.dataset.w, h = +g.dataset.h, [name, bins] = PROFILES[prof]
      if (+g.dataset.tight) {
        g.innerHTML = `<text x="${x + 5}" y="${y + 10}" style="font-size:7.5px;fill:#a2a8b4">${name}</text>` +
          bins.map(([, c], k) => `<rect x="${x + 5 + k * 11}" y="${y + h - 11}" width="8" height="7" rx="1.5" style="fill:${c}"/>`).join('')
        return
      }
      const rh = (h - 20) / 3
      g.innerHTML = `<text x="${x + 7}" y="${y + 12}" style="font-size:8px;fill:#a2a8b4">sort · ${name} plant</text>` +
        bins.map(([t, c], k) => `<rect x="${x + 7}" y="${(y + 17 + k * rh).toFixed(1)}" width="${w - 14}" height="${(rh - 3).toFixed(1)}" rx="3" style="fill:${c};opacity:.24"/><rect x="${x + 7}" y="${(y + 17 + k * rh).toFixed(1)}" width="3" height="${(rh - 3).toFixed(1)}" rx="1" style="fill:${c}"/><text x="${x + 15}" y="${(y + 17 + k * rh + rh / 2 + 1.5).toFixed(1)}" style="font-size:8.5px;fill:#eef0f4">${t}</text>`).join('')
      g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350 })
    }
    function hot(el, ms = 260) { if (!el) return; el.classList.add('hot'); setTimeout(() => el.classList.remove('hot'), ms) }
    function fire(k) {
      if (!svg) return
      hot($(`.sensor[data-i="${k}"]`, svg), 320)
      hot($(`.led[data-o="${k}"]`, svg), 320)
      hot($('.led.tx', svg), 140)
      state = (state + 1) % 4
      paintState()
      if (layer >= 2 && !reduced) {
        const c = document.createElementNS(NS, 'circle')
        c.setAttribute('class', 'pkt'); c.setAttribute('r', '3.2'); c.setAttribute('cx', G.spine)
        $('#tw-pkts', svg).append(c)
        pkts.push({ el: c, y: railY(), to: G.top(layer - 1) + G.bh / 2 })
      } else arrive()
    }
    function arrive() {
      if (layer >= 4) {
        kpi += 1 + Math.floor(Math.random() * 3)
        rate = Math.round(clamp(rate + (Math.random() - 0.5) * 60, 1080, 1360))
        run = Math.round(clamp(run + (Math.random() - 0.5) * 2, 88, 98))
        bars.shift(); bars.push(clamp(0.35 + (rate - 1080) / 560 + (Math.random() - 0.5) * 0.15, 0.1, 1))
        faultAt = faultAt.map((f) => f - 1).filter((f) => f >= 0)
        if (Math.random() < 0.06) { faults++; faultAt.push(bars.length - 1) }
        paintBars()
      }
      if (layer >= 5) hot($(`.site[data-s="${Math.floor(Math.random() * 7)}"]`, svg), 380)
    }
    function paintBars() {
      if (!svg || !$('#tw-k0', svg)) return
      $('#tw-k0', svg).textContent = fmt(kpi)
      $('#tw-k1', svg).textContent = fmt(rate)
      $('#tw-k2', svg).textContent = `${run}%`
      $('#tw-k3', svg).textContent = String(faults)
      const rb = $('#tw-runbar', svg), full = +rb.previousElementSibling.getAttribute('height'), top = +rb.previousElementSibling.getAttribute('y')
      rb.setAttribute('height', (full * run / 100).toFixed(1)); rb.setAttribute('y', (top + full * (1 - run / 100)).toFixed(1))
      const g = $('#tw-spark', svg)
      if (!g) return
      const x = +g.dataset.x, y = +g.dataset.y, w = +g.dataset.w, h = +g.dataset.h, n = bars.length
      const pts = bars.map((v, k) => [x + (k / (n - 1)) * w, y + h - v * (h - 10)])
      const line = pts.map(([px, py], k) => `${k ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join('')
      g.innerHTML = `<path d="${line} L${x + w} ${y + h} L${x} ${y + h}Z" style="fill:var(--acc);opacity:.12"/><path d="${line}" style="fill:none;stroke:var(--acc);stroke-width:1.6"/>` +
        faultAt.map((f) => `<rect x="${(x + (f / (n - 1)) * w - 1.5).toFixed(1)}" y="${y}" width="3" height="${h}" rx="1" style="fill:#ff5a5f;opacity:.55"/>`).join('') +
        `<text x="${x}" y="${y + 6}" style="font-size:7.5px;fill:var(--fg-3)">production · last 24 h · faults in red</text>`
    }
    function tick(now) {
      if (!running) return
      const dt = Math.min(64, now - (last || now)); last = now
      spawnT -= dt
      if (spawnT <= 0 && !bags.some((b) => b.t < 0.08)) { bags.push({ t: 0, cls: Math.random() < 0.5 ? 0 : 1 }); spawnT = 1300 }
      // front to back: each bag stops short of the one ahead, and of any sensor forced ON
      bags.sort((a, b) => b.t - a.t)
      bags.forEach((b, i) => {
        let lim = 1.05
        if (i) lim = Math.min(lim, bags[i - 1].t - 0.07)
        forced.forEach((k) => { if (b.t < SENS[k] - 0.03) lim = Math.min(lim, SENS[k] - 0.04) })
        const nt = Math.max(b.t, Math.min(b.t + 0.00009 * dt, lim))
        SENS.forEach((f, k) => { if (b.t < f && nt >= f) { fire(k); if (k === 1) b.seen = true } })
        b.t = nt
      })
      bags = bags.filter((b) => { if (b.t >= 1) { b.el && b.el.remove(); b.dot && b.dot.remove(); hot($(`.mach[data-m="${b.cls}"]`, svg), 500); return false } return true })
      pkts = pkts.filter((p) => {
        p.y -= 0.32 * dt
        p.el.setAttribute('cy', p.y.toFixed(1))
        if (p.y <= p.to) { p.el.remove(); arrive(); return false }
        return true
      })
      rxT += dt
      if (rxT > 420) { rxT = 0; hot($('.led.rx', svg), 110) }   // the bridge polls the PLC
      msgT += dt
      if (msgT > 3000) { msgT = 0; prof = (prof + 1) % PROFILES.length; paintProfile();  }
      if (layer >= 6) {
        noteT += dt
        if (noteT > 3200) {
          noteT = 0; noteI = (noteI + 1) % NOTES.length
          $('#tw-notetxt', svg).textContent = `🔔 ${NOTES[noteI]}`
          const n = $('#tw-note', svg)
          n.animate([{ transform: 'translateY(-10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.2,.7,.2,1)' })
        }
      }
      if (forcedT && now - forcedT > 1400) { forcedT = null; towerAt.textContent = `L${layer} · ${LONG[layer - 1]}` }
      draw()
      requestAnimationFrame(tick)
    }

    build()
    let lastSize = ''
    new ResizeObserver(() => { const k = `${towerStage.clientWidth}x${towerStage.clientHeight}`; if (k !== lastSize) { lastSize = k; build(); paintBars() } }).observe(towerStage)
    if (reduced) {
      bags = [{ t: 0.08, cls: 0 }, { t: 0.36, cls: 1, seen: true }, { t: 0.55, cls: 0, seen: true }, { t: 0.82, cls: 1, seen: true }]
      kpi = 8412; bars = Array.from({ length: 24 }, (_, k) => 0.45 + 0.35 * Math.abs(Math.sin(k / 3)))
      draw(); paintBars()
    } else {
      kpi = 8412; bars = Array.from({ length: 24 }, (_, k) => 0.45 + 0.3 * Math.abs(Math.sin(k / 3)) + Math.random() * 0.1)
      paintBars()
      new IntersectionObserver((es) => es.forEach((e) => {
        running = e.isIntersecting
        if (running) { last = 0; requestAnimationFrame(tick) }
      }), { threshold: 0.1 }).observe(towerStage)
    }
    return { setLayer: (n) => { setLayer(n); if (n < 2) { pkts.forEach((p) => p.el.remove()); pkts = [] } } }
  }

  // ── dusk: the sky turns over ─────────────────────────
  const duskEl = $('#dusk'), sky = $('#sky'), duskStage = $('.dusk .stage')
  let duskP = 0
  const SKY = [
    [0, '#f1f3f6', '#f1f3f6'], [0.22, '#fde7c4', '#ffcf9a'], [0.42, '#f6a978', '#c2687a'],
    [0.6, '#51407a', '#2b2448'], [0.78, '#111729', '#0c0f1a'], [1, '#07090e', '#07090e'],
  ]
  const hex = (h) => h.startsWith('rgb') ? h.match(/\d+/g).map(Number) : [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], t))).join(',')})` }
  function skyAt(p) {
    for (let i = 1; i < SKY.length; i++) {
      if (p <= SKY[i][0]) {
        const t = (p - SKY[i - 1][0]) / (SKY[i][0] - SKY[i - 1][0])
        return [mix(SKY[i - 1][1], SKY[i][1], t), mix(SKY[i - 1][2], SKY[i][2], t)]
      }
    }
    return [SKY[SKY.length - 1][1], SKY[SKY.length - 1][2]]
  }
  function dusk() {
    if (!duskEl) return
    const r = duskEl.getBoundingClientRect()
    duskP = reduced ? 0.8 : clamp(-r.top / Math.max(1, r.height - innerHeight))
    const [a, b] = skyAt(duskP)
    const s = duskStage.style
    s.setProperty('--sky-a', a); s.setProperty('--sky-b', b)
    sky.style.setProperty('--sky-a', a); sky.style.setProperty('--sky-b', b)
    s.setProperty('--orb-y', `${lerp(10, 82, clamp(duskP / 0.62))}%`)
    s.setProperty('--orb-o', String(1 - clamp((duskP - 0.5) / 0.18)))
    s.setProperty('--orb-b', mix('#ffb347', '#ff6a3d', clamp(duskP / 0.55)))
    s.setProperty('--stars', String(clamp((duskP - 0.5) / 0.3)))
    s.setProperty('--then', String(clamp((duskP - 0.8) / 0.14)))
    const dark = duskP > 0.48
    s.setProperty('--ink', dark ? '#eef0f4' : '#0b0e15')
    s.setProperty('--ink-2', dark ? '#c3c8d2' : '#394250')
    s.setProperty('--ink-3', dark ? '#8b93a3' : '#5f6876')
    clockHand()
  }

  // the 24-hour commit clock (every repo, Oct 24 2025 → Oct 24 2026, author-local hour)
  const WORK = [171,115,54,39,18,14,11,83,121,300,412,509,575,500,343,269,217,121,104,99,86,170,161,196]
  const MINE = [398,286,225,161,114,86,47,76,181,257,259,318,270,272,263,240,217,204,267,187,264,258,421,443]
  const cv = $('#clockviz')
  let handEl, timeEl
  if (cv) {
    const mx = Math.max(...WORK, ...MINE)
    const ang = (h) => (h / 24) * Math.PI * 2 - Math.PI / 2
    const wedge = (h, r0, r1, w) => {
      const a0 = ang(h) - w / 2, a1 = ang(h) + w / 2
      const p = (r, a) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`
      return `M${p(r0, a0)} L${p(r1, a0)} A${r1} ${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 0 0 ${p(r0, a0)}Z`
    }
    let g = ''
    const step = (Math.PI * 2) / 24
    g += `<circle r="64" fill="none" stroke="currentColor" stroke-opacity=".18"/><circle r="124" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-dasharray="2 4"/>`
    for (let h = 0; h < 24; h++) {
      g += `<path d="${wedge(h, 66, 66 + (WORK[h] / mx) * 54, step * 0.72)}" fill="#2f8fd0" opacity=".92"><title>${h}:00 · day job · ${WORK[h]} commits</title></path>`
      g += `<path d="${wedge(h, 128, 128 + (MINE[h] / mx) * 60, step * 0.72)}" fill="#9d8bff"><title>${h}:00 · my own builds · ${MINE[h]} commits</title></path>`
    }
    const lab = (h, r, t) => { const a = ang(h); return `<text x="${(r * Math.cos(a)).toFixed(1)}" y="${(r * Math.sin(a) + 4).toFixed(1)}" text-anchor="middle" fill="currentColor" opacity=".75">${t}</text>` }
    g += lab(0, 198, 'midnight') + lab(12, 196, 'noon') + lab(6, 46, '6a') + lab(18, 46, '6p')
    g += `<line id="cv-hand" x1="0" y1="0" x2="0" y2="-56" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle r="4" fill="currentColor"/>`
    g += `<text id="cv-time" y="30" text-anchor="middle" fill="currentColor" style="font-size:13px;font-weight:700">12:00</text>`
    cv.innerHTML = g
    cv.style.color = 'var(--ink, #0b0e15)'
    handEl = $('#cv-hand', cv); timeEl = $('#cv-time', cv)
  }
  function clockHand() {
    if (!handEl) return
    const h = hourAt(scrollY) % 24              // the same hour the top bar shows
    handEl.setAttribute('transform', `rotate(${(h / 24) * 360})`)   // 0° = up = midnight
    const hh = Math.floor(h), mm = Math.floor((h - hh) * 60)
    timeEl.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }

  // ── § 02 — the plant, on hard mode ───────────────────
  const STATIONS = [
    ['Dirty in', 'receiving'], ['Sort', 'by type, by hand'], ['Storage', 'waits its turn'], ['Release', 'what goes next'],
    ['Wash + dry', 'the big machines'], ['Fold', 'finishing'], ['Clean out', 'shipped back'],
  ]
  const stage = $('#plant-stage')
  if (stage) plant()
  function plant() {
    const out = $('#plant-out'), cnt = $('#plant-cnt')
    let vertical = false, svg, items = [], done = 0, last = 0, spawnT = 0, running = false
    const forced = new Set()   // sensors forced ON hold the line behind them
    const sw = { wan: false, halt: false, stale: false }
    let queued = 0
    const cloud = document.createElement('div')
    cloud.className = 'cloudbar'
    stage.before(cloud)
    const bubble = document.createElement('div')
    bubble.className = 'bubble'; bubble.setAttribute('role', 'status')
    stage.append(bubble)

    const N = 7, ST = Array.from({ length: N }, (_, i) => 0.05 + (i / (N - 1)) * 0.86)  // station t along the line
    const HALT_T = (ST[3] + ST[4]) / 2, STALE_T = ST[3] - 0.045

    function geom() {
      vertical = stage.clientWidth < 720
      return vertical
        ? { w: 360, h: 860, at: (t) => [64, 40 + t * 790], box: (i) => [104, 40 + ST[i] * 790 - 26, 236, 52] }
        : { w: 1000, h: 250, at: (t) => [40 + t * 920, 178], box: (i) => [40 + ST[i] * 920 - 64, 64, 128, 56] }
    }
    let G
    function build() {
      G = geom()
      stage.innerHTML = ''
      stage.append(bubble)
      svg = document.createElementNS(NS, 'svg')
      svg.setAttribute('viewBox', `0 0 ${G.w} ${G.h}`)
      svg.setAttribute('role', 'img')
      svg.setAttribute('aria-label', 'A laundry line with seven stations. Items move from dirty in to clean out.')
      const [x0, y0] = G.at(0), [x1, y1] = G.at(1)
      let s = `<defs><pattern id="hz" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="14" fill="#f2b100"/><rect x="7" width="7" height="14" fill="#11151c"/></pattern></defs>`
      const [hx0, hy0] = G.at(HALT_T), [hx1, hy1] = G.at(1)
      s += vertical
        ? `<rect class="halted" x="${hx0 - 22}" y="${hy0}" width="44" height="${hy1 - hy0 + 10}" rx="8" fill="url(#hz)" opacity="0"/>`
        : `<rect class="halted" x="${hx0}" y="${hy0 - 22}" width="${hx1 - hx0 + 10}" height="44" rx="8" fill="url(#hz)" opacity="0"/>`
      s += `<path class="lane" d="M${x0} ${y0} L${x1} ${y1}"/><path class="lane-in" d="M${x0} ${y0} L${x1} ${y1}"/>`
      for (let i = 0; i < N; i++) {
        const [bx, by, bw, bh] = G.box(i), [sx, sy] = G.at(ST[i])
        const lx = vertical ? bx + 14 : bx + bw / 2, anchor = vertical ? 'start' : 'middle'
        s += `<g class="st" data-i="${i}">`
        s += vertical ? `<path d="M${sx + 8} ${sy} L${bx} ${sy}" stroke="var(--line-2)" stroke-dasharray="3 4"/>` : `<path d="M${sx} ${by + bh} L${sx} ${sy - 12}" stroke="var(--line-2)" stroke-dasharray="3 4"/>`
        s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="10"/>`
        s += `<text class="nm" x="${lx}" y="${by + 24}" text-anchor="${anchor}" style="font-size:${vertical ? 14 : 13}px">${esc(STATIONS[i][0])}</text>`
        s += `<text class="sub" x="${lx}" y="${by + 42}" text-anchor="${anchor}">${esc(STATIONS[i][1])}</text></g>`
      }
      for (let i = 0; i < N; i++) {
        const [sx, sy] = G.at(ST[i] - 0.03)
        const stale = i === 3 ? ' data-stale' : ''
        s += `<g class="sensor" data-i="${i}"${stale} tabindex="0" role="button" aria-label="Force the sensor before ${esc(STATIONS[i][0])}">`
        s += `<circle class="hit" cx="${sx}" cy="${sy}" r="${vertical ? 26 : 18}"/><circle class="ring" cx="${sx}" cy="${sy}" r="12" fill="none"/>`
        s += `<rect class="d" x="${sx - 6}" y="${sy - 6}" width="12" height="12" transform="rotate(45 ${sx} ${sy})"/></g>`
      }
      s += `<g id="items"></g>`
      svg.innerHTML = s
      stage.prepend(svg)
      $$('.sensor', svg).forEach((el) => {
        const go = () => force(+el.dataset.i, el)
        el.addEventListener('click', go)
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } })
      })
      items.forEach((it) => { it.el = null })
      forced.forEach((i) => $(`.sensor[data-i="${i}"]`, svg).classList.add('on'))
      paintSwitches()
      draw()
    }

    function shape(it) {
      const g = document.createElementNS(NS, 'g')
      g.setAttribute('class', 'item')
      g.addEventListener('click', () => why(it))
      it.el = g
      $('#items', svg).append(g)
    }
    function state(t) {
      if (t < ST[4] - 0.02) return 'DIRTY'
      if (t < ST[4] + 0.035) return 'WET ↑'
      if (t < ST[5] + 0.02) return 'DRY ↓'
      return 'FOLDED'
    }
    function paint(it) {
      if (!it.el) shape(it)
      const st = state(it.t)
      if (st !== it.st) {
        it.st = st
        const r = st === 'WET ↑' ? 15 : st === 'DRY ↓' ? 11 : st === 'FOLDED' ? 10 : 13
        const tagY = vertical ? 4 : -24, tagX = vertical ? -50 : 0
        const body = st === 'FOLDED'
          ? `<rect x="-12" y="-8" width="24" height="16" rx="4" fill="#e8f3fb" stroke="#0a6fab" stroke-width="1.2"/>`
          : `<path d="M${-r} 0 C ${-r} ${-r * 1.2}, ${r} ${-r * 1.25}, ${r} 0 S ${-r * .2} ${r * 1.15}, ${-r} 0Z" fill="${st === 'DIRTY' ? '#8f8a7e' : st === 'WET ↑' ? '#4b8fbf' : '#d9e6f0'}" stroke="#11151c" stroke-width="1.1"/>`
        it.el.innerHTML = `${body}<text x="${tagX}" y="${tagY}" text-anchor="middle" style="font-family:var(--font-mono);font-size:10px;fill:var(--fg-2)">${st}</text>`
      }
      const [x, y] = G.at(it.t)
      const sq = it.moving ? 1 + Math.sin(it.t * 90) * 0.04 : 1
      it.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sq.toFixed(3)} ${(2 - sq).toFixed(3)})`)
      it.el.classList.toggle('held', !!it.reason)
    }
    function draw() { items.forEach(paint) }

    function say(html) { out.innerHTML = html }
    function force(i, el) {
      const on = !forced.has(i)
      on ? forced.add(i) : forced.delete(i)
      el.classList.toggle('on', on)
      say(on
        ? `<span class="k">TEST FORCE ◆ ${esc(STATIONS[i][0])} → ON.</span> As far as the controller knows, that spot is taken, so the next item stops and waits. Click-to-force is a test tool: since March 2009, how we prove a control system during commissioning, before real goods arrive.`
        : `<span class="k">TEST FORCE ◆ ${esc(STATIONS[i][0])} → OFF.</span> Spot's free. The line moves again.`)
    }
    function why(it) {
      const msg = it.reason || (it.moving ? 'Moving. Nothing to explain.' : 'Waiting on the one ahead.')
      const [x, y] = G.at(it.t)
      const rect = svg.getBoundingClientRect(), k = rect.width / G.w
      bubble.textContent = msg
      bubble.style.left = `${x * k}px`; bubble.style.top = `${y * k - 18}px`
      bubble.classList.add('show')
      clearTimeout(why.t); why.t = setTimeout(() => bubble.classList.remove('show'), 2600)
    }

    function tick(now) {
      if (!running) return
      const dt = Math.min(64, now - (last || now)); last = now
      spawnT -= dt
      if (spawnT <= 0 && !items.some((it) => it.t < 0.06)) { items.push({ t: 0, moving: true }); spawnT = 1500 }
      items.sort((a, b) => b.t - a.t)
      for (let k = 0; k < items.length; k++) {
        const it = items[k], ahead = items[k - 1]
        let limit = 1.05, reason = null
        if (ahead) limit = Math.min(limit, ahead.t - 0.055)
        forced.forEach((s) => {
          const at = ST[s] - 0.03
          if (it.t < at - 0.01 && at - 0.045 < limit) { limit = at - 0.045; reason = `The sensor ahead is forced ON. The controller thinks that spot is taken.` }
        })
        if (sw.halt && it.t < HALT_T) { if (HALT_T - 0.012 < limit) { limit = HALT_T - 0.012; reason = 'Back half halted. A person restarts it when it\'s safe.' } }
        if (sw.stale && it.t <= STALE_T && !it.reread) {
          if (STALE_T < limit) { limit = STALE_T; if (it.t >= STALE_T - 0.002) { it.hold = (it.hold || 0) + dt; reason = 'Sensor looks stale. Re-reading it live before release.'; if (it.hold > 1800) it.reread = true } }
        }
        const v = 0.000072 * dt
        const nt = Math.min(it.t + v, limit)
        it.moving = nt > it.t + v * 0.5
        if (!reason && !it.moving && ahead) reason = 'Waiting on the one ahead.'
        it.reason = it.moving ? null : reason
        it.t = Math.max(it.t, nt)
        for (let s = 0; s < N; s++) if (it.prev !== undefined && it.prev < ST[s] && it.t >= ST[s]) ping()   // passing a station pings the cloud
        it.prev = it.t
      }
      items = items.filter((it) => {
        if (it.t >= 1) { done++; it.el && it.el.remove(); return false }
        return true
      })
      cnt.textContent = `${done} through`
      draw()
      requestAnimationFrame(tick)
    }
    function ping() {
      if (sw.wan) { queued++; paintCloud(); return }
      cloud.classList.remove('ping'); void cloud.offsetWidth; cloud.classList.add('ping')
    }
    function paintCloud() {
      cloud.innerHTML = sw.wan
        ? `<span class="dot off"></span><b>org cloud</b><span>WAN down · plant still running · queued for rollup: <b>${queued}</b></span>`
        : `<span class="dot"></span><b>org cloud</b><span>rolled up from the plant every minute${queued ? ` · caught up` : ''}</span>`
      cloud.classList.toggle('down', sw.wan)
    }
    function paintSwitches() {
      if (!svg) return
      $('.halted', svg).setAttribute('opacity', sw.halt ? '.55' : '0')
      const st = $('.sensor[data-stale]', svg)
      st && st.classList.toggle('stale', sw.stale)
      paintCloud()
    }
    $$('#switches .sw').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.sw
      sw[k] = !sw[k]
      b.setAttribute('aria-pressed', sw[k])
      if (k === 'wan' && !sw.wan && queued) { say(`<span class="k">WAN back.</span> ${queued} queued events caught up in one burst. Nothing on the floor waited for the internet.`); queued = 0 }
      else if (k === 'wan' && sw.wan) say('<span class="w">Internet cut.</span> The line keeps moving. The plant runs on its own server; the cloud gets the story later.')
      else if (k === 'halt') say(sw.halt ? '<span class="w">Back half halted.</span> Only that half stops. The front half keeps working.' : 'Back half restarted — by a person, on purpose.')
      else if (k === 'stale') { items.forEach((it) => { it.reread = false; it.hold = 0 }); say(sw.stale ? '<span class="w">The release sensor is lying.</span> The next item stops and reads it again, live, before it goes.' : 'Sensor honest again.') }
      paintSwitches()
    }))

    build()
    let lastV = vertical
    addEventListener('resize', () => { const v = stage.clientWidth < 720; if (v !== lastV) { lastV = v; build() } })
    if (reduced) {
      items = ST.slice(0, 6).map((t) => ({ t: t + 0.02, moving: false }))
      draw()
      return
    }
    new IntersectionObserver((es) => es.forEach((e) => {
      running = e.isIntersecting
      if (running) { last = 0; requestAnimationFrame(tick) }
    }), { threshold: 0.15 }).observe(stage)
  }

  // ── § 04 — Burrow, drawn ─────────────────────────────
  const fac = $('#factory')
  if (fac) {
    const nodes = [
      { id: 'in', x: 10, y: 120, w: 112, t: 'intent in', s: 'cards · tickets · timers' },
      { id: 'build', x: 160, y: 120, w: 112, t: 'one session', s: 'builds + tests' },
      { id: 'read', x: 310, y: 120, w: 112, t: 'other vendor', s: 'reviews the diff' },
      { id: 'ship', x: 400, y: 30, w: 112, t: 'shipped', s: 'merged · deployed' },
      { id: 'park', x: 400, y: 214, w: 112, t: 'parked', s: 'a question for me', park: true },
    ]
    const wires = [['in', 'build'], ['build', 'read'], ['read', 'ship'], ['read', 'park'], ['read', 'build']]
    const c = (id) => { const n = nodes.find((x) => x.id === id); return [n.x + n.w / 2, n.y + 26] }
    let s = ''
    const paths = []
    wires.forEach(([a, b], i) => {
      const [x0, y0] = c(a), [x1, y1] = c(b)
      const back = b === 'build' && a === 'read'
      const d = back
        ? `M${x0} ${y0 + 26} C ${x0} ${y0 + 70}, ${x1} ${y1 + 70}, ${x1} ${y1 + 26}`
        : `M${x0} ${y0} C ${(x0 + x1) / 2} ${y0}, ${(x0 + x1) / 2} ${y1}, ${x1} ${y1}`
      paths.push(d)
      s += `<path class="wire" id="w${i}" d="${d}"${back ? ' stroke-dasharray="4 5"' : ''}/>`
    })
    nodes.forEach((n) => {
      s += `<g class="node${n.park ? ' park' : ''}"><rect x="${n.x}" y="${n.y}" width="${n.w}" height="52" rx="10"/><text x="${n.x + 12}" y="${n.y + 22}" style="fill:var(--fg);font-weight:700">${n.t}</text><text x="${n.x + 12}" y="${n.y + 40}" style="font-size:10.5px">${n.s}</text></g>`
    })
    s += `<text x="160" y="226" style="font-size:10.5px;fill:var(--fg-3)">checks fail → same session, again</text>`
    s += `<circle class="pulse" r="4.5"><animateMotion dur="3.6s" repeatCount="indefinite" path="${paths[0]} ${paths[1].replace('M', 'L')} ${paths[2].replace('M', 'L')}"/></circle>`
    s += `<circle class="pulse" r="4" style="fill:#f5b82e;filter:drop-shadow(0 0 6px #f5b82e)"><animateMotion dur="5.2s" begin="1.6s" repeatCount="indefinite" path="${paths[0]} ${paths[1].replace('M', 'L')} ${paths[3].replace('M', 'L')}"/></circle>`
    fac.innerHTML = s
    if (reduced) $$('animateMotion', fac).forEach((a) => a.remove())
  }

  // ── the year, hung from a rail ───────────────────────
  const MONTHS = [43, 833, 208, 506, 411, 340, 283, 637, 491, 1274, 2358, 1897, 1121]
  const LABELS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
  const months = $('#months'), axis = $('#axis'), tape = $('#tape'), yearnum = $('#yearnum'), over = $('#over')
  if (months) {
    const mx = Math.max(...MONTHS)
    months.innerHTML = MONTHS.map((v, i) => `<div class="m" style="--h:${(v / mx).toFixed(3)};--i:${i * 2.3}"><span class="hook"></span><span class="bag" title="${LABELS[i]}: ${fmt(v)} commits"></span><span class="v">${fmt(v)}</span></div>`).join('')
    axis.innerHTML = LABELS.map((l, i) => `<span>${l}${i === 0 ? ' ’25' : i === 3 ? ' ’26' : ''}</span>`).join('')
    const total = MONTHS.reduce((a, b) => a + b, 0)
    const run = () => {
      tape.classList.add('on')
      if (reduced) { yearnum.textContent = fmt(total); return }
      const t0 = performance.now(), per = 138, D = per * MONTHS.length + 700
      let fired = false
      const step = (now) => {
        const el = now - t0
        let sum = 0
        MONTHS.forEach((v, i) => { sum += v * clamp((el - i * per) / 700) })
        yearnum.textContent = fmt(sum)
        if (!fired && sum >= 9000) { fired = true; over.classList.add('show'); setTimeout(() => over.classList.remove('show'), 1600) }
        if (el < D) requestAnimationFrame(step)
        else yearnum.textContent = fmt(total)
      }
      requestAnimationFrame(step)
    }
    new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { run(); o.disconnect() } }), { threshold: 0.35 }).observe(tape)
  }

  // ── § 05 — the binder ────────────────────────────────
  // g: [status, number, unit] — graded on what holds up, not on how fast it shipped
  const A = 'assets/shift/'
  const CARDS = [
    { n: 'Weave', cert: '1362263', hue: 'weave', holo: 1, art: 'gen:weave', type: 'AI maintenance (CMMS) · in production',
      flav: 'A QR code on every machine. Procedures written from the manual, page cited. A report the owner reads on Monday.',
      g: ['LIVE', '14', 'written invariants'], stat: ['1,832 commits', 'since Dec ’25'],
      back: ['The crew already lived in a group text, so Weave joined the group text — idea to production in about 3½ hours.', 'Every instruction and every AI answer written in Simplified Technical English.', 'A roadmap of 99 specs that grades its own items; production deploys are manual, on purpose.'],
      links: [['case file', 'apps/weave.html']] },
    { n: 'Burrow', cert: 'ead20af', hue: 'burrow', holo: 1, art: 'burrow', pos: '0% 50%', type: 'personal software factory',
      flav: 'Intent goes in. Questions come back. A path decides what the model does next.',
      g: ['RUNNING', '1,436', 'runs logged'], stat: ['27 feeds', 'every run costed'],
      back: ['Every change it writes is reviewed by a model from a different vendor. Unsure work parks; it never guesses.', 'Merge authority is mechanical — a prompt can’t merge anything.', 'Runs a Monday industry digest, a nightly product review, and a YouTube channel.'],
      links: [['case file', 'apps/burrow.html']] },
    { n: 'Spitball', cert: '695cdbc', hue: 'spitball', holo: 1, art: 'spitball', type: 'baseball roguelite · iPhone · iPad · Mac',
      flav: 'You’re the pitcher. And you cheat.',
      g: ['ON SALE', '202', 'tests green'], stat: ['$4.99', '412 commits'],
      back: ['Three simulated players tune the fun against target numbers, thousands of seasons at a time.', 'Every pitch ends with one plain sentence saying why it went that way.', 'Friends and mentors are hiding in the clubhouse crew.'],
      links: [['App Store', 'https://apps.apple.com/app/id6818556612'], ['case file', 'apps/spitball.html']] },
    { n: 'Know That?', cert: '@knowthatclub', hue: 'knowthat', holo: 1, art: 'kt-nfl', pos: '50% 22%', type: 'science Shorts · @knowthatclub',
      flav: 'My daughters pick the questions. The machine finds the answers. I decide what ships.',
      g: ['PUBLIC', '91.7K', 'views, best reel'], stat: ['23 built', 'every fact sourced'],
      back: ['Every script is fact-checked with a sources table before a frame is drawn.', 'Voice, music and effects from ElevenLabs. A phone-speaker rattle fixed by measuring it, not by ear.', 'What gets watched: flip a confident wrong belief. Never judge a Short before 72 hours.'],
      links: [['YouTube', 'https://www.youtube.com/@knowthatclub'], ['case file', 'apps/knowthat.html']] },
    { n: 'PicPost', cert: '77f88d1', hue: 'pic', art: 'picpost', type: 'real postcards, printed and mailed',
      flav: 'Your photo, in the mail. By post, not a post.',
      g: ['LIVE', '109', 'tests'], stat: ['from $3', 'holiday cards'],
      back: ['The holiday version went from a blocked spec to a live, paid product in one evening.', 'Fulfillment only fires from a verified payment; addresses are verified before anyone is charged.', 'An AI assistant can build your card list. You approve it inside PicPost.'],
      links: [['picpost.io', 'https://picpost.io'], ['case file', 'apps/picpost.html']] },
    { n: 'Mispronounced', cert: '1a63169', hue: 'mis', art: 'mispronounced', pos: '0% 50%', type: 'AI accent test',
      flav: 'Talk for a minute. It tells you what gives your accent away — down to the word.',
      g: ['LIVE', '279', 'tests'], stat: ['$3', 'unlocks a run'],
      back: ['Two passes: listen loosely, then structure. Forcing a schema on the listening made it hear worse.', 'On a light accent it stops at the country instead of inventing a city.', 'First run free. Real users, real revenue.'],
      links: [['mispronounced.io', 'https://mispronounced.io'], ['case file', 'apps/mispronounced.html']] },
    { n: 'Traffic', cert: '3a5dd98', hue: 'traffic', art: 'gen:traffic', type: 'first-party analytics · Rust',
      flav: 'A dozen of my sites report here, this one included. No cookies. It never stores an IP address.',
      g: ['LIVE', '0', 'IPs stored'], stat: ['12 sites', 'one binary'],
      back: ['Built overnight; running in nine products by the next evening.', 'Rewritten from Rails to Rust and cut over in production the same day.', 'Counts AI crawlers on their own line — they don’t run JavaScript.'],
      links: [] },
    { n: 'Ember', cert: 'b317bab', hue: 'ember', art: 'ember', type: 'campfire question game · iOS',
      flav: 'One phone, passed hand to hand. The questions start light and burn down to the good stuff.',
      g: ['ON SALE', '135', 'cards'], stat: ['$2.99', 'my first App Store sale'],
      back: ['Built over a camping weekend so my friends would be a little jealous.', 'Native SwiftUI and Metal fire. No backend, so it works offline at the campsite.', 'The first thing I ever sold on the App Store.'],
      links: [['App Store', 'https://apps.apple.com/app/id6817376658'], ['case file', 'apps/ember.html']] },
    { n: 'Misra', cert: 'b4417af', hue: 'misra', art: 'misra', type: 'one Urdu poem a week',
      flav: 'Urdu script, Roman Urdu and English, side by side. Tap any word.',
      g: ['WEEKLY', '144', 'poems'], stat: ['8 poets', 'recited'],
      back: ['For people like me who understand spoken Urdu but can’t read the script.', 'The first thing my software factory built end to end, from an empty repo.', 'The model never writes the poem. A word it can’t pair stays dark.'],
      links: [['misra.naveed.io', 'https://misra.naveed.io'], ['case file', 'apps/misra.html']] },
    { n: 'Hunch', cert: 'e6600b2', hue: 'hunch', art: 'gen:hunch', type: 'a football notebook for a friend',
      flav: 'Write a take in plain English. AI reads every game’s context; the math scores it against the closing line.',
      g: ['LIVE', '1,517', 'games scored'], stat: ['since 2021', 'weather, snaps, lines'],
      back: ['Not much of a gambler. The math and the AI parsing were the fun part.', 'Not a better odds model — a way to test hunches.', 'Built for a friend in a day; public by day two.'],
      links: [['hunch.naveed.io', 'https://hunch.naveed.io/welcome']] },
    { n: 'TV Cal', cert: 'bcbe0b1', hue: 'tvcal', art: 'tvcal', type: 'TV calibration with your phone',
      flav: 'A better picture in fifteen minutes. No meter, no account.',
      g: ['LIVE', '8', 'TV brands'], stat: ['no backend', 'no account'],
      back: ['A phone camera can’t measure light. It can still answer the question.', 'Test patterns cast from YouTube; the camera reads the bars and gives a verdict.', 'Built for my friends’ TVs.'],
      links: [['tv.naveed.io', 'https://tv.naveed.io'], ['case file', 'apps/tvcal.html']] },
    { n: 'Miscolored', cert: 'f83d355', hue: 'miscolored', art: 'miscolored', type: 'AI color analysis',
      flav: 'A few selfies in. Your season, your palette, and photos of you wearing it out.',
      g: ['LIVE', '12', 'seasons'], stat: ['3 AI passes', 'look · structure · render'],
      back: ['Three passes, each doing one job.', 'Same lesson as Mispronounced: let it perceive freely, then format.', 'Image generation is the expensive part, so it’s rate-limited.'],
      links: [['miscolored.naveed.io', 'https://miscolored.naveed.io'], ['case file', 'apps/miscolored.html']] },
    { n: 'Car wash reviews', cert: '38c1699', hue: 'carwash', art: 'carwash', type: 'Naperville-area car washes, rated',
      flav: 'By a guy who ran one for nine years.',
      g: ['LIVE', '19', 'washes listed'], stat: ['a 5 needs', 'a reason'],
      back: ['A 5 means “as good as it gets around here,” and every 5 needs a written reason.', 'Built to learn how AI search finds and cites a small site.', 'The car wash is where all of this started.'],
      links: [['napervillecarwashes.com', 'https://napervillecarwashes.com'], ['case file', 'apps/carwash.html']] },
    { n: 'PetalPost', cert: 'petalpost', hue: 'petal', art: 'petalpost', type: 'postcards, mailed for real',
      flav: 'Doodle a bouquet, tie a note, hit send. A real 4×6 art postcard lands in someone’s mailbox.',
      g: ['LIVE', '4×6', 'real postcards'], stat: ['no app', 'to install'],
      back: ['Started as a bouquet I drew for my wife.', 'Printed and mailed for you; paid with Stripe.', 'PicPost, its photo-first sibling, grew out of it.'],
      links: [['case file', 'apps/petalpost.html']] },
    { n: 'Hushbin', cert: 'hushbin', hue: 'hushbin', art: 'gen:logo:assets/apps/hushbin-logo.svg', type: 'an end-to-end encrypted pastebin',
      flav: 'Share sensitive text between your own devices without trusting the server.',
      g: ['LIVE', '256', 'bit AES'], stat: ['client-side', 'zero-knowledge'],
      back: ['Every pad is encrypted in the browser before it leaves. The passphrase never travels.', 'Version history and syntax highlighting.', 'A privacy mode for screen-sharing.'],
      links: [['hushbin.naveed.io', 'https://hushbin.naveed.io'], ['case file', 'apps/hushbin.html']] },
    { n: 'OurWorkshop', cert: 'ourworkshop', hue: 'ourworkshop', art: 'gen:logo:assets/apps/ourworkshop-icon.svg', type: 'a shop OS for custom makers',
      flav: 'A lead becomes a quote becomes a multi-week build, with the client watching the whole way.',
      g: ['BUILT', '1', 'codebase, many shops'], stat: ['each shop', 'own subdomain'],
      back: ['For woodworkers, framers and sign shops: the arc they all share.', 'Row-level tenancy; one codebase serves every shop.', 'The client watches the build, not just the invoice.'],
      links: [['case file', 'apps/ourworkshop.html']] },
    { n: 'MH Build Studio', cert: 'mhbuildstudio', hue: 'mhbuild', art: 'mhbuild', type: 'a fabrication shop’s storefront',
      flav: 'Wedding arches, candy carts and lit marquee signs, for a two-person shop.',
      g: ['LIVE', '0', 'databases'], stat: ['catalog feed', 'relayed forms'],
      back: ['The site keeps no data: it reads its catalog from a feed and relays its forms.', 'The worked example of how thin a shop’s website is allowed to be.', 'A real shop in Bloomingdale, IL.'],
      links: [['mhbuildstudio.com', 'https://mhbuildstudio.com'], ['case file', 'apps/mhbuild.html']] },
    { n: 'Cleanup Quest', cert: 'c0fda8f', hue: 'cleanup', art: 'gen:cleanup', type: 'a cleanup game for my kids · iOS',
      flav: 'Prop the phone up facing a messy room. It gives one spoken instruction at a time.',
      g: ['PAUSED', '40%', 'built'], stat: ['paused', 'QA has notes'],
      back: ['The camera notices when things disappear from the floor.', 'A stop-motion recap at the end, as the reward.', 'Paused at about 40%. The QA department has opinions.'],
      links: [] },
  ]
  // three sheets, no tabs: what runs every day, what people pay for, what I made for people I like
  const SHEETS = [
    ['the machinery', 'runs every day, mostly unattended', ['Weave', 'Burrow', 'Traffic', 'Misra', 'Hushbin', 'OurWorkshop']],
    ['out in the world', 'things people pay for', ['Spitball', 'Ember', 'PicPost', 'Mispronounced', 'Miscolored', 'PetalPost']],
    ['for people I like', 'family, friends, my town', ['Know That?', 'Hunch', 'TV Cal', 'Car wash reviews', 'MH Build Studio', 'Cleanup Quest']],
  ]
  const byName = Object.fromEntries(CARDS.map((c) => [c.n, c]))
  CARDS.splice(0, CARDS.length, ...SHEETS.flatMap(([, , names]) => names.map((n) => byName[n])))
  function genArt(kind) {
    if (kind.startsWith('logo:')) return `<div class="gen" style="background:radial-gradient(110% 110% at 30% 20%,color-mix(in oklab,var(--hue) 45%,#0b0e15),#0b0e15 72%)"><img src="${kind.slice(5)}" alt="" style="position:absolute;left:50%;top:50%;width:38%;height:auto;transform:translate(-50%,-50%);filter:drop-shadow(0 10px 24px rgba(0,0,0,.5))"></div>`
    switch (kind) {
      case 'weave': return `<div class="gen" style="background:radial-gradient(120% 120% at 20% 0%,#2fd0c6,#0e3f45 70%)"><img src="${A}weave-qr.webp" alt="" style="position:absolute;right:10%;top:12%;height:76%;width:auto;border-radius:6px;box-shadow:0 10px 30px -10px #000"><img src="assets/apps/weave-logo.svg" alt="" style="position:absolute;left:10%;bottom:14%;width:34%;height:auto;filter:brightness(10)"></div>`
      case 'traffic': {
        // Traffic's real numbers for mispronounced.io: where visits came from, the site, where they landed. Lights run the wires.
        const hub = { x: 124, y: 80, r: 16 }
        const left = [['Direct', 701, '#86f0ff', 32], ['Google', 462, '#b48cff', 80], ['ChatGPT', 285, '#ffbe73', 128]].map(([n, c, t, y]) => ({ n, c, t, y, x: 58, u: 'views' }))
        const right = [['/', 360, 32], ['/recordings', 77, 80], ['/about', 44, 128]].map(([n, c, y]) => ({ n, c, y, x: 188, t: '#88c8d7', u: 'arrivals' }))
        const all = [...left, ...right]
        all.forEach((s) => { s.r = 3.5 + 5.5 * Math.sqrt(s.c / 701) })
        const spoke = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l; return [a.x + ux * (a.r + 3), a.y + uy * (a.r + 3), b.x - ux * (b.r + 5), b.y - uy * (b.r + 5)] }
        const wires = [...left.map((s) => [spoke(s, hub), s]), ...right.map((s) => [spoke(hub, s), s])]
        const halo = 'paint-order:stroke;stroke:#0b0b10;stroke-width:3px;stroke-linejoin:round'
        let svg = `<defs>${[...new Set(all.map((s) => s.t))].map((t) => `<marker id="tf-${t.slice(1)}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L8 5L1 9" fill="none" stroke="${t}" stroke-width="1.6"/></marker>`).join('')}<linearGradient id="tf-tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c2c3a"/><stop offset="1" stop-color="#3b1b26"/></linearGradient></defs>`
        svg += `<circle cx="34" cy="80" r="80" fill="none" stroke="#4df3ff" stroke-opacity=".14" stroke-dasharray="1 5"/><circle cx="222" cy="80" r="80" fill="none" stroke="#ffb86b" stroke-opacity=".14" stroke-dasharray="1 5"/>`
        svg += `<text x="8" y="13" style="font:500 6.5px var(--font-mono);letter-spacing:1.6px;fill:#7c8494">CAME FROM</text><text x="252" y="13" text-anchor="end" style="font:500 6.5px var(--font-mono);letter-spacing:1.6px;fill:#7c8494">LANDED</text>`
        svg += wires.map(([[x1, y1, x2, y2], s]) => `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${s.t}" stroke-opacity=".38" stroke-width=".9" fill="none" marker-end="url(#tf-${s.t.slice(1)})"/>`).join('')
        svg += wires.map(([[x1, y1, x2, y2], s], w) => {
          const n = s.c > 200 ? 3 : s.c > 50 ? 2 : 1, len = Math.hypot(x2 - x1, y2 - y1), dur = len / (10 + 3.5 * Math.log2(1 + s.c))
          return Array.from({ length: n }, (_, k) => {
            const t = (k / n + w * 0.17) % 1, dot = `<circle r="4" fill="${s.t}" opacity=".22"/><circle r="1.7" fill="${s.t}"/><circle r=".7" fill="#fff" opacity=".85"/>`
            if (reduced) return `<g transform="translate(${(x1 + (x2 - x1) * t).toFixed(1)} ${(y1 + (y2 - y1) * t).toFixed(1)})">${dot}</g>`
            const timing = `dur="${dur.toFixed(2)}s" begin="-${(t * dur).toFixed(2)}s" repeatCount="indefinite"`
            return `<g opacity="0">${dot}<animateMotion ${timing} path="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" ${timing}/></g>`
          }).join('')
        }).join('')
        svg += all.map((s) => {
          const lx = left.includes(s) ? s.x - s.r - 5 : s.x + s.r + 5, a = left.includes(s) ? 'end' : 'start'
          return `<circle cx="${s.x}" cy="${s.y}" r="${(s.r + 2.4).toFixed(1)}" fill="none" stroke="${s.t}" stroke-opacity=".5" stroke-width=".8"/><circle cx="${s.x}" cy="${s.y}" r="${s.r.toFixed(1)}" fill="${s.t}"/><text x="${lx.toFixed(1)}" y="${s.y - 1}" text-anchor="${a}" style="font:600 9.5px var(--font-display);fill:#d9dbe2;${halo}">${s.n}</text><text x="${lx.toFixed(1)}" y="${s.y + 8.5}" text-anchor="${a}" style="font:400 7px var(--font-mono);letter-spacing:.3px;fill:#8b8f9a;${halo}">${s.c} ${s.u}</text>`
        }).join('')
        svg += `<circle cx="${hub.x}" cy="${hub.y}" r="${hub.r + 4}" fill="#101017" stroke="#b08a5a" stroke-opacity=".55" stroke-width=".8"/><rect x="${hub.x - 12}" y="${hub.y - 12}" width="24" height="24" rx="6" fill="url(#tf-tile)"/><text x="${hub.x}" y="${hub.y + 3.5}" text-anchor="middle" style="font:800 15px var(--font-display);fill:#fff">ə</text><path d="M${hub.x - 7} ${hub.y + 7.5}l1.75 -1.5l1.75 1.5l1.75 -1.5l1.75 1.5l1.75 -1.5l1.75 1.5l1.75 -1.5l1.75 1.5" fill="none" stroke="#ff5a6a" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`
        svg += `<text x="${hub.x}" y="160" text-anchor="middle" style="font:600 10px var(--font-display);fill:#f1f2f5;${halo}">mispronounced.io</text><text x="${hub.x}" y="170" text-anchor="middle" style="font:400 7.5px var(--font-mono);letter-spacing:.4px;fill:#5fe3f2;${halo}">575 visits</text>`
        return `<div class="gen" style="background:#0b0b10"><svg viewBox="0 0 260 179" role="img" aria-label="Where visits to mispronounced.io came from and where they landed" style="position:absolute;inset:0;width:100%;height:100%">${svg}</svg></div>`
      }
      case 'hunch': return `<div class="gen" style="background:repeating-linear-gradient(90deg,#1f5a2a 0 22px,#236a31 22px 44px)"><div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 43px,rgba(255,255,255,.55) 43px 45px)"></div><span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-4deg);background:#fff;color:#123;padding:6px 12px;border-radius:6px;font:800 16px var(--font-display)">MY TAKE ✓</span></div>`
      case 'cleanup': return `<div class="gen" style="background:linear-gradient(180deg,#2a2440,#141024)">${[['#ffd166', 12, 58, 14], ['#ef476f', 30, 66, -10], ['#06d6a0', 50, 54, 8], ['#118ab2', 68, 64, -6], ['#ffd166', 82, 58, 18]].map(([c, x, y, r]) => `<span style="position:absolute;left:${x}%;top:${y}%;width:26px;height:26px;border-radius:5px;background:${c};transform:rotate(${r}deg);box-shadow:0 6px 0 rgba(0,0,0,.3)"></span>`).join('')}<span class="gtag" style="color:#ffd166">put the blue block in the bin</span></div>`
    }
    return ''
  }
  const cardsEl = $('#cards')
  const slab = (c, i, k) => {
    const art = c.art.startsWith('gen:') ? genArt(c.art.slice(4)) : `<img src="${A}${c.art}.webp" alt="" loading="lazy"${c.pos ? ` style="object-position:${c.pos}"` : ''}>`
    const ext = (u) => /^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ''
    return `
      <article class="slab${c.holo ? ' holo' : ''} rise" style="--hue:var(--${c.hue});transition-delay:${(k % 3) * 0.05}s" data-i="${i}">
        <button class="flip" type="button" aria-pressed="false"><span class="vh">Flip the ${esc(c.n)} card</span></button>
        <span class="label"><span class="t"><b>${esc(c.n)}</b>night shift ’26 · #${String(i + 1).padStart(2, '0')}/${CARDS.length}<em>cert ${esc(c.cert)}</em></span><span class="g"><span class="st">${esc(c.g[0])}</span><b>${esc(c.g[1])}</b><span>${esc(c.g[2])}</span></span></span>
        <span class="flipper">
          <span class="card face front">
            <span class="top"><span class="nm">${esc(c.n)}</span><span class="no">#${String(i + 1).padStart(2, '0')}</span></span>
            <span class="art">${art}</span>
            <span class="type">${esc(c.type)}</span>
            <span class="flav">${esc(c.flav)}</span>
            <span class="stat"><span><b>${esc(c.stat[0])}</b></span><span>${esc(c.stat[1])}</span></span>
          </span>
          <span class="card face back">
            <span class="top"><span class="nm">${esc(c.n)}</span><span class="no">receipts</span></span>
            <span class="rcpts">${c.back.map((b) => `<span>${esc(b)}</span>`).join('')}</span>
            <span class="lks">${c.links.map(([t, u]) => `<a href="${u}"${ext(u)}>${esc(t)} ${ext(u) ? '↗' : '→'}</a>`).join('') || '<span class="none">not public yet</span>'}</span>
          </span>
        </span>
        <span class="sheen" aria-hidden="true"></span>
      </article>`
  }
  function renderCards() {
    let i = 0
    cardsEl.innerHTML = SHEETS.map(([name, sub, names], n) => `
      <section class="sheet" aria-label="Sheet ${n + 1}: ${esc(name)}">
        <div class="sheet-head"><span class="kicker"><span class="acc">sheet ${n + 1}</span> — ${esc(name)}</span><span class="kicker">${esc(sub)}</span></div>
        <div class="binder">${names.map((_, k) => slab(CARDS[i], i++, k)).join('')}</div>
      </section>`).join('')
    watchRise(cardsEl)
    $$('.slab', cardsEl).forEach(tilt)
  }
  function tilt(el) {
    const btn = $('.flip', el)
    el.addEventListener('click', (e) => {
      if (e.target.closest('a')) return
      const on = el.classList.toggle('flipped')
      btn.setAttribute('aria-pressed', on)
    })
    if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
      el.classList.add('tilting')
      el.style.setProperty('--ry', `${(x - 0.5) * 7}deg`)
      el.style.setProperty('--rx', `${(0.5 - y) * 7}deg`)
      el.style.setProperty('--mx', `${x * 100}%`); el.style.setProperty('--my', `${y * 100}%`)
      el.style.setProperty('--fx', `${x * 100}%`); el.style.setProperty('--fy', `${y * 100}%`)
    })
    el.addEventListener('pointerleave', () => { el.classList.remove('tilting'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg') })
  }
  if (cardsEl) {
    $('#binder-count').textContent = `night shift ’26 · ${CARDS.length} cards`
    renderCards()
  }

  // ── § 07 — the terminal ──────────────────────────────
  const tb = $('#term-body'), tf = $('#term-form'), ti = $('#term-in')
  if (tb) {
    const line = (html, cls = '') => { const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = html; tb.append(d); tb.scrollTop = tb.scrollHeight }
    const go = (id) => { const el = document.getElementById(id); el && el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }) }
    const CMDS = {
      help: () => line('whoami · neofetch · layers · ls builds · open &lt;build&gt; · contact · clear<br><span class="cm"># a few others. no hints.</span>'),
      whoami: () => line('Naveed Kakal — Lead Developer, Kannegiesser ETECH. day shift: every layer of a laundry plant. night shift: everything else.'),
      neofetch: () => line([
        ['os', 'plant-floor 20 (since Aug 2006)'], ['host', 'Naperville, IL'], ['uptime', '322 of the last 366 days'],
        ['kernel', 'sensors + conveyors'], ['stack', 'sensors → controllers → screens → reports → cloud → phone'], ['commits', '10,402 this year'],
        ['binder', `${CARDS.length} cards`], ['crew', 'Zoya &amp; Maya (root)'],
      ].map(([k, v]) => `<span class="pr">${k.padEnd(8)}</span> ${v}`).join('<br>')),
      layers: () => { line(LONG.map((l, i) => `<span class="pr">L${i + 1}</span> ${esc(l)}`).join('<br>') + '<br><span class="cm"># taking you to the bottom floor…</span>'); setTimeout(() => go('climb'), 600) },
      'ls builds': () => line(CARDS.map((c) => esc(c.n)).join('  ·  ')),
      pulse: () => line('<span class="y">🔔 Dryer 4 · door open 6 min</span> <span class="cm"># that one, but on your phone</span>'),
      contact: () => line('<a href="mailto:naveed.kakal@gmail.com">naveed.kakal@gmail.com</a> · <a href="https://www.linkedin.com/in/naveed-kakal-b7416417/" target="_blank" rel="noopener">linkedin</a> · <a href="https://github.com/naveedkakal" target="_blank" rel="noopener">github</a>'),
      clear: () => { tb.innerHTML = '' },
      coffee: () => line('brewing… ☕ the most important deliverable.'),
      sudo: () => line('nk is not in the sudoers file. This incident will be reported to Zoya &amp; Maya.', 'er'),
      'rm -rf /': () => line('Read-only filesystem. Production is a wall, not a suggestion.', 'er'),
      'drop database': () => line('not again. I did that once — a live production database, Ottawa, 2012.', 'er'),
      'sorting is working?': () => line('yes. seventeen years later — yes.', 'ok'),
    }
    const run = (raw) => {
      const cmd = raw.trim().toLowerCase().replace(/\s+/g, ' ')
      if (!cmd) return
      line(`<span class="pr">nk ~ %</span> ${esc(raw)}`)
      if (CMDS[cmd]) return CMDS[cmd]()
      if (cmd.startsWith('open ')) {
        const q = cmd.slice(5), i = CARDS.findIndex((c) => c.n.toLowerCase().startsWith(q))
        if (i < 0) return line(`no build called “${esc(q)}”. try ls builds`, 'er')
        line(`opening ${esc(CARDS[i].n)}…`, 'ok')
        setTimeout(() => { const el = $(`.slab[data-i="${i}"]`); el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); el.classList.add('in', 'flipped'); $('.flip', el).setAttribute('aria-pressed', 'true') }, 300)
        return
      }
      if (cmd.startsWith('sudo')) return CMDS.sudo()
      if (cmd.startsWith('drop ')) return CMDS['drop database']()
      line(`zsh: command not found: ${esc(cmd)} <span class="cm"># try help</span>`)
    }
    tf.addEventListener('submit', (e) => { e.preventDefault(); run(ti.value); ti.value = '' })
    $$('.term .chips [data-cmd]').forEach((b) => b.addEventListener('click', () => { run(b.dataset.cmd); ti.focus({ preventScroll: true }) }))
    line('<span class="cm"># this terminal is real. try help.</span>')
  }

  // ── go ──────────────────────────────────────────────
  measure()
  addEventListener('resize', () => { measure(); onScroll() })
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('load', () => { measure(); onScroll() })
  onScroll()
})()
