# Slide patterns

Each slide is one file, `project/slides/<id>.html`, holding exactly one `<section id="<id>">`. The speaker notes are the `<aside>`, always the last child. Classes come from `assets/deck.css`. `/_blob/…` stands for the URL the Slides type returns when you upload an image; use that URL verbatim. For PowerPoint output the same files are local and pictures are `src="/project/img/<name>.png"`.

The examples come from one talk (`examples/attention/` in the repository), so they show how the pieces of a real deck fit together.

## Contents

- Frame of a content slide
- Cover
- Two-level bullets, and a lead-in with its explanation (`.ex`)
- Numbered steps
- Emphasis
- Text left, figure right (`.split`)
- Text on top, figure below (`.stack`), pictures side by side (`.row`)
- Problem slide
- Diagram drawn on the slide (`.host`)
- Method overview with lettered parts
- Formula with named terms
- Flow of steps (`.flow`)
- Rows of "box, arrow, outcome" (`.dia`)
- Tables
- A value written on a chart
- Sources
- Conclusion
- Logo and theme

## Frame of a content slide

```html
<section id="m2" class="c">
<p class="sec">B | Attention</p>
<h2 class="ttl">Scaled Dot-Product Attention</h2>
<div class="rule"></div>
<div class="pnum"></div>
<!-- the body: a .txt, then a visual (.host | .fig | table | .flow | .eq …), or a .split / .stack of the two -->
<p class="cite">Source: Author et al., Venue Year, Sec. 3</p>
<aside>[≤ 7:10] The script for this slide, in full sentences.</aside>
</section>
```

- `.sec` is the section label. Use it only on the slides of a lettered part of the method, with the same text on each. Leave the line out everywhere else.
- The title is at most five words in title case, on one line.
- A topic that continues on a second slide keeps its title and adds a circled number. The number is a block beside the title, not a character in it:

```html
<div class="tbar"><h2 class="ttl">Architecture</h2><p class="circ">2</p></div>
```

- A slide that holds only a diagram or a flow gets `class="c mid"`, which puts it in the vertical middle.
- The source line is there on every content slide when the paper is someone else's, and only where something comes from elsewhere when the paper is the presenter's own (see "Sources").

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

## Two-level bullets, and a lead-in with its explanation

The Slides format turns a `<ul>` nested inside an `<li>` into hollow markers. So level two is a sibling list, `ul.bl.sub`, never a child of the `<li>`. One `.grp` holds a level-one line and its level-two lines. The font size is set once, on `.txt`; `check_layout.js` tells you the size that fits.

```html
<div class="txt" style="font-size:44px">
  <div class="grp">
    <ul class="bl"><li>Compares BLEU on newstest2014 with the best earlier systems</li></ul>
  </div>
  <div class="grp">
    <ul class="bl"><li><span class="k">Result</span></li></ul>
    <ul class="bl sub"><li>English–German: big model is <span class="em">more than 2 BLEU</span> above the best ensemble</li><li>English–French: 41.8, a new best for a single model</li></ul>
  </div>
</div>
```

When each point is a name plus one sentence, make the name a bold item and put the sentence in a `<p class="ex">` right after the list, inside the same `.grp`. It starts where the item's text starts. Do not use a `<br>` inside the `<li>` for this: Slides then drops the hanging indent of the item.

```html
<div class="txt" style="font-size:50px">
  <div class="grp">
    <ul class="bl"><li><span class="k">Translation uses an encoder and a decoder</span></li></ul>
    <p class="ex">One reads the input sentence, the other writes the output word by word</p>
  </div>
  <div class="grp">
    <ul class="bl"><li><span class="k">In 2017 both are <span class="em">recurrent networks</span></span></li></ul>
    <p class="ex">Attention only helps the decoder look back at the input</p>
  </div>
</div>
```

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

## Emphasis

Red is a `<span class="em">` around a key term or a key number, at most three on a slide: `<li>The big model costs <span class="em">less than 1/4</span> of the previous best</li>`. In a table cell or a box the class goes on the cell or the paragraph. Bold is only for sub-headings such as `<span class="k">Result</span>`.

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

