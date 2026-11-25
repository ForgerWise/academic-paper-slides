---
name: academic-paper-slides
description: Turn an academic paper into presentation slides, as a Claude Slides artifact, an editable PowerPoint (.pptx) file or Google Slides. Short text plus a visual on every slide (figures, tables, formulas with named terms, diagrams drawn from boxes, icons and arrows), topic titles, plain white pages, text sized by a script to fill the slide, and speaker notes written to be read aloud. Use whenever the user wants slides to present or explain a paper, their own or someone else's.
---

# Academic paper slides

Turn one research paper into presentation slides that a listener can follow, and a script the presenter can read aloud.

**What a good deck looks like.** The model is a talk a careful researcher builds by hand: a short text at the top of each slide and, under it, something to look at that explains the text, such as a photo, the paper's figure, a chart with the key value marked, a table, a formula with its terms named, or a small diagram drawn from boxes, icons and arrows. Most slides have such a visual. A deck that is slide after slide of bullets has failed, however correct the bullets are.

**Output:** a Claude Slides artifact, an editable PowerPoint file, or Google Slides (section 0). This skill decides content, structure and look. Where it disagrees with the Slides artifact type's general design advice (accent slides, cards, statement slides, margins), this skill wins, because choosing it is the user's explicit instruction. The type's hard format limits always hold.

**Bundled files**

- `assets/deck.css`: the stylesheet. Copy it to `project/deck.css` and change only the theme variables.
- `assets/icons/*.png`: 22 plain line icons for diagrams (observer, building, house, drone, car, sun, glare, model, computer, server, database, cloud, camera, sensor, satellite, phone, person, document, chart, clock, gear, wall). Upload the ones a diagram uses.
- `references/patterns.md`: the HTML for every slide kind. Read it before writing the first slide and copy from it. Do not invent markup.
- `scripts/check_layout.js`: measures every slide and says which text size fits.
- `scripts/check_notes.py`: checks the speaker notes as spoken text and prints the timing.
- `scripts/export_pptx.js`: turns the deck into an editable PowerPoint file (also the way to Google Slides).

If these files are not beside this `SKILL.md` (the skill was installed as a single file), get them once per session and use them from the clone:

```bash
git clone --depth 1 https://github.com/ForgerWise/academic-paper-slides /tmp/aps
# files are in /tmp/aps/skills/academic-paper-slides/
```

If the clone fails, say so and stop before building: the stylesheet and patterns are required.

## 0. Choose the output

The deck is always the same set of files: `project/deck.json`, `project/deck.css` and one `project/slides/<id>.html` per slide. What changes is where they live and what the user receives.

- **Claude Slides artifact** (default when the Slides artifact type is available and the user named no format): create the deck from that type and follow its own instructions for the index file, uploads and publishing. Pictures are uploaded and referenced by the URL the type returns. The artifact itself exports to PowerPoint and PDF.
- **PowerPoint (.pptx)** (the user asks for PowerPoint or a file, or there is no Slides type here, for example in a terminal agent): write the same files into a local folder `<deck_root>/project/`. The index is just `{"title": "...", "order": ["cover", "problem", ...]}`. Put pictures in `project/img/` and reference them as `src="/project/img/<name>.png"`. Run both checks, then export:
  ```bash
  node scripts/check_layout.js <deck_root> --font "Arial"
  node scripts/export_pptx.js <deck_root> <name>.pptx --font "Arial"
  ```
  `--font` names the font the file is opened with, in both commands (Arial for English, Meiryo or Yu Gothic for Japanese on Windows). The result is editable, not pictures of slides: each `.txt` block is one text box with real two-level bullets, tables are PowerPoint tables, flow boxes, the boxes and arrows of a diagram, rings and circled numbers are shapes, the notes are speaker notes.
- **Google Slides**: export the PowerPoint file as above. If a Google Drive tool that can convert on upload is connected, upload it as a Google Slides presentation and give the link. Otherwise deliver the .pptx and tell the user to upload it to Drive and open it with Google Slides.

For PowerPoint and Google Slides, name a font that exists where the file will be opened (`--font`, or the font in `deck.css`), because a substituted font changes the line breaks: Arial for Latin text; for Chinese, Japanese or Korean, a Noto Sans family for Google Slides, Meiryo or Yu Gothic for PowerPoint on Windows, or ask which system the user presents on.

**PowerPoint sets text wider than the browser that measures it here**, most of all Japanese, Chinese and Korean text, so a line that just fits in the check can wrap onto an extra line in the real file, sometimes in the middle of a word. Two things guard against it, and both are required:

1. The width margin. With `--font` on a deck that is mostly Chinese, Japanese or Korean, `check_layout.js` and `export_pptx.js` measure every character 0.08 em wider (`--margin 0.08`; set another value, or `--margin 0`, in both commands alike). Sizes the check accepts or suggests then leave about 8% of the line free. Nothing of the margin is written into the file. For a Latin deck the default is 0; give `--margin 0.03` when lines wrap in the real file.
2. A look at the real file. **A PowerPoint deck is not delivered before it has been rendered by PowerPoint or LibreOffice and every slide has been looked at**: a clean `check_layout.js` does not show how PowerPoint breaks the lines. If the font named by `--font` is not installed on the machine that runs the scripts, both scripts say so, and this look is the only check there is.
   - LibreOffice: `soffice --headless --convert-to pdf <name>.pptx`, then `pdftoppm -r 80 -png <name>.pdf page` and read the pictures.
   - Windows without LibreOffice: let PowerPoint itself write one PNG per slide, then read the pictures.
     ```powershell
     $ppt = New-Object -ComObject PowerPoint.Application
     $deck = $ppt.Presentations.Open("C:\full\path\name.pptx", -1, 0, 0)   # read-only, untitled off, no window
     $deck.Export("C:\full\path\png", "PNG", 1920, 1080)                    # Slide1.PNG, Slide2.PNG, ...
     $deck.Close(); $ppt.Quit()
     ```
   - Neither at hand: say so when you deliver, and ask the user to page through the file once.

   A line that wraps in the real file: shorten it or lower the size of its block, export again, look again.

