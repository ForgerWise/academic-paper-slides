---
name: academic-paper-slides
description: Turn an academic paper into presentation slides, as a Claude Slides artifact, an editable PowerPoint (.pptx) file or Google Slides. Short text plus a visual on every slide (figures, tables, formulas with named terms, diagrams drawn from boxes, icons and arrows), topic titles, plain white pages, text sized by a script to fill the slide, and speaker notes written to be read aloud. Use whenever the user wants slides to present or explain a paper, their own or someone else's.
---

# Academic paper slides

Turn one research paper into presentation slides that a listener can follow, and a script the presenter can read aloud.

**What a good deck looks like.** The model is a talk a careful researcher builds by hand: a short text at the top of each slide and, under it, something to look at that explains the text, such as a photo, the paper's figure, a chart with the key value marked, a table, a formula with its terms named, or a small diagram drawn from boxes, icons and arrows. Most slides have such a visual. A deck that is slide after slide of bullets has failed, however correct the bullets are.

**Output:** a Claude Slides artifact, an editable PowerPoint file, or Google Slides (section 1). This skill decides content, structure and look. Where it disagrees with the Slides artifact type's general design advice (accent slides, cards, statement slides, margins), this skill wins, because choosing it is the user's explicit instruction. The type's hard format limits always hold.

**How to use this file.** Sections 2 to 4 decide what the deck says, section 5 how it looks, section 6 the script. Section 7 is the sizing loop you run on every slide, section 8 the order of work, section 9 the review before delivery. Each rule stands in one place; the other sections point to it.

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

## 1. Choose the output

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

**PowerPoint sets text wider than the browser that measures it here**, most of all Japanese, Chinese and Korean text, and another machine (a Mac) sets it wider again, so a line that just fits in the check can wrap onto an extra line in the real file. Two things guard against it, and both are required:

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

## 2. Before you start

- Read the whole paper: convert the PDF to text and look at every page with a figure. Every number, figure number and section number on a slide is checked against the paper, never written from memory. For the presenter's own system, check formulas and credits against the code as well.
- Settle these inputs. Use the default when the user has not said, and list what was missing in one line when you deliver:
  - talk length (default 15 minutes)
  - output: Slides artifact, PowerPoint or Google Slides (default: section 1)
  - deck language (default: the language of the request) and notes language (default: same)
  - date, presenter name and affiliation (default: bracketed placeholders on the cover)
  - template or brand: logo, colors, font (default: the neutral theme in `deck.css`)
  - grading rubric or required sections (default: none)
  - whether the presenter is an author of the paper, and if so the only author ("my paper", "our paper" means author; default: not an author)
- With a rubric, follow its sections and order. Without one, use the structure below.

## 3. The story

The deck tells one connected story. A 15-minute talk is 15 to 17 slides; scale at about one slide per minute. Each slide follows from the one before it, in this order:

