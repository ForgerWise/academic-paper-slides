#!/usr/bin/env node
// check_layout.js <deck_root> [--shots <dir>] [--min 36] [--max 60] [--where "<css selector>"] [--font "Arial"] [--margin 0.08]
//
// --font    checks the deck as it is laid out in that font: the PowerPoint target (export_pptx.js --font).
// --margin  measures with every character that much wider (in em). PowerPoint sets text a little wider than the
//           browser used here, most of all Japanese, Chinese and Korean text, so a line that just fits here wraps
//           there. With the margin, every size this script accepts or suggests leaves that much room.
//           Default: 0.08 when --font is given and the deck is mostly CJK text, otherwise 0.
//           export_pptx.js has the same option and the same default: use the same value in both.
//
// Renders a Slides deck locally (no network, page scripts off) and reports per slide:
//   - top and bottom edge of the content (must stay inside y = 221..990)
//   - for every .txt block: how much of its available height it fills, its current
//     font size, and the largest size between --min and --max that still fits
//   - rule breaks that are mechanical: wrapped title, over-long title name, nested <ul>
//   - layout slips that enlarging text causes: a line that wraps for one last word, blocks that
//     overlap, content that runs off the side of the slide
// Exit code 0 = clean, 1 = something to fix, 2 = could not run.
//
// <deck_root> is the folder that contains project/deck.json.
// Pictures kept in project/img/ are shown. Uploaded pictures (/_blob/...) are not
// available locally; that is fine: every figure has a px width and height, so the
// layout boxes are still correct.

const fs = require('fs');
const path = require('path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  console.error('playwright is not installed here. Skip this check and say so, or run it where playwright exists.');
  process.exit(2);
}

const argv = process.argv.slice(2);
const root = argv[0];
const opt = (name, dflt) => {
  const i = argv.indexOf(name);
  return i > 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
if (!root || !fs.existsSync(path.join(root, 'project', 'deck.json'))) {
  console.error('usage: check_layout.js <deck_root> [--shots <dir>] [--min 36] [--max 60] [--where "<css selector>"] [--font "Arial"] [--margin 0.08]');
  process.exit(2);
}
const cfg = {
  min: Number(opt('--min', 36)),
  max: Number(opt('--max', 60)),
  top: 221,        // first usable y of a content slide
  bottom: 990,     // last usable y of a content slide
  safety: 0.96,    // local fallback fonts differ a little from the deck's fonts
  lowFill: 0.7,    // below this the text block looks lost beside or above its figure
  lowFillSolo: 0.55, // text-only slide: top-aligned text may leave more room below
  step: 4,         // ignore size gains smaller than this; real fonts shift line breaks a little
};
const shots = opt('--shots', null);
const where = opt('--where', null);   // print the boxes of these elements, to place connectors and labels by
// --font checks the deck as it will be laid out in that font: the one export_pptx.js --font writes into the file
const fontSafe = (opt('--font', '') || '').replace(/[^\p{L}\p{N} _-]/gu, '').trim();
const withFont = (text) => (fontSafe ? text.replace(/font-family\s*:\s*/g, (m) => `${m}'${fontSafe}', `) : text);
const marginArg = argv.indexOf('--margin') > 0 ? Number(argv[argv.indexOf('--margin') + 1]) : null;
if (marginArg !== null && !(marginArg >= 0 && marginArg <= 0.3)) { console.error('--margin takes a number between 0 and 0.3 (em)'); process.exit(2); }

// Runs inside the page. Share of CJK characters in the slides' text, and whether a font is really installed
function probe(fontName) {
  let cjk = 0, all = 0;
  document.querySelectorAll('body > section').forEach((sec) => {
    const c = sec.cloneNode(true);
    c.querySelectorAll('aside').forEach((e) => e.remove());
    const t = c.textContent.replace(/\s+/g, '');
    all += t.length;
    cjk += (t.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || []).length;
  });
  let installed = true;
  if (fontName) {
    // A missing font falls back to the generic family, so the text is then exactly as wide as in that family
    const ctx = document.createElement('canvas').getContext('2d');
    const w = (f) => { ctx.font = '72px ' + f; return ctx.measureText('mmmmmmmmmmlli 0123456789 あいう日本語').width; };
    installed = ['serif', 'sans-serif', 'monospace'].some((g) => w(`"${fontName}", ${g}`) !== w(g));
  }
  return { share: all ? cjk / all : 0, installed };
}

// Same base rules the Slides preview uses, so local boxes match the real page closely.
const BASE_CSS = [
  '* { margin: 0 }',
  'body { font: 32px/1.2 sans-serif }',
  'body > section { width: 1920px !important; height: 1080px !important; overflow: hidden !important;',
  '  box-sizing: border-box !important; position: relative; isolation: isolate }',
  'section[hidden], aside, noscript { display: none !important }',
  'h1 { font-size: 96px; font-weight: 600 } h2 { font-size: 64px; font-weight: 600 } h3 { font-size: 44px; font-weight: 600 }',
  'p, li, h1, h2, h3, td, th { overflow-wrap: break-word }',
  'table { width: 100%; border-collapse: separate; border-spacing: 0; border: solid #0003; border-width: 2px 0 0 2px }',
  'th, td { padding: .35em .6em; text-align: left; border: solid #0003; border-width: 0 2px 2px 0 }',
  'x-shape, x-icon, x-embed { display: block }',
  // Slides draws each kind of <x-shape> itself; these only make the local screenshots look the same
  'x-shape[kind="arrow-right"] { clip-path: polygon(0 28%, 60% 28%, 60% 0, 100% 50%, 60% 100%, 60% 72%, 0 72%) }',
  'x-shape[kind="arrow-left"] { clip-path: polygon(100% 28%, 40% 28%, 40% 0, 0 50%, 40% 100%, 40% 72%, 100% 72%) }',
  'x-shape[kind="arrow-down"] { clip-path: polygon(28% 0, 72% 0, 72% 60%, 100% 60%, 50% 100%, 0 60%, 28% 60%) }',
  'x-shape[kind="arrow-up"] { clip-path: polygon(28% 100%, 72% 100%, 72% 40%, 100% 40%, 50% 0, 0 40%, 28% 40%) }',
  'x-shape[kind="ellipse"] { border-radius: 50% }',
].join('\n');

// Slides draws <x-connector> itself; a plain browser shows nothing. Replace each one that has
// coordinates by a line drawn in SVG, so the screenshots show the diagram as Slides will.
function drawConnectors(html) {
  return html.replace(/<x-connector\b([^>]*)>\s*<\/x-connector>/g, (all, attrs) => {
    const at = (k) => { const m = new RegExp('\\b' + k + '="([^"]*)"').exec(attrs); return m ? m[1] : null; };
    const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((k) => parseFloat(at(k)));
    if ([x1, y1, x2, y2].some((v) => Number.isNaN(v))) return all;
    const st = at('style') || '';
    const css = (k, d) => { const m = new RegExp('(?:^|;)\\s*' + k + '\\s*:\\s*([^;]+)').exec(st); return m ? m[1].trim() : d; };
    const color = /^#[0-9a-fA-F]{3,8}$/.test(css('color', '')) ? css('color', '') : '#222222';
    const w = parseFloat(css('border-width', '2')) || 2;
    const dash = /dash|dot/.test(css('border-style', '')) ? ` stroke-dasharray="${w * 3} ${w * 2.5}"` : '';
    const route = at('route') || 'straight', head = at('head') || 'end';
    let pts = [[x1, y1], [x2, y2]];
    if (route === 'hv') pts = [[x1, y1], [x2, y1], [x2, y2]];
    if (route === 'vh') pts = [[x1, y1], [x1, y2], [x2, y2]];
    if (route === 'elbow') pts = Math.abs(x2 - x1) >= Math.abs(y2 - y1)
      ? [[x1, y1], [(x1 + x2) / 2, y1], [(x1 + x2) / 2, y2], [x2, y2]]
      : [[x1, y1], [x1, (y1 + y2) / 2], [x2, (y1 + y2) / 2], [x2, y2]];
    const tip = (a, b) => {          // a filled head at b, pointing away from a
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      const len = 4.2 * w, half = 1.9 * w, bx = b[0] - ux * len, by = b[1] - uy * len;
      return `<path d="M${b[0]} ${b[1]} L${bx - uy * half} ${by + ux * half} L${bx + uy * half} ${by - ux * half} Z" fill="${color}"/>`;
    };
    let heads = '';
    if (head === 'end' || head === 'both') heads += tip(pts[pts.length - 2], pts[pts.length - 1]);
    if (head === 'both') heads += tip(pts[1], pts[0]);
    return `<svg class="xconn" width="1" height="1" style="position:absolute;left:0;top:0;overflow:visible"><path d="M${pts.map((q) => q.join(' ')).join(' L')}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${dash}/>${heads}</svg>`;
  });
}

function buildPage() {
  const deck = JSON.parse(fs.readFileSync(path.join(root, 'project', 'deck.json'), 'utf8'));
  const parts = ["<!doctype html><html><head><meta charset='utf-8'><style>" + BASE_CSS + '</style>',
    "<link rel='stylesheet' href='/project/deck.css'></head><body>"];
  for (const id of deck.order || []) {
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) continue;
    const f = path.join(root, 'project', 'slides', id + '.html');
    if (fs.existsSync(f)) parts.push(drawConnectors(fs.readFileSync(f, 'utf8')));
  }
  parts.push('</body></html>');
  return parts.join('\n');
}