## 1. Before you start

- Read the whole paper: convert the PDF to text and look at every page with a figure. Every number, figure number and section number on a slide is checked against the paper, never written from memory.
- Settle these inputs. Use the default when the user has not said, and list what was missing in one line when you deliver:
  - talk length (default 15 minutes)
  - output: Slides artifact, PowerPoint or Google Slides (default: section 0)
  - deck language (default: the language of the request) and notes language (default: same)
  - date, presenter name and affiliation (default: bracketed placeholders on the cover)
  - template or brand: logo, colors, font (default: the neutral theme in `deck.css`)
  - grading rubric or required sections (default: none)
  - whether the presenter is an author of the paper, and if so the only author ("my paper", "our paper" means author; default: not an author)
- With a rubric, follow its sections and order. Without one, use the structure below.

## 2. Deck structure

The deck tells one connected story. Each slide follows from the one before it, in this order:

1. Cover
2. Background: the situation the problem comes from, as one plain message the whole audience accepts ("camera drones are expected to automate crop monitoring"), with one small visual. A busy background slide is not read. A concept the problem slide depends on (SfM, attention) is introduced here, so that it does not appear on the problem slide out of nowhere
3. Problem: what goes wrong in that situation. The last line is the goal, "→ Goal: …", bold and larger than every other line of the body, because it is the sentence the rest of the talk answers. The goal must follow from what the audience has seen so far. When the goal is a tool or a system (a simulator, a dataset, a platform), do not state it on the problem slide: first build the need for it ("Opening for a system paper" below). If the background and the problem are both short, put them on one slide.
4. Preliminaries: the terms and concepts the audience needs for the rest. Only if they are needed.
5. Related work: how others approached the problem, as one comparison table with the row for this paper highlighted
6. Method overview: the approach on one slide, as a diagram of its parts and how they act on one another (UAV → airflow → plants).
   - The heading says what the parts are ("Simulator Components", "Transformer Components"), not "Method".
   - Name each part in plain words the audience knows, with no letter or number in front: "A |" tells the audience nothing.
   - The list of parts is complete: every actor the audience expects is a part, even a simple one (a UAV simulator lists the UAV's flight model). Two things that work as one (a plant model and its response to the airflow) are one part.
   - Draw the system's input into the diagram as the first box, with an arrow into the system ("Input: flight plan (height, speed, camera angle)"), not as a separate line of text.
   - No stray numbers or settings.
7. Method details: the parts in the order of the overview, one idea per slide, with the figure, demonstration or formula that shows it. Every slide of a part carries that part's name, as the overview has it and without a letter, as a small section label above its title, so the audience always knows which part they are in.
   - For each part say how it works: what goes in, what is computed, what comes out, and what is simplified. A simple model is explained too.
   - Say why a part is built the way it is ("single leaves must move, so plants are built from movable parts").
   - Give the actual computation as an idea: the model used, its inputs, the formula or rule, and what was fitted to what ("momentum theory gives the induced speed; a jet profile spreads it; correction factors fitted to CFD").
   - No fine numbers where the idea is the message. Say how the model behaves ("tilts more under stronger wind", not "up to 70° at the top"; "rigid parts: stems, leaflets, fruit", not "up to 128 parts"). Keep a number only when the number itself is the message and its meaning is obvious to an outsider; whoever wants the values reads the paper.
   - Never fill a method slide with behaviour the audience already expects ("the downwash moves backwards in forward flight").
   - A pipeline or loop figure shows only what belongs to that slide's topic.
   - Why a platform, engine or tool was chosen: show what the tool is good at, with its logo next to the title and licensed promotional pictures below the text. Name known systems built on it, and verify that claim. State honestly what it lacks ("wind tools made for visual effects, not checked against real airflow") → what this work adds. Compare with named alternatives only on properties the slide can compare meaningfully; drop the others. "Powerful and popular" is not a reason.
8. Experiment setup: data, environment, procedure and baselines, and the default settings the results rely on (such as the flight speed or the model size), stated once here, before the result slides. One or two lines of text and a flow of boxes (① → ② → ③ → ④) under them, plus screenshots or photos of the environment when there are any
9. Results: one result per slide, with its chart or table. A comparison with prior methods goes in this order: the test object, then each prior method's simple pros and cons, then this method's pros and its limits, in plain words without numbers. Never claim "better in every situation" unless the paper shows it. Their share of the talk follows the contribution: when the contribution is a system, the experiments are an "Example use" of two or three slides, and the rest goes to the appendix
10. Conclusion: one line each for the background, the problem and the solution, then the results as findings, not values ("with downwash on, the 3D model loses accuracy"; "close to CFD", not "within 0.4–1.1 m/s"), with a number only where the number is the message. When the contribution is a system, list the system first and the example use last
11. Appendix: only if there is material for it

**Opening for a system paper.** When the contribution is a tool or a system, the opening answers these in order, one link per slide or per line:

1. the application is wanted;
2. but something goes wrong in it;
3. so the ways of working must be compared with that effect included, and doing it for real is costly or cannot be repeated;
4. so a tool of this kind is needed;
5. but existing tools leave the effect out (the related-work table);
6. so this work builds one.

The kind of solution ("simulator") is not named on any slide before step 4, and the goal line stands where step 4 is reached, not on the problem slide. The opening slides are bullets, not boxes: large type, generous paragraph spacing on an emptier slide, and each link that follows from the line above as a "→" line under it. Step 4 says the tool "is needed"; only step 6 says "we built it".

**Story check.** Test the chain before building: read your one-sentence summaries of the slides in order. Each must follow from the one before with a plain link ("so", "but", "to solve this", "to test this"). If a link is missing, reorder, merge or cut until it is there. The kind of solution is not named before the slide that says why it is needed. No abbreviation and no score appears before it has been explained.

Slides of one kind are titled by their topic, not by a running number (section 3).

Add strengths, critique, takeaways, a reviewer verdict or references only when the user or the rubric asks.

A 15-minute talk is 15 to 17 slides. Scale with the talk length at about one slide per minute.

## 3. Content rules

- One slide says one thing. Two things means two slides, or the minor one moves to the notes.
- Titles name the topic of the slide in a short phrase, at most five words, in title case: "Scaled Dot-Product Attention", "Training Cost". Never a sentence, a claim or a figure number. The title must fit on one line and stay clear of the page number. A listener from outside the project can tell from the title what the slide is about: "Flight Plan Comparison", not the project's own label such as "Side Passes".
  - The only slide of its kind takes the kind as its title: "Related Work", "Conclusion".
  - Slides of one kind about different things are each named by their own topic, not "Method 1", "Result 2".
  - Put the kind in front only when the name alone would not tell the audience where they are in the talk: "Preliminary: Attention" in a talk whose method slides are also about attention.
  - A slide that belongs to a part of the method gets that part's name as a section label above the title, with no letter in front: `<p class="sec">Attention</p>`.
  - One topic that continues because it does not fit on one slide keeps its title and adds a circled number, written as a block beside the title (patterns, "Frame of a content slide"). Do not type the characters ① ②: fonts draw them at very different sizes.
- Write only what carries information, but do not abbreviate until it is unreadable.
- Define a term on the line where it is first needed, in a few words in parentheses, for example "ViT (an image model built from Transformer blocks)". Do not spend an earlier slide on it, and do not explain common knowledge. An abbreviation (CFD, SfM, F-score, nadir) is explained on the slide where the audience first sees it, not only in the notes; `check_layout.js` lists the ones that are not. A measured quantity names its reference once: "height h above the canopy".
- Use the paper's own terms. In a deck that is not in the paper's language, give the original term once on first use. No metaphors.
- On a slide with a figure, the text first says what the figure compares, then the result. Do not repeat what the figure already shows.
- Result slides state results. No judgement words such as "convincing", "reliable" or "should be discounted".
- Claims are never stronger than the paper's.
  - Use the paper's verb or a weaker one: "degrades", not "breaks"; "scores lower", not "fails".
  - A result line names exactly the configurations the paper says achieved it ("the big model", "in the semi-supervised setting"), not the method in general.
  - Do not say that two models or methods rank all cases the same, or that one setting is best, unless the paper says so. When you show only some rows of a table, keep the rows that go against the line above the table: never pick rows that hide a counterexample.
- If a critique or verdict is requested: each criticism names the problem and its evidence (figure number, number). Say whether a concern is a limit of the method or a flaw in the experiment design. Suggest fixes only if asked.
- No cross-slide references such as "(p. 7)" or "see slide 4".
- Every number on a slide can be found in the paper. Mark invented example values "values are illustrative".
- Detail cut from a slide goes into its notes, not into smaller type.
- Every slide earns a visual. Before you write a list, ask what the content looks like, and show that:
  - what a thing is or looks like → a photo or the paper's figure, with a caption
  - steps or a pipeline (input → model → output, train → test) → a flow of boxes, or boxes joined by arrows
  - something that moves → a short looping GIF or video
  - how an idea works → a small diagram from boxes, icons and arrows, carrying ONE concrete example through it (a query word, three scores, the weights they turn into, the output). A worked number explains a method faster than any sentence
  - the same properties of several things → a table
  - a formula → the formula itself, as large as the slide allows and easy to read, the terms the slide is about boxed with room around them, and under each a panel that starts with the term's name
  - a result → the paper's chart or table, with the key value written on it in red; a chart with many bars is redrawn with the two or three the slide discusses
  - a metric → pictures of what counts as right, wrong and missed, before any number
  - two areas of one picture → outline each area in its own colour and write the words that name it in the same colour

  The text above the visual is one sentence, or two to four short lines, that say what to look for, and every visual has it. A flow of steps is a visual like any other: one or two short lines above it say what the flow is (what is tested and how). A slide is never a title and a flow, or a title and a diagram, alone. A numbered list is for content that has no such shape. Text-only slides are for the conclusion and little else: `check_layout.js` lists them, and fails the deck when more than a third of its slides have no visual.
- An argument that is one line of reasoning is written as bullets, top to bottom, each link that follows from the line above as a "→" line under it ("but", "so" are said in the words). Never split it into two side-by-side panels (field test against simulation) with a conclusion under them: listeners read that as a comparison and lose the "therefore".
- Never assume context the audience lacks. A label names the action in full: "Fly beside the row, camera tilted toward it", not "Beside the row". The lead line says what the thing is ("three flights along a tomato row"). Parallel labels share one form (where the UAV flies / where the camera looks).
- Comparing several clips: one large video that plays the cases in sequence, each introduced by a title card (its name over the dimmed first frame for about 1.5 s) and labelled in a corner while it plays. Not small GIFs side by side. Cut from the highest-resolution source and crop away labels in another language.
- Anything that moves (plants bending in the airflow, a camera view along a flight, a running simulation) is shown moving: a short looping GIF or video, not a still with an outline around the moving part. The caption says what to watch.
- Metrics: explain the mechanism a result depends on before the metric ("3D model from photos: a point found in two photos gives its 3D position → the point must stay in place between the photos"), then show the score. Show a metric's numbers only after a slide has made it intuitive with a picture of what counts as right, wrong and missed. Otherwise do not show the score at all.
  - Show the pictures side by side (correct parts in one colour, wrong in another, missed in a third) and state the result as a plain share: "of the whole true plant surface, 36% is rebuilt within 2 cm with downwash off, 14% with it on".
  - Score tables go to the appendix or nowhere.
- A figure made for the paper is not automatically a slide figure: a paper figure is read from 30 cm for minutes, a slide from the back row in under a minute. If its smallest text cannot be read from the back row, or not everything in it serves the slide's one message, redraw it on the slide.
  - An architecture or pipeline figure is redrawn as boxes and block arrows, with only this slide's steps and the overview's names.
  - A chart with many bars, of which the slide discusses two or three, is redrawn with only those, labels at 36px or more; the full chart goes to the appendix.
  - Keep the paper's figure when it is itself the evidence (photo, rendered frame, validation plot) and legible at slide size. Crop it to the panel the slide is about, remove rings and marks the slide no longer needs, and add labels the crop lost ("air" on the arrows).
- Diagrams are drawn on the slide, not pasted as a picture, so the presenter can edit them: white boxes with a thin outline, dark arrows thick enough to see from the back row, black line icons from `assets/icons/`, a few words per box, red for the one value or word that matters. No fills, no shadows, no gradients. A diagram or example you made up to explain the paper says so in the source line ("diagram drawn by presenter", "example values chosen by presenter").
- Pictures from outside the paper. When a picture the paper does not have would make a slide clearer (a photo of the device or the place, the scene of the problem), look on the web for one that may be reused: public domain or CC0, CC BY or CC BY-SA (Wikimedia Commons, Openverse, agencies such as NASA), or a site whose license allows reuse (Unsplash, Pexels). Read the license on the picture's own page, not in a search result, and credit the picture in the source line: "Photo: Author, CC BY 4.0, via Wikimedia Commons". Do not use a picture whose license you cannot find, and never one that only decorates. If nothing reusable turns up, build the slide without it and say so when you deliver.
- Pictures only the presenter can supply. When a slide needs a picture or a video that is in neither the paper nor the web (a demonstration of the system, a screenshot of results), leave a sized placeholder on the slide (patterns, "Placeholder"; for something that moves, a placeholder that asks for a looping GIF or video) and, when you deliver, give the user a plain-text list with one item per slide: what the picture must show, the viewpoint, the length for a video, the format and size, and whether it is required or optional. A demonstration shot under settings other than the paper's experiments says so on the slide, in its caption: "0.5 m above the canopy (demonstration)".
- Sources.
  - Someone else's paper: every content slide ends with a source line (`.cite`): "Source: Author et al., Venue Year, Sec. 3" or "Figure: Author et al., Venue Year, Fig. 4; orange ring added by presenter". A table you compiled says "Table compiled by presenter".
  - A citation for a prior method or another paper shown on the slide goes in a small multi-line block in a corner (`.cite.corner`), kept apart from the figure, so that it is not read as the figure's source.
  - Several sources on one slide: mark each claim with [1], [2] in the line and list them in the source block at the bottom, one per line, shortened to authors, title, venue and year ("cite two", "cite three" in patterns).
  - Your own paper (the presenter is an author): its text, figures, tables and results carry no source line and no citation. The cover already says whose work it is. A source line appears only on a slide that shows something from elsewhere: another paper's method, result or figure, a statistic, a picture from the web. That includes a formula, a model or a constant your paper takes from another paper: it gets a source line even in a talk on your own work.

## 4. Speaker notes

The notes are a script. The presenter reads them aloud exactly as written, and a listener who is not looking at the screen must still understand the slide. Check every paragraph against four tests.

1. **It can be read aloud as written.** Full sentences only. Nothing the mouth cannot say:
   - no label followed by a colon ("Result: …", "A: …", "Step 1: …")
   - no bullets, numbering, parentheses, brackets, arrows, slashes or math symbols
   - no written abbreviations ("e.g.", "Fig. 3", "Sec. 2", "vs.", "et al.")
   - spell out what you will say: "for example", "figure three", "versus", "the authors", "about nine percent"
2. **It stands alone.** Start with the slide's point in one or two sentences. Name what a figure shows ("the red line is the new method") instead of "as you can see here". On method slides say what goes in, what is computed, what comes out and what data it was trained on.
3. **It does not read the slide.** Say the point in new words, then add what the slide does not have: how to read the figure, why the authors did it this way, how to interpret the result, the link to the next slide.
4. **Simple words, adult tone.** Short sentences of everyday words, one idea each, as you would explain it to a colleague from another field. Contractions and short questions ("Why does this help?") are fine. Not written style ("respectively", "the former", "it is worth noting that", "utilize"), and not childish either: no "super cool", no exclamation marks, no cheerleading, no talking down. Keep technical terms where they are the correct word, and keep every number and fact exactly as in the paper.

Rewrite, do not patch:

| Written (wrong) | Spoken (right) |
|---|---|
| Method A: fine-tune all layers. Method B: train only the last layer (cheaper). | The authors compare two ways to adapt the model. The first one updates every layer. The second one updates only the last layer, which costs much less. |
| Result: +9% vs. baseline (Fig. 5). | So what did they find? The new method is about nine percent more accurate than the baseline. That is the gap between the two bars on the left. |
| As you can see, the errors are 3.2, 2.1 and 4.5 m respectively. | The error is smallest in the second building, at about two meters. In the other two it is three and four and a half meters. |

Also:

- Who did the work:
  - Someone else's paper: "the authors", never "we".
  - The presenter's own paper: first person, and the author list on the paper decides which. Sole author, or a thesis or dissertation: "I". Co-authored paper: "we".
  - Keep one pronoun for the whole script. Do not switch between "I" and "we" from slide to slide.
- The first sentence of a slide's notes links it to the slide before ("This design has two problems"), so the talk is one story and not a list of slides.
- Start each slide's notes with the time by which the presenter should reach it, for example `[≤ 7:45]`. It is the one non-spoken token allowed. Take the value from `check_notes.py`, do not estimate it.
- Pace: 125 words per minute (150 for a native speaker), 260 characters per minute for Chinese, Japanese or Korean, 3 seconds per slide change. Leave one minute of buffer.
- Sentence length: the check warns above 28 words, or above 60 characters in Chinese, Japanese and Korean, where it counts characters and splits at 。！？ (`--max-words`, `--max-chars`).
- Notes are plain text, at most 4,000 characters per slide.

Then run the check and fix every `E` line. Read every `W` line and fix it unless it is a false alarm:

```bash
python3 scripts/check_notes.py <deck_root> --minutes 15
```

Add `--own` when the presenter is an author. The script catches mechanics. It cannot judge tests 2 and 3, so reread each script once as a listener with eyes closed.

## 5. Look

**Color and boxes**

- White background, near-black text. The accent color for the title bar and the outlines of diagram boxes and panels, dark grey for arrows, red for emphasis. Nothing else.
- Theme = the variables at the top of `deck.css`: `--ink`, `--accent`, `--line`, `--hl`, `--head`, `--mark`, `--em`. With a user template or brand, set `--accent` to its theme color, so the titles and boxes match the template, set the font, and add the logo (see patterns). Without one, keep the neutral defaults. Do not add colors.
- Boxes are for diagrams: nodes, panels, flow steps, a boxed term of a formula. They are white with an outline, never filled. Ordinary text is never put in a box or a card to decorate it.
- Text inside every box and node is centred, horizontally and vertically; the stylesheet does it. The one exception is a bulleted list inside a panel, which is left-aligned. Boxes in one row hold the same number of lines, so that their titles still start on one line (`check_layout.js`: `BOXES`).
- Slides keeps only colour, bold, italic and underline on words inside a line. Anything that needs its own size, border or position is a block of its own: no `<sub>`, `<sup>`, badges or pills inside a sentence. `check_layout.js` reports these as `INLINE`.

**Emphasis**

Use both kinds sparingly. A slide where everything is stressed stresses nothing.

- Bold is for sub-headings inside the body: a level-one lead-in ("**Result**", "**Why waves**"), the goal line, table headers, the name line of a box or panel. Do not bold words inside a sentence.
- Red (`<span class="em">`) marks the key terms and key numbers: the two things being contrasted, the result to remember, the value a diagram arrives at. At most three on a slide, a few words each, never a whole sentence, never in a title.

**Formulas**

- One formula per slide, centered across the slide, on one line, never beside a figure. First it has to read well as a formula: with a clear gap between its pieces and real subscripts and superscripts. The formula must match the implementation (check the code, not only the paper), its symbols are named in the slide's language, and each term box is centred on its letters. Under each boxed term a panel gives the term's name, its expression, and its symbols as a short bulleted list, left-aligned inside the box (never centred bullets). On a slide whose message is a formula, make the formula as large as the slide allows (often 80px or more), and make the panels under it large too: `check_layout.js` prints both sizes, and the text block under them takes what is left. It is a row of pieces (`.eq`, patterns "Formula"): a symbol and its subscript or superscript form a group, and the parts the slide does not discuss can be grey.
- The terms the slide discusses are boxed. A box has room inside and a gap outside: its outline never touches or covers a character, and no more than three terms are boxed.
- The text in a box sits on the same baseline as the pieces outside it. The box's padding and border must not lift it: `.term` offsets them with a negative bottom margin equal to its bottom padding plus its border. Change one and change the other, and look in the screenshot that every character of the formula lines up.
- Under the formula, one panel per boxed term, in the same left-to-right order. Each panel starts with the name of its term as a title, larger than its lines, then one or two short lines on what the term does. A line joins term and panel, straight down or in right angles, never diagonal.
- A long formula gets a smaller size inline on `.eq` (the check names it, not under 36px). A formula that needs fractions, sums or matrices is cropped from the paper as a picture and centered the same way.

**Bullets**

- A text block that says one thing is one sentence or one short paragraph, without any bullet or dash (a `<p>` in the `.txt`). Before using bullets, try to merge short lines into one sentence. Bullets are only for two or more separate points; `check_layout.js` reports a list of one bullet.
- Bullet levels follow the logic. Parallel points are level one and equal. A line that follows from or answers its parent (cause → effect, gap → our fix) is a "→" line under it with no bullet (`<p class="ex">→ …</p>`). A detail that says nothing by itself is merged with its parent into one sentence. Level two is for details or examples that stand as lines of their own. Check this on every slide, not only the one the user named.
- Both levels use the same solid marker at the same size. Only the indent differs.
- Do not put every line on level one. That is a paragraph cut into lines, not a list.
- Level one may be just a bold lead-in such as "**Result**", with the content on level two.
- When each point is a name plus one sentence, the name is a bold item and the sentence follows as an explanation paragraph (`.ex`) that starts under the item's text, without a marker of its own.
- Level one is numbered (1. 2. 3.) when its lines are steps in order, the parts of a figure in the order they are explained, or a ranking. Everything else uses bullets, and level two always uses bullets. Do not number lines that have no order. A block that has numbered lines gets class `num` on its `.txt`, so that bulleted and numbered lines start at the same position.

**Position and size**

- Text goes left or on top. Figures go right or below.
- Title: 72px, bold, one line. Section label above it: 40px.
- The goal line of the problem slide is the largest text in the body: 64px, bold, on one line if it can be.
- Text above, visual below. Every slide with text and a picture, chart, diagram or video puts all the text at the top and the visual under it, never beside it. This holds for drawn diagrams too, including any result or legend line: it joins the text at the top. `check_layout.js` reports a side-by-side slide (`SIDE BY SIDE`).
- Use the space, without waiting to be told. When one element shrinks (a cropped picture), its neighbour grows into the freed room at once. A text block with empty room takes a larger font size and wider line and paragraph spacing until the slide is filled; pictures and videos are as large as the slide allows, with no wide gap above or below them. A flow or a diagram alone on a slide takes most of the slide. Enlarge the text first; when a line's wording is what keeps it small, reword that line.
- Body text as large as fits: 36 to 60px. Tables 36 to 44px. Nothing under 27px (2.5% of the slide height) except the source line at 24px: the back row cannot read it.
- Flow boxes are tall, with text as large as fits (32 to 56px) and each step's name larger than its lines. Keep the lines in a box short so that the text can grow. Between two boxes sits a block arrow, not a typed "→". Above the flow stand one or two lines of text.
- Arrows are easy to see: connectors in a diagram are dark and 6px wide, never under 4px.
- Figures as large as they stay sharp: at most about 1.3× their native pixel size. A figure whose smallest text cannot be read from the back row is redrawn on the slide (section 3), or left out and replaced by text.
- Mark the important part of a figure with a ring (`.ring`, or `.ring.box` around a block) or a numbered badge (`.badge`), and say so in the source line when the slide has one.
  - A ring never crosses the figure's own text: panel titles, labels, legends, axis labels. Make it larger rather than tighter, with a clear margin around everything it encloses, and let it reach a little beyond the figure if it must.
  - When the gaps between the items of a figure are too narrow for a ring to pass without crossing text, add white space between the items in a copy of the figure, then ring the part. Change the layout only, never the data, and say so in the source line ("spacing widened by presenter").
  - When the part to mark includes a panel's title, ring the whole panel with its title inside.
- Figures cropped from the paper lose the paper's own panel letters and figure headings that mean nothing on the slide ("(b) Simulator architecture", "(c)", "(d)"), unless the text of the slide refers to them.
- An architecture or pipeline figure that is kept from the paper (legible from the back row, and all of it serving the slide) gets as much of the slide as it can: one short line of text above it, and the figure at the largest size that stays sharp. Otherwise it is redrawn as boxes and block arrows.
- A diagram that is explained in parts gets one slide per part: the same figure on every slide, with the part under discussion ringed. These slides are one topic continued, so they share a title and a running number.
- Tables: grid lines drawn, grey bold header, no zebra fill. To stress one row (this paper, the best result), give that row the highlight fill and, if it helps, red text; at most one row per table. Size the columns so the key column does not wrap. A short table gets class `roomy` so that it does not leave the slide half empty. In a cell, colour the whole cell (`em` on the `<td>`), not a phrase inside it: Claude Slides shows a cell in one colour, and only the PowerPoint export keeps a red phrase. In a cell with Chinese, Japanese or Korean text, break lines yourself with `<br>` where the cell is too narrow for one line, so that no office program chooses the break.
- Diagrams fill the space under the text: icons 160 to 220px, tall boxes with text of 44 to 52px, the lowest element ending near y 960. A diagram squeezed into a strip under the text reads as unfinished.
- A box that explains something (a panel, a step of a flow) starts with a title that is larger than its lines. Its text is centred like that of every box, and boxes in a row hold the same number of lines, so their titles start on one line.

**Canvas**

- 1920 × 1080. Content area: x 91 to 1829, y 221 to 990 (1738 × 769).
- Nothing may end below y 990. The source line, when there is one, sits at y 1030 in 24px.

## 6. Fill the slide

The usual failure is a short text block at a cautious size over a figure that is smaller than the slide allows. So size in this order and let the script choose the number.

1. **The layout is always text above, visual below** (`.stack`): all the text at the top, the figure, diagram or video under it at full width. Tables and flows are their own full-width blocks, under their lines of text. A tall figure is cropped to the panel the slide is about, or redrawn wider than tall, so that it can stand under the text. Never text left and figure right.
2. **Size the figure first, as large as allowed.** Width up to 1738, height is what the text leaves; shorten the text before you shrink the figure. Never beyond 1.3× native size. Always write the px width and height on both `.fig` and its `<img>`.
3. **Put all text of the slide in one `.txt` block** and set its size once, inline: `<div class="txt" style="font-size:44px">`. The lists inherit it. Do not set sizes on single lists. A flow of boxes works the same way: one size, inline on `.flow`.
4. **Run the check and apply what it prints:**
   ```bash
   node scripts/check_layout.js <deck_root> --shots <empty_temp_dir>
   ```
   - `GROW: set .txt font-size:NNpx` or `GROW: set .flow font-size:NNpx`: set exactly that size.
   - `GROW: set .eq font-size:NNpx` or `GROW: set .cols font-size:NNpx`: a formula, and the panels under it, as large as the slide allows. Set the size, run again, set the text size the next run names, and measure the connectors again with `--where`.
   - `GROW: the text fits at NNpx, but "word" would then stand alone…`: there is room for larger text and one line's wording is in the way. Reword that line so that it fits on one line or breaks evenly, then set the size. Do not leave the text small.
   - `TEXT TOO BIG` or `TEXT TOO LONG` or `OVERFLOW`: move detail to the notes or split the slide. Do not go below 36px to make it fit.
   - `FLOW TOO BIG` or `FLOW TOO LONG`: set the size it names, or shorten the lines in the boxes. A line in a box may wrap once at most.
   - `UNDERFILL`: the text is lost even at 60px. Go to step 5.
   - `UNDERUSED`: a table leaves the lower part of the slide empty, or a flow sits in a strip with empty bands above and below. Table: enlarge its text within the size limits, or put a `.txt` block above it that says what it compares. Flow: shorten the line the message names, so that the text of every box can grow.
   - `ARROW`: a typed arrow between boxes. Use the block arrow the message gives.
   - `FORMULA: … panel(s) … have no title` or `FORMULA: the outline … touches …`: give each panel the name of its term as its title, and give the boxed term back its room (patterns, "Formula").
   - `ORPHAN`: a line wraps for its last word alone. This is what enlarged text does to a layout. Set the size the message names if it names one. Otherwise give the line more width (widen the column of the table or the box) or shorten the wording. Do not leave it.
   - `FORMULA too wide`: set the size it names on `.eq`.
   - `OVERLAP`, `OFF THE SLIDE`, `OVERFLOW: text is wider than its box`: a block grew into its neighbour or out of its box. Give it room or make its text shorter or smaller.
   - `DIAGRAM`: a part lies outside its host, or the host holds more than 24 pinned parts. Enlarge the host, move the part, or split the diagram.
   - `LIST: a <br> inside a list item`: use an explanation paragraph (`.ex`) instead.
   - `SIDE BY SIDE`: text beside a picture, diagram or video. Put all the text at the top and the visual under it (`.stack`).
   - `BULLET`: a list of one bullet. Write it as a sentence: `<div class="txt"><p>…</p></div>`.
   - `BOXES`: the titles of the boxes in a row start at different heights, because their text is centred and they hold different numbers of lines. Give them the same number of lines: merge two short lines, or break one with `<br>`.
   - `LABEL`: a part's name with a letter or number in front ("A | …"). Name the part in plain words.
   - `SVG TEXT`: words typed inside an `<svg>`. Keep the drawing plain and write the words as real text over it.
   - `SMALL`: text under 27px, which the back row cannot read. Enlarge it or move it to the notes.
   - `INLINE`: something inside a line that Slides drops (`<sub>`, `<sup>`, a circled number in a sentence). Make it a block as the message says.
   - `TEXT ONLY`: too many slides without a visual. Give them one (section 3, "Every slide earns a visual").
   - `TEXT: the flow has no text above it` or `TEXT: the slide shows a visual with no line of text`: add one or two short lines above the visual that say what it shows.
   - `FORMULA: the text in the box … sits NNpx higher`: restore the negative bottom margin of `.term`.
   - `Note: first shown without an explanation`: abbreviations the audience meets with no explanation on the slide. Explain each in a few words where it first appears, unless every listener knows it.
   - `TITLE`, `NESTED`, `LIST outside .txt`, `NUMBERED`, `EMPHASIS`, `BOLD`, `LOGO`: fix the slide as the message says.
   - A line that starts with `~` is not a fault. It says what stops a block from growing, such as the longest line of a flow. Act on it when the slide still has empty space.

   To place connectors and labels, ask the script where things are: `--where ".term, .panel"` prints the box of every match (left, top, width, height, and the middle of its top and bottom edge) in slide coordinates. Connectors that are direct children of the slide use these numbers as they are; inside a `.host`, subtract the host's left and top.
   - `Note:` about titles that are a kind plus a number: name each slide by its topic.
5. **Rebalance an underfilled slide**, first option that applies:
   1. The figure can still grow within step 2: enlarge it, which narrows the text column and makes the text taller.
   2. Switch the layout: a short text over a wide figure usually fills better as a stack.
   3. Bring back one second-level detail from the notes that helps the audience read the figure. Never add filler.
   4. The message is complete as it is: accept it. One short statement at 60px over a large figure is a good slide.
6. Run again until it prints `Layout clean.` The target is a text block that fills 75 to 96% of its available height.
7. **Check last, every time.** Any later change (a size, a width, a word, a new slide, a fix the user asked for) can break a line or push a block. After the last change of all, run the check once more and look at the screenshots of that run. A deck is finished only when its final state has been checked, not an earlier one.

Slides draws `<x-connector>` itself; the script draws the same lines for its screenshots, so a diagram can be judged locally. The script renders with local fonts, which differ slightly from the deck's fonts, so it keeps a 4% margin and ignores gains under 4px. Pictures in `project/img/` are shown; uploaded pictures appear as empty boxes locally, which is expected. If Playwright is not available, say so, size by the rules above, and check the published deck by eye.

## 7. Workflow

1. Read the paper. Write one sentence per slide: "this slide says …". Reading only those sentences must tell the whole paper, and each must follow from the one before (section 2).
2. Extract figures: render pages with `pdftoppm -r 300`, crop each figure, and note its native pixel size for the 1.3× limit. For each figure decide whether it is kept or redrawn on the slide (section 3: can its smallest text be read from the back row, and does all of it serve the slide?). Crop away the paper's panel letters and figure headings unless the slide's text will refer to them. Upload them as the Slides type instructs, or save them in `project/img/` for PowerPoint output.
3. Create the deck as a Slides artifact or in a local folder (section 0). Write the index, `project/deck.css` (from `assets/deck.css`, themed) and the slides (from `references/patterns.md`), then publish.
4. Run `check_layout.js` and work through section 6 until clean.
5. Write the notes last, when the slides are final. Run `check_notes.py` and work through section 4 until no `E` remains. Copy the `start-by` column into the `[≤ m:ss]` markers.
6. Look at every screenshot yourself, slide by slide. The scripts cannot judge these, and they are what users send back:
   - Story: the titles and first lines, read in order, tell the paper. No slide comes out of nowhere. The kind of solution is not named before the slide that says why it is needed, and no abbreviation or score appears before it has been explained.
   - Method: the overview names every part in plain words, with the input as its first box, and the method slides follow in its order. Each says what goes in, what is computed, what comes out and what is simplified.
   - Titles: named by topic, no bare "Method ①", one line, and clear to a listener from outside the project. A number sits in a circle no taller than the capital letters beside it.
   - Alignment: lines of one level start at the same position whether they have a bullet or a number. Markers are one size, none hollow.
   - Space: nothing floats in an empty area, and no block has empty bands above and below it. Text beside a figure instead of above it, a picture with wide gaps above and below it, a table with half a slide under it, a flow or a row of boxes in a strip: enlarge it, and reword the line that stops it, before you accept it.
   - Arrows: every arrow is seen at a glance from the back of the room. Block arrows between the boxes of a flow, thick dark connectors in a diagram.
   - Boxes: the text of every box is centred, across and down, and the titles of boxes in a row start on one line.
   - Bullets: no list of one bullet, and no short lines that would read better as one sentence.
   - Figures from the paper: every word in them can be read from the back row, and nothing in them is beside the slide's point. Otherwise redraw.
   - Motion and metrics: what moves is shown moving, with a caption that says what to watch. No score appears before a picture has shown what it counts.
   - Goal: on the problem slide the goal line is the largest text in the body.
   - Tables: grid lines visible, at most one highlighted row, the key column not wrapped.
   - Figures: sharp. When a diagram is explained in parts, the part is ringed and the figure keeps its size and place from slide to slide.
   - Formulas: centered and easy to read on their own, with the text below, or above and below. The outline of a boxed term touches no character, and the boxed text stands on the same line as the rest. Every panel under the formula starts with the name of its term.
   - Rings: no ring crosses a word of the figure. A ringed panel has its title inside the ring.
   - Claims: read every result line against the paper. No verb stronger than the paper's, the configuration named, no table rows left out that go against the line.
   - Emphasis: at most three red phrases on a slide, bold only on sub-headings.
   - Layout: text is left or on top, figures right or below.
   - Visuals: almost every slide has one, it has a line or two of text above it, and it fills the space under the text. A diagram's arrows start and end on the boxes and icons they join.
   - Lines: no line ends in a single word, no table cell or box wraps for one word, nothing touches or covers its neighbour. Look hardest at the text you enlarged.
   - Shape: a slide that lists steps, cases or properties as sentences is redrawn as a flow, a diagram or a table.
7. If subagents are available, have two that have not seen your work review the deck.
   - The first checks it against the paper (numbers, figure numbers, claims) and against these rules. Reviewers make mistakes too: verify each finding in the paper before changing anything.
   - The second plays a listener in the last row with no background in the field. Give it only the slide pictures (the screenshots of `check_layout.js --shots`; no notes, no paper), and tell it to treat text under about 2.5% of the slide height (27px) as unreadable. It reports, slide by slide, what it could not see and what it could not understand: an unexplained term, symbol, score or abbreviation, a title that says nothing, a missing step in the story.
   - Fix what the second reviewer reports before delivering. Without subagents, do this pass yourself: look at each screenshot at a quarter of its size and read only what is still legible.
8. For PowerPoint or Google Slides, export with `export_pptx.js`, render the file with PowerPoint or LibreOffice and look at every slide (section 0). This look is required, not optional: fix what wraps or overlaps there and export again.
9. When the user asks for changes to a finished deck:
   - Edit only what the user named. Keep the sentences they did not mention word for word.
   - When you apply one of their rules elsewhere in the deck, say which other slides changed, so they can undo it.
   - After every change, render the slide and check it before reporting: no overflow off the slide, no single orphan word on its own line (reword or shorten), no text overlapping a picture or video, nothing cut off at the bottom.
9. Whatever you changed in steps 6 to 8, finish with section 6 step 7: one more run of `check_layout.js` and one more look at its screenshots.
10. Deliver in one sentence, plus the inputs that are still missing (date, presenter) and, when the deck has placeholders, the list of pictures and videos the user has to supply (section 3).

## 8. Working with the user

- The user may edit slides directly. Before every publish, read the live version of each file you change and edit that, never an old local copy.
- If a publish is refused because the deck changed, reread the files it names, redo your change on the new version, and publish again.
- Feedback left as a comment on the deck is answered in that comment thread. In chat, one line.
- When feedback on one slide is really a deck-wide rule ("name the result slides", "make the text bigger"), apply it to every slide.
- Do not rewrite text the user typed onto a slide. If something there looks wrong, ask.
- A version without speaker notes (a file to hand out or submit): in a copy of the deck remove every `<aside>`, export PowerPoint with `--font "Arial"` (`--no-notes` leaves the notes out of the file without touching the deck), convert the file to PDF and look at the pages, and use the file name the user gave. Tell the user that a video shows only as its still image in these files.