1. **Cover**
2. **Background**: the situation the problem comes from, as one plain message the whole audience accepts ("camera drones are expected to automate crop monitoring"), with one small visual. A busy background slide is not read. A concept the problem slide depends on (SfM, attention) is introduced here, so that it does not appear later out of nowhere.
3. **Problem**: what goes wrong in that situation. The last line is the goal, "→ Goal: …", bold and the largest text of the body, because it is the sentence the rest of the talk answers. The goal must follow from what the audience has seen so far. If background and problem are both short, put them on one slide.
4. **Preliminaries**: the terms and concepts the audience needs for the rest. Only if they are needed.
5. **Related work**: how others approached the problem, as one comparison table with the row for this paper highlighted.
6. **Method overview**: the approach on one slide, as a diagram of its parts and how they act on one another (UAV → airflow → plants).
   - The title says what the parts are ("Simulator Components", "Transformer Components"), not "Method".
   - Each part is named in plain words, with no letter or number in front ("A |" tells the audience nothing).
   - The list of parts is complete: every actor the audience expects is a part, even a simple one (a UAV simulator lists the UAV's flight model). Two things that work as one (a plant model and its response to the airflow) are one part.
   - The system's input is the first box of the diagram, with an arrow into the system ("Input: flight plan (height, speed, camera angle)"), not a separate line of text. No stray numbers or settings.
7. **Method details**: the parts in the order of the overview, one idea per slide. Every slide of a part carries that part's name as a small section label above its title.
   - For each part say how it works: what goes in, what is computed, what comes out, and what is simplified. A simple model is explained too. Say why it is built that way ("single leaves must move, so each stem, leaf and fruit is a part of its own").
   - Explain the idea and the behaviour, not the values (section 4, "Numbers").
   - The core method is in the body, not the appendix. The formula or model the system is built on gets its own slide (text above, formula, a panel per key term), right after the slide that shows what it produces.
   - Never fill a method slide with behaviour the audience already expects ("the downwash moves backwards in forward flight"). A pipeline or loop figure shows only what belongs to that slide's topic.
   - Why a tool, engine or platform was chosen: show what it is good at, with its logo next to the title and licensed promotional pictures below the text. Name known systems built on it, and verify that claim. State honestly what it lacks ("wind tools made for visual effects, not checked against real airflow") → what this work adds. Compare with named alternatives only on properties the slide can compare meaningfully. "Powerful and popular" is not a reason.
8. **Experiment setup**: data, environment, procedure and baselines, and the default settings the results rely on (flight speed, model size), stated once here. One or two lines of text and a flow of boxes under them, plus screenshots or photos of the environment when there are any.
9. **Results**: one result per slide, with its chart or table.
   - A comparison with prior methods goes in this order: the test object, then each prior method's simple pros and cons, then this method's pros and its limits, in plain words. Never claim "better in every situation" unless the paper shows it.
   - Their share of the talk follows the contribution: when the contribution is a system, the experiments are an "Example use" of two or three slides, and the rest goes to the appendix.
10. **Conclusion**: one line each for the background, the problem and the solution, then the findings. A finding is a relation the audience can reuse, not a list of values: "the more directly the flight's downwash hits the crops, the less accurate the 3D model". For a system paper the system comes first and the example use last.
11. **Appendix**: only if there is material for it.

Add strengths, critique, takeaways, a reviewer verdict or references only when the user or the rubric asks.

**Opening for a system paper.** When the contribution is a tool or a system (a simulator, a dataset, a platform), the goal is not stated on the problem slide. The opening first builds the need, one link per slide or per line:

1. the application is wanted;
2. but something goes wrong in it;
3. so the ways of working must be compared with that effect included, and doing it for real is costly or cannot be repeated;
4. so a tool of this kind "is needed" (the goal line stands here);
5. but existing tools leave the effect out (the related-work table);
6. so "we built it".

The kind of solution ("simulator") is not named on any slide before step 4. These slides are bullets, not boxes: large type, generous paragraph spacing, each link as a "→" line under the line it follows from (section 5, "Text").

**Story check.** Before building, write one sentence per slide and read them in order. Each must follow from the one before with a plain link ("so", "but", "to solve this", "to test this"); if a link is missing, reorder, merge or cut. The kind of solution is not named before the slide that says why it is needed. No abbreviation and no score appears before it has been explained.

## 4. What a slide says

**One slide, one thing.** Two things means two slides, or the minor one moves to the notes. Detail cut from a slide goes into its notes, not into smaller type.

**Titles**

- A title names the topic in a short phrase, at most five words, in title case: "Scaled Dot-Product Attention", "Training Cost". Never a sentence, a claim or a figure number. It fits on one line and stays clear of the page number.
- A listener from outside the project can tell from it what the slide is about: "Flight Plan Comparison", not the project's own label such as "Side Passes".
- The only slide of its kind takes the kind as its title ("Related Work", "Conclusion"). Slides of one kind about different things are each named by their own topic, not "Method 1", "Result 2".
- Put the kind in front only when the name alone would not tell the audience where they are in the talk: "Preliminary: Attention" in a talk whose method slides are also about attention.
- A slide that belongs to a part of the method gets that part's name as a section label above the title, with no letter in front: `<p class="sec">Attention</p>`.
- One topic that continues because it does not fit on one slide keeps its title and adds a circled number, written as a block beside the title (patterns, "Frame of a content slide"). Do not type the characters ① ②: fonts draw them at very different sizes.

**Words**

- Write only what carries information, but do not abbreviate until it is unreadable.
- Everyday words, not technical terms, unless the term is the point of the slide and is defined there: "each stem, leaf and fruit moves", not "rigid parts"; "wind pushes on", not "drag on"; "swings back and settles", not "damped spring". The paper's own name for a thing (a method, a dataset, a metric) is kept; in a deck that is not in the paper's language, give the original term once on first use. No metaphors that need decoding.
- Define a term or abbreviation (CFD, SfM, F-score) on the line where it is first needed, in a few words in parentheses: "ViT (an image model built from Transformer blocks)". Not on an earlier slide, not only in the notes, and not for common knowledge. `check_layout.js` lists abbreviations shown without an explanation. A measured quantity names its reference once: "height h above the canopy".
- Never assume context the audience lacks. A label names the action in full: "Fly beside the row, camera tilted toward it", not "Beside the row". The lead line says what the thing is ("three flights along a tomato row"). Parallel labels share one form (where the UAV flies / where the camera looks).
- One point per line. A line that packs several points ("also near the ground and in forward flight; not within 0.75 m of the rotors") is split into separate items, a strength and a limit apart, each pointing to the figure panel that shows it ("(b)", "grey in a").
- No cross-slide references such as "(p. 7)" or "see slide 4".
- Sibling slides use the same wording: when a phrase changes on one slide, change it on the slides of the same kind.

**Claims and numbers**

- Every number on a slide can be found in the paper. Mark invented example values "values are illustrative".
- Numbers: no fine numbers where the idea is the message. Method slides say how the model works and behaves ("tilts more under stronger wind", not "up to 70° at the top"; "correction factors fitted to CFD", not "three factors at 2, 4 and 6 m/s"). The conclusion states findings ("close to CFD", not "within 0.4–1.1 m/s"). Keep a number only when the number itself is the message and its meaning is obvious to an outsider; whoever wants the values reads the paper.
- Claims are never stronger than the paper's.
  - Use the paper's verb or a weaker one: "degrades", not "breaks"; "scores lower", not "fails".
  - A result line names exactly the configurations the paper says achieved it ("the big model", "in the semi-supervised setting"), not the method in general.
  - Do not say that two methods rank all cases the same, or that one setting is best, unless the paper says so. When you show only some rows of a table, keep the rows that go against the line above the table.
- Result slides state results. No judgement words such as "convincing", "reliable" or "should be discounted".
- On a slide with a figure, the text first says what the figure compares, then the result. Do not repeat what the figure already shows.
- Metrics: explain the mechanism the result depends on first ("3D model from photos: a point found in two photos gives its 3D position → the point must stay in place between the photos"), then make the metric visible with pictures of what counts as right, wrong and missed, side by side in three colours, and state the result as a plain share ("of the whole true plant surface, 36% is rebuilt within 2 cm with downwash off, 14% with it on"). A score with no such slide before it is not shown. Score tables go to the appendix or nowhere.
- If a critique or verdict is requested: each criticism names the problem and its evidence (figure number, number). Say whether a concern is a limit of the method or a flaw in the experiment design. Suggest fixes only if asked.

**Every slide earns a visual.** Before you write a list, ask what the content looks like, and show that:

| The content is | Show |
|---|---|
| what a thing is or looks like | a photo or the paper's figure, with a caption |
| steps or a pipeline | a flow of boxes with block arrows |
| how an idea works | a small diagram from boxes, icons and arrows, carrying ONE concrete example through it (a query word, three scores, the weights they turn into, the output) |
| the same properties of several things | a table |
| a formula | the formula itself, its key terms boxed, a panel under each (section 5, "Formulas") |
| a result | the paper's chart or table, with the key value written on it in red |
| a metric | pictures of right, wrong and missed, before any number |
| something that moves | a short looping GIF or video, with a caption that says what to watch; never a still with an outline around the moving part |
| several clips to compare | one large video that plays the cases in sequence, each introduced by a title card (its name over the dimmed first frame for about 1.5 s) and labelled in a corner while it plays; not small GIFs side by side. Cut from the highest-resolution source and crop away labels in another language |
| two areas of one picture | each area outlined in its own colour, the words that name it in the same colour |
| one line of reasoning | bullets with "→" lines, never two side-by-side panels with a conclusion under them: listeners read that as a comparison and lose the "therefore" |

- Every visual has text above it: one sentence, or two to four short lines, that say what to look for. A slide is never a title and a flow, or a title and a diagram, alone.
- Text-only slides are for the conclusion and little else: `check_layout.js` lists them, and fails the deck when more than a third of its slides have no visual.

**Figures and pictures**

- A figure made for the paper is not automatically a slide figure: a paper figure is read from 30 cm for minutes, a slide from the back row in under a minute. Keep it when it is itself the evidence (photo, rendered frame, validation plot), its smallest text can be read from the back row, and all of it serves the slide. Otherwise redraw it on the slide:
  - an architecture or pipeline figure as boxes and block arrows, with only this slide's steps and the overview's names;
  - a chart with many bars as the two or three the slide discusses, labels at 36px or more; the full chart goes to the appendix.
- A kept figure is cropped to the panel the slide is about. Remove the paper's panel letters and headings ("(b) Simulator architecture") unless the slide's text refers to them, remove rings and marks the slide no longer needs, and add the labels the crop lost ("air" on the arrows).
- Diagrams are drawn on the slide, not pasted as a picture, so the presenter can edit them: white boxes with a thin outline, dark arrows thick enough to see from the back row, black line icons from `assets/icons/`, a few words per box, red for the one value or word that matters. No fills, no shadows, no gradients.
- Pictures from outside the paper. When a picture the paper does not have would make a slide clearer (the device, the place, the scene of the problem), look on the web for one that may be reused: public domain or CC0, CC BY or CC BY-SA (Wikimedia Commons, Openverse, agencies such as NASA), or a site whose license allows reuse (Unsplash, Pexels). Read the license on the picture's own page (do not use a picture whose license you cannot find), credit it in the source line ("Photo: Author, CC BY 4.0, via Wikimedia Commons"), and never use a picture that only decorates. If nothing reusable turns up, build the slide without it and say so when you deliver.
- Pictures only the presenter can supply (a demonstration of the system, a screenshot of results): leave a sized placeholder on the slide (patterns, "Placeholder"; for something that moves, one that asks for a looping GIF or video) and, when you deliver, give the user a plain-text list with one item per slide: what the picture must show, the viewpoint, the length for a video, the format and size, and whether it is required or optional. A demonstration shot under settings other than the paper's experiments says so in its caption: "0.5 m above the canopy (demonstration)".

**Sources and credit**

- Someone else's paper: every content slide ends with a source line (`.cite`): "Source: Author et al., Venue Year, Sec. 3" or "Figure: Author et al., Venue Year, Fig. 4; orange ring added by presenter". A table you compiled says "Table compiled by presenter"; a diagram or example you made up says "diagram drawn by presenter", "example values chosen by presenter".
- Your own paper (the presenter is an author): its text, figures, tables and results carry no source line. A source line appears only on a slide that shows something from elsewhere: another paper's method, result or figure, a statistic, a picture from the web, or a formula, model or constant your paper takes from another work.
- Credit precisely, and check it against the code or the paper before citing. Textbook pieces cite the textbook. The presenter's own combination of them carries no citation. Prior work used only as a baseline is cited on the comparison slide, never as the source of the presenter's model.
- A citation for a prior method shown on the slide goes in a small multi-line block in a corner (`.cite.corner`), kept apart from the figure, so that it is not read as the figure's source.
- Several sources on one slide: mark each claim with [1], [2] in the line and list them in the source block at the bottom, one per line, shortened to authors, title, venue and year ("cite two", "cite three" in patterns).

## 5. Layout and look

**Canvas and layout**

- 1920 × 1080. Content area: x 91 to 1829, y 221 to 990 (1738 × 769). Nothing may end below y 990. The source line, when there is one, sits at y 1030 in 24px.
- Text above, visual below. Every slide with text and a picture, chart, diagram or video puts all the text at the top and the visual under it, never beside it. This holds for drawn diagrams too: a result or legend line joins the text at the top. `check_layout.js` reports a side-by-side slide (`SIDE BY SIDE`).
- Use the space, without waiting to be told. Pictures, videos and diagrams are as large as the slide allows, with no wide gap above or below them; text takes a larger size and wider line and paragraph spacing until the slide is filled. When one element shrinks (a cropped picture), its neighbour grows into the freed room at once. Section 7 is the procedure.
- Sibling slides look alike. Slides of the same kind in one section (hover and forward flight, encoder and decoder) use the same body text size, the same text width and the same picture width, so the audience sees no jump when paging. Take the smaller of the sizes the check allows and set it on all of them.

**Text**

- Sizes: title 72px, bold, one line; section label 40px; body 36 to 60px, as large as fits; the goal line 64px, bold; tables 36 to 44px; text in flow boxes 32 to 56px. Nothing under 27px (2.5% of the slide height) except the source line at 24px: the back row cannot read it.
- A text block that says one thing is one sentence or one short paragraph, without any bullet or dash (a `<p>` in the `.txt`). Before using bullets, try to merge short lines into one sentence. Bullets are for two or more separate points.
- Bullet levels follow the logic. Check this on every slide, not only the one the user named.
  - Parallel points are level one and equal.
  - A line that follows from or answers its parent (cause → effect, gap → our fix) is a "→" line under it with no bullet: `<p class="ex">→ …</p>`.
  - A detail that says nothing by itself is merged with its parent into one sentence. Level two is for details and examples that stand as lines of their own.
  - When each point is a name plus one sentence, the name is a bold item and the sentence follows as an explanation paragraph (`.ex`) without a marker. Level one may be just a bold lead-in such as "**Result**", with the content on level two.
- Both levels use the same solid marker at the same size; only the indent differs. Level one is numbered (1. 2. 3.) only when its lines are steps in order, the parts of a figure in the order they are explained, or a ranking; level two always uses bullets. A block with numbered lines gets class `num` on its `.txt`, so that bulleted and numbered lines start at the same position.
- Slides keeps only colour, bold, italic and underline on words inside a line. Anything that needs its own size, border or position is a block of its own: no `<sub>`, `<sup>`, badges or pills inside a sentence (`INLINE`).

**Colour and emphasis**

- White background, near-black text. The accent color for the title bar and the outlines of diagram boxes and panels, dark grey for arrows, red for emphasis. Nothing else.
- Theme = the variables at the top of `deck.css`: `--ink`, `--accent`, `--line`, `--hl`, `--head`, `--mark`, `--em`. With a user template or brand, set `--accent` to its theme color, so the titles and boxes match the template, set the font, and add the logo (see patterns). Without one, keep the neutral defaults. Do not add colors.
- Bold is for sub-headings inside the body: a level-one lead-in ("**Result**", "**Why waves**"), the goal line, table headers, the title of a box or panel. Do not bold words inside a sentence.
- Red (`<span class="em">`) marks the key terms and key numbers: the two things being contrasted, the result to remember, the value a diagram arrives at. At most three on a slide, a few words each, never a whole sentence, never in a title.

**Boxes, flows and diagrams**

- Boxes are for diagrams: nodes, panels, flow steps, a boxed term of a formula. They are white with an outline, never filled. Ordinary text is never put in a box or a card to decorate it.
- Text inside every box is centred, across and down; the stylesheet does it. The one exception is a bulleted list inside a panel, which is left-aligned. A box that explains something starts with a title larger than its lines, and boxes in one row hold the same number of lines, so that their titles start on one line (`BOXES`).
- Nested boxes share one corner radius. A rounded rectangle's radius scales with its shorter side in PowerPoint, so a large frame and the small boxes inside it look different unless every shape gets one absolute radius (adj = radius ÷ shorter side). The stylesheet gives nodes, panels and flow boxes the same radius in px and `export_pptx.js` writes it per shape; do not frame boxes with `<x-shape kind="rounded">`, whose radius scales. Check every frame-in-frame diagram in the exported file.
- A flow of steps: tall boxes that take the rest of the slide under their one or two lines of text, each step's name larger than its lines, short lines so that the text can grow, and a block arrow between two boxes, never a typed "→".
- Diagrams fill the space under the text: icons 160 to 220px, tall boxes with text of 44 to 52px, the lowest element ending near y 960. A diagram squeezed into a strip reads as unfinished. Connectors are dark and 6px wide, never under 4px, and start and end on the boxes and icons they join.
- Rows of pictures with arrows between them: spread the row to the slide edges (`.row.spread`) and leave clear space on both sides of each arrow, since text and shapes render wider on another machine. Every arrow, icon and box of the row sits on one centre line, the middle of the pictures.
- A diagram that is explained in parts gets one slide per part: the same figure in the same place on every slide, with the part under discussion ringed. These slides share a title and a running number.
- Marks on a figure: a ring (`.ring`, or `.ring.box` around a block) or a numbered badge (`.badge`), named in the source line when the slide has one.
  - A ring never crosses the figure's own text: panel titles, labels, legends, axis labels. Make it larger rather than tighter, and let it reach a little beyond the figure if it must. When the part to mark includes a panel's title, ring the whole panel with its title inside.
  - When the gaps between the items of a figure are too narrow for a ring, add white space between the items in a copy of the figure, then ring the part. Change the layout only, never the data, and say so in the source line ("spacing widened by presenter").
- Figures are as large as they stay sharp: at most about 1.3× their native pixel size.

**Formulas**

- One formula per slide, centered across the slide, on one line, with text above it. It must match the implementation (check the code, not only the paper), and its symbols are named in the slide's language.
- It reads well as a formula first: a row of pieces (`.eq`, patterns "Formula") with a clear gap between them and real subscripts and superscripts; the parts the slide does not discuss can be grey. It is as large as the slide allows, often 80px or more, and the panels under it are large too: `check_layout.js` prints both sizes (`GROW: set .eq`, `GROW: set .cols`), and the text block takes what is left.
- The terms the slide discusses are boxed, three at most. A box is centred on its letters, has room inside and a gap outside, and its outline never touches a character. The boxed text sits on the same baseline as the pieces outside it: `.term` offsets its padding and border with a negative bottom margin; change one and change the other.
- Under the formula, one panel per boxed term, in the same left-to-right order, joined to its term by a line that runs straight down or in right angles, never diagonally. A panel gives the term's name as its title, its expression or one or two short lines on what it does, and its symbols as a short bulleted list, left-aligned inside the box (never centred bullets).
- A long formula gets a smaller size inline on `.eq` (the check names it, not under 36px). A formula that needs fractions, sums or matrices is cropped from the paper as a picture and centered the same way.

**Tables**

- Grid lines drawn, grey bold header, no zebra fill. To stress one row (this paper, the best result), give that row the highlight fill and, if it helps, red text; at most one row per table. Size the columns so the key column does not wrap. A short table gets class `roomy` so that it does not leave the slide half empty.
- In a cell, colour the whole cell (`em` on the `<td>`), not a phrase inside it: Claude Slides shows a cell in one colour, and only the PowerPoint export keeps a red phrase. In a cell with Chinese, Japanese or Korean text, break lines yourself with `<br>` where the cell is too narrow for one line, so that no office program chooses the break.

## 6. Speaker notes

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

## 7. Size every slide with the script

The usual failure is a short text block at a cautious size over a visual that is smaller than the slide allows. Size in this order and let the script choose the numbers.

1. **Build the slide as text above, visual below** (`.stack`, or the text block followed by a table, flow, formula or diagram at full width). A tall figure is cropped to the panel the slide is about, or redrawn wider than tall, so that it can stand under the text.
2. **Size the visual first, as large as allowed.** Width up to 1738, height what the text leaves; shorten the text before you shrink the visual. Never beyond 1.3× native size. Write the px width and height on both `.fig` and its `<img>`.
3. **Put all text of the slide in one `.txt` block** and set its size once, inline: `<div class="txt" style="font-size:44px">`. A flow, a formula and its panels work the same way: one size, inline on `.flow`, `.eq`, `.cols`.
4. **Run the check and apply what it prints**, then run again until it prints `Layout clean.`
   ```bash
   node scripts/check_layout.js <deck_root> --shots <empty_temp_dir>
   ```
5. **Check last, every time.** Any later change (a size, a width, a word, a new slide, a fix the user asked for) can break a line or push a block. A deck is finished only when its final state has been checked and its screenshots looked at.

What the messages ask for:

| Message | Do this |
|---|---|
| `GROW: set .txt / .flow / .eq / .cols font-size:NNpx` | Set exactly that size. After `.eq` or `.cols`, run again, set the text size the next run names, and measure the connectors again (`--where`). |
| `GROW: … but "word" would then stand alone` | There is room for larger text and one line's wording is in the way. Reword that line so that it fits on one line or breaks evenly, then set the size. |
| `TEXT TOO BIG`, `TEXT TOO LONG`, `OVERFLOW` | Move detail to the notes or split the slide. Do not go below 36px. |
| `FLOW TOO BIG`, `FLOW TOO LONG` | Set the size it names, or shorten the lines in the boxes. A line in a box wraps once at most. |
| `UNDERFILL` | The text is lost even at 60px. Enlarge the visual; or bring back one detail from the notes that helps the audience read it, never filler; or accept it: one short statement at 60px over a large visual is a good slide. |
| `UNDERUSED` | A table leaves the lower part of the slide empty, or the text in a flow is small for its boxes. Enlarge the table's text or put a `.txt` above it; shorten the line of the flow the message names. |
| `ORPHAN` | A line wraps for its last word alone. Set the size the message names, widen the column or the box, or shorten the wording. Do not leave it. |
| `OVERLAP`, `OFF THE SLIDE`, `OVERFLOW: text is wider than its box` | A block grew into its neighbour or out of its box. Give it room or make its text shorter or smaller. |
| `SIDE BY SIDE` | Text beside a visual. Put all the text at the top and the visual under it. |
| `TEXT: … no text above it`, `TEXT ONLY` | Add the line or two above the visual; give text-only slides a visual (section 4). |
| `BULLET` | A list of one bullet. Write it as a sentence: `<div class="txt"><p>…</p></div>`. |
| `LIST: a <br> inside a list item` | Use an explanation paragraph (`.ex`) instead. |
| `BOXES` | Titles of boxes in a row start at different heights. Give the boxes the same number of lines: merge two short lines, or break one with `<br>`. |
| `LABEL` | A part's name with a letter or number in front ("A | …"). Name the part in plain words. |
| `ARROW` | A typed arrow between boxes. Use the block arrow the message gives. |
| `DIAGRAM` | A part lies outside its host, or the host holds more than 24 pinned parts. Enlarge the host, move the part, or split the diagram. |
| `FORMULA …` | Too wide: set the size it names on `.eq`. Panel without a title, outline touching a character, boxed text higher than the rest: restore what the message names (patterns, "Formula"). |
| `SVG TEXT` | Words typed inside an `<svg>`. Keep the drawing plain and write the words as real text over it. |
| `SMALL` | Text under 27px. Enlarge it or move it to the notes. |
| `INLINE` | Something inside a line that Slides drops (`<sub>`, a circled number in a sentence). Make it a block as the message says. |
| `TITLE`, `NESTED`, `LIST outside .txt`, `NUMBERED`, `EMPHASIS`, `BOLD`, `LOGO` | Fix the slide as the message says. |
| `Note: first shown without an explanation` | Explain each abbreviation in a few words where it first appears, unless every listener knows it. |
| `Note:` about titles that are a kind plus a number | Name each slide by its topic. |
| a line that starts with `~` | Not a fault: it says what stops a block from growing. Act on it when the slide still has empty space. |

To place connectors and labels, ask the script where things are: `--where ".term, .panel"` prints the box of every match (left, top, width, height, and the middle of its top and bottom edge) in slide coordinates. Connectors that are direct children of the slide use these numbers as they are; inside a `.host`, subtract the host's left and top.

Slides draws `<x-connector>` itself; the script draws the same lines for its screenshots, so a diagram can be judged locally. The script renders with local fonts, which differ slightly from the deck's fonts, so it keeps a 4% margin and ignores gains under 4px. Pictures in `project/img/` are shown; uploaded pictures appear as empty boxes locally, which is expected. If Playwright is not available, say so, size by the rules above, and check the published deck by eye.

## 8. Workflow

1. Read the paper and settle the inputs (section 2). Write one sentence per slide and run the story check (section 3).
2. Extract figures: render pages with `pdftoppm -r 300`, crop each figure, and note its native pixel size for the 1.3× limit. Decide for each whether it is kept or redrawn (section 4, "Figures and pictures"). Upload them as the Slides type instructs, or save them in `project/img/` for PowerPoint output.
3. Create the deck as a Slides artifact or in a local folder (section 1). Write the index, `project/deck.css` (from `assets/deck.css`, themed) and the slides (from `references/patterns.md`), then publish.
4. Size every slide (section 7) until the layout is clean.
5. Write the notes last, when the slides are final. Run `check_notes.py` and work through section 6 until no `E` remains. Copy the `start-by` column into the `[≤ m:ss]` markers.
6. Review (section 9) and fix what it finds.
7. For PowerPoint or Google Slides, export with `export_pptx.js`, render the file with PowerPoint or LibreOffice and look at every slide (section 1). This look is required: fix what wraps or overlaps there and export again.
8. Whatever you changed in steps 6 and 7, run `check_layout.js` once more and look at its screenshots (section 7, step 5).
9. Deliver in one sentence, plus the inputs that are still missing (date, presenter) and, when the deck has placeholders, the list of pictures and videos the user has to supply.

## 9. Review before delivery

Look at every screenshot yourself, slide by slide. The scripts cannot judge these, and they are what users send back.

- **Story**: the titles and first lines, read in order, tell the paper. No slide, term, abbreviation or score comes out of nowhere. The method slides follow the overview's order, and the core formula or model is in the body.
- **Words**: titles and labels are clear to a listener from outside the project; everyday words; one point per line; no fine numbers where the idea is the message; the conclusion states relations.
- **Claims and credit**: read every result line against the paper: no verb stronger than the paper's, the configuration named, no rows left out that go against the line. Every citation names the right source for that piece.
- **Layout**: text above, visual below, on every slide. Nothing floats in an empty area: no picture with wide gaps around it, no table with half a slide under it, no flow or diagram in a strip. Sibling slides have the same text size and picture width.
- **Text**: no list of one bullet, "→" lines where a line follows from its parent, lines of one level starting at the same position, no line ending in a single word, at most three red phrases, bold only on sub-headings. Look hardest at the text you enlarged.
- **Visuals**: almost every slide has one, with a line or two of text above it. Figures are sharp and every word in them can be read from the back row; otherwise redraw. What moves is shown moving. No score before a picture has shown what it counts.
- **Boxes and arrows**: text centred in every box, titles of a row on one line, one corner radius in nested boxes, arrows seen at a glance, every arrow, icon and box of a row on one centre line, with clear space beside each arrow.
- **Formulas**: centered, large, matching the code, boxes centred on their letters and touching no character, every panel titled with its term.
- **Tables and rings**: grid lines visible, at most one highlighted row, the key column not wrapped; no ring crosses a word of the figure.

If subagents are available, have two that have not seen your work review the deck.

- The first checks it against the paper (numbers, figure numbers, claims, credits) and against these rules. Reviewers make mistakes too: verify each finding in the paper before changing anything.
- The second plays a listener in the last row with no background in the field. Give it only the slide pictures (the screenshots of `check_layout.js --shots`; no notes, no paper), and tell it to treat text under about 2.5% of the slide height (27px) as unreadable. It reports, slide by slide, what it could not see and what it could not understand: an unexplained term, symbol, score or abbreviation, a title that says nothing, a missing step in the story.
- Fix what the second reviewer reports before delivering. Without subagents, do this pass yourself: look at each screenshot at a quarter of its size and read only what is still legible.

## 10. Working with the user

- The user may edit slides directly. Before every publish, read the live version of each file you change and edit that, never an old local copy. If a publish is refused because the deck changed, reread the files it names, redo your change on the new version, and publish again.
- Edit only what the user named. Keep the sentences they did not mention word for word, and do not rewrite text the user typed onto a slide; if something there looks wrong, ask.
- When feedback on one slide is really a deck-wide rule ("name the result slides", "make the text bigger", a change of wording), apply it to the sibling slides too, and say which other slides changed, so the user can undo it.
- After every change, render the slide and check it before reporting: no overflow off the slide, no single word alone on a line, no text overlapping a picture or video, nothing cut off at the bottom.
- Feedback left as a comment on the deck is answered in that comment thread. In chat, one line.
- A version without speaker notes (a file to hand out or submit): in a copy of the deck remove every `<aside>`, export PowerPoint with `--font "Arial"` (`--no-notes` leaves the notes out of the file without touching the deck), convert the file to PDF and look at the pages, and use the file name the user gave. Tell the user that a video shows only as its still image in these files.
