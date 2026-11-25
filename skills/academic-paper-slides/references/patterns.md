# Slide patterns

Each slide is one file, `project/slides/<id>.html`, holding exactly one `<section id="<id>">`. The speaker notes are the `<aside>`, always the last child. Classes come from `assets/deck.css`. `/_blob/…` stands for the URL the Slides type returns when you upload an image; use that URL verbatim. For PowerPoint output the same files are local and pictures are `src="/project/img/<name>.png"`.

The examples come from one talk (`examples/attention/` in the repository), so they show how the pieces of a real deck fit together.

## Contents

- Frame of a content slide
- Cover
- One sentence, two-level bullets, and a lead-in with its explanation (`.ex`)
- Numbered steps
- Emphasis
- Marking a figure (rings and badges)
- Text on top, visual below (`.stack`), pictures side by side (`.row`)
- Paper figure or slide figure
- Something that moves (GIF or video)
- A metric made visible
- Problem slide
- Line of reasoning (bullets with "→" lines)
- Diagram drawn on the slide (`.host`)
- Method overview: the parts and how they act on one another
- Formula with named terms
- Flow of steps (`.flow`)
- Rows of "box, arrow, outcome" (`.dia`)
- Placeholder for a picture or video the presenter supplies
- Tables
- A value written on a chart
- Sources
- Conclusion
- Logo and theme

## Frame of a content slide

```html
<section id="m2" class="c">
<p class="sec">Attention</p>
<h2 class="ttl">Scaled Dot-Product Attention</h2>
<div class="rule"></div>
<div class="pnum"></div>
<!-- the body: a .txt, then a visual (.host | .fig | table | .flow | .eq …), or a .stack of the two: text above, visual below -->
<p class="cite">Source: Author et al., Venue Year, Sec. 3</p>
<aside>[≤ 7:10] The script for this slide, in full sentences.</aside>
</section>
```

- `.sec` is the section label: the name of the part of the method the slide belongs to, written as the overview names it, with no letter or number in front ("Attention", not "B | Attention"). Use it only on the method slides, with the same text on every slide of one part. Leave the line out everywhere else.
- The title is at most five words in title case, on one line. A listener from outside the project can tell from it what the slide is about.
- A topic that continues on a second slide keeps its title and adds a circled number. The number is a block beside the title, not a character in it:

```html
<div class="tbar"><h2 class="ttl">Architecture</h2><p class="circ">2</p></div>
```

- Every visual has one or two lines of text above it (a `.txt` block) that say what it shows. A slide is never a title and a flow, or a title and a diagram, alone.
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

## One sentence, two-level bullets, and a lead-in with its explanation

A text block that says one thing is one sentence or one short paragraph: a `<p>` in the `.txt`, with no bullet and no dash. Before you write bullets, try to merge the short lines into one sentence. Bullets are for two or more separate points; `check_layout.js` reports a list of one bullet (`BULLET`).

```html
<div class="txt" style="font-size:60px"><p>The Transformer is an encoder and a decoder built from <span class="em">attention and feed-forward layers only</span>.</p></div>
```

With two or more points, the levels follow the logic. Parallel points are level one and equal. A line that follows from or answers its parent (cause → effect, gap → our fix) is a "→" line under it with no bullet: `<p class="ex">→ so the point must stay in place between the photos</p>`. A detail that says nothing by itself is merged with its parent into one sentence. Level two is for details and examples that stand as lines of their own. The Slides format turns a `<ul>` nested inside an `<li>` into hollow markers. So level two is a sibling list, `ul.bl.sub`, never a child of the `<li>`. One `.grp` holds a level-one line and its level-two lines. The font size is set once, on `.txt`; `check_layout.js` tells you the size that fits.

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

## Marking a figure (rings and badges)

Text never stands beside a figure: every slide with text and a visual is a `.stack`, text above and visual below (next section). A `.split` never holds text: it only sets a picture beside the diagram that reads from it ("Rows of box, arrow, outcome"). `check_layout.js` reports text beside a visual (`SIDE BY SIDE`).

```html
<div class="fig" style="width:1100px;height:520px">
  <img src="/_blob/FIG" alt="Fig. 9 of the paper: accuracy of the three settings" style="width:1100px;height:520px;object-fit:contain">
  <x-shape kind="ellipse" class="ring" style="left:66%;top:9%;width:8%;height:16%"></x-shape>
</div>
```