The text beside a figure uses the height of the figure: it starts near the top of the column and ends near the bottom. A few lines floating in the middle of a tall column are too small. `check_layout.js` prints the largest size that fits (up to 60px) and, when one line's wording is all that keeps the text small, names that line: reword it so that it fits on one line or breaks evenly, then set the size.

`.ring` and `.badge` are positioned in % of the figure box. To mark a block of a diagram, use a box instead of an ellipse: `<x-shape kind="rounded" class="ring box" style="left:9%;top:35%;width:40%;height:39%"></x-shape>`. When a diagram is explained over several slides, repeat the figure at the same size and move only the ring. A badge holds its number as text: `<div class="badge" style="left:12%;top:40%">1</div>`.

## Text on top, figure below (`.stack`), pictures side by side (`.row`)

For figures 1.8 : 1 or wider. The figure height is what the text leaves: `769 − text height − 24`.

```html
<div class="stack">
  <div class="txt" style="font-size:46px"><!-- two to four lines --></div>
  <div class="fig" style="width:1500px;height:400px">
    <img src="/_blob/FIG" alt="Fig. 7 of the paper: error per building" style="width:1500px;height:400px;object-fit:contain">
  </div>
</div>
```

Several pictures of the same kind (three test sites, two views) stand in a `.row` under the text, each a `.fig` with a caption below it. When the text names two areas of a picture, outline each with a ring in its own colour and write the words that name it in the same colour.

```html
<div class="row">
  <div class="fig" style="width:420px"><img src="/_blob/SITE-A" alt="Test site A" style="width:420px;height:420px;object-fit:cover"><x-shape kind="rect" class="ring box red" style="left:0%;top:0%;width:100%;height:100%"></x-shape><x-shape kind="rect" class="ring box" style="left:25%;top:25%;width:50%;height:50%"></x-shape><p class="figcap">Site A</p></div>
  <!-- the other sites -->
</div>
```

## Problem slide

The last line of the slide is the goal, after the text and any diagram. The goal is set at 64px, bold, in the accent color: larger than the body text whatever size that is. Keep it to one or two lines.

```html
<p class="goal">→ Goal: locate a phone in a building nobody has surveyed</p>
```

## Diagram drawn on the slide (`.host`)

Use it to show how something works: who sees what, what blocks what, what is computed from what. A host is a box of fixed size under the text. Everything in it is pinned with `left`, `top`, `width` and, for boxes and icons, `height`, in px measured from the host's corner.

- `<div class="node">`: a small white box with an outline in the accent color, text centered.
- `<div class="panel">`: a larger rounded box that holds a name line and a few lines or a short list.
- `<img class="ico">`: an icon from `assets/icons/` or a small photo.
- `<p class="lbl">`: plain text. Add `bd` for bold, `ctr` to center it in its width. Give every label a `width` wide enough for its longest line.
- `<x-connector x1 y1 x2 y2>`: an arrow from one point to another. `head="none"` for a plain line, `route="hv"` or `"vh"` for a right-angled one. Colour and thickness go in `style` as `color` and `border-width`; `border-style:dashed` for a dashed line. Arrows must be seen from the back of the room: `#404040` at 6px for ordinary arrows, the emphasis red (`#C00000`) for the one path the slide is about. Never thinner than 4px.

Rules that keep a diagram right:

1. Write the boxes, icons and labels first. Then add the connectors, reading each end from the numbers already in the file: the middle of a box's right edge is `(left + width, top + height / 2)`, of its bottom edge `(left + width / 2, top + height)`. Leave about 10px between an arrow's end and an icon.
2. One host holds at most 24 pinned parts, connectors included.
3. Carry one example through the diagram. Here the query “it” scores three words, the scores become weights, and the output is mostly “cat”.
4. Make the boxes tall and their text large (44 to 52px), so that the diagram fills the space under the text. A row of low boxes in a strip, with thin arrows, reads as unfinished.
4. Set the host's `font-size` inline (40 to 52px); labels and boxes inherit it. Make the host as tall as the space under the text allows and fill it.

