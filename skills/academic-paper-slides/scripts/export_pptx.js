#!/usr/bin/env node
// export_pptx.js <deck_root> <out.pptx> [--font "Arial"]
//
// Turns a deck (project/deck.json, project/deck.css, project/slides/*.html) into an
// editable PowerPoint file. The deck is rendered locally, every element is measured,
// and each one is written as a native PowerPoint object at the same place:
//   .txt block      -> ONE text box with real bullets and numbering (easy to edit)
//   title, source   -> text boxes        table -> PowerPoint table
//   figure          -> picture           ring / badge / rule -> shapes
//   flow box        -> rounded rectangle with its text inside
//   <aside>         -> speaker notes     page number -> slide-number field
// The same file opens in Google Slides (upload it to Drive, or File > Import slides).
//
// Images must be local files inside the deck, referenced as /project/img/<name>.
// A picture that is not a local file becomes a grey placeholder with its alt text.
// Needs: playwright (with Chromium) and pptxgenjs. No network, page scripts off.
// Exit code 0 = written, 2 = could not run.

const fs = require('fs');
const path = require('path');

function need(name) {
  try { return require(name); } catch (e) {
    console.error(`${name} is not installed here. Install it (npm i ${name}) or run this where it exists.`);
    process.exit(2);
  }
}
const { chromium } = need('playwright');
const PptxGenJS = need('pptxgenjs');

const argv = process.argv.slice(2);
const root = argv[0];
const out = argv[1];
const fontArg = argv.indexOf('--font') > 0 ? argv[argv.indexOf('--font') + 1] : null;
if (!root || !out || !fs.existsSync(path.join(root, 'project', 'deck.json'))) {
  console.error('usage: export_pptx.js <deck_root> <out.pptx> [--font "Arial"]');
  process.exit(2);
}
const projectDir = path.resolve(root, 'project');

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
].join('\n');
const MIME = { '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

// A deck file addressed as /project/<path>; null if it is missing or outside the deck.
function deckFile(urlPath) {
  if (!urlPath.startsWith('/project/')) return null;
  const p = path.resolve(root, '.' + decodeURIComponent(urlPath));
  if (!p.startsWith(projectDir + path.sep) || !fs.existsSync(p) || !fs.statSync(p).isFile()) return null;
  return p;
}

const deck = JSON.parse(fs.readFileSync(path.join(root, 'project', 'deck.json'), 'utf8'));
function buildPage() {
  const parts = ["<!doctype html><html><head><meta charset='utf-8'><style>" + BASE_CSS + '</style>',
    "<link rel='stylesheet' href='/project/deck.css'></head><body>"];
  for (const id of deck.order || []) {
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) continue;
    const f = path.join(root, 'project', 'slides', id + '.html');
    if (fs.existsSync(f)) parts.push(fs.readFileSync(f, 'utf8'));
  }
  parts.push('</body></html>');
  return parts.join('\n');
}

