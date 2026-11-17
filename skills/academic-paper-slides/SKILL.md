---
name: academic-paper-slides
description: Turn an academic paper into presentation slides, as a Claude Slides artifact, an editable PowerPoint (.pptx) file or Google Slides. One message per slide, label-only titles, plain white pages, two-level bullets, text beside or above each figure and sized by a script to fill the slide, plus speaker notes written to be read aloud word for word. Use it whenever the user wants slides to present or explain a paper, whether it is their own paper for a conference talk, thesis defense or lab meeting, or someone else's for a journal club or reading group (論文發表, 論文紹介, 輪講), even if they only say "make slides for this paper".
---

# Academic paper slides

Turn one research paper into presentation slides that a listener can follow, and a script the presenter can read aloud.

**Output:** a Claude Slides artifact, an editable PowerPoint file, or Google Slides (section 0). This skill decides content, structure and look. Where it disagrees with the Slides artifact type's general design advice (accent slides, cards, statement slides, margins), this skill wins, because choosing it is the user's explicit instruction. The type's hard format limits always hold.

**Bundled files**

- `assets/deck.css`: the stylesheet. Copy it to `project/deck.css` and change only the theme variables.
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
  The result is editable, not pictures of slides: each `.txt` block is one text box with real two-level bullets, tables are PowerPoint tables, flow boxes and rings are shapes, the notes are speaker notes.
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

1. Cover
2. Problem: what is wrong today. The last line is bold: "→ Goal: …"
3. Background 1, 2, …: only what the audience needs to follow the rest
4. Purpose: the research question and the paper's aims
5. Related work: one comparison table, with the row for this paper highlighted
6. Method 1, 2, 3, …: one step per slide
7. Experiment setup: a flow of boxes (① → ② → ③ → ④) showing what is trained on what, what is tested, and against which baselines
8. Result 1, 2, 3, …: one result per slide
9. Conclusion: what was done, what it achieved, where it applies

The deck ends at the conclusion. Add strengths, critique, takeaways, a reviewer verdict, references or an appendix only when the user or the rubric asks.

A 15-minute talk is 15 to 17 slides. Scale with the talk length at about one slide per minute.

## 3. Content rules

- One slide says one thing. Two things means two slides, or the minor one moves to the notes.
- Titles are labels only: "Problem", "Method 3", "Result 2". Never "Label: content". No claims or figure numbers in titles.
- Write only what carries information, but do not abbreviate until it is unreadable.
- Define a term on the line where it is first needed, in a few words in parentheses, for example "ViT (an image model built from Transformer blocks)". Do not spend an earlier slide on it, and do not explain common knowledge.
- Use the paper's own terms. In a deck that is not in the paper's language, give the original term once on first use. No metaphors.
- On a slide with a figure, the text first says what the figure compares, then the result. Do not repeat what the figure already shows.
- Result slides state results. No judgement words such as "convincing", "reliable" or "should be discounted".
- If a critique or verdict is requested: each criticism names the problem and its evidence (figure number, number). Say whether a concern is a limit of the method or a flaw in the experiment design. Suggest fixes only if asked.
- No cross-slide references such as "(p. 7)" or "see slide 4".
- Every number on a slide can be found in the paper. Mark invented example values "values are illustrative".
- Detail cut from a slide goes into its notes, not into smaller type.
- Every content slide ends with a source line (`.cite`): "Source: Author et al., Venue Year, Sec. 3" or "Figure: Author et al., Venue Year, Fig. 4; orange ring added by presenter". A table you compiled says "Table compiled by presenter".

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

- White background, near-black text. Only the title, its rule and the page number use the accent color.
- Theme = the four variables at the top of `deck.css`: `--ink`, `--accent`, `--hl`, `--mark`. With a user template or brand, set `--accent` (and the font) from it and add the logo (see patterns). Without one, keep the neutral defaults. Do not add colors.
- No colored blocks or cards that hold text. Two exceptions: the flow boxes on the experiment-setup slide (white, black border, the key step with a thick border) and the highlighted row of the related-work table.

**Bullets**

- Always two levels, and the levels mean something: level one is the point, level two is its detail or example.
- Both levels use the same solid marker at the same size. Only the indent differs.
- Do not put every line on level one. That is a paragraph cut into lines, not a list.
- Level one may be just a bold lead-in such as "**Result**", with the content on level two.

**Position and size**

- Text goes left or on top. Figures go right or below.
- Title: 84px, bold, one line.
- Body text as large as fits: 36 to 54px. Tables 36 to 44px. Flow boxes 32 to 36px. Nothing under 24px.
- Figures as large as they stay sharp: at most about 1.3× their native pixel size. A figure that cannot be read is left out and replaced by text.
- Mark the important part of a figure with a ring (`.ring`) or a numbered badge (`.badge`), and say so in the source line.
- Tables: white bold header with a rule under it, no zebra fill. Size the columns so the key column does not wrap.