```html
<div class="txt" style="font-size:48px">
  <div class="grp">
    <ul class="bl"><li>Attention answers a query from key–value pairs</li></ul>
  </div>
  <div class="grp">
    <ul class="bl"><li>Self-attention: queries, keys and values are the words of one sentence</li></ul>
  </div>
</div>
<div class="host" style="width:1738px;height:540px;font-size:44px">
  <p class="lbl bd ctr" style="left:470px;top:0px;width:300px">Key</p>
  <p class="lbl bd ctr" style="left:800px;top:0px;width:200px">Score</p>
  <p class="lbl bd ctr" style="left:1080px;top:0px;width:240px">Weight</p>
  <div class="node" style="left:0px;top:240px;width:300px;height:110px"><p>Query: “it”</p></div>
  <div class="node" style="left:470px;top:76px;width:300px;height:100px"><p>“cat”</p></div>
  <div class="node" style="left:470px;top:245px;width:300px;height:100px"><p>“mat”</p></div>
  <div class="node" style="left:470px;top:414px;width:300px;height:100px"><p>“sat”</p></div>
  <p class="lbl ctr" style="left:800px;top:98px;width:200px">2.0</p>
  <p class="lbl ctr" style="left:800px;top:267px;width:200px">1.0</p>
  <p class="lbl ctr" style="left:800px;top:436px;width:200px">0.0</p>
  <p class="lbl ctr bd em" style="left:1080px;top:98px;width:240px">0.67</p>
  <p class="lbl ctr" style="left:1080px;top:267px;width:240px">0.24</p>
  <p class="lbl ctr" style="left:1080px;top:436px;width:240px">0.09</p>
  <div class="node" style="left:1400px;top:165px;width:338px;height:260px"><p class="bd">Output</p><p>0.67 “cat”<br>+ 0.24 “mat”<br>+ 0.09 “sat”</p></div>
  <x-connector x1="300" y1="295" x2="470" y2="126" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="300" y1="295" x2="470" y2="295" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="300" y1="295" x2="470" y2="464" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="990" y1="126" x2="1090" y2="126" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="990" y1="295" x2="1090" y2="295" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="990" y1="464" x2="1090" y2="464" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="1300" y1="126" x2="1400" y2="250" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="1300" y1="295" x2="1400" y2="295" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="1300" y1="464" x2="1400" y2="340" style="color:#404040;border-width:6px"></x-connector>
</div>
```

Boxes in a chain, with a return path made of three connectors (up, across, down; only the last has a head):

```html
<div class="host" style="width:1738px;height:400px;font-size:50px">
  <p class="lbl ctr em" style="left:380px;top:0px;width:860px">attention: look at any input word</p>
  <div class="node" style="left:0px;top:150px;width:330px;height:160px"><p>Input sentence</p></div>
  <div class="node" style="left:430px;top:150px;width:330px;height:160px"><p class="bd">Encoder</p></div>
  <div class="node" style="left:860px;top:150px;width:330px;height:160px"><p class="bd">Decoder</p></div>
  <div class="node" style="left:1290px;top:150px;width:448px;height:160px"><p>Output sentence</p></div>
  <p class="lbl ctr" style="left:380px;top:330px;width:860px">recurrent networks</p>
  <x-connector x1="330" y1="230" x2="430" y2="230" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="760" y1="230" x2="860" y2="230" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="1190" y1="230" x2="1290" y2="230" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="1025" y1="150" x2="1025" y2="84" head="none" style="color:#C00000;border-width:6px;border-style:dashed"></x-connector>
  <x-connector x1="1025" y1="84" x2="595" y2="84" head="none" style="color:#C00000;border-width:6px;border-style:dashed"></x-connector>
  <x-connector x1="595" y1="84" x2="595" y2="150" style="color:#C00000;border-width:6px;border-style:dashed"></x-connector>
</div>
```

A picture can be the start of a diagram: make the photo an `.ico` with `object-fit:cover` and let the arrows leave from the middle of its right edge.

## Method overview with lettered parts

The parts of the method as panels, the one-line idea above them in red, and what they produce together below. The letters return as section labels on the slides of each part. Each panel starts with its title (`<p class="pt">`), which is larger than its lines; panels in a row get class `top`, so that their titles start on one line.

