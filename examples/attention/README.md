# Example: Attention Is All You Need

Two decks made by Claude from the same paper: A. Vaswani et al., "Attention Is All You Need", NIPS 2017 (arXiv:1706.03762v7).

| Folder | How it was made | Size |
|---|---|---|
| `with-skill/` | With this skill | 17 slides for a 15-minute talk, with a read-aloud script (13:55 at 125 words per minute) |
| `baseline/` | Without the skill, following the default design guidance of Claude's Slides type: cards, an accent slide, big numbers | 12 slides |

The comparison image in the main README shows four matching slides from each deck.

The baseline is meant to be a fair picture of the default style, not a broken deck: its layout bugs were fixed, and its numbers were checked against the paper like those of the other deck. Both decks were written in one session by the same model.

## Render them yourself

```bash
# screenshots of every slide, plus the layout report
node skills/academic-paper-slides/scripts/check_layout.js examples/attention/with-skill --shots /tmp/with-skill
node skills/academic-paper-slides/scripts/check_layout.js examples/attention/baseline --shots /tmp/baseline

# speaker-notes check and timing
python3 skills/academic-paper-slides/scripts/check_notes.py examples/attention/with-skill --minutes 15

# editable PowerPoint file
node skills/academic-paper-slides/scripts/export_pptx.js examples/attention/with-skill /tmp/attention.pptx
```

The layout report flags many things in `baseline/`. That is expected: it was not built to this skill's rules.

## Figures

The pictures in `project/img/` are Fig. 1 and Fig. 2 of the paper. The arXiv version carries a notice from Google that allows its tables and figures to be reproduced in journalistic or scholarly works when proper attribution is given. They appear here in a presentation of the paper, with the source named on every slide. All slide text and speaker notes were written for this example.

One detail for readers who check the numbers: the paper's abstract and Table 2 give 41.8 BLEU for English–French, while the text of Section 6.1 says 41.0. The slides use the table.
