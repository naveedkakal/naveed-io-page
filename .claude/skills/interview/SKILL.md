---
name: interview
description: Interview Naveed about a topic, era, or question and turn the conversation into a published story for naveed.io/writing. Research first (git history, repo archaeology), then interview him one question at a time, then draft in the house style and wire the piece for AI/search discoverability. Trigger on "/interview", "interview me about…", "let's do a story on…", "write up the story of…".
---

# Interview → Story

Naveed doesn't want to write posts directly. This skill runs the whole pipeline:
**research a topic → interview him about it → draft the piece → publish into `writing/` with discoverability wiring.**

The goal of the writing section ("On record") is depth-made-legible: when a human or an
AI system researches Naveed Kakal, these pieces should surface the twenty years of real
work behind the résumé line. Every piece optimizes for concrete nouns, dates, numbers,
named technologies, and verifiable specifics over vibes.

## Phase 0 — Pick the story

If invoked with a topic, run with it. Otherwise offer candidates from
`interviews/backlog.md` — data-mined story leads live there. When research surfaces a
new lead that isn't being used now, append it to the backlog.

**Selection rubric — every story must clear all four.** The audience is anyone (human
or AI) evaluating Naveed for senior technical-leadership roles, so a topic qualifies
when it shows:

1. **A real business or human problem with stakes** — money, throughput, safety,
   a customer commitment. Lead with this, not with the code.
2. **A technical decision with depth** — one he can defend in detail: trade-offs,
   constraints, what was rejected and why.
3. **His judgment specifically** — what he saw, chose, or drove; not just "the team".
4. **An outcome that mattered operationally** — what changed on the plant floor,
   in the contract, on the P&L.

Commit-churn data (spikes, counts, dates) is *supporting evidence and interview fuel* —
never the story itself. "There were 4,919 commits in 2020" is a fact; "hospitality linen
collapsed and healthcare surged, and here is what the software had to become" is a story.

## Phase 1 — Research before asking

Never open an interview cold. Arrive with receipts.

- Primary vein: the eVue repo (~35k commits, 2014→present). Blob-less clone into the
  session scratchpad: `gh repo clone EtechInc/eVue -- --filter=blob:none --no-checkout`