```html
<p class="goal" style="padding-top:0px;color:#C00000;text-align:center;font-size:54px">The Transformer: attention and feed-forward layers only</p>
<div class="host" style="width:1738px;height:590px;font-size:44px">
  <div class="panel top" style="left:0px;top:20px;width:540px;height:330px"><p class="pt">A | Encoder and decoder stacks</p><p>Six layers each, with no recurrence inside</p></div>
  <div class="panel top" style="left:599px;top:20px;width:540px;height:330px"><p class="pt">B | Attention</p><p>Scaled dot-product attention, run as 8 parallel heads</p></div>
  <div class="panel top" style="left:1198px;top:20px;width:540px;height:330px"><p class="pt">C | Positional encoding</p><p>Tells the model the order of the words</p></div>
  <div class="node" style="left:469px;top:470px;width:800px;height:110px"><p class="bd">Translation without recurrence</p></div>
  <x-connector x1="270" y1="350" x2="270" y2="410" head="none" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="1468" y1="350" x2="1468" y2="410" head="none" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="270" y1="410" x2="1468" y2="410" head="none" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="869" y1="350" x2="869" y2="470" style="color:#404040;border-width:6px"></x-connector>
</div>
```

The three lines without heads and the one with a head form a bracket: down from the outer panels, across, and down from the middle into the result.

## Formula with named terms

The formula must be easy to read before anything is added to it: one line, large (60 to 72px), with clear gaps between its pieces.

- Every piece is a `<p>`: `<p>Attention(Q, K, V) = softmax(</p>`. The row keeps a gap between pieces, so write an operator as its own piece.
- A symbol with a subscript or a superscript is a group, `<div class="pc">`, holding the symbol and then `<p class="sb">` (subscript) or `<p class="sp">` (superscript): `<div class="pc"><p>d</p><p class="sb">k</p></div>`. Do not type the characters ᵀ or ₖ in a formula: fonts draw them badly.
- A term the slide explains is boxed: `<div class="term">…</div>`. It holds pieces and groups like the row itself, and it has room inside, so its outline never touches or covers a character. Do not shrink that room, and box at most three terms.
- Pieces the slide does not discuss can get class `dim` (grey).

Under the formula, one panel per boxed term, in the same left-to-right order. Each panel starts with the **name of its term as a title** (`<p class="pt">`), then one or two short lines that say what the term does. A line joins each term to its panel.

```html
<div class="eq" style="font-size:68px"><p>Attention(Q, K, V) = softmax(</p><div class="term"><div class="pc"><p>QK</p><p class="sp">T</p></div></div><p>/</p><div class="term"><div class="pc"><p>√d</p><p class="sb">k</p></div></div><p>) V</p></div>
<div class="cols" style="font-size:48px;flex:none">
  <div class="panel" style="flex:1"><p class="pt">Scores</p><p>Each query times each key</p><p>One score per pair of words</p></div>
  <div class="panel" style="flex:1"><p class="pt">Scaling</p><p>Keeps the scores small</p><p>Large scores give softmax<br><span class="em">very small gradients</span></p></div>
</div>
<div class="txt" style="font-size:60px">
  <div class="grp"><ul class="bl"><li>softmax turns the scores into weights</li><li>Multiplying by V gives the weighted sum of the values</li></ul></div>
</div>
<x-connector x1="1275" y1="332" x2="511" y2="385" route="vh" head="none" style="color:#222222;border-width:4px"></x-connector>
<x-connector x1="511" y1="385" x2="511" y2="438" head="none" style="color:#222222;border-width:4px"></x-connector>
<x-connector x1="1516" y1="332" x2="1516" y2="438" head="none" style="color:#222222;border-width:4px"></x-connector>
```

The connectors are children of the slide itself, so their coordinates are slide coordinates. Write the slide without them first, then get the numbers:

```bash
node scripts/check_layout.js <deck_root> --where ".term, .cols .panel"
```

A line leaves the `bottom-mid` of its term and goes straight down into its panel when the term stands above that panel (the second term here). When it does not, the line goes down, across and down in right angles to the `top-mid` of the panel: one connector with `route="vh"` to a point halfway between formula and panels, and a second one straight down from there (the first term here). No diagonal lines. Change the formula, its size or the font and the numbers change: measure again.

