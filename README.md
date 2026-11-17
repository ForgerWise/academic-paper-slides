# Academic Paper Slides

A Claude skill that turns one research paper into a seminar deck and a script you can read aloud. Its rules were worked out slide by slide in a university lab's weekly paper-reading seminar.

It builds the deck with Claude's **Slides** artifact type, so the result is an editable, shareable deck that exports to PowerPoint or PDF.

## What it does differently

Most slide generators stop when the slide "looks fine". This skill adds two checks that run on the finished deck and tell Claude exactly what to change.

**1. Text that fills the slide.** A short text block at a timid size beside a figure is the most common flaw in generated decks, and a bottom-edge check cannot see it. `check_layout.js` renders the deck locally, measures how much of its column each text block fills, and prints the largest font size that still fits:

```
#   id       top  bottom  size  best  fill
3   m1       276  936     36    54    56%
    ! GROW: set .txt font-size:54px (now 36px, fill 56% -> 91%)
```

It also flags overflow, wrapped titles, "Label: content" titles and nested lists.

**2. Speaker notes you can actually say.** Notes are written as a script: full sentences, plain words, an adult tone, and enough content that a listener who is not looking at the screen still follows. `check_notes.py` rejects anything that cannot be spoken as written and prints the timing of every slide:

```
3   m1   52   0:25   1:04
    E label-colon: a label such as 'Result: ...' or 'A: ...' cannot be spoken. Turn it into a sentence  «Method: we propose a general map»
    W reads-the-slide: 2 slide lines are repeated word for word. Say them in your own words
```

## The style it enforces

- One message per slide. Titles are labels ("Problem", "Method 2", "Result 3"), never claims.
- White pages, near-black text, one accent color. No cards or colored blocks around text.
- Two-level bullets with the same marker at both levels; the levels mean point and detail.
- Text on the left or on top, figures on the right or below, both as large as they stay readable.
- Every number on a slide is traceable to the paper, and every slide carries a source line.
- Default structure: cover, problem, background, purpose, related work, method, experiment setup, results, conclusion.

This is one opinionated style for technical seminars, not the only good one. If your group prefers assertion-style titles or a branded template, fork it and change the rules in `SKILL.md`; the two checks keep working.

## Requirements

- A Claude app or tool where the Slides artifact type is available.
- For `check_layout.js`: Node.js with Playwright and its Chromium. For `check_notes.py`: Python 3, standard library only. Claude's own workspace usually has both. Neither script uses the network, and the layout check runs with page scripts off.
- `pdftoppm` (poppler) to extract figures from the paper.

## Install

- **Claude apps:** zip the `skills/academic-paper-slides` folder and upload it as a custom skill. If you install only `SKILL.md`, the skill clones this repository at run time to get its stylesheet, patterns and scripts.
- **Claude Code:** copy `skills/academic-paper-slides` into `~/.claude/skills/` (or a project's `.claude/skills/`), or load this repository as a plugin.

Then attach a paper and ask, for example: *"Make a 15-minute seminar deck for this paper."* Tell Claude the talk length, the language, and your template or brand color if you have one.

## Repository layout

```
.claude-plugin/plugin.json          plugin manifest
skills/academic-paper-slides/
  SKILL.md                          the rules and the workflow
  assets/deck.css                   stylesheet; theme = four variables at the top
  references/patterns.md            HTML for every slide kind
  scripts/check_layout.js           fill, fit and overflow check
  scripts/check_notes.py            read-aloud lint and timing
examples/demo-deck/                 four-slide deck with made-up content, passes both checks
```

Try the checks on the demo deck:

```bash
node skills/academic-paper-slides/scripts/check_layout.js examples/demo-deck --shots /tmp/shots
python3 skills/academic-paper-slides/scripts/check_notes.py examples/demo-deck
```

## Theming

Edit the four variables at the top of `assets/deck.css`: `--ink` (text), `--accent` (title, rule, page number), `--hl` (highlighted table row) and `--mark` (annotations on figures). A logo and a different font are described at the end of `references/patterns.md`.

## Limits

- 16:9 decks only.
- The layout check uses local fallback fonts, so it keeps a small safety margin; a final look at the published deck is still part of the workflow.
- The notes check catches mechanics (labels, symbols, abbreviations, timing). Whether a script is clear to a listener is still judged by reading it.
- The Slides file format belongs to Anthropic and may change; the skill defers to the type's own instructions for it.

## License

MIT. See `LICENSE`.