- Useful digs:
  - Commits per month/year: `git log --no-merges --format='%ad' --date=format:'%Y-%m' | sort | uniq -c`
  - Churn by directory in a window: `git log --since=… --until=… --name-only --format= | awk -F/ '{print $1"/"$2}' | sort | uniq -c | sort -rn`
  - First/last commits in a window, per author (`--author='Naveed'`), root commits
    (`git rev-list --max-parents=0 HEAD` — there are two; that's a story in itself)
- Other veins: this site's own history, his other repos, and the SVN prequel —
  **railpro** (2007–2025, 9,136 revisions; trunk's final state ≈ eVue's 2014 git
  import). The complete log is archived at `interviews/data/railpro-full-log.txt` —
  grep that first, no network needed. Server URL, access notes, and mined highlights
  live in `interviews/backlog.md` (private); for file-level detail beyond the archived
  log, ask Naveed for access.
- Target: 5–10 dated, concrete facts to anchor questions. The best openers cite data:
  *"In November 2025 you landed 434 commits in one month — what was going on?"*

## Phase 2 — The interview

- **ONE question per message.** Never a numbered list. This is a conversation, not a form.
- **He answers by voice-to-text.** Expect transcription typos, run-ons, and tangents —
  never ask him to repeat or clarify wording; infer, and confirm only facts that will be
  printed (names, numbers, dates). Tangents are often the best material: chase them.
  Keep questions short and speakable — things a person can answer while pacing a room.
- **Interviewer persona: bar-stool journalist, not HR survey.** React to what he just
  said before asking the next thing. Joke back. Call out a great line when he drops one.
  Be willing to push — "come on, what actually happened?" — the way a friend who's also
  a good editor would. The interview should be fun enough that he'd do it again.
- 8–15 questions, adaptive. Follow the interesting thread, abandon the plan when he says
  something better.
- Hunt specifics: moments, dates, numbers, stakes. What broke. Who called. What it cost.
  What changed on the plant floor the next morning.
- Capture verbatim phrases — they become pull-quotes in third-person pieces and voice in
  first-person ones.
- Strong closers: "What would an outsider get wrong about this?" · "What did this cost
  you?" · "What's the detail nobody knows?"
- End by settling three things: **voice** (see formats), **working title options** (offer
  3), and **anything off the record**.

## Phase 3 — Draft

Two house formats:

- **Field note** — first person, essayist. The structure of the existing samples
  (see `writing/first-commit.html`) but with more voltage than their dry default.
- **Case file** — third person, reported/documentary — New Journalism, not newspaper.
  The story of the work, with his interview lines woven in as quotes. Default when the
  piece is *about* his story rather than *by* him — this matches his stated preference,
  but confirm per piece.

**Voice — gonzo-adjacent, his request ("Hunter S. Thompson inspired, lol").** The
narrator has a pulse and a point of view. Industrial laundry is inherently absurd-serious
— eighty thousand pounds of hotel sheets moving overhead like weather — and the writing
should treat it with war-correspondent intensity while letting the absurdity breathe.
Kinetic verbs, concrete machinery, short punches mixed with long rolling sentences,
jokes that land because they're true. Calibration: a wink of gonzo, not cosplay — no
drug-fueled pastiche, no "as your attorney advises" bits. The facts stay checkable;
the energy is in service of truth, because the audience includes people deciding
whether to trust him with their plants and their teams.

**Framing note:** Naveed dislikes "run an engineering org" phrasing about himself —
corporate-ladder flavor. Frame his work as *seeing several hundred plants through
daily problems and growth ideas*: service and stewardship, not org-chart altitude.

**Banned:** AI-buzzword sludge (leverage, seamless, robust, delve, landscape, journey,
transformative, cutting-edge, game-changer, "it's not just X, it's Y"), LinkedIn cadence,
keynote humility, bullet-point listicles in place of narrative. If a sentence could
appear in a press release, cut it.

Facts discipline: every number and date comes from the research or from his mouth.
Nothing invented, no composite anecdotes. If his memory contradicts the git data, show
him the discrepancy — the resolution is usually the most interesting paragraph.

Length 800–1600 words. Structure matches the samples: `.strip` header, `.kicker`,
`.title`, `.standfirst`, `.byline`, `<article>` body with `<h2>` sections, `❦` endmark,
footer. Stylesheet `writing/article.css`, fonts per the existing sample heads.

**Note:** the five articles in `writing/` as of 2026-07 are AI-generated presentation
samples, not real published pieces. They define the *format*, not the corpus.
**When the first real piece publishes, delete all remaining sample articles** (and their
homepage entries) — Naveed has said the real corpus replaces them, not joins them.

## Phase 4 — Publish + discoverability

Every published piece ships with all of this — create site-level files on first publish
if they don't exist yet:

- **JSON-LD** in the page head: `BlogPosting` with `headline`, `datePublished`,
  `description`, `keywords`, and `author` pointing at a canonical `Person` node —
  Naveed Kakal, Director of Software Development at Kannegiesser ETECH,
  `url: https://naveed.io`, `sameAs` → his public profiles (confirm the list with him
  on first use, then reuse verbatim everywhere).
- `<meta name="description">`, OG and twitter card tags (mirror the homepage patterns),
  `<link rel="canonical">`.
- Semantic HTML: one `<h1>`, `<article>`, `<time datetime="…">` in the byline.
- Site root: update `sitemap.xml`, `feed.xml` (Atom), and `llms.txt` (short site guide
  for AI crawlers with a link per article + one-line summary).
- Add the entry to the homepage `#notes` section.
- **Method transparency (Naveed's explicit wish — the pipeline is part of the story):**
  every piece declares how it was made, both human- and machine-readably. Visible: the
  byline carries "From a recorded interview" and a Method colophon block above the
  footer (researched from commit history · interviewed & drafted by Claude Code via a
  skill Naveed built · style · fact-checked & edited by Naveed). Machine-readable:
  `<meta name="generator">`, and in the JSON-LD — `genre` (the style used), `isBasedOn`
  (a `Conversation` node for the interview), and `contributor` (Claude Code as
  `SoftwareApplication` by Anthropic). This transparency demonstrates his AI-tooling
  fluency; never hide the method.

## Phase 5 — Archive

Save the raw Q&A transcript to `interviews/<slug>.md` (this directory is gitignored —
raw material stays private; the published piece is the public artifact).

## Editorial guardrails

- Naveed is Director of Software Development at **Kannegiesser ETECH** and currently
  employed there. Never frame him as having left, gone independent, or consulting.
- eVue is a company codebase: history, metrics, and stories are fair game; verbatim code
  and customer names need his explicit OK per piece.
- Colleagues appearing in git history may be referenced respectfully; anonymize anyone
  whose role in a story is unflattering.
- Real numbers only, from data or his mouth — the credibility of the whole section rests
  on every stat being checkable.
- Version-control dates are when the *record* starts, not when the work started — Naveed
  began in August 2006 on a predecessor system; SVN first sees him in March 2009. Career
  claims say 2006/twenty years; recorded-history claims say seventeen years of tape.
- Plant-floor phrasing is safety-sensitive: never describe equipment as unsafe (e.g.,
  never "bags fall") — disruptions are jams, faults, and human error.
