# Slide patterns

Each slide is one file, `project/slides/<id>.html`, holding exactly one `<section id="<id>">`. The speaker notes are the `<aside>`, always the last child. Classes come from `assets/deck.css`. `/_blob/…` stands for the URL the Slides type returns when you upload an image; use that URL verbatim.

## Contents

- Frame of a content slide
- Cover
- Two-level bullets
- Numbered steps
- Formula
- Emphasis
- Text left, figure right (`.split`)
- Text on top, figure below (`.stack`)
- Text only
- Problem slide
- Related-work table
- Experiment-setup flow
- Logo and theme

## Frame of a content slide

```html
<section id="r3" class="c">
<h2 class="ttl">Training cost</h2>
<div class="rule"></div>
<div class="pnum"></div>
<!-- one of: .txt | .split | .stack | table | .flow -->
<p class="cite">Figure: Author et al., Venue Year, Fig. 9; orange ring added by presenter</p>
<aside>[≤ 9:10] The script for this slide, in full sentences.</aside>
</section>
```

The title is a label. Slides of one kind about different things are named by topic, "Training cost"; a topic that continues over several slides keeps its name and adds a circled number, "Architecture ②". SKILL.md section 3 has the rule.

## Cover

```html
<section id="cover" class="cover">
<p class="cv-event">Conference or meeting name · 2026-01-15</p>
<h1 class="cv-title">Title of the paper, as published</h1>
<p class="cv-paper">First Author, Second Author, Last Author · Venue Year</p>
<div class="cv-rule"></div>
<p class="cv-who">Presenter name</p>
<p class="cv-aff">Lab or department, institution</p>
<aside>One or two sentences that say which paper this is and the question it answers.</aside>
</section>
```

Unknown date, presenter or affiliation: keep a bracketed placeholder such as `[date]` and list it when you deliver. Leave out `.cv-event` if there is no event.

## Two-level bullets

The Slides format turns a `<ul>` nested inside an `<li>` into hollow markers. So level two is a sibling list, `ul.bl.sub`, never a child of the `<li>`. One `.grp` holds a level-one line and its level-two lines.

```html
<div class="txt" style="font-size:44px">
  <div class="grp">
    <ul class="bl"><li>Compares three ways to set the offset</li></ul>
    <ul class="bl sub"><li>Red: one offset per access point (this paper)</li><li>Blue: one offset for the whole room</li></ul>
  </div>
  <div class="grp">
    <ul class="bl"><li><span class="k">Result</span></li></ul>
    <ul class="bl sub"><li>Red improves accuracy by up to 9%</li></ul>
  </div>
</div>
```

The font size is set once, on `.txt`. `check_layout.js` reads that value and tells you the size that fits.

## Numbered steps

Level one is an `<ol class="bl">` when the lines are steps in order, parts of a figure in the order they are explained, or a ranking. Each `.grp` holds its own list, so give every `<ol>` after the first a `start`. Level two stays a bulleted `ul.bl.sub`. Bulleted and numbered groups can share one `.txt`. Put class `num` on that `.txt`: it gives every level-one line the same left edge whether it has a bullet or a number, and the same for level two.

```html
<div class="txt num" style="font-size:48px">
  <div class="grp">
    <ul class="bl"><li>Decoder: 6 identical layers, three sub-layers each</li></ul>
  </div>
  <div class="grp">
    <ol class="bl"><li>Masked self-attention</li></ol>
    <ul class="bl sub"><li>A position sees only earlier output positions</li></ul>
  </div>
  <div class="grp">
    <ol class="bl" start="2"><li>Attention over the encoder output</li></ol>
  </div>
  <div class="grp">
    <ol class="bl" start="3"><li>Feed-forward network</li></ol>
  </div>
</div>
```

## Formula

The formula is a centered line (`.eq`) inside the slide's one `.txt`, on a slide without a side figure. On a slide about the formula it comes first and the text below explains it:

```html
<div class="txt num" style="font-size:48px">
  <p class="eq">Attention(Q, K, V) = softmax(QKᵀ / √dₖ) V</p>
  <div class="grp"><ol class="bl"><li>QKᵀ: one score for every pair of words</li></ol></div>
  <div class="grp"><ol class="bl" start="2"><li>÷ √dₖ: keeps the scores small</li></ol></div>
</div>
```

When the formula supports a point, put the group that makes the point above the `.eq` and the groups that explain its terms below it. A formula with fractions, sums or matrices is cropped from the paper and placed as a centered `.fig` in a `.stack`.

## Emphasis

Red is a `<span class="em">` around a few words, at most twice on a slide: `<li>The big model costs <span class="em">less than 1/4</span> of the previous best</li>`. Bold is only for sub-headings such as `<span class="k">Result</span>`.

## Text left, figure right (`.split`)

For figures narrower than 1.8 : 1. Give `.fig` and the `<img>` the same px width and height. The text column gets `1738 − 50 − figure width`.