**Canvas**

- 1920 × 1080. Content area: x 91 to 1829, y 221 to 990 (1738 × 769).
- Nothing may end below y 990. The source line sits at y 1030 in 24px.

## 6. Fill the slide

The usual failure is a short text block at a cautious size, floating in a tall column beside a figure. Checking the bottom edge cannot see it, because the row always stretches to the bottom of the slide. So size in this order and let the script choose the number.

1. **Pick the layout from the figure's shape** (width ÷ height). 1.8 or wider: `.stack`, text on top and the figure below at full width. Narrower: `.split`, text left and figure right. Tables and flows are their own full-width blocks.
2. **Size the figure first, as large as allowed.** In a split: height up to 769, width up to about 1000 so the text keeps at least 690. In a stack: width up to 1738, height is what the text leaves. Never beyond 1.3× native size. Always write the px width and height on both `.fig` and its `<img>`.
3. **Put all text of the slide in one `.txt` block** and set its size once, inline: `<div class="txt" style="font-size:44px">`. The lists inherit it. Do not set sizes on single lists.
4. **Run the check and apply what it prints:**
   ```bash
   node scripts/check_layout.js <deck_root> --shots <empty_temp_dir>
   ```
   - `GROW: set .txt font-size:NNpx`: set exactly that size.
   - `TEXT TOO BIG` or `TEXT TOO LONG` or `OVERFLOW`: move detail to the notes or split the slide. Do not go below 36px to make it fit.
   - `UNDERFILL`: the text is lost even at 54px. Go to step 5.
   - `UNDERUSED`: a table or flow leaves the lower part of the slide empty. Enlarge its text within the size limits, or put a `.txt` block above the table that says what it compares.
   - `TITLE`, `NESTED`, `LIST outside .txt`: fix the markup as the message says.
5. **Rebalance an underfilled slide**, first option that applies:
   1. The figure can still grow within step 2: enlarge it, which narrows the text column and makes the text taller.
   2. Switch the layout: a short text over a wide figure usually fills better as a stack.
   3. Bring back one second-level detail from the notes that helps the audience read the figure. Never add filler.
   4. The message is complete as it is: accept it. One short statement at 54px, centered beside a large figure, is a good slide.
6. Run again until it prints `Layout clean.` The target is a text block that fills 75 to 96% of its available height.

The script renders with local fonts, which differ slightly from the deck's fonts, so it keeps a 4% margin and ignores gains under 4px. Pictures in `project/img/` are shown; uploaded pictures appear as empty boxes locally, which is expected. If Playwright is not available, say so, size by the rules above, and check the published deck by eye.

## 7. Workflow

1. Read the paper. Write one sentence per slide: "this slide says …". Reading only those sentences must tell the whole paper.
2. Extract figures: render pages with `pdftoppm -r 300`, crop each figure, and note its native pixel size for the 1.3× limit. Upload them as the Slides type instructs, or save them in `project/img/` for PowerPoint output.
3. Create the deck as a Slides artifact or in a local folder (section 0). Write the index, `project/deck.css` (from `assets/deck.css`, themed) and the slides (from `references/patterns.md`), then publish.
4. Run `check_layout.js` and work through section 6 until clean.
5. Write the notes last, when the slides are final. Run `check_notes.py` and work through section 4 until no `E` remains. Copy the `start-by` column into the `[≤ m:ss]` markers.
6. Look at the screenshots yourself, slide by slide: markers are the same size, no hollow markers, no wrapped title, no blurry figure, text is left or on top, nothing looks empty.
7. If subagents are available, have one that has not seen your work check the deck against the paper (numbers, figure numbers, claims) and against these rules. Reviewers make mistakes too: verify each finding in the paper before changing anything.
8. For PowerPoint or Google Slides, export with `export_pptx.js` and look at the result (section 0).
9. Deliver in one sentence, plus the inputs that are still missing (date, logo, presenter).

## 8. Working with the user

- The user may edit slides directly. Before every publish, read the live version of each file you change and edit that, never an old local copy.
- If a publish is refused because the deck changed, reread the files it names, redo your change on the new version, and publish again.
- Feedback left as a comment on the deck is answered in that comment thread. In chat, one line.
- When feedback on one slide is really a deck-wide rule ("no 'Label: content' titles", "make the text bigger"), apply it to every slide.
- Do not rewrite text the user typed onto a slide. If something there looks wrong, ask.