`.ring` and `.badge` are positioned in % of the figure box. To mark a block of a diagram, use a box instead of an ellipse: `<x-shape kind="rounded" class="ring box" style="left:9%;top:35%;width:40%;height:39%"></x-shape>`. When a diagram is explained over several slides, repeat the figure at the same size and move only the ring. A badge holds its number as text: `<div class="badge" style="left:12%;top:40%">1</div>`.

A ring never crosses the figure's own text (panel titles, labels, legends, axis labels). Make it larger rather than tighter: leave a clear margin around everything it encloses, and let it reach a little beyond the figure if it must (`left:-2%;width:101%`). When the part includes a panel's title, ring the whole panel with the title inside. When the gaps between the items of a figure are too narrow for any ring to pass without crossing text, add white space between the items in a copy of the figure first: find a row or column of pixels that only straight lines cross and repeat it (layout only, never the data), then ring the part and say so in the source line ("spacing widened and orange box added by presenter"). After placing a ring, look at the figure at full size in the screenshot.

## Text on top, visual below (`.stack`), pictures side by side (`.row`)

The layout of every slide that has text and a picture, chart, diagram or video: all the text at the top, the visual under it. A result or legend line of a drawn diagram joins the text at the top. The visual is as large as the slide allows: full width, and the height the text leaves (`769 − text height − 24`), with no wide gap above or below it. When the picture gets smaller (a crop), the text grows into the freed room at once: `check_layout.js` prints the size. A tall figure is cropped to the panel the slide is about, or redrawn wider than tall.

```html
<div class="stack">
  <div class="txt" style="font-size:46px"><!-- two to four lines --></div>
  <div class="fig" style="width:1500px;height:400px">
    <img src="/_blob/FIG" alt="Fig. 7 of the paper: error per building" style="width:1500px;height:400px;object-fit:contain">
  </div>
</div>
```

Several pictures of the same kind (three test sites, two views) stand in a `.row` under the text, each a `.fig` with a caption below it. Sibling slides (the same kind of slide in one section) use the same text size, text width and picture width. A row of pictures with arrows between them is a `.row spread`: it reaches the slide edges, every picture, icon, box and arrow sits on one centre line, and each `<x-shape kind="arrow-right" class="arw">` keeps clear space on both sides. When the text names two areas of a picture, outline each with a ring in its own colour and write the words that name it in the same colour.

```html
<div class="row">
  <div class="fig" style="width:420px"><img src="/_blob/SITE-A" alt="Test site A" style="width:420px;height:420px;object-fit:cover"><x-shape kind="rect" class="ring box red" style="left:0%;top:0%;width:100%;height:100%"></x-shape><x-shape kind="rect" class="ring box" style="left:25%;top:25%;width:50%;height:50%"></x-shape><p class="figcap">Site A</p></div>
  <!-- the other sites -->
</div>
```

Crop a paper figure to the panel the slide is about. Crop away the paper's own panel letters and figure headings ("(b) Simulator architecture") unless the text of the slide refers to them, remove rings and marks the slide no longer needs, and add the labels the crop lost ("air" on the arrows) as real text over the picture.

## Paper figure or slide figure

A figure made for the paper is not automatically a slide figure: a paper figure is read from 30 cm for minutes, a slide from the back row in under a minute. Two tests decide. Can its smallest text be read from the back row (at least about 27px on the slide, 2.5% of the slide height)? Does everything in it serve the slide's one message? If either answer is no, redraw it on the slide:

- An architecture or pipeline figure is redrawn as boxes and block arrows (`.flow`, or a `.host` diagram), with only this slide's steps and the names the overview uses.
- A chart with many bars, of which the slide discusses two or three, is redrawn with only those, labels at 36px or more (a small table, or bars drawn as `<x-shape kind="rect">` blocks with their values written beside them). The full chart goes to the appendix.
- The source line says so: "redrawn by presenter from Fig. 4".

Keep the paper's figure when it is itself the evidence (a photo, a rendered frame, a validation plot) and it is legible at slide size. A kept architecture or pipeline figure gets as much of the slide as it can: a `.stack` with one short line of text above it and the figure at the largest size that stays sharp.

## Something that moves (GIF or video)