`.cols` takes the height its panels need when it has `flex:none`, which leaves room for the text below. When a term has no panel, put its name above it instead: `<div class="tcol"><p class="tl">Scores</p><div class="term">…</div></div>`.

A short formula with no terms to single out is the same row without `.term` and without panels, followed by a `.txt` that explains it. A formula that needs fractions, sums or matrices is cropped from the paper as a picture; its terms are then marked with `.ring box` outlines placed around them with a margin, never across a symbol.

## Flow of steps (`.flow`)

One `.flow` row of up to four `.card` boxes with a block arrow between them. In each box: a head row (`.hd`) with the step number in a circle and the name of the step, then one to three short lines (what data it uses, what it produces). The name is set larger than the lines by the stylesheet, so keep it to one or two words. The step being evaluated gets `class="card key"`. The flow must explain itself; do not add a paragraph under it.

A slide that holds only a flow gets `class="c mid"` on its section, and the flow then has to use the height: tall boxes with large text, not a strip with empty bands above and below. Set the text size once, inline on `.flow`; `check_layout.js` prints the largest size that fits (32 to 56px) and names the line that stops the text from growing. Shorten that line or break it in two with `<br>`: one fact per line, at most about 14 characters where there are three boxes, and a line may wrap once at most. Three boxes hold larger text than four.

The arrow between two boxes is a block arrow, `<x-shape kind="arrow-right" class="arw"></x-shape>`, not a typed "→", which is too thin to see.

```html
<div class="flow" style="font-size:54px">
  <div class="card"><div class="hd"><p class="circ">1</p><p class="bd">Data</p></div><p>WMT 2014</p><p>English–German<br>4.5M pairs</p><p>English–French<br>36M pairs</p></div>
  <x-shape kind="arrow-right" class="arw"></x-shape>
  <div class="card"><div class="hd"><p class="circ">2</p><p class="bd">Train</p></div><p>8 P100 GPUs</p><p>Base: 12 hours</p><p>Big: 3.5 days</p></div>
  <x-shape kind="arrow-right" class="arw"></x-shape>
  <div class="card key"><div class="hd"><p class="circ">3</p><p class="bd">Test</p></div><p>newstest2014</p><p>Scored by BLEU</p><p>Against GNMT,<br>ConvS2S, MoE</p></div>
</div>
```

## Rows of "box, arrow, outcome" (`.dia`)

For content that is "this leads to that": cases and their outcomes, causes and effects, inputs and what the model makes of them. Each row is a box, an arrow and the outcome in bold. It can stand beside a picture in a `.split`, or alone. Use it instead of a numbered list that would describe the same rows in sentences.

```html
<div class="split">
  <div class="fig" style="width:560px;height:373px"><img src="/_blob/PHOTO" alt="Sunlight reflected by a window" style="width:560px;height:373px"></div>
  <div class="dia" style="font-size:40px">
    <div class="card"><p>Brightness stays high</p></div><x-shape kind="arrow-right" class="arw"></x-shape><p class="bd">Glare</p>
    <div class="card"><p>Brightness keeps changing</p></div><x-shape kind="arrow-right" class="arw"></x-shape><p class="bd">Flicker</p>
  </div>
</div>
```

Here the picture is on the left because the diagram reads from it. Two to four rows; a few words per box.

## Tables

Related work as a comparison (approach, one column per axis; the row for this paper highlighted), and results the paper gives as numbers. The text above says what the table compares and what to read from it.

```html
<div class="stack">
<div class="txt" style="font-size:44px">
  <div class="grp">
    <ul class="bl"><li>Compares BLEU on newstest2014 with the best earlier systems</li></ul>
  </div>
  <div class="grp">
    <ul class="bl"><li><span class="k">Result</span></li></ul>
    <ul class="bl sub"><li>English–German: big model is <span class="em">more than 2 BLEU</span> above the best ensemble</li><li>English–French: 41.8, a new best for a single model</li></ul>
  </div>
</div>
<table class="tb" style="font-size:40px">
<tr class="h"><th style="width:46%">Model</th><th class="ctr">English–German</th><th class="ctr">English–French</th></tr>
<tr><td>GNMT + RL (ensemble)</td><td class="ctr">26.30</td><td class="ctr">41.16</td></tr>
<tr><td>ConvS2S (ensemble)</td><td class="ctr">26.36</td><td class="ctr">41.29</td></tr>
<tr><td>Transformer (base)</td><td class="ctr">27.3</td><td class="ctr">38.1</td></tr>
<tr class="hl"><td>Transformer (big)</td><td class="ctr">28.4</td><td class="ctr">41.8</td></tr>
</table>
</div>
```