// Runs inside the page.
function measure(cfg) {
  const CHROME = '.cite,.ttl,.sec,.tbar,.pnum,.logo,.rule,aside,.xconn';
  const px = (v) => parseFloat(v) || 0;
  const contentHeight = (el) => {
    const kids = [...el.children].filter((k) => k.getBoundingClientRect().height > 0);
    if (!kids.length) return 0;
    return kids[kids.length - 1].getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top;
  };
  // The height a block needs. A block that stretches to fill the slide (a flow of boxes, panels in a row)
  // is measured without the stretch
  const natural = (k) => {
    if (getComputedStyle(k).flexGrow === '0') return k.getBoundingClientRect().height;
    const keep = k.style.flex;
    k.style.flex = 'none';
    const h = k.getBoundingClientRect().height;
    k.style.flex = keep;
    return h;
  };
  // Height the text block could use: the whole row in a .split, or what its
  // siblings leave free in a column (.stack or the slide itself).
  const available = (txt) => {
    const p = txt.parentElement;
    const cs = getComputedStyle(p);
    const inner = p.clientHeight - px(cs.paddingTop) - px(cs.paddingBottom);
    if (cs.display.includes('flex') && cs.flexDirection.startsWith('row')) return inner;
    const flow = [...p.children].filter((k) => {
      const s = getComputedStyle(k);
      return s.position !== 'absolute' && s.display !== 'none' && k.tagName !== 'ASIDE';
    });
    // the height of the other blocks, with their own margins (the panels under a formula keep a gap above them)
    const others = flow.filter((k) => k !== txt).reduce((a, k) => {
      const ks = getComputedStyle(k);
      return a + natural(k) + px(ks.marginTop) + px(ks.marginBottom);
    }, 0);
    return inner - others - px(cs.rowGap) * Math.max(0, flow.length - 1);
  };
  // The lines of a paragraph as lists of words. A word that breaks across lines counts on each line
  const CJK = '\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uac00-\\ud7af';
  const TOKEN = new RegExp(`[${CJK}]|[^\\s${CJK}]+`, 'g');
  const linesOf = (el) => {
    const pieces = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let t;
    while ((t = w.nextNode())) {
      if (t.parentElement.closest('ul, ol, table, aside') !== el.closest('ul, ol, table, aside')) continue;
      let m;
      TOKEN.lastIndex = 0;
      while ((m = TOKEN.exec(t.textContent))) {
        const rg = document.createRange();
        rg.setStart(t, m.index); rg.setEnd(t, m.index + m[0].length);
        for (const r of rg.getClientRects()) if (r.width > 0) pieces.push({ text: m[0], mid: (r.top + r.bottom) / 2, left: r.left, right: r.right, h: r.height });
      }
    }
    pieces.sort((a, b) => a.mid - b.mid || a.left - b.left);
    const lines = [];
    for (const q of pieces) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(q.mid - last.mid) < 0.5 * Math.max(q.h, last.h)) last.words.push(q);
      else lines.push({ mid: q.mid, h: q.h, words: [q] });
    }
    return lines.map((l) => ({ n: l.words.length, text: l.words.map((x) => x.text).join(' '),
      width: Math.max(...l.words.map((x) => x.right)) - Math.min(...l.words.map((x) => x.left)) }));
  };
  const cjkOnly = new RegExp(`^[${CJK}、。，．・\\s]+$`);
  // Paragraphs under root whose last line holds one word (two characters in Chinese or Japanese)
  const orphans = (root) => [...root.querySelectorAll('p, li, h1, h2, h3, td, th')].filter((el) => !el.closest('aside, .cite')).map((el) => {
    const ls = linesOf(el);
    if (ls.length < 2) return null;
    const last = ls[ls.length - 1];
    const few = cjkOnly.test(last.text) ? last.n <= 2 : last.n === 1;
    // One word left over from a line of three or more words. Two words split over two lines are not an orphan
    const total = ls.reduce((n, l) => n + l.n, 0);
    // In a box of a diagram, where text is centered, a short last line is normal: only a very short one counts there
    const boxed = el.closest('.node, .panel, .lbl') || getComputedStyle(el).textAlign === 'center';
    if (!few || total < 3 || last.width >= (boxed ? 0.34 : 0.6) * Math.max(...ls.map((l) => l.width))) return null;
    // Chinese and Japanese are measured character by character; show them without the spaces between
    const tidy = (t) => t.replace(new RegExp(`\\s+(?=[${CJK}、。，．・（）「」])|(?<=[${CJK}、。，．・（）「」])\\s+`, 'g'), '');
    const all = tidy(ls.map((l) => l.text).join(' '));
    return { el, word: tidy(last.text), line: all.length > 48 ? all.slice(0, 45) + '...' : all };
  }).filter(Boolean);
  const WIDER = 'give the line more width (widen the column or the box) or shorten the wording';
  // A formula has its own size and its own flag, so it does not count here
  const tooWide = (txt) => {
    const eqWide = [...txt.querySelectorAll('.eq')].some((el) => el.scrollWidth > el.clientWidth + 1);
    return [...(eqWide ? [] : [txt]), ...txt.querySelectorAll('ul,li,p,div,table')]
      .some((el) => !el.classList.contains('eq') && !(eqWide && el.querySelector('.eq')) && el.scrollWidth > el.clientWidth + 1);
  };

  return [...document.querySelectorAll('body > section')].map((sec, i) => {
    const sr = sec.getBoundingClientRect();
    const out = { n: i + 1, id: sec.id, cover: sec.classList.contains('cover'), flags: [], notes: [], txt: [] };

    const extent = () => {
      let t = Infinity, b = 0;
      sec.querySelectorAll('p,li,img,table,h1,h2,h3,svg,x-shape,.fig,.card,.node,.panel,.host,.ph').forEach((el) => {
        if (el.closest(CHROME)) return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        t = Math.min(t, r.top - sr.top);
        b = Math.max(b, r.bottom - sr.top);
      });
      return { top: t, bottom: b };
    };
    const { top, bottom } = extent();
    out.top = Number.isFinite(top) ? Math.round(top) : null;
    out.bottom = Math.round(bottom);
    if (!out.cover) {
      if (bottom > cfg.bottom + 0.5) out.flags.push(`OVERFLOW bottom ${out.bottom} > ${cfg.bottom}: cut text or move detail to the notes`);
      if (Number.isFinite(top) && top < cfg.top - 0.5) out.flags.push(`OVERFLOW top ${out.top} < ${cfg.top}: content runs into the title bar`);
    }

    const ttl = sec.querySelector('.ttl');
    if (ttl) {
      const bar = ttl.closest('.tbar') || ttl;
      if (bar.scrollWidth > bar.clientWidth + 1) out.flags.push('TITLE too long for one line');
      if (bar.getBoundingClientRect().right - sr.left > 1740) out.flags.push('TITLE reaches the page number: shorten it');
      const t = ttl.textContent.trim();
      const num = bar !== ttl ? bar.querySelector('.circ') : null;
      out.title = num ? t + ' ' + num.textContent.trim() : t;
      const name = /[:：]/.test(t) ? t.split(/[:：]/).slice(1).join(' ').trim() : t;
      const cjk = (name.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) || []).length;
      const words = name.replace(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g, ' ').split(/\s+/).filter(Boolean).length;
      if (words > 6 || cjk > 14) out.flags.push('TITLE is too long: a topic name of at most five words');
      const HOW = 'write <div class="tbar"><h2 class="ttl">Name</h2><p class="circ">1</p></div>';
      if (/\s\d{1,2}$/.test(t)) out.flags.push('TITLE number: put it in a circle; ' + HOW);
      if (/[\u2460-\u2473]/.test(t)) out.flags.push('TITLE number: do not type the character ①, fonts draw it at very different sizes; ' + HOW);
    }
    // Slides keeps only colour, bold, italic and underline on words inside a line
    if (sec.querySelector('sub, sup')) out.flags.push('INLINE: Slides drops <sub> and <sup>. In a formula use <p class="sb"> pieces; elsewhere type the characters ¹ ² ³');
    if (sec.querySelector('li br')) out.flags.push('LIST: a <br> inside a list item loses its hanging indent in Slides. Put the second line in <p class="ex"> right after the list, inside the same .grp');
    if (sec.querySelector('span.circ, h1 .circ, h2 .circ, li .circ')) out.flags.push('INLINE: a circled number inside a line is dropped by Slides. Make it a block: <p class="circ">1</p> in a .tbar or a .hd row');
    sec.querySelectorAll('.host').forEach((h) => {
      const pinned = [...h.children].filter((k) => getComputedStyle(k).position === 'absolute' || k.tagName === 'X-CONNECTOR').length;
      if (pinned > 24) out.flags.push(`DIAGRAM: ${pinned} pinned elements in one .host; Slides shows at most 24. Split it into two hosts side by side or simplify`);
      const hr = h.getBoundingClientRect();
      [...h.children].forEach((k) => {
        const r = k.getBoundingClientRect();
        if (k.classList.contains('xconn') || !r.width) return;
        if (r.left < hr.left - 1 || r.top < hr.top - 1 || r.right > hr.right + 1 || r.bottom > hr.bottom + 1)
          out.flags.push(`DIAGRAM: "${(k.textContent.trim() || k.getAttribute('alt') || k.className).slice(0, 24)}" lies outside its .host; enlarge the host or move it`);
      });
    });
    if (sec.querySelector('li ul, li ol')) out.flags.push('NESTED list inside <li>: write the second level as a sibling ul.bl.sub');
    // Text goes above the visual, never beside it
    if ([...sec.querySelectorAll('.split')].some((sp) => sp.querySelector('.txt') && sp.querySelector('img, .fig, .host, .dia, .ph, table, .flow')))
      out.flags.push('SIDE BY SIDE: text stands beside a picture or diagram. Put all the text at the top and the visual under it (.stack, or the text block followed by the visual), and let the visual take the full width');
    // A text block that says one thing is a sentence, not a list of one bullet
    if (!out.cover) sec.querySelectorAll('.txt').forEach((txt) => {
      const lis = txt.querySelectorAll('li');
      if (lis.length === 1 && !txt.querySelector('.ex, :scope > p'))
        out.flags.push(`BULLET: a single bullet ("${lis[0].textContent.trim().replace(/\s+/g, ' ').slice(0, 40)}"). A text block that says one thing is a sentence with no bullet: <div class="txt"><p>…</p></div>. Bullets are for two or more separate points`);
    });
    // The parts of a method are named in plain words: "A | Encoder" tells the audience nothing
    sec.querySelectorAll('.sec, .pt, .hd p:not(.circ)').forEach((el) => {
      const t = el.textContent.trim();
      if (/^[A-Za-z0-9]\s*[|｜]\s*\S/.test(t)) out.flags.push(`LABEL: "${t.slice(0, 30)}" starts with a letter or number. Name the part in plain words, with nothing in front: "${t.replace(/^[A-Za-z0-9]\s*[|｜]\s*/, '').slice(0, 30)}"`);
    });
    // Text typed into a drawing becomes part of a picture: it cannot be edited, and fonts do not load there
    if (sec.querySelector('svg:not(.xconn) text')) out.flags.push('SVG TEXT: text typed inside an <svg> is baked into a picture. Keep the drawing plain and write the words as real text over it (a <p> placed on top)');
    // The back row cannot read text under about 2.5% of the slide height. The source line is the one exception
    {
      const small = [...sec.querySelectorAll('p, li, td, th, h1, h2, h3')].filter((el) => !el.closest('aside, .cite, .pnum, .cv-pnum')
        && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && el.getBoundingClientRect().height > 0
        && px(getComputedStyle(el).fontSize) < 27);
      if (small.length) out.flags.push(`SMALL: ${small.length} line(s) under 27px ("${small[0].textContent.trim().replace(/\s+/g, ' ').slice(0, 30)}" at ${Math.round(px(getComputedStyle(small[0]).fontSize))}px). The back row cannot read text under about 2.5% of the slide height: enlarge it or move it to the notes`);
    }
    if (!out.cover && sec.querySelector('ul, ol') && ![...sec.querySelectorAll('ul, ol')].every((u) => u.closest('.txt, .card, .panel, .node, table')))
      out.flags.push('LIST outside .txt: wrap the text of the slide in one .txt block');

    // A table with no text block that leaves the lower 40% of the slide empty
    if (!out.cover && !sec.querySelector('.txt') && sec.querySelector('table') && bottom > 0 && bottom < cfg.top + 0.6 * (cfg.bottom - cfg.top)) {
      const tb = Math.max(0, ...[...sec.querySelectorAll('table')].map((e) => px(getComputedStyle(e).fontSize)));
      out.flags.push(tb < 44
        ? `UNDERUSED: content ends at y ${out.bottom}. Enlarge the table text (up to 44px)`
        : `UNDERUSED: content ends at y ${out.bottom}. Add a .txt block above the table that says what it compares`);
    }

    // A flow of boxes is sized like a text block: the largest text between 32 and 56px that fits
    sec.querySelectorAll('.flow').forEach((flow) => {
      const cur = Math.round(px(getComputedStyle(flow).fontSize));
      const avail = available(flow);
      const keep = flow.style.fontSize;
      const keepFlex = flow.style.flex;
      flow.style.flex = 'none';   // measured at the height its text needs; on the slide it stretches to the bottom
      let fit = null, best = null;
      // the line that is too wide for its box, or wraps more than once, at the size now set
      const widest = () => [...flow.querySelectorAll('.card p')].find((el) => el.scrollWidth > el.clientWidth + 1
        || el.getBoundingClientRect().height > 2.4 * px(getComputedStyle(el).lineHeight)
        || el.closest('.card').scrollWidth > el.closest('.card').clientWidth + 1);
      const fits = (s) => {
        flow.style.fontSize = s + 'px';
        return flow.getBoundingClientRect().height <= avail * cfg.safety && !widest();
      };
      const FLOW_MAX = 56;
      for (let s = FLOW_MAX; s >= 32; s -= 2) if (fits(s)) { fit = s; break; }
      // What stops the text from growing further: a line, if the height would still allow it
      let stop = null;
      if (fit !== null && fit < FLOW_MAX) {
        flow.style.fontSize = (fit + 2) + 'px';
        const w = flow.getBoundingClientRect().height <= avail * cfg.safety ? widest() : null;
        if (w) stop = w.textContent.trim().replace(/\s+/g, ' ').slice(0, 40);
      }
      // Prefer a size, up to 6px smaller, at which no line ends in a single word
      if (fit !== null) {
        best = fit;
        for (let s = fit; s >= Math.max(32, fit - 6); s -= 2) if (fits(s) && !orphans(flow).length) { best = s; break; }
      }
      flow.style.fontSize = (best || cur) + 'px';
      const cleanAtBest = best !== null && !orphans(flow).length;
      flow.style.fontSize = keep;
      const lone = orphans(flow);
      out.txt.push({ cur, best, fill: Math.round(flow.getBoundingClientRect().height / avail * 100), fillBest: null });
      if (best === null) out.flags.push('FLOW TOO LONG: at 32px a line still wraps more than once or the boxes do not fit. Shorten the lines or use fewer boxes');
      else if (cur > fit) out.flags.push(`FLOW TOO BIG at ${cur}px: set .flow font-size:${best}px`);
      else if (lone.length && cleanAtBest && best !== cur) out.flags.push(`ORPHAN: "${lone[0].word}" stands alone on the last line of "${lone[0].line}": set .flow font-size:${best}px, or shorten the wording`);
      else if (lone.length) lone.forEach((o) => out.flags.push(`ORPHAN: "${o.word}" stands alone on the last line of "${o.line}": shorten the wording, or use fewer or wider boxes`));
      else if (best - cur >= cfg.step && (cleanAtBest || best - cur > 8)) out.flags.push(`GROW: set .flow font-size:${best}px (now ${cur}px)`);
      if (stop && best !== null && cur <= fit) out.notes.push(`the flow stops at ${fit}px because of the line "${stop}". A shorter line there lets the text of every box grow (up to ${FLOW_MAX}px)`);
      // A flow alone on its slide with empty bands above and below it
      const alone = !sec.querySelector('table, .fig, .host');
      const fill = flow.getBoundingClientRect().height / avail;
      if (alone && best !== null && cur >= best - 2 && fill < 0.62) {
        out.flags.push(stop
          ? `UNDERUSED: the flow fills ${Math.round(fill * 100)}% of the height and cannot grow past ${fit}px because of the line "${stop}". Shorten that line or break it in two with <br>, so the text of every box can grow`
          : `UNDERUSED: the flow fills ${Math.round(fill * 100)}% of the height. Give each box one more line of what it does, or put a .txt line above the flow`);
      }
      if (flow.querySelector(':scope > p.arrow')) out.flags.push('ARROW: a typed arrow between boxes is hard to see. Use a block arrow: <x-shape kind="arrow-right" class="arw"></x-shape>');
      flow.style.flex = keepFlex;
    });

    // Text in a box is centred across and down, so the titles of boxes in a row start on one line only when
    // the boxes hold the same number of lines
    if (!out.cover) {
      const rows = [];
      sec.querySelectorAll('.flow, .cols').forEach((row) => rows.push([...row.children].filter((k) => k.matches('.card, .panel'))));
      sec.querySelectorAll('.host').forEach((h) => {
        const byTop = {};
        [...h.children].filter((k) => k.matches('.panel')).forEach((k) => {
          const r = k.getBoundingClientRect();
          (byTop[Math.round(r.top / 4) + ':' + Math.round(r.height / 4)] = byTop[Math.round(r.top / 4) + ':' + Math.round(r.height / 4)] || []).push(k);
        });
        Object.values(byTop).forEach((g) => rows.push(g));
      });
      rows.forEach((boxes) => {
        const heads = boxes.map((b) => b.querySelector(':scope > .hd, :scope > .pt')).filter(Boolean);
        if (heads.length < 2 || heads.length !== boxes.length) return;
        const tops = heads.map((h) => h.getBoundingClientRect().top);
        if (Math.max(...tops) - Math.min(...tops) > 6) {
          const hi = heads[tops.indexOf(Math.min(...tops))], lo = heads[tops.indexOf(Math.max(...tops))];
          const nm = (h) => h.textContent.trim().replace(/^\d+\s*/, '').replace(/\s+/g, ' ').slice(0, 24);
          out.flags.push(`BOXES: the titles of the boxes in this row start at different heights ("${nm(hi)}" ${Math.round(Math.max(...tops) - Math.min(...tops))}px above "${nm(lo)}"). Text in a box is centred, so give the boxes the same number of lines: merge two short lines in the taller one, or break a line of the shorter one with <br>`);
        }
      });
    }

    // A line that wraps for one last word, outside the blocks that are sized above and below (those report their own)
    orphans(sec).filter((o) => !o.el.closest('.txt, .flow')).forEach((o) =>
      out.flags.push(`ORPHAN: "${o.word}" stands alone on the last line of "${o.line}": ${WIDER}`));

    // Blocks that overlap, or that run off the side of the slide
    if (!out.cover) {
      const blocks = [...sec.querySelectorAll('.txt, .fig, table, .flow, .dia, .host, .eq, .cite, .ttl')]
        .filter((el) => !el.parentElement.closest('.txt, .fig, table, .flow, .dia, .host, .eq, .tbar') && el.getBoundingClientRect().height > 0);
      const name = (el) => el.tagName === 'TABLE' ? 'the table' : 'the .' + el.classList[0] + ' block';
      for (let a = 0; a < blocks.length; a++) {
        const ra = blocks[a].getBoundingClientRect();
        if (ra.left - sr.left < -0.5 || ra.right - sr.left > 1920.5) out.flags.push(`OFF THE SLIDE: ${name(blocks[a])} runs past the side edge`);
        for (let b = a + 1; b < blocks.length; b++) {
          const rb = blocks[b].getBoundingClientRect();
          const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (w > 4 && h > 4) out.flags.push(`OVERLAP: ${name(blocks[a])} and ${name(blocks[b])} cover each other by ${Math.round(w)} x ${Math.round(h)}px`);
        }
      }
      sec.querySelectorAll('.card, .node, .panel, td, th').forEach((el) => {
        if (el.scrollWidth > el.clientWidth + 1 || (el.matches('.node, .panel') && el.scrollHeight > el.clientHeight + 1))
          out.flags.push(`OVERFLOW: text does not fit its ${el.matches('td, th') ? 'table cell' : 'box'} ("${el.textContent.trim().slice(0, 30)}"): enlarge the box or shorten the text`);
      });
      // A formula stays on one line
      sec.querySelectorAll('.eq').forEach((el) => {
        if (el.scrollWidth <= el.clientWidth + 1) return;
        const cur = px(getComputedStyle(el).fontSize);
        const fit = Math.floor(cur * el.clientWidth / el.scrollWidth * 0.98 / 2) * 2;
        out.flags.push(fit >= 36
          ? `FORMULA too wide at ${Math.round(cur)}px: set style="font-size:${fit}px" on .eq`
          : 'FORMULA too wide even at 36px: crop it from the paper as a picture, or show only the part the slide is about');
      });
      // A slide whose message is a formula: the formula as large as the slide allows, and the panels under it large too.
      // The formula comes first: the text block gives way, down to its smallest size
      {
        const EQ_MAX = 96, EQ_WANT = 80, COLS_MAX = 60;
        const FLOOR = Math.max(cfg.min, 44);   // the text under a formula gives way, but not below this size
        const txts = [...sec.querySelectorAll('.txt')];
        const withTxt = (size, fn) => {
          const keep = txts.map((t) => t.style.fontSize);
          if (size) txts.forEach((t) => { t.style.fontSize = size + 'px'; });
          const v = fn();
          txts.forEach((t, k) => { t.style.fontSize = keep[k]; });
          return v;
        };
        const eqs = [...sec.querySelectorAll('.eq')];
        if (eqs.length === 1 && eqs[0].scrollWidth <= eqs[0].clientWidth + 1) {
          const el = eqs[0];
          const cur = Math.round(px(getComputedStyle(el).fontSize));
          const keep = el.style.fontSize;
          const wide = () => {
            const kids = [...el.children].filter((k) => k.getBoundingClientRect().width > 0);
            return kids.length ? kids[kids.length - 1].getBoundingClientRect().right - kids[0].getBoundingClientRect().left : 0;
          };
          const fitsAt = (s) => { el.style.fontSize = s + 'px'; return wide() <= el.clientWidth * 0.94 && extent().bottom <= cfg.bottom + 0.5; };
          let fit = null;
          for (let s = EQ_MAX; s > cur; s -= 2) if (fitsAt(s)) { fit = s; break; }
          if ((fit === null || fit < EQ_WANT) && cur < EQ_WANT) {
            // with the text under it at 44px, up to 80px
            const alt = withTxt(FLOOR, () => { for (let s = EQ_WANT; s > Math.max(cur, fit || 0); s -= 2) if (fitsAt(s)) return s; return null; });
            if (alt) fit = alt;
          }
          el.style.fontSize = keep;
          if (fit !== null && fit - cur >= 4) out.flags.push(`GROW: set .eq font-size:${fit}px (now ${cur}px). A formula is as large as the slide allows; then run again, set the text size the check names, and measure the connectors again (--where)`);
        }
        // The panels that explain the terms
        if (eqs.length) sec.querySelectorAll('.cols').forEach((cols) => {
          const cur = Math.round(px(getComputedStyle(cols).fontSize));
          const keep = cols.style.fontSize;
          const ps = [...cols.querySelectorAll('.panel p')];
          const count = () => ps.map((q) => linesOf(q).length);
          const base = count();
          const fitsAt = (s) => {
            cols.style.fontSize = s + 'px';
            const c = count();
            return c.every((n, k) => n <= base[k]) && ![...cols.querySelectorAll('.panel')].some((pn) => pn.scrollWidth > pn.clientWidth + 1)
              && !orphans(cols).length && extent().bottom <= cfg.bottom + 0.5;
          };
          let fit = null;
          for (let s = COLS_MAX; s > cur; s -= 2) if (fitsAt(s)) { fit = s; break; }
          if (fit === null) fit = withTxt(FLOOR, () => { for (let s = COLS_MAX; s > cur; s -= 2) if (fitsAt(s)) return s; return null; });
          cols.style.fontSize = keep;
          if (fit !== null && fit - cur >= 4) out.flags.push(`GROW: set .cols font-size:${fit}px (now ${cur}px). The panels under a formula are large too`);
        });
      }
      // Under a formula, each panel that explains a term starts with the term's name
      if (sec.querySelector('.eq .term')) {
        const untitled = [...sec.querySelectorAll('.panel')].filter((pn) => !pn.querySelector('.pt'));
        if (untitled.length) out.flags.push(`FORMULA: ${untitled.length} panel(s) under the formula have no title. Start each with the name of its term: <p class="pt">Name</p>, then one or two lines`);
        // An outline needs air: no character of the formula closer than 6px to a term's outline
        const pieces = [...sec.querySelectorAll('.eq p')].filter((q) => !q.classList.contains('tl'));
        sec.querySelectorAll('.eq .term').forEach((tm) => {
          const tr = tm.getBoundingClientRect();
          const near = pieces.find((q) => {
            const r = q.getBoundingClientRect();
            if (Math.min(r.bottom, tr.bottom) - Math.max(r.top, tr.top) <= 4) return false;
            if (tm.contains(q)) return r.left - tr.left < 10 || tr.right - r.right < 10;
            return r.right > tr.left - 6 && r.left < tr.right + 6;
          });
          if (near) out.flags.push(`FORMULA: the outline around "${tm.textContent.trim().slice(0, 16)}" touches "${near.textContent.trim().slice(0, 12)}". Keep the gap of .eq and the padding of .term as deck.css sets them, or make the formula smaller`);
          // The text in a box stays on the baseline of the pieces outside it
          const plain = (q) => !/\b(sb|sp|tl)\b/.test(q.className);
          const base = [...tm.querySelectorAll('p')].find(plain);
          const eq = tm.closest('.eq');
          const ref = base && [...eq.querySelectorAll('p')].find((q) => plain(q) && !q.closest('.term')
            && Math.abs(px(getComputedStyle(q).fontSize) - px(getComputedStyle(base).fontSize)) < 0.5);
          if (ref) {
            const lift = ref.getBoundingClientRect().bottom - base.getBoundingClientRect().bottom;
            if (Math.abs(lift) > 2) out.flags.push(`FORMULA: the text in the box around "${tm.textContent.trim().slice(0, 16)}" sits ${Math.round(Math.abs(lift))}px ${lift > 0 ? 'higher' : 'lower'} than the rest of the formula. The box's padding and border must not move it: give .term a negative bottom margin equal to its bottom padding plus its border, as deck.css does`);
          }
        });
      }
      // A template that requires its logo says so in deck.css: section { --logo: required }
      if (getComputedStyle(sec).getPropertyValue('--logo').trim() === 'required' && !sec.querySelector('img.logo'))
        out.flags.push('LOGO missing: every content slide starts with <img class="logo"> (assets/logo.png)');
    }

    // The cover of a template that requires its logos (deck.css: section { --logo: required }).
    // class="cover": the full cover for talks outside the lab, with both logos and the affiliations.
    // class="cover internal": talks inside the lab, with the presenter's name and the lab logo only.
    if (out.cover && getComputedStyle(sec).getPropertyValue('--logo').trim() === 'required') {
      const internal = sec.classList.contains('internal');
      const univ = sec.querySelector('img.cv-univ'), lab = sec.querySelector('img.cv-lab');
      if (!lab) out.flags.push('LOGO missing: the cover carries the lab logo, <img class="cv-lab"> (assets/logo-lab.png)');
      if (internal && univ) out.flags.push('COVER: an internal cover (class="cover internal") has no university logo. Remove <img class="cv-univ">, or use class="cover" for a talk outside the lab');
      const aff = [...sec.querySelectorAll('.cv-aff')].map((e) => e.textContent).join(' ');
      if (internal && (sec.querySelector('ol.cv-aff') || /University|Graduate School|Laborator|\bLab\b|大学|大學|研究科|研究室/i.test(aff)))
        out.flags.push('COVER: an internal cover shows the presenter\'s name only, with no affiliation. Remove the affiliation from .cv-aff (a line that names the paper of a paper reading may stay)');
      if (sec.querySelector('.cv-pnum, .pnum')) out.flags.push('COVER: the cover has no page number. Remove <p class="cv-pnum">');
      if (!internal && !univ) out.flags.push('COVER: the full cover carries both logos. For a talk inside the lab (lab meeting, 輪講, progress report) write class="cover internal"; for a talk outside it add <img class="cv-univ"> (assets/logo-univ.png)');
    }
    // Every visual has a line of text that says what it shows. A flow of steps is a visual like any other
    if (!out.cover) {
      const before = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      const lead = [...sec.querySelectorAll('.txt, .goal')];
      sec.querySelectorAll('.flow').forEach((fl) => {
        if (!lead.some((t) => before(t, fl))) out.flags.push('TEXT: the flow has no text above it. Put one or two short lines in a .txt block above the flow that say what it shows (what is tested and how). A slide is never a title and a flow alone');
      });
      const vis = sec.querySelector('.host, .fig, table, .dia, .ph');
      if (vis && !sec.querySelector('.flow') && !sec.querySelector('.txt, .goal, .cols'))
        out.flags.push('TEXT: the slide shows a visual with no line of text. Put one or two short lines above it that say what to look for');
    }
    // Abbreviations on this slide, and whether the slide explains them: "CFD (…)", "(… CFD …)" or "CFD: …"
    {
      const clone = sec.cloneNode(true);
      clone.querySelectorAll('aside, .cite, .pnum, .logo').forEach((e) => e.remove());
      clone.querySelectorAll('br').forEach((e) => e.replaceWith(' '));
      clone.querySelectorAll('p, li, td, th, h1, h2, h3, div').forEach((e) => e.append(' '));
      const text = clone.textContent.replace(/\s+/g, ' ');
      const found = text.match(/\b(?:[A-Z]{2,}[a-z0-9]*|[A-Z][a-z]+[A-Z0-9][A-Za-z0-9]*|[A-Z]+[0-9]+[A-Za-z0-9]*)\b/g) || [];
      out.abbr = [...new Set(found)].map((tok) => {
        const e = tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return { tok, defined: new RegExp(e + '(?:\\s+[\\w.-]+){0,2}\\s*[\\(（:：]|[\\(（][^\\)）]*' + e).test(text) };
      });
    }
    const ems = [...sec.querySelectorAll('.em')].filter((e) => !e.closest(CHROME));
    if (ems.length > 3) out.flags.push(`EMPHASIS: ${ems.length} red phrases on one slide; keep at most three`);
    if (ems.some((e) => e.textContent.trim().split(/\s+/).length > 6)) out.flags.push('EMPHASIS: a red phrase is longer than six words; stress only the key number or phrase');
    if (sec.querySelector('.ttl .em')) out.flags.push('EMPHASIS in the title: titles carry no emphasis');
    if (sec.querySelector('.bl.sub li b, .bl.sub li strong, .bl.sub li .k, .bl.sub li .bd'))
      out.flags.push('BOLD inside a level-two line: bold is for sub-headings; stress a key number with red emphasis instead');

    sec.querySelectorAll('.txt').forEach((txt) => {
      const pcls = txt.parentElement.classList;
      if (!(txt.parentElement === sec || pcls.contains('split') || pcls.contains('stack'))) {
        out.flags.push('.txt must be a direct child of the slide, .split or .stack');
        return;
      }
      const cur = Math.round(px(getComputedStyle(txt).fontSize));
      const avail = available(txt);
      const fillNow = contentHeight(txt) / avail;
      const keep = txt.style.fontSize;
      let fit = null, best = null, fillBest = null;
      const fits = (s) => { txt.style.fontSize = s + 'px'; return contentHeight(txt) <= avail * cfg.safety && !tooWide(txt); };
      for (let s = cfg.max; s >= cfg.min; s -= 2) if (fits(s)) { fit = s; break; }
      const fillFit = fit !== null ? contentHeight(txt) / avail : null;   // how full the block can get
      // Prefer a size, up to 6px smaller, at which no line ends in a single word
      let cleanAtBest = false;
      if (fit !== null) {
        best = fit;
        for (let s = fit; s >= Math.max(cfg.min, fit - 6); s -= 2) if (fits(s) && !orphans(txt).length) { best = s; cleanAtBest = true; break; }
        txt.style.fontSize = best + 'px';
        fillBest = contentHeight(txt) / avail;
      }
      txt.style.fontSize = keep;
      const lone = orphans(txt);
      const t = { cur, best, fill: Math.round(fillNow * 100), fillBest: best ? Math.round(fillBest * 100) : null };
      out.txt.push(t);
      if (best === null) out.flags.push(`TEXT TOO LONG: does not fit even at ${cfg.min}px. Move detail to the notes or split the slide`);
      else if (cur > fit) out.flags.push(`TEXT TOO BIG at ${cur}px (fits at ${best}px). Prefer cutting text; otherwise set font-size:${best}px`);
      else if (lone.length && cleanAtBest && best !== cur) out.flags.push(`ORPHAN: "${lone[0].word}" stands alone on the last line of "${lone[0].line}": set .txt font-size:${best}px (no line then ends in a single word), or ${WIDER}`);
      else if (lone.length) lone.forEach((o) => out.flags.push(`ORPHAN: "${o.word}" stands alone on the last line of "${o.line}": ${WIDER}`));
      else if (best - cur >= cfg.step && cleanAtBest) out.flags.push(`GROW: set .txt font-size:${best}px (now ${cur}px, fill ${t.fill}% -> ${t.fillBest}%)`);
      else if (fit - cur >= cfg.step && fillNow < 0.8) {
        // Room to grow, but at the larger size a line would end in a single word: the wording has to change first
        txt.style.fontSize = fit + 'px';
        const lf = orphans(txt);
        txt.style.fontSize = keep;
        out.flags.push(lf.length
          ? `GROW: the text fits at ${fit}px (now ${cur}px, fill ${t.fill}% -> ${Math.round(fillFit * 100)}%), but "${lf[0].word}" would then stand alone on the last line of "${lf[0].line}". Reword that line so it breaks evenly or fits on one line, then set .txt font-size:${fit}px`
          : `GROW: set .txt font-size:${fit}px (now ${cur}px, fill ${t.fill}% -> ${Math.round(fillFit * 100)}%)`);
      }
      // Under the text a flow of boxes or a row of panels stretches to the bottom of the slide, so the text is never lost there
      const filler = txt.parentElement === sec && [...sec.children].some((k) => k !== txt && k.matches('.flow, .cols') && getComputedStyle(k).flexGrow !== '0');
      if (!filler && best !== null && cur <= best && fillFit < (txt.parentElement === sec ? cfg.lowFillSolo : cfg.lowFill))
        out.flags.push(`UNDERFILL: only ${Math.round(fillFit * 100)}% even at ${fit}px. Rebalance the layout (see "Fill the slide", step 5)`);
    });
    if (cfg.where) {
      try {
        out.where = [...sec.querySelectorAll(cfg.where)].map((el) => {
          const r = el.getBoundingClientRect();
          return { what: (el.className || el.tagName).toString().split(' ')[0] + ' "' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 22) + '"',
            x: Math.round(r.left - sr.left), y: Math.round(r.top - sr.top), w: Math.round(r.width), h: Math.round(r.height) };
        });
      } catch (e) { out.where = []; }
    }
    out.visual = !!sec.querySelector('img:not(.logo), table, .flow, .dia, .host, .eq, .ph, svg:not(.xconn)');
    return out;
  });
}