Anything that moves (plants bending in the airflow, a camera view along a flight, a running simulation) is shown moving: a short looping GIF or a video clip, not a still with an outline around the moving part. The caption says what to watch.

```html
<div class="fig" style="width:900px">
  <img src="/_blob/STILL" data-video="/_blob/CLIP" alt="Side view: the canopy bends under the drone" style="width:900px;height:506px;object-fit:cover">
  <p class="figcap">Watch the leaves under the rotors: they bend away as the drone passes</p>
</div>
```

- A GIF is an ordinary picture: `<img src="/_blob/LOOP-GIF" …>`. Keep it short (3 to 8 s), looping, and no larger than it is shown.
- A video is a still picture that names its clip in `data-video` (MP4 with H.264, or WebM, 20 MB or less). Upload both; the clip plays, looping, while the slide is presented, and the still is what thumbnails, PDF and PNG show. For PowerPoint output keep both in `project/img/` (`src="/project/img/still.png" data-video="/project/img/clip.mp4"`); `export_pptx.js` places the clip with the still as its cover.
- Comparing several clips: one large video that plays the cases in sequence, each introduced by a title card (its name over the dimmed first frame, for about 1.5 s) and labelled in a corner while it plays. Not small GIFs side by side. Cut from the highest-resolution source, and crop away labels in another language.
- When only the presenter can make the clip, leave a placeholder that asks for it ("Placeholder" below).

## A metric made visible

Explain the mechanism the result depends on first ("a point found in two photos gives its 3D position → the point must stay in place between the photos"). A metric's numbers appear only after a slide has made the metric intuitive with a picture of what counts as right, wrong and missed. Otherwise do not show the score at all. Show the pictures side by side, with the correct parts in one colour, the wrong ones in another and the missed ones in a third, say in the text what each colour means, and state the result as a plain share. Score tables go to the appendix or nowhere.

```html
<div class="txt" style="font-size:46px">
  <div class="grp"><ul class="bl"><li>Green: rebuilt within 2 cm. Red: rebuilt in the wrong place. Grey: missed</li><li>Of the whole true plant surface, <span class="em">36%</span> is rebuilt within 2 cm with the downwash off, <span class="em">14%</span> with it on</li></ul></div>
</div>
<div class="row">
  <div class="fig" style="width:820px"><img src="/_blob/OFF" alt="Reconstruction with the downwash off, coloured by error" style="width:820px;height:460px;object-fit:contain"><p class="figcap">Downwash off: 36% within 2 cm</p></div>
  <div class="fig" style="width:820px"><img src="/_blob/ON" alt="Reconstruction with the downwash on, coloured by error" style="width:820px;height:460px;object-fit:contain"><p class="figcap">Downwash on: 14% within 2 cm</p></div>
</div>
```

## Problem slide

The last line of the slide is the goal, after the text and any diagram. The goal is set at 64px, bold, in the accent color: larger than the body text whatever size that is. Keep it to one or two lines.

```html
<p class="goal">→ Goal: locate a phone in a building nobody has surveyed</p>
```

## Line of reasoning (bullets with "→" lines)

An argument that is one line of reasoning, such as the opening of a talk, is written as bullets, not boxes: large type, generous paragraph spacing on an emptier slide, and each link that follows from the line above as a "→" line under it. The order for a system paper: what is wanted → why it is hard → testing for real is costly → a tool "is needed" → existing tools lack it → we built it. Never split the argument into two side-by-side panels (field test against simulation) with a conclusion under them: listeners read two panels as a comparison and lose the "therefore".

```html
<div class="txt" style="font-size:60px">
  <div class="grp"><ul class="bl"><li>Translation models should train on more data</li></ul><p class="ex">→ but a recurrent network reads one word after another</p></div>
  <div class="grp"><ul class="bl"><li>Nothing in it runs in parallel</li></ul><p class="ex">→ so training is slow</p></div>
  <div class="grp"><ul class="bl"><li><span class="em">A model with no recurrence is needed</span></li></ul></div>
</div>
```

## Diagram drawn on the slide (`.host`)

Use it to show how something works: who sees what, what blocks what, what is computed from what. A host is a box of fixed size under the text. Everything in it is pinned with `left`, `top`, `width` and, for boxes and icons, `height`, in px measured from the host's corner.