A `text-align` on one cell applies to its whole column. Only the header row is bold. Grid lines are drawn by the Slides type itself and by the PowerPoint export, so add no border rules. `class="hl"` fills the one row to stress; `class="em"` on its cells makes them red. `class="tb roomy"` gives taller rows to a table of four rows or fewer. Set column widths with `style="width:46%"` on header cells so the key column does not wrap. Marks in a comparison table (✓ yes, △ under conditions, ✗ no) are explained in the source line.

## A value written on a chart

The paper's chart goes in a `.fig`. The number the slide is about is written on it with `.note`, positioned in % of the figure box, and the text above says the same number.

```html
<div class="fig" style="width:1500px;height:520px">
  <img src="/_blob/CHART" alt="Fig. 5 of the paper: accuracy by building, baseline against the proposed method" style="width:1500px;height:520px;object-fit:contain">
  <p class="note" style="left:78%;top:6%">+9%</p>
</div>
```

## Sources

Someone else's paper: every content slide ends with one source line.

```html
<p class="cite">Figure: Vaswani et al., NIPS 2017, Fig. 1, Sec. 3.1; orange box added by presenter</p>
```

A table you compiled says "Table compiled by presenter". A diagram or a worked example you made up says "diagram drawn by presenter" or "example values chosen by presenter". A picture from the web is credited with its author and license: `Photo: Author, CC BY 4.0, via Wikimedia Commons`.

The presenter's own paper needs no source line for its own content. For other people's work on such a slide, mark the claim in the line with `[1]` and list the sources in one block at the bottom, one per line, shortened to authors, title, venue and year. Two lines are `class="cite two"`, three `class="cite three"`:

```html
<p class="cite two">[1] A. Author and B. Author, “Title of the first paper,” Venue 2022.<br>[2] C. Author et al., “Title of the second paper,” Journal, 2020.</p>
```

## Conclusion

One line each for the background, the problem and the solution, then the results with the key number in red.

```html
<div class="txt" style="font-size:52px">
  <div class="grp">
    <ul class="bl"><li><span class="k">Background</span>: recurrent translation models, attention as a helper</li></ul>
  </div>
  <div class="grp">
    <ul class="bl"><li><span class="k">Problem</span>: recurrence is slow to train and weak over long distances</li></ul>
  </div>
  <div class="grp">
    <ul class="bl"><li><span class="k">Solution</span>: the Transformer, built on attention alone</li></ul>
  </div>
  <div class="grp">
    <ul class="bl"><li><span class="k">Results</span></li></ul>
    <ul class="bl sub"><li><span class="em">28.4 BLEU</span> on English–German, 2 above the best ensemble</li><li>Training cost a fraction of earlier models</li><li>Also works for parsing</li></ul>
  </div>
</div>
```

## Logo and theme

- Theme: edit the variables at the top of `deck.css`. With a brand or lab template, `--accent` is its theme color, so titles match the template. Keep `--ink` near black and the background white.
- Font: replace `'Inter'` in the `section` rule and register the family in the deck index as the Slides type describes. For a Chinese, Japanese or Korean deck use a family that covers the script, for example Noto Sans TC, JP, SC or KR.
- Logo: upload it, add `class="c lg"` to every content section, and put the image first in the section:

```html
<section id="r3" class="c lg">
<img class="logo" src="/_blob/LOGO" alt="">
<h2 class="ttl">Training Cost</h2>
```
- Icons for diagrams: `assets/icons/`, black line drawings on a transparent background. Upload the ones a diagram uses and place them as `<img class="ico">`.