```html
<div class="split">
  <div class="txt" style="font-size:44px"><!-- two-level bullets --></div>
  <div class="fig" style="width:930px;height:620px">
    <img src="/_blob/FIG" alt="Fig. 9 of the paper: accuracy of the three settings" style="width:930px;height:620px;object-fit:contain">
    <x-shape kind="ellipse" class="ring" style="left:66%;top:9%;width:8%;height:16%"></x-shape>
  </div>
</div>
```

`.ring` and `.badge` are positioned in % of the figure box. To mark a block of a diagram, use a box instead of an ellipse: `<x-shape kind="rounded" class="ring box" style="left:9%;top:35%;width:40%;height:39%"></x-shape>`. When a diagram is explained over several slides, repeat the figure at the same size and move only the ring. A badge holds its number as text: `<div class="badge" style="left:12%;top:40%">1</div>`.

## Text on top, figure below (`.stack`)

For figures 1.8 : 1 or wider. The figure height is what the text leaves: `769 − text height − 24`.

```html
<div class="stack">
  <div class="txt" style="font-size:46px"><!-- two-level bullets --></div>
  <div class="fig" style="width:1500px;height:400px">
    <img src="/_blob/FIG" alt="Fig. 7 of the paper: error per building" style="width:1500px;height:400px;object-fit:contain">
  </div>
</div>
```

## Text only

`.txt` is a direct child of the section. It starts at the top of the content area.

```html
<div class="txt" style="font-size:54px"><!-- two-level bullets --></div>
```

## Problem slide

A text-only slide whose last line is the goal, inside the same `.txt`. The goal is set at 64px, bold, in the accent color: larger than the body text whatever size that is. Keep it to one or two lines.

```html
<p class="goal">→ Goal: locate a phone in a building nobody has surveyed</p>
```

## Related-work table

Columns: approach, one-line description, then one column per comparison axis. Marks: ✓ yes, △ under conditions, ✗ no (or the marks the deck language expects, such as ○ △ ×). Explain the marks in the source line. The row for the presented paper gets `class="hl"`.

```html
<table class="tb">
<tr class="h"><th style="width:22%">Approach</th><th>Idea</th><th style="width:16%" class="ctr">No survey</th><th style="width:16%" class="ctr">Handles walls</th></tr>
<tr><td>Fingerprinting</td><td>Measure every room</td><td class="ctr">✗</td><td class="ctr">✓</td></tr>
<tr><td>Path-loss model</td><td>Distance formula</td><td class="ctr">✓</td><td class="ctr">✗</td></tr>
<tr class="hl"><td>This paper</td><td>Map learned from other buildings</td><td class="ctr">✓</td><td class="ctr">✓</td></tr>
</table>
<p class="cite">Table compiled by presenter from Author et al., Venue Year, Sec. 2. ✓ yes, ✗ no</p>
```

A `text-align` on one cell applies to its whole column. Only the header row is bold. Grid lines are drawn by the Slides type itself and by the PowerPoint export, so add no border rules. `class="hl"` gives a row the highlight fill: use it in any table to stress one row, at most one row per table.

## Experiment-setup flow

One `.flow` row of up to four `.card` boxes with an arrow between them. In each box: a bold first line naming the step, then one or two short lines (what data it uses, what it produces), optionally a small image. The step being evaluated gets `class="card key"`. The flow must explain itself; do not add a paragraph under it.

Set the text size once, inline on `.flow`; `check_layout.js` prints the largest size that fits (32 to 48px), so the boxes fill the slide. Keep every line in a box short: one fact per line, and a line may wrap once at most. A slide that holds only a flow gets `class="c mid"` on its section, which puts the flow in the vertical middle.

```html
<div class="flow" style="font-size:40px">
  <div class="card"><p class="bd">① Train the general model</p><p>Uses: 12 surveyed buildings</p><p>Learns: signal strength from floor plan</p></div>
  <p class="arrow">→</p>
  <div class="card"><p class="bd">② Adapt to the new building</p><p>Uses: its floor plan only</p></div>
  <p class="arrow">→</p>
  <div class="card key"><p class="bd">③ Test positioning</p><p>3 buildings never seen in training</p></div>
  <p class="arrow">→</p>
  <div class="card"><p class="bd">④ Compare</p><p>Against: surveyed map, copied map</p></div>
</div>
```

## Logo and theme

- Theme: edit the five variables at the top of `deck.css`. With a brand or lab template, `--accent` is its theme color, so titles match the template. Keep `--ink` near black and the background white.
- Font: replace `'Inter'` in the `section` rule and register the family in the deck index as the Slides type describes. For a Chinese, Japanese or Korean deck use a family that covers the script, for example Noto Sans TC, JP, SC or KR.
- Logo: upload it, add `class="c lg"` to every content section, and put the image first in the section:

```html
<section id="r3" class="c lg">
<img class="logo" src="/_blob/LOGO" alt="">
<h2 class="ttl">Training cost</h2>
```