(async () => {
  const html = buildPage();
  const browser = await chromium.launch({ args: ['--host-resolver-rules=MAP * ^NOTFOUND'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, javaScriptEnabled: false });
  const page = await context.newPage();
  let first = true;
  await page.route('**/*', (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (req.isNavigationRequest()) {
      if (!first) return route.abort('aborted');
      first = false;
      return route.fulfill({ body: withFont(html), contentType: 'text/html; charset=utf-8' });
    }
    // Deck files (the stylesheet, and pictures kept in project/img/) are served; nothing else is
    const MIME = { '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
    const projectDir = path.resolve(root, 'project');
    const f = u.pathname.startsWith('/project/') ? path.resolve(root, '.' + decodeURIComponent(u.pathname)) : null;
    const type = f && MIME[path.extname(f).toLowerCase()];
    if (type && f.startsWith(projectDir + path.sep) && fs.existsSync(f) && fs.statSync(f).isFile())
      return route.fulfill({ body: type === 'text/css' ? withFont(fs.readFileSync(f, 'utf8')) : fs.readFileSync(f), contentType: type });
    return route.abort('aborted'); // uploaded pictures (/_blob/...) and web fonts are not available locally
  });
  await page.goto('http://deck.local/', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const info = await page.evaluate(probe, fontSafe);
  const margin = marginArg !== null ? marginArg : (fontSafe && info.share > 0.3 ? 0.08 : 0);
  if (margin) {
    // Wider characters while measuring: PowerPoint needs a little more width for the same text
    await page.evaluate((m) => {
      const st = document.createElement('style');
      st.textContent = `body > section, body > section * { letter-spacing: ${m}em !important }`;
      document.head.appendChild(st);
    }, margin);
  }

  const rows = await page.evaluate(measure, { ...cfg, where });
  let bad = 0;
  console.log(['#', 'id', 'top', 'bottom', 'size', 'best', 'fill'].join('\t'));
  for (const r of rows) {
    const t = r.txt[0];
    console.log([r.n, r.id, r.top ?? '-', r.bottom || '-', t ? t.cur : '-', t && t.best ? t.best : '-', t ? t.fill + '%' : '-'].join('\t'));
    for (const f of r.flags) { bad++; console.log('\t! ' + f); }
    for (const f of r.notes || []) console.log('\t~ ' + f);   // worth knowing, not a fault
    // Slide coordinates: left, top, width, height, then the middle of the top and of the bottom edge
    for (const b of r.where || []) console.log(`\t@ ${b.what}: x ${b.x} y ${b.y} w ${b.w} h ${b.h} | top-mid ${b.x + Math.round(b.w / 2)},${b.y} bottom-mid ${b.x + Math.round(b.w / 2)},${b.y + b.h}`);
  }
  // Slides that are text only: fine for a few, a sign of a wall of bullets when there are many
  const content = rows.filter((r) => !r.cover);
  const plain = content.filter((r) => !r.visual);
  if (content.length >= 6 && plain.length > content.length / 3) {
    bad++;
    console.log(`\n! TEXT ONLY: ${plain.length} of ${content.length} content slides have no figure, table, formula or diagram (${plain.map((r) => r.id).join(', ')}). Give most of them one: see "Show the shape of the content"`);
  } else if (plain.length) {
    console.log(`\nNote: text-only slides: ${plain.map((r) => r.id).join(', ')}. Check that none of them would be clearer as a diagram, a table or a figure.`);
  }
  // Abbreviations whose first appearance in the deck has no explanation on that slide
  const seen = new Set(), unexplained = [];
  for (const r of rows) {
    if (r.cover) continue;
    for (const a of r.abbr || []) {
      const key = a.tok.replace(/s$/, '');
      if (seen.has(key)) continue;
      seen.add(key);
      if (!a.defined) unexplained.push(`${a.tok} (slide ${r.n})`);
    }
  }
  if (unexplained.length) console.log(`\nNote: first shown without an explanation on the slide: ${unexplained.slice(0, 16).join(', ')}${unexplained.length > 16 ? ', ...' : ''}. Explain an abbreviation in a few words where the audience first sees it, on the slide and not only in the notes, unless every listener knows it.`);
  if (margin) console.log(`\nPowerPoint margin: measured with every character ${margin} em wider (--margin), so the sizes above leave room for PowerPoint's wider text. Export with the same value.`);
  if (fontSafe && !info.installed) console.log(`\nNote: the font "${fontSafe}" is not installed on this machine, so this check measured with another font. Run it where the font is installed, or trust only the rendered PowerPoint file.`);
  if (fontSafe) console.log('\nPowerPoint deck: after exporting, render the .pptx with PowerPoint or LibreOffice and look at every slide. A clean result here does not show how PowerPoint breaks the lines.');
  console.log(bad ? `\n${bad} thing(s) to fix. Fix them and run again.` : '\nLayout clean.');

  // "Method 1", "Method 2": a label with only a number says nothing about the slide
  const KINDS = /^(methods?|results?|background|experiments?|evaluation|approach|analysis|discussion|方法|結果|结果|背景|前提知識|實驗|实验|手法|提案手法|実験|評価)$/i;
  const bare = {};
  for (const r of rows) {
    const m = r.title && !/[:：]/.test(r.title) && /^(.+?)\s*(?:\d+|[\u2460-\u2473])$/.exec(r.title);
    if (m && KINDS.test(m[1].trim())) (bare[m[1]] = bare[m[1]] || []).push(r.title);
  }
  for (const [label, list] of Object.entries(bare)) {
    if (list.length > 1) console.log(`Note: ${list.length} titles are "${label}" plus a number (${list.join(', ')}). Name each slide by its topic instead, for example "Training cost".`);
  }

  if (shots) {
    fs.mkdirSync(shots, { recursive: true });
    const secs = await page.$$('body > section');
    for (let i = 0; i < secs.length; i++) {
      await secs[i].scrollIntoViewIfNeeded();
      await secs[i].screenshot({ path: path.join(shots, String(i + 1).padStart(2, '0') + '-' + rows[i].id + '.png'), animations: 'disabled' });
    }
    console.log(`Screenshots: ${shots} (uploaded pictures show as empty boxes locally)`);
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(2); });
