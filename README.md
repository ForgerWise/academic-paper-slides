# Academic Paper Slides

A Claude skill that turns a research paper into a seminar deck that looks like a person made it, and a script you can read aloud.

**[Download the skill (zip)](https://github.com/ForgerWise/academic-paper-slides/releases/latest/download/academic-paper-slides.zip)** and upload it to Claude as a custom skill. Then attach a paper and ask: *"Make a 15-minute seminar deck for this paper."*

## Why use it

**The deck does not look AI-generated.** No grids of rounded cards, no colored blocks around every sentence, no icon rows, no decorative accent slides. Pages are white with near-black text and one accent color. The only boxes in the whole deck are the steps of the experiment flow.

**It reads like a deck a careful person would make.** One message per slide. Titles are plain labels ("Problem", "Method 2", "Result 3"). Bullets have two levels that mean something: the point, then its detail. Text sits beside or above the figure it explains, and every slide names its source.

**It is easy to read from the back of the room.** Text is set as large as the slide allows, 36 to 54px, and figures as large as they stay sharp. A script measures every slide and tells Claude the exact size that fits, so a short text block never floats in an empty column and nothing overflows.

**The speaker notes are a script, not a summary.** Full sentences in plain words with an adult tone, written so that a listener who is not looking at the screen still follows. They add what the slide does not say (how to read the figure, why the authors did it this way) instead of reading the bullets back. Each slide's notes start with the time you should reach it.

**It stays faithful to the paper.** Every number, figure number and section number on a slide is checked against the paper, and result slides report results without editorial judgement.

## How it keeps those promises

Rules alone do not hold: a model drifts back to cards and cautious font sizes. So the skill ships two checks that run on the finished deck and print exactly what to change.

`check_layout.js` renders the deck locally, measures how much of its column each text block fills, and prints the largest font size that still fits. It also flags overflow, wrapped titles, "Label: content" titles and nested lists.

```
#   id       top  bottom  size  best  fill
3   m1       276  936     36    54    56%
    ! GROW: set .txt font-size:54px (now 36px, fill 56% -> 91%)
```

`check_notes.py` rejects anything in the notes that cannot be spoken as written, warns about written style, childish wording and notes that repeat the slide, and prints the timing of every slide.

```
3   m1   52   0:25   1:04
    E label-colon: a label such as 'Result: ...' or 'A: ...' cannot be spoken. Turn it into a sentence  «Method: we propose a general map»
    W reads-the-slide: 2 slide lines are repeated word for word. Say them in your own words
```

## What you get

- A deck built with Claude's **Slides** artifact type: editable, shareable, and exportable to PowerPoint or PDF.
- Default structure: cover, problem, background, purpose, related work, method, experiment setup, results, conclusion. About one slide per minute of talk.
- Your template if you have one: set the accent color, font and logo. Without one, a neutral black-and-white theme.
- Any deck language. The notes can be in a different language from the slides.

This is one opinionated style for technical seminars, not the only good one. If your group prefers assertion-style titles, fork it and change the rules in `SKILL.md`; the two checks keep working.

## Install

- **Claude apps:** download [academic-paper-slides.zip](https://github.com/ForgerWise/academic-paper-slides/releases/latest/download/academic-paper-slides.zip) and upload it as a custom skill. If you install only `SKILL.md`, the skill clones this repository at run time to get its stylesheet, patterns and scripts.
- **Claude Code:** unzip it into `~/.claude/skills/` (or a project's `.claude/skills/`), or load this repository as a plugin.

Tell Claude the talk length, the language, and your template or brand color if you have one.

## Requirements

- A Claude app or tool where the Slides artifact type is available.
- For `check_layout.js`: Node.js with Playwright and its Chromium. For `check_notes.py`: Python 3, standard library only. Claude's own workspace usually has both. Neither script uses the network, and the layout check runs with page scripts off.
- `pdftoppm` (poppler) to extract figures from the paper.

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