- `<div class="node">`: a small white box with an outline in the accent color.
- `<div class="panel">`: a larger rounded box that holds a title (`<p class="pt">`) and one or two short lines.
- Nested boxes share one corner radius: nodes, panels and flow boxes all have the same radius in px, and `export_pptx.js` writes it per shape (in PowerPoint a rounded rectangle's radius scales with its shorter side, so a frame and the boxes inside it would differ). Do not frame boxes with `<x-shape kind="rounded">`, whose radius scales.
- Text inside every box is centred, across and down; the stylesheet does it. Boxes in one row hold the same number of lines, so that their titles still start on one line (`check_layout.js`: `BOXES`).
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

## Method overview: the parts and how they act on one another

One slide, as a diagram of the parts of the method and how they act on one another, with one sentence above it.

- The title says what the parts are ("Transformer Components", "Simulator Components"), not "Method".
- Each part is a panel named in plain words the audience knows, with no letter or number in front. The same names return as the section labels of the method slides, in the same order.
- The list of parts is complete: every actor the audience expects is a part, even a simple one (a UAV simulator lists the UAV's flight model). Two things that work as one (a plant model and its response to the airflow) are one part.
- The system's input is the first box of the diagram, with an arrow into the system ("Input: flight plan (height, speed, camera angle)"), not a separate line of text. The output is the last box.
- Arrows show what acts on what. No stray numbers or settings.

```html
<div class="txt" style="font-size:60px"><p>The Transformer is an encoder and a decoder built from <span class="em">attention and feed-forward layers only</span>.</p></div>
<div class="host" style="width:1738px;height:560px;font-size:44px">
  <div class="node" style="left:0px;top:30px;width:330px;height:220px"><p class="bd">Input</p><p>source sentence</p></div>
  <div class="panel" style="left:430px;top:20px;width:878px;height:240px"><p class="pt">Encoder and Decoder Stacks</p><p>Six layers each, no recurrence</p></div>
  <div class="node" style="left:1408px;top:30px;width:330px;height:220px"><p class="bd">Output</p><p>translation</p></div>
  <div class="panel" style="left:180px;top:340px;width:660px;height:210px"><p class="pt">Attention</p><p>Relates all words<br>in every layer</p></div>
  <div class="panel" style="left:900px;top:340px;width:660px;height:210px"><p class="pt">Positional Encoding</p><p>Adds the word order<br>to the input</p></div>
  <x-connector x1="330" y1="140" x2="430" y2="140" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="1308" y1="140" x2="1408" y2="140" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="640" y1="340" x2="640" y2="260" style="color:#404040;border-width:6px"></x-connector>
  <x-connector x1="1100" y1="340" x2="1100" y2="260" style="color:#404040;border-width:6px"></x-connector>
</div>
```

The sentence goes in and the translation comes out through the stacks; attention and positional encoding act on the stacks, so their arrows point into that panel. The method slides then follow in the order of the panels: stacks, attention, positional encoding.

## Formula with named terms

The formula must be easy to read before anything is added to it: one line, with clear gaps between its pieces, and as large as the slide allows. On a slide whose message is a formula that is often 80px or more: `check_layout.js` prints the size (`GROW: set .eq font-size`), and the size for the panels under it (`GROW: set .cols font-size`). The text block under them takes what is left.

- Every piece is a `<p>`: `<p>Attention(Q, K, V) = softmax(</p>`. The row keeps a gap between pieces, so write an operator as its own piece.
- A symbol with a subscript or a superscript is a group, `<div class="pc">`, holding the symbol and then `<p class="sb">` (subscript) or `<p class="sp">` (superscript): `<div class="pc"><p>d</p><p class="sb">k</p></div>`. Do not type the characters ᵀ or ₖ in a formula: fonts draw them badly.
- A term the slide explains is boxed: `<div class="term">…</div>`. It holds pieces and groups like the row itself, and it has room inside, so its outline never touches or covers a character. Do not shrink that room, and box at most three terms.
- The text in a box stays on the baseline of the pieces outside it. The stylesheet does this with a negative bottom margin on `.term` equal to its bottom padding plus its border; if you change one, change the other. In the screenshot every character of the formula stands on one line.
- Pieces the slide does not discuss can get class `dim` (grey).

Under the formula, one panel per boxed term, in the same left-to-right order. Each panel starts with the **name of its term as a title** (`<p class="pt">`), then one or two short lines that say what the term does. The text of a panel is centred, and the panels hold the same number of lines, so their titles start on one line. A line joins each term to its panel. When the term has symbols of its own, the panel gives the term's name, its expression, and its symbols as a short bulleted list, left-aligned inside the box (the stylesheet does it; never centred bullets): `<div class="panel"><p class="pt">Scaling</p><p>1 / √d<span class="sb">k</span></p><ul class="bl"><li>d<span class="sb">k</span>: size of the key vectors</li></ul></div>`. The formula must match the implementation (check the code, not only the paper), its symbols are named in the slide's language, and each term box is centred on its letters.

```html
<div class="eq" style="font-size:74px"><p>Attention(Q, K, V) = softmax(</p><div class="term"><div class="pc"><p>QK</p><p class="sp">T</p></div></div><p>/</p><div class="term"><div class="pc"><p>√d</p><p class="sb">k</p></div></div><p>) V</p></div>
<div class="cols" style="font-size:56px;flex:none">
  <div class="panel" style="flex:1"><p class="pt">Scores</p><p>Each query times each key</p><p>One score per pair of words:<br>higher means a closer match</p></div>
  <div class="panel" style="flex:1"><p class="pt">Scaling</p><p>Keeps the scores small</p><p>Large scores give softmax<br><span class="em">very small gradients</span></p></div>
</div>
<div class="txt" style="font-size:46px">
  <div class="grp"><ul class="bl"><li>softmax turns the scores into weights</li><li>Multiplying by V gives the weighted sum of the values</li></ul></div>
</div>
<x-connector x1="1303" y1="340" x2="511" y2="389" route="vh" head="none" style="color:#222222;border-width:4px"></x-connector>
<x-connector x1="511" y1="389" x2="511" y2="438" head="none" style="color:#222222;border-width:4px"></x-connector>
<x-connector x1="1565" y1="340" x2="1565" y2="438" head="none" style="color:#222222;border-width:4px"></x-connector>
```

The connectors are children of the slide itself, so their coordinates are slide coordinates. Write the slide without them first, then get the numbers:

```bash
node scripts/check_layout.js <deck_root> --where ".term, .cols .panel"
```

A line leaves the `bottom-mid` of its term and goes straight down into its panel when the term stands above that panel (the second term here). When it does not, the line goes down, across and down in right angles to the `top-mid` of the panel: one connector with `route="vh"` to a point halfway between formula and panels, and a second one straight down from there (the first term here). No diagonal lines. Change the formula, its size or the font and the numbers change: measure again.

`.cols` takes the height its panels need when it has `flex:none`, which leaves room for the text below. When a term has no panel, put its name above it instead: `<div class="tcol"><p class="tl">Scores</p><div class="term">…</div></div>`.

A short formula with no terms to single out is the same row without `.term` and without panels, followed by a `.txt` that explains it. A formula that needs fractions, sums or matrices is cropped from the paper as a picture; its terms are then marked with `.ring box` outlines placed around them with a margin, never across a symbol.

## Flow of steps (`.flow`)

One `.flow` row of up to four `.card` boxes with a block arrow between them. In each box: a head row (`.hd`) with the step number in a circle and the name of the step, then one to three short lines (what data it uses, what it produces). The name is set larger than the lines by the stylesheet, so keep it to one or two words. The text of a box is centred, across and down; give the boxes of one flow the same number of lines, so that their names start on one line. The step being evaluated gets `class="card key"`. The boxes must explain the steps themselves; do not add a paragraph under the flow.

A flow is a visual like any other: one or two short lines of text stand above it and say what the flow is (what is tested and how). Under them the flow takes the rest of the slide: tall boxes with large text, not a strip with empty space under it. Set the text size once, inline on `.flow`; `check_layout.js` prints the largest size that fits (32 to 56px) and names the line that stops the text from growing. Shorten that line or break it in two with `<br>`: one fact per line, at most about 14 characters where there are three boxes, and a line may wrap once at most. Three boxes hold larger text than four.

The arrow between two boxes is a block arrow, `<x-shape kind="arrow-right" class="arw"></x-shape>`, not a typed "→", which is too thin to see.

```html
<div class="txt" style="font-size:54px">
  <div class="grp"><ul class="bl"><li>Two translation tasks from WMT 2014 (public benchmark), scored with BLEU (higher is better)</li><li>Compared with the best earlier systems (GNMT, ConvS2S, MoE)</li></ul></div>
</div>
<div class="flow" style="font-size:50px">
  <div class="card"><div class="hd"><p class="circ">1</p><p class="bd">Data</p></div><p>English–German<br>4.5M pairs</p><p>English–French<br>36M pairs</p></div>
  <x-shape kind="arrow-right" class="arw"></x-shape>
  <div class="card"><div class="hd"><p class="circ">2</p><p class="bd">Train</p></div><p>1 machine,<br>8 GPUs (P100)</p><p>Base: 12 hours<br>Big: 3.5 days</p></div>
  <x-shape kind="arrow-right" class="arw"></x-shape>
  <div class="card key"><div class="hd"><p class="circ">3</p><p class="bd">Test</p></div><p>newstest2014<br>test set</p><p>BLEU against<br>earlier systems</p></div>
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

## Placeholder for a picture or video the presenter supplies

When a slide needs a picture or a video that only the presenter can make (a demonstration of the system, a screenshot of results), leave a box of the final size that says what goes there. The box takes the place of the `.fig`: give it the width and height the picture will have.

```html
<div class="stack">
  <div class="txt" style="font-size:52px"><!-- one or two lines --></div>
  <div class="ph" style="width:900px;height:506px"><p class="bd">Video: the simulator running one flight</p><p>Side view, 10 to 15 s, looping, 16:9, at least 1280 × 720</p></div>
</div>
```

Something that moves is asked for as a short looping GIF or a video, never as a still. When you deliver, list every placeholder for the user in plain text, one item per slide:

```
Slide 9 "Simulator Demo" (required): video of the simulator running one flight. Side view of the drone and the canopy,
  10 to 15 s, MP4, 16:9, at least 1280 x 720.
Slide 12 "Field Test" (optional): photo of the drone over the field, taken from the ground, JPG or PNG, at least 1600 px wide.
```

A demonstration shot under settings other than the paper's experiments says so in its caption on the slide: `<p class="figcap">0.5 m above the canopy (demonstration)</p>`.

## Tables

Related work as a comparison (approach, one column per axis; the row for this paper highlighted), and results the paper gives as numbers. The text above says what the table compares and what to read from it.

A comparison with prior methods goes in this order: the test object, then each prior method's simple pros and cons, then this method's pros and its limits, in plain words without numbers. Never claim "better in every situation" unless the paper shows it. The citation of a prior method goes in a small multi-line block in the corner, `<p class="cite corner two">…</p>`, kept apart from the figure so that it is not read as the figure's source.

Why a platform, engine or tool was chosen: show what the tool is good at, with its logo next to the title and licensed promotional pictures in a `.row` below the text. Name known systems built on it, and verify that claim. State honestly what it lacks ("wind tools made for visual effects, not checked against real airflow") as a bullet, and what this work adds as the "→" line under it. Compare with named alternatives only on properties the slide can compare meaningfully. "Powerful and popular" is not a reason.

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

A `text-align` on one cell applies to its whole column. Only the header row is bold. To stress a value, colour the whole cell: `em` on the `<td>`. A phrase inside a cell (`<span class="em">`) is one colour with its cell in Claude Slides; the PowerPoint export keeps it red, but do not rely on it. In a cell with Chinese, Japanese or Korean text, do not leave the line break to the program: where a cell needs two lines, break it yourself with `<br>` at a sensible place, and keep the other cells to one line by giving their column enough width. The export also tells PowerPoint not to start a line with 、 or 。 in a cell. Grid lines are drawn by the Slides type itself and by the PowerPoint export, so add no border rules. `class="hl"` fills the one row to stress; `class="em"` on its cells makes them red. `class="tb roomy"` gives taller rows to a table of four rows or fewer. Set column widths with `style="width:46%"` on header cells so the key column does not wrap. Marks in a comparison table (✓ yes, △ under conditions, ✗ no) are explained in the source line.

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

One line each for the background, the problem and the solution, then the results as findings, not values ("close to CFD", not "within 0.4–1.1 m/s"), with the key number in red. When the contribution is a system, the system comes first and the example use last.

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