// Runs inside the page: describe every slide as a flat list of drawable items.
function extract() {
  const px = (v) => parseFloat(v) || 0;
  const hex = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!m) return null;
    const p = m[1].split(',').map((s) => parseFloat(s));
    if (p.length > 3 && p[3] === 0) return null;
    return p.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, '0')).join('').toUpperCase();
  };
  const bold = (cs) => (parseInt(cs.fontWeight, 10) || 400) >= 600;
  const family = (cs) => cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
  let xid = 0;

  return [...document.querySelectorAll('body > section')].map((sec) => {
    const sr = sec.getBoundingClientRect();
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height };
    };
    // Circled numbers (.circ) are drawn as shapes, because fonts draw the character for them at very different sizes
    const circs = [];
    const textAfter = (n, el) => {     // x of the first visible character that follows n inside el
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let t;
      while ((t = w.nextNode())) {
        if (n.contains(t) || !(n.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        const k = t.textContent.search(/\S/);
        if (k < 0) continue;
        const rg = document.createRange();
        rg.setStart(t, k); rg.setEnd(t, k + 1);
        return rg.getBoundingClientRect().left - sr.left;
      }
      return null;
    };
    // Inline content of a paragraph as styled runs. With shapes = true a circled number at the start or the end
    // of the line leaves the text and becomes a shape; `lead` is then where the text after it starts.
    // Anywhere else (inside a line, in a list item, in a table) it stays in the text as its character.
    const runs = (el, shapes) => {
      const outRuns = [];
      let lead = null, strip = false;
      const walk = (node, st) => {
        node.childNodes.forEach((n) => {
          if (n.nodeType === 3) {
            let t = n.textContent.replace(/\s+/g, ' ');
            if (strip) { t = t.replace(/^ +/, ''); if (t) strip = false; }
            if (t) outRuns.push({ text: t, ...st });
          } else if (n.nodeType === 1) {
            if (n.tagName === 'BR') { outRuns.push({ text: '\n', ...st }); return; }
            if (/^(UL|OL|ASIDE)$/.test(n.tagName)) return;
            const cs = getComputedStyle(n);
            if (n.classList.contains('circ')) {
              const label = n.textContent.trim();
              const k = parseInt(label, 10);
              const first = !outRuns.some((r) => r.text.trim());
              const x = textAfter(n, el);
              if (shapes && (x === null || (first && lead === null))) {
                circs.push({ type: 'circ', r: rect(n), text: label, color: hex(cs.color), size: px(cs.fontSize), linePx: px(cs.borderTopWidth) });
                if (x !== null) { lead = x; strip = true; }
              } else {
                outRuns.push({ text: k >= 1 && k <= 20 ? String.fromCharCode(0x2460 + k - 1) : `(${label})`, ...st });
              }
              return;
            }
            walk(n, { bold: bold(cs), italic: cs.fontStyle === 'italic',
              underline: cs.textDecorationLine.includes('underline'), color: hex(cs.color),
              sub: n.tagName === 'SUB' || !!st.sub, sup: n.tagName === 'SUP' || !!st.sup });
          }
        });
      };
      const cs = getComputedStyle(el);
      walk(el, { bold: bold(cs), italic: cs.fontStyle === 'italic', underline: false, color: hex(cs.color) });
      if (outRuns.length) {
        outRuns[0].text = outRuns[0].text.replace(/^ +/, '');
        outRuns[outRuns.length - 1].text = outRuns[outRuns.length - 1].text.replace(/ +$/, '');
      }
      return { list: outRuns.filter((r) => r.text !== ''), lead };
    };
    // The box the text itself occupies: the element's box without its padding
    const inner = (el) => {
      const r = rect(el), cs = getComputedStyle(el);
      const l = px(cs.paddingLeft), t = px(cs.paddingTop);
      return { x: r.x + l, y: r.y + t, w: r.w - l - px(cs.paddingRight), h: r.h - t - px(cs.paddingBottom) };
    };
    const para = (el, extra) => {
      const cs = getComputedStyle(el);
      const lh = cs.lineHeight === 'normal' ? px(cs.fontSize) * 1.2 : px(cs.lineHeight);
      const a = cs.textAlign;
      const rr = runs(el, el.tagName !== 'LI'), box = inner(el);
      // Text after a circled number gets its own box, starting where that text starts
      if (rr.lead !== null) { box.w -= rr.lead - box.x; box.x = rr.lead; }
      return { runs: rr.list, own: rr.lead !== null, size: px(cs.fontSize), line: lh, r: box,
        align: a === 'center' ? 'center' : (a === 'right' || a === 'end') ? 'right' : 'left', ...extra };
    };
    // Paragraphs of a text container, in reading order, with the measured gap before each
    const paras = (box) => {
      const list = [];
      box.querySelectorAll('li, p, h1, h2, h3').forEach((el) => {
        if (el.closest('table') || (el.tagName !== 'LI' && el.closest('li'))) return;
        const ul = el.tagName === 'LI' ? el.parentElement : null;
        const number = ul && ul.tagName === 'OL'
          ? (parseInt(ul.getAttribute('start'), 10) || 1) + [...ul.children].indexOf(el) : null;
        list.push(para(el, { bullet: !!ul, number, level: ul && ul.classList.contains('sub') ? 1 : 0,
          indent: ul ? px(getComputedStyle(ul).paddingLeft) : 0 }));
      });
      list.forEach((p, i) => { p.before = i ? Math.max(0, p.r.y - (list[i - 1].r.y + list[i - 1].r.h)) : 0; });
      return list;
    };

    const items = [];
    const visit = (el) => {
      if (el.tagName === 'ASIDE') return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = rect(el);
      const tag = el.tagName.toUpperCase();
      const cl = el.classList;
      if (cl.contains('pnum')) { items.push({ type: 'pnum', r, size: px(cs.fontSize), color: hex(cs.color), bold: bold(cs) }); return; }
      if (cl.contains('txt')) {
        const ps = paras(el);
        if (ps.length) {
          const top = ps[0].r.y, bottom = ps[ps.length - 1].r.y + ps[ps.length - 1].r.h;
          items.push({ type: 'textblock', r: { x: r.x, y: top, w: r.w, h: bottom - top }, paras: ps });
        }
        el.querySelectorAll('table, img, svg, x-shape').forEach(visit);
        return;
      }
      if (tag === 'TABLE') {
        const rows = [...el.querySelectorAll('tr')].map((tr) => ({
          h: tr.getBoundingClientRect().height, fill: hex(getComputedStyle(tr).backgroundColor),
          head: tr.querySelector('th') !== null,
          cells: [...tr.children].map((c) => {
            const ccs = getComputedStyle(c);
            const a = ccs.textAlign;
            return { runs: runs(c, false).list, w: c.getBoundingClientRect().width, bold: bold(ccs), color: hex(ccs.color),
              align: a === 'center' ? 'center' : (a === 'right' || a === 'end') ? 'right' : 'left',
              padX: px(ccs.paddingLeft), padY: px(ccs.paddingTop) };
          }),
        }));
        items.push({ type: 'table', r, rows, size: px(cs.fontSize), ink: hex(cs.color) });
        return;
      }
      if (cl.contains('card')) {
        items.push({ type: 'card', r, fill: hex(cs.backgroundColor) || 'FFFFFF', line: hex(cs.borderTopColor),
          linePx: px(cs.borderTopWidth), radius: px(cs.borderTopLeftRadius),
          padX: px(cs.paddingLeft), padY: px(cs.paddingTop), paras: paras(el) });
        el.querySelectorAll('img, svg').forEach(visit);
        return;
      }
      if (cl.contains('badge')) {
        items.push({ type: 'badge', r, fill: hex(cs.backgroundColor), line: hex(cs.borderTopColor),
          linePx: px(cs.borderTopWidth), color: hex(cs.color), size: px(cs.fontSize), text: el.textContent.trim() });
        return;
      }
      if (tag === 'IMG') {
        const u = el.getAttribute('src') ? new URL(el.src) : null;
        if (!el.naturalWidth && el.style.width && el.style.height) { r.w = px(el.style.width); r.h = px(el.style.height); }
        items.push({ type: 'image', r, path: u ? u.pathname : null, alt: el.alt || '',
          nw: el.naturalWidth, nh: el.naturalHeight, fit: cs.objectFit });
        return;
      }
      if (tag === 'SVG') { el.setAttribute('data-xid', String(++xid)); items.push({ type: 'svg', r, xid }); return; }
      if (tag === 'X-SHAPE') {
        items.push({ type: 'shape', r, kind: el.getAttribute('kind') || 'rect', fill: hex(cs.backgroundColor),
          line: px(cs.borderTopWidth) ? hex(cs.borderTopColor) : null, linePx: px(cs.borderTopWidth) });
        return;
      }
      if (/^(P|H1|H2|H3)$/.test(tag)) {
        const p = para(el, {});
        if (p.runs.length) items.push({ type: 'text', r: p.r, para: p, nowrap: cs.whiteSpace === 'nowrap', fill: hex(cs.backgroundColor) });
        return;
      }
      if (tag === 'UL' || tag === 'OL') {
        const ps = paras(el);
        if (ps.length) items.push({ type: 'textblock', r, paras: ps });
        return;
      }
      if (el !== sec) {
        const fill = hex(cs.backgroundColor);
        if (fill && r.w > 0 && r.h > 0) items.push({ type: 'rect', r, fill });
      }
      [...el.children].forEach(visit);
    };
    visit(sec);
    items.push(...circs);

    const aside = sec.querySelector(':scope > aside');
    const scs = getComputedStyle(sec);
    return { id: sec.id, bg: hex(scs.backgroundColor) || 'FFFFFF', ink: hex(scs.color) || '222222',
      font: family(scs), items, notes: aside ? aside.textContent.replace(/\s+/g, ' ').trim() : '' };
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
      return route.fulfill({ body: html, contentType: 'text/html; charset=utf-8' });
    }
    const f = deckFile(u.pathname);
    const type = f && MIME[path.extname(f).toLowerCase()];
    if (f && type) return route.fulfill({ body: fs.readFileSync(f), contentType: type });
    return route.abort('aborted');
  });
  await page.goto('http://deck.local/', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const slides = await page.evaluate(extract);

  // Vector drawings are placed as pictures of themselves
  const svgPng = {};
  for (const s of slides) for (const it of s.items) {
    if (it.type !== 'svg') continue;
    const buf = await page.locator(`[data-xid="${it.xid}"]`).screenshot({ omitBackground: true });
    svgPng[it.xid] = 'image/png;base64,' + buf.toString('base64');
  }
  await browser.close();

  const IN = (v) => v / 144;   // 1920 px = 13.333 in
  const PT = (v) => v / 2;     // so 2 px = 1 pt
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = deck.title || 'Slides';
  const SHAPES = { ellipse: 'ellipse', rect: 'rect', rounded: 'roundRect', diamond: 'diamond', line: 'line',
    'arrow-right': 'rightArrow', 'arrow-left': 'leftArrow', 'arrow-up': 'upArrow', 'arrow-down': 'downArrow' };
  const box = (r) => ({ x: IN(r.x), y: IN(r.y), w: IN(r.w), h: IN(r.h) });
  let missing = 0;
  const bulletFix = [];        // per slide: the indent each bulleted paragraph should have, in order

  for (const s of slides) {
    const slide = pptx.addSlide();
    bulletFix.push([]);
    const font = fontArg || s.font || 'Arial';
    slide.background = { color: s.bg };

    // One paragraph -> pptxgenjs text runs; the last run carries the paragraph settings
    const toRuns = (p, isLast) => {
      if (p.bullet) {            // text starts where the list's padding ends; the marker hangs 0.6em before it
        const left = p.indent || 46;
        bulletFix[bulletFix.length - 1].push({ marL: left, hang: Math.min(left, (p.number ? 1.1 : 0.8) * p.size) });   // markers end just before the text
      }
      // A <br> becomes a soft break in front of the run that follows it
      const parts = [];
      let brk = false;
      for (const r of p.runs) {
        if (r.text === '\n') { brk = true; continue; }
        parts.push(brk ? { ...r, brk: true } : r);
        brk = false;
      }
      if (!parts.length) parts.push({ text: '' });
      return parts.map((r, i) => {
        const o = { fontFace: font, fontSize: PT(p.size), bold: !!r.bold, italic: !!r.italic,
          color: r.color || s.ink, align: p.align, lineSpacing: PT(p.line), paraSpaceBefore: PT(p.before || 0) };
        if (r.underline) o.underline = { style: 'sng' };
        if (r.sub) o.subscript = true;
        if (r.sup) o.superscript = true;
        if (r.brk) o.softBreakBefore = true;
        if (p.bullet) {
          o.bullet = p.number ? { type: 'number', style: 'arabicPeriod', numberStartAt: p.number, indent: PT(p.indent || 64) }
            : { characterCode: '2022', indent: PT(p.indent || 46) };
          o.indentLevel = p.level || 0;
        }
        if (i === parts.length - 1 && !isLast) o.breakLine = true;
        return { text: r.text, options: o };
      });
    };
    const body = (ps) => ps.flatMap((p, i) => toRuns(p, i === ps.length - 1));

    for (const it of s.items) {
      if (it.type === 'rect') {
        slide.addShape('rect', { ...box(it.r), fill: { color: it.fill }, line: { type: 'none' } });
      } else if (it.type === 'text') {
        const o = { ...box(it.r), margin: 0, valign: 'top', wrap: !it.nowrap, fit: 'none' };
        if (it.fill && it.fill !== s.bg) o.fill = { color: it.fill };
        slide.addText(toRuns(it.para, true), o);
      } else if (it.type === 'textblock') {
        slide.addText(body(it.paras), { ...box(it.r), margin: 0, valign: 'top', fit: 'none' });
      } else if (it.type === 'pnum') {
        slide.slideNumber = { ...box(it.r), fontFace: font, fontSize: PT(it.size), color: it.color || s.ink,
          bold: it.bold, align: 'center' };
      } else if (it.type === 'card') {
        slide.addShape('roundRect', { ...box(it.r), fill: { color: it.fill },
          line: { color: it.line || s.ink, width: PT(it.linePx) }, rectRadius: IN(it.radius) });
        const inner = { x: it.r.x + it.padX, y: it.r.y + it.padY, w: it.r.w - 2 * it.padX, h: it.r.h - 2 * it.padY };
        // A line that follows a circled number is its own text box; the lines between such lines share one
        const groups = [];
        it.paras.forEach((p) => {
          const g = groups[groups.length - 1];
          if (p.own || !g || g.own) groups.push({ own: p.own, ps: [p] }); else g.ps.push(p);
        });
        groups.forEach((g, k) => {
          const f = g.ps[0], l = g.ps[g.ps.length - 1];
          const r = g.own ? f.r : { x: inner.x, y: k ? f.r.y : inner.y, w: inner.w, h: l.r.y + l.r.h - (k ? f.r.y : inner.y) };
          slide.addText(body(g.ps.map((p, j) => (j ? p : { ...p, before: 0 }))), { ...box(r), margin: 0, valign: 'top', fit: 'none' });
        });
      } else if (it.type === 'badge') {
        slide.addText(it.text, { ...box(it.r), shape: 'ellipse', fill: { color: it.fill || s.ink },
          line: { color: it.line || 'FFFFFF', width: PT(it.linePx) }, fontFace: font, fontSize: PT(it.size),
          bold: true, color: it.color || 'FFFFFF', align: 'center', valign: 'middle', margin: 0 });
      } else if (it.type === 'circ') {
        // The line of a shape is centered on its edge; a CSS border lies inside it
        const h = it.linePx / 2;
        slide.addText(it.text, { ...box({ x: it.r.x + h, y: it.r.y + h, w: it.r.w - it.linePx, h: it.r.h - it.linePx }),
          shape: 'ellipse', line: { color: it.color || s.ink, width: PT(it.linePx) }, fontFace: font, fontSize: PT(it.size),
          bold: true, color: it.color || s.ink, align: 'center', valign: 'middle', margin: 0, wrap: false, fit: 'none' });
      } else if (it.type === 'shape') {
        const o = { ...box(it.r) };
        o.fill = it.fill ? { color: it.fill } : { type: 'none' };
        o.line = it.line ? { color: it.line, width: PT(it.linePx) } : { type: 'none' };
        slide.addShape(SHAPES[it.kind] || 'rect', o);
      } else if (it.type === 'svg') {
        slide.addImage({ data: svgPng[it.xid], ...box(it.r) });
      } else if (it.type === 'image') {
        const file = it.path ? deckFile(it.path) : null;
        if (!file || !it.nw) {
          missing++;
          slide.addShape('rect', { ...box(it.r), fill: { color: 'EEEEEE' }, line: { color: 'BBBBBB', width: 1 } });
          slide.addText(`[picture: ${it.alt || it.path || 'no file'}]`, { ...box(it.r), fontFace: font, fontSize: 14,
            color: '666666', align: 'center', valign: 'middle' });
          continue;
        }
        let r = it.r;
        if (it.fit === 'contain') {            // keep the picture's proportions inside its frame
          const k = Math.min(it.r.w / it.nw, it.r.h / it.nh);
          const w = it.nw * k, h = it.nh * k;
          r = { x: it.r.x + (it.r.w - w) / 2, y: it.r.y + (it.r.h - h) / 2, w, h };
        }
        slide.addImage({ path: file, ...box(r) });
      } else if (it.type === 'table') {
        const line = { type: 'solid', pt: 1, color: 'A6A6A6' };   // grid lines, as Slides draws them
        const rows = it.rows.map((row) => row.cells.map((c) => ({
          text: c.runs.map((r) => r.text).join(''),
          options: { fontFace: font, fontSize: PT(it.size), bold: row.head || c.bold, color: c.color || s.ink,
            align: c.align, valign: 'middle', margin: [PT(c.padY), PT(c.padX), PT(c.padY), PT(c.padX)],
            fill: row.fill && row.fill !== s.bg ? { color: row.fill } : undefined,
            border: [line, line, line, line] },
        })));
        slide.addTable(rows, { x: IN(it.r.x), y: IN(it.r.y), w: IN(it.r.w),
          colW: it.rows[0].cells.map((c) => IN(c.w)), rowH: it.rows.map((row) => IN(row.h)) });
      }
    }
    if (s.notes) slide.addNotes(s.notes);
  }

  // pptxgenjs derives a bullet's indent from its level alone. Rewrite each bulleted paragraph's
  // indent to the measured one so both levels sit exactly where the deck puts them.
  let data = await pptx.write({ outputType: 'nodebuffer' });
  try {
    const JSZip = require(require.resolve('jszip', { paths: [path.dirname(require.resolve('pptxgenjs'))] }));
    const zip = await JSZip.loadAsync(data);
    const EMU = (v) => Math.round(v * 6350);   // px -> EMU
    let ok = true;
    for (let i = 0; i < bulletFix.length; i++) {
      const name = `ppt/slides/slide${i + 1}.xml`;
      let xml = await zip.file(name).async('string');
      // A paragraph with several runs (a red or bold span inside a line) must carry its settings once
      xml = xml.replace(/<a:p>([\s\S]*?)<\/a:p>/g, (m, inner) => {
        let seen = false;
        return '<a:p>' + inner.replace(/<a:pPr\b[^>]*?(?:\/>|>[\s\S]*?<\/a:pPr>)/g, (pp) => (seen ? '' : ((seen = true), pp))) + '</a:p>';
      });
      const found = xml.match(/marL="\d+" indent="-\d+"/g) || [];
      if (found.length !== bulletFix[i].length) { ok = false; break; }
      let k = 0;
      const face = String(fontArg || slides[i].font || 'Arial').replace(/[<>&"]/g, '');
      zip.file(name, xml.replace(/marL="\d+" indent="-\d+"/g, () => {
        const f = bulletFix[i][k++];
        return `marL="${EMU(f.marL)}" indent="-${EMU(f.hang)}"`;
      // Name the bullet's font, so every bullet is drawn the same size and height as the text
      }).replace(/(<a:buFont [^>]*\/>)?<a:buChar /g, `<a:buFont typeface="${face}"/><a:buChar `)
        .replace(/<a:buFont typeface="\+mj-lt"\/>/g, `<a:buFont typeface="${face}"/>`));
    }
    if (ok) data = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    else console.log('Note: bullet indents were left at the library defaults (unexpected file layout).');
  } catch (e) {
    console.log('Note: bullet indents were left at the library defaults (' + e.message + ').');
  }
  fs.writeFileSync(path.resolve(out), data);
  console.log(`Wrote ${out}: ${slides.length} slides.`);
  if (missing) console.log(`${missing} picture(s) were not local files and became placeholders. Put them in project/img/ and use src="/project/img/<name>".`);
})().catch((e) => { console.error(e.message); process.exit(2); });
