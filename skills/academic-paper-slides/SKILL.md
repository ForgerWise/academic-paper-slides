---
name: academic-paper-slides
description: Turn an academic paper into presentation slides, as a Claude Slides artifact, an editable PowerPoint (.pptx) file or Google Slides. Short text plus a visual on every slide (figures, tables, formulas with named terms, diagrams drawn from boxes, icons and arrows), topic titles, plain white pages, text sized by a script to fill the slide, and speaker notes written to be read aloud. Use whenever the user wants slides to present or explain a paper, their own or someone else's.
---

# Academic paper slides

Turn one research paper into presentation slides that a listener can follow, and a script the presenter can read aloud.

**What a good deck looks like.** The model is a talk a careful researcher builds by hand: a short text at the top of each slide and, under or beside it, something to look at that explains the text, such as a photo, the paper's figure, a chart with the key value marked, a table, a formula with its terms named, or a small diagram drawn from boxes, icons and arrows. Most slides have such a visual. A deck that is slide after slide of bullets has failed, however correct the bullets are.

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
  node scripts/export_pptx.js <deck_root> <name>.pptx
  ```
  The result is editable, not pictures of slides: each `.txt` block is one text box with real two-level bullets, tables are PowerPoint tables, flow boxes, the boxes and arrows of a diagram, rings and circled numbers are shapes, the notes are speaker notes.
- **Google Slides**: export the PowerPoint file as above. If a Google Drive tool that can convert on upload is connected, upload it as a Google Slides presentation and give the link. Otherwise deliver the .pptx and tell the user to upload it to Drive and open it with Google Slides.

For PowerPoint and Google Slides, set the font in `deck.css` to one that exists where the file will be opened, because a substituted font changes the line breaks: Arial for Latin text; for Chinese, Japanese or Korean, a Noto Sans family for Google Slides, or ask which system the user presents on. If LibreOffice is available, convert the .pptx to PDF and look at the pages before delivering.

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
2. Background: the situation the problem comes from
3. Problem: what goes wrong in that situation. The last line is the goal, "→ Goal: …", bold and larger than every other line of the body, because it is the sentence the rest of the talk answers. If the background and the problem are both short, put them on one slide.
4. Preliminaries: the terms and concepts the audience needs for the rest. Only if they are needed.
5. Related work: how others approached the problem, as one comparison table with the row for this paper highlighted
6. Method overview: the approach on one slide, as a diagram of its parts. When the method has two or three named parts, letter them here ("A | Encoder and decoder stacks", "B | Attention")
7. Method details: one idea per slide, with the figure, demonstration or formula that shows it. Every slide of a lettered part carries that part's name as a small section label above its title, so the audience always knows which part they are in
8. Experiment setup: data, environment, procedure and baselines. A flow of boxes (① → ② → ③ → ④), plus screenshots or photos of the environment when there are any
9. Results: one result per slide, with its chart or table
10. Conclusion: one line each for the background, the problem and the solution, then the results with their key numbers
11. Appendix: only if there is material for it

Test the chain before building: read your one-sentence summaries of the slides in order. Each must follow from the one before with a plain link ("so", "but", "to solve this", "to test this"). If a link is missing, reorder, merge or cut until it is there.

Slides of one kind are titled by their topic, not by a running number (section 3).

Add strengths, critique, takeaways, a reviewer verdict or references only when the user or the rubric asks.

A 15-minute talk is 15 to 17 slides. Scale with the talk length at about one slide per minute.

## 3. Content rules

- One slide says one thing. Two things means two slides, or the minor one moves to the notes.
- Titles name the topic of the slide in a short phrase, at most five words, in title case: "Scaled Dot-Product Attention", "Training Cost". Never a sentence, a claim or a figure number. The title must fit on one line and stay clear of the page number.
  - The only slide of its kind takes the kind as its title: "Related Work", "Conclusion".
  - Slides of one kind about different things are each named by their own topic, not "Method 1", "Result 2".
  - Put the kind in front only when the name alone would not tell the audience where they are in the talk: "Preliminary: Attention" in a talk whose method slides are also about attention.
  - A slide that belongs to a lettered part of the method gets a section label above the title: `<p class="sec">B | Attention</p>`.
  - One topic that continues because it does not fit on one slide keeps its title and adds a circled number, written as a block beside the title (patterns, "Frame of a content slide"). Do not type the characters ① ②: fonts draw them at very different sizes.
- Write only what carries information, but do not abbreviate until it is unreadable.
- Define a term on the line where it is first needed, in a few words in parentheses, for example "ViT (an image model built from Transformer blocks)". Do not spend an earlier slide on it, and do not explain common knowledge.
- Use the paper's own terms. In a deck that is not in the paper's language, give the original term once on first use. No metaphors.
- On a slide with a figure, the text first says what the figure compares, then the result. Do not repeat what the figure already shows.
- Result slides state results. No judgement words such as "convincing", "reliable" or "should be discounted".
- If a critique or verdict is requested: each criticism names the problem and its evidence (figure number, number). Say whether a concern is a limit of the method or a flaw in the experiment design. Suggest fixes only if asked.
- No cross-slide references such as "(p. 7)" or "see slide 4".
- Every number on a slide can be found in the paper. Mark invented example values "values are illustrative".
- Detail cut from a slide goes into its notes, not into smaller type.
- Every slide earns a visual. Before you write a list, ask what the content looks like, and show that:
  - what a thing is or looks like → a photo or the paper's figure, with a caption
  - steps or a pipeline (input → model → output, train → test) → a flow of boxes, or boxes joined by arrows
  - how an idea works → a small diagram from boxes, icons and arrows, carrying ONE concrete example through it (a query word, three scores, the weights they turn into, the output). A worked number explains a method faster than any sentence
  - the same properties of several things → a table
  - a formula → the formula itself, the terms the slide is about boxed, each with its name and a panel below that says what it is
  - a result → the paper's chart or table, with the key value written on it in red
  - two areas of one picture → outline each area in its own colour and write the words that name it in the same colour

  The text above the visual is two to four short lines that say what to look for. A numbered list is for content that has no such shape. Text-only slides are for the conclusion and little else: `check_layout.js` lists them, and fails the deck when more than a third of its slides have no visual.
- Diagrams are drawn on the slide, not pasted as a picture, so the presenter can edit them: white boxes with a thin outline, grey arrows, black line icons from `assets/icons/`, a few words per box, red for the one value or word that matters. No fills, no shadows, no gradients. A diagram or example you made up to explain the paper says so in the source line ("diagram drawn by presenter", "example values chosen by presenter").
- Pictures from outside the paper. When a picture the paper does not have would make a slide clearer (a photo of the device or the place, the scene of the problem), look on the web for one that may be reused: public domain or CC0, CC BY or CC BY-SA (Wikimedia Commons, Openverse, agencies such as NASA), or a site whose license allows reuse (Unsplash, Pexels). Read the license on the picture's own page, not in a search result, and credit the picture in the source line: "Photo: Author, CC BY 4.0, via Wikimedia Commons". Do not use a picture whose license you cannot find, and never one that only decorates. If nothing reusable turns up, build the slide without it and say so when you deliver.
- Sources.
  - Someone else's paper: every content slide ends with a source line (`.cite`): "Source: Author et al., Venue Year, Sec. 3" or "Figure: Author et al., Venue Year, Fig. 4; orange ring added by presenter". A table you compiled says "Table compiled by presenter".
  - Several sources on one slide: mark each claim with [1], [2] in the line and list them in the source block at the bottom, one per line, shortened to authors, title, venue and year ("cite two", "cite three" in patterns).
  - Your own paper (the presenter is an author): its text, figures, tables and results carry no source line and no citation. The cover already says whose work it is. A source line appears only on a slide that shows something from elsewhere: another paper's method, result or figure, a statistic, a picture from the web.

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
- Notes are plain text, at most 4,000 characters per slide.

Then run the check and fix every `E` line. Read every `W` line and fix it unless it is a false alarm:

```bash
python3 scripts/check_notes.py <deck_root> --minutes 15
```

Add `--own` when the presenter is an author. The script catches mechanics. It cannot judge tests 2 and 3, so reread each script once as a listener with eyes closed.

## 5. Look

**Color and boxes**

- White background, near-black text. The accent color for the title bar and the outlines of diagram boxes and panels, grey for arrows, red for emphasis. Nothing else.
- Theme = the variables at the top of `deck.css`: `--ink`, `--accent`, `--line`, `--hl`, `--head`, `--mark`, `--em`. With a user template or brand, set `--accent` to its theme color, so the titles and boxes match the template, set the font, and add the logo (see patterns). Without one, keep the neutral defaults. Do not add colors.
- Boxes are for diagrams: nodes, panels, flow steps, a boxed term of a formula. They are white with an outline, never filled. Ordinary text is never put in a box or a card to decorate it.
- Slides keeps only colour, bold, italic and underline on words inside a line. Anything that needs its own size, border or position is a block of its own: no `<sub>`, `<sup>`, badges or pills inside a sentence. `check_layout.js` reports these as `INLINE`.

**Emphasis**

Use both kinds sparingly. A slide where everything is stressed stresses nothing.

- Bold is for sub-headings inside the body: a level-one lead-in ("**Result**", "**Why waves**"), the goal line, table headers, the name line of a box or panel. Do not bold words inside a sentence.
- Red (`<span class="em">`) marks the key terms and key numbers: the two things being contrasted, the result to remember, the value a diagram arrives at. At most three on a slide, a few words each, never a whole sentence, never in a title.

**Formulas**

- One formula per slide, centered across the slide, on one line, never beside a figure. It is a row of pieces (`.eq`, patterns "Formula"): each subscript is its own piece, the parts the slide does not discuss are grey, and the terms it does discuss are boxed with their names above.
- Under the formula, one panel per boxed term says what the term is, in the same left-to-right order, joined to its term by a line.
- A long formula gets a smaller size inline on `.eq` (the check names it, not under 36px). A formula that needs fractions, sums or matrices is cropped from the paper as a picture and centered the same way.

**Bullets**

- Always two levels, and the levels mean something: level one is the point, level two is its detail or example.
- Both levels use the same solid marker at the same size. Only the indent differs.
- Do not put every line on level one. That is a paragraph cut into lines, not a list.
- Level one may be just a bold lead-in such as "**Result**", with the content on level two.
- When each point is a name plus one sentence, the name is a bold item and the sentence follows as an explanation paragraph (`.ex`) that starts under the item's text, without a marker of its own.
- Level one is numbered (1. 2. 3.) when its lines are steps in order, the parts of a figure in the order they are explained, or a ranking. Everything else uses bullets, and level two always uses bullets. Do not number lines that have no order. A block that has numbered lines gets class `num` on its `.txt`, so that bulleted and numbered lines start at the same position.

**Position and size**

- Text goes left or on top. Figures go right or below.
- Title: 72px, bold, one line. Section label above it: 40px.
- The goal line of the problem slide is the largest text in the body: 64px, bold, on one line if it can be.
- Body text as large as fits: 36 to 54px. Tables 36 to 44px. Flow boxes as large as fits: 32 to 48px, so that the flow fills the slide instead of sitting in a strip at the top. Nothing under 24px.
- Figures as large as they stay sharp: at most about 1.3× their native pixel size. A figure that cannot be read is left out and replaced by text.
- Mark the important part of a figure with a ring (`.ring`, or `.ring.box` around a block) or a numbered badge (`.badge`), and say so in the source line when the slide has one.
- A diagram that is explained in parts gets one slide per part: the same figure on every slide, with the part under discussion ringed. These slides are one topic continued, so they share a title and a running number.
- Tables: grid lines drawn, grey bold header, no zebra fill. To stress one row (this paper, the best result), give that row the highlight fill and, if it helps, red text; at most one row per table. Size the columns so the key column does not wrap. A short table gets class `roomy` so that it does not leave the slide half empty.
- Diagrams fill the space under the text: icons 160 to 220px, box text 40 to 52px, the lowest element ending near y 960. A diagram squeezed into a strip under the text reads as unfinished.

**Canvas**

- 1920 × 1080. Content area: x 91 to 1829, y 221 to 990 (1738 × 769).
- Nothing may end below y 990. The source line, when there is one, sits at y 1030 in 24px.

## 6. Fill the slide

The usual failure is a short text block at a cautious size, floating in a tall column beside a figure. Checking the bottom edge cannot see it, because the row always stretches to the bottom of the slide. So size in this order and let the script choose the number.

1. **Pick the layout from the figure's shape** (width ÷ height). 1.8 or wider: `.stack`, text on top and the figure below at full width. Narrower: `.split`, text left and figure right. Tables and flows are their own full-width blocks. A slide that holds only a flow puts it in the vertical middle (`class="c mid"`).
2. **Size the figure first, as large as allowed.** In a split: height up to 769, width up to about 1000 so the text keeps at least 690. In a stack: width up to 1738, height is what the text leaves. Never beyond 1.3× native size. Always write the px width and height on both `.fig` and its `<img>`.
3. **Put all text of the slide in one `.txt` block** and set its size once, inline: `<div class="txt" style="font-size:44px">`. The lists inherit it. Do not set sizes on single lists. A flow of boxes works the same way: one size, inline on `.flow`.
4. **Run the check and apply what it prints:**
   ```bash
   node scripts/check_layout.js <deck_root> --shots <empty_temp_dir>
   ```
   - `GROW: set .txt font-size:NNpx` or `GROW: set .flow font-size:NNpx`: set exactly that size.
   - `TEXT TOO BIG` or `TEXT TOO LONG` or `OVERFLOW`: move detail to the notes or split the slide. Do not go below 36px to make it fit.
   - `FLOW TOO BIG` or `FLOW TOO LONG`: set the size it names, or shorten the lines in the boxes. A line in a box may wrap once at most.
   - `UNDERFILL`: the text is lost even at 54px. Go to step 5.
   - `UNDERUSED`: a table leaves the lower part of the slide empty. Enlarge its text within the size limits, or put a `.txt` block above it that says what it compares.
   - `ORPHAN`: a line wraps for its last word alone. This is what enlarged text does to a layout. Set the size the message names if it names one. Otherwise give the line more width (narrow the figure beside it, widen the column of the table or the box) or shorten the wording. Do not leave it.
   - `FORMULA too wide`: set the size it names on `.eq`.
   - `OVERLAP`, `OFF THE SLIDE`, `OVERFLOW: text is wider than its box`: a block grew into its neighbour or out of its box. Give it room or make its text shorter or smaller.
   - `DIAGRAM`: a part lies outside its host, or the host holds more than 24 pinned parts. Enlarge the host, move the part, or split the diagram.
   - `LIST: a <br> inside a list item`: use an explanation paragraph (`.ex`) instead.
   - `INLINE`: something inside a line that Slides drops (`<sub>`, `<sup>`, a circled number in a sentence). Make it a block as the message says.
   - `TEXT ONLY`: too many slides without a visual. Give them one (section 3, "Every slide earns a visual").
   - `TITLE`, `NESTED`, `LIST outside .txt`, `NUMBERED`, `EMPHASIS`, `BOLD`, `LOGO`: fix the slide as the message says.

   To place connectors and labels, ask the script where things are: `--where ".term, .panel"` prints the box of every match (left, top, width, height, and the middle of its top and bottom edge) in slide coordinates. Connectors that are direct children of the slide use these numbers as they are; inside a `.host`, subtract the host's left and top.
   - `Note:` about titles that are a kind plus a number: name each slide by its topic.
5. **Rebalance an underfilled slide**, first option that applies:
   1. The figure can still grow within step 2: enlarge it, which narrows the text column and makes the text taller.
   2. Switch the layout: a short text over a wide figure usually fills better as a stack.
   3. Bring back one second-level detail from the notes that helps the audience read the figure. Never add filler.
   4. The message is complete as it is: accept it. One short statement at 54px, centered beside a large figure, is a good slide.
6. Run again until it prints `Layout clean.` The target is a text block that fills 75 to 96% of its available height.
7. **Check last, every time.** Any later change (a size, a width, a word, a new slide, a fix the user asked for) can break a line or push a block. After the last change of all, run the check once more and look at the screenshots of that run. A deck is finished only when its final state has been checked, not an earlier one.

Slides draws `<x-connector>` itself; the script draws the same lines for its screenshots, so a diagram can be judged locally. The script renders with local fonts, which differ slightly from the deck's fonts, so it keeps a 4% margin and ignores gains under 4px. Pictures in `project/img/` are shown; uploaded pictures appear as empty boxes locally, which is expected. If Playwright is not available, say so, size by the rules above, and check the published deck by eye.

## 7. Workflow

1. Read the paper. Write one sentence per slide: "this slide says …". Reading only those sentences must tell the whole paper, and each must follow from the one before (section 2).
2. Extract figures: render pages with `pdftoppm -r 300`, crop each figure, and note its native pixel size for the 1.3× limit. Upload them as the Slides type instructs, or save them in `project/img/` for PowerPoint output.
3. Create the deck as a Slides artifact or in a local folder (section 0). Write the index, `project/deck.css` (from `assets/deck.css`, themed) and the slides (from `references/patterns.md`), then publish.
4. Run `check_layout.js` and work through section 6 until clean.
5. Write the notes last, when the slides are final. Run `check_notes.py` and work through section 4 until no `E` remains. Copy the `start-by` column into the `[≤ m:ss]` markers.
6. Look at every screenshot yourself, slide by slide. The scripts cannot judge these, and they are what users send back:
   - Story: the titles and first lines, read in order, tell the paper. No slide comes out of nowhere.
   - Titles: named by topic, no bare "Method ①", one line. A number sits in a circle no taller than the capital letters beside it.
   - Alignment: lines of one level start at the same position whether they have a bullet or a number. Markers are one size, none hollow.
   - Space: nothing floats in an empty area. Text beside a figure, a table with half a slide under it, a flow in a strip at the top: enlarge it before you accept it.
   - Goal: on the problem slide the goal line is the largest text in the body.
   - Tables: grid lines visible, at most one highlighted row, the key column not wrapped.
   - Figures: sharp. When a diagram is explained in parts, the part is ringed and the figure keeps its size and place from slide to slide.
   - Formulas: centered, with the text below, or above and below.
   - Emphasis: at most two red phrases on a slide, bold only on sub-headings.
   - Layout: text is left or on top, figures right or below.
   - Visuals: almost every slide has one, it explains the text above it, and it fills the space under the text. A diagram's arrows start and end on the boxes and icons they join.
   - Lines: no line ends in a single word, no table cell or box wraps for one word, nothing touches or covers its neighbour. Look hardest at the text you enlarged.
   - Shape: a slide that lists steps, cases or properties as sentences is redrawn as a flow, a diagram or a table.
7. If subagents are available, have one that has not seen your work check the deck against the paper (numbers, figure numbers, claims) and against these rules. Reviewers make mistakes too: verify each finding in the paper before changing anything.
8. For PowerPoint or Google Slides, export with `export_pptx.js` and look at the result (section 0).
9. Whatever you changed in steps 6 to 8, finish with section 6 step 7: one more run of `check_layout.js` and one more look at its screenshots.
10. Deliver in one sentence, plus the inputs that are still missing (date, presenter).

## 8. Working with the user

- The user may edit slides directly. Before every publish, read the live version of each file you change and edit that, never an old local copy.
- If a publish is refused because the deck changed, reread the files it names, redo your change on the new version, and publish again.
- Feedback left as a comment on the deck is answered in that comment thread. In chat, one line.
- When feedback on one slide is really a deck-wide rule ("name the result slides", "make the text bigger"), apply it to every slide.
- Do not rewrite text the user typed onto a slide. If something there looks wrong, ask.
