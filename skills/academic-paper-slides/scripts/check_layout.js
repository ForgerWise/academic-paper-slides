#!/usr/bin/env node
// check_layout.js <deck_root> [--shots <dir>] [--min 36] [--max 54]
//
// Renders a Slides deck locally (no network, page scripts off) and reports per slide:
//   - top and bottom edge of the content (must stay inside y = 221..990)
//   - for every .txt block: how much of its available height it fills, its current
//     font size, and the largest size between --min and --max that still fits
//   - rule breaks that are mechanical: wrapped title, colon in title, nested <ul>
// Exit code 0 = clean, 1 = something to fix, 2 = could not run.
//
// <deck_root> is the folder that contains project/deck.json.
// Images are not available locally. That is fine: every figure has a px width and
// height, so the layout boxes are still correct.

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
  console.error('usage: check_layout.js <deck_root> [--shots <dir>] [--min 36] [--max 54]');
  process.exit(2);
}
const cfg = {
  min: Number(opt('--min', 36)),
  max: Number(opt('--max', 54)),
  top: 221,        // first usable y of a content slide
  bottom: 990,     // last usable y of a content slide
  safety: 0.96,    // local fallback fonts differ a little from the deck's fonts
  lowFill: 0.7,    // below this the text block looks lost beside or above its figure
  lowFillSolo: 0.55, // text-only slide: top-aligned text may leave more room below
  step: 4,         // ignore size gains smaller than this; real fonts shift line breaks a little
};
const shots = opt('--shots', null);

// Same base rules the Slides preview uses, so local boxes match the real page closely.
const BASE_CSS = [
  '* { margin: 0 }',
  'body { font: 32px/1.2 sans-serif }',
  'body > section { width: 1920px !important; height: 1080px !important; overflow: hidden !important;',
  '  box-sizing: border-box !important; position: relative; isolation: isolate }',
  'section[hidden], aside, noscript { display: none !important }',
  'h1 { font-size: 96px; font-weight: 600 } h2 { font-size: 64px; font-weight: 600 } h3 { font-size: 44px; font-weight: 600 }',
  'p, li, h1, h2, h3, td, th { overflow-wrap: break-word }',
  'table { width: 100%; border-collapse: separate; border-spacing: 0 }',
  'th, td { padding: .35em .6em; text-align: left }',
  'x-shape, x-icon, x-embed { display: block }',
].join('\n');

function buildPage() {
  const deck = JSON.parse(fs.readFileSync(path.join(root, 'project', 'deck.json'), 'utf8'));
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

// Runs inside the page.
function measure(cfg) {
  const CHROME = '.cite,.ttl,.pnum,.logo,.rule,aside';
  const px = (v) => parseFloat(v) || 0;
  const contentHeight = (el) => {
    const kids = [...el.children].filter((k) => k.getBoundingClientRect().height > 0);
    if (!kids.length) return 0;
    return kids[kids.length - 1].getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top;
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
    const others = flow.filter((k) => k !== txt).reduce((a, k) => a + k.getBoundingClientRect().height, 0);
    return inner - others - px(cs.rowGap) * Math.max(0, flow.length - 1);
  };
  const tooWide = (txt) => [txt, ...txt.querySelectorAll('ul,li,p,div,table')]
    .some((el) => el.scrollWidth > el.clientWidth + 1);

  return [...document.querySelectorAll('body > section')].map((sec, i) => {
    const sr = sec.getBoundingClientRect();
    const out = { n: i + 1, id: sec.id, cover: sec.classList.contains('cover'), flags: [], txt: [] };

    let top = Infinity, bottom = 0;
    sec.querySelectorAll('p,li,img,table,h1,h2,h3,svg,x-shape,.fig,.card').forEach((el) => {
      if (el.closest(CHROME)) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      top = Math.min(top, r.top - sr.top);
      bottom = Math.max(bottom, r.bottom - sr.top);
    });
    out.top = Number.isFinite(top) ? Math.round(top) : null;
    out.bottom = Math.round(bottom);
    if (!out.cover) {
      if (bottom > cfg.bottom + 0.5) out.flags.push(`OVERFLOW bottom ${out.bottom} > ${cfg.bottom}: cut text or move detail to the notes`);
      if (Number.isFinite(top) && top < cfg.top - 0.5) out.flags.push(`OVERFLOW top ${out.top} < ${cfg.top}: content runs into the title bar`);
    }

    const ttl = sec.querySelector('.ttl');
    if (ttl) {
      if (ttl.scrollWidth > ttl.clientWidth + 1) out.flags.push('TITLE too long for one line');
      if (/[:：]/.test(ttl.textContent)) out.flags.push('TITLE has a colon: titles are labels only');
    }
    if (sec.querySelector('li ul, li ol')) out.flags.push('NESTED list inside <li>: write the second level as a sibling ul.bl.sub');
    if (!out.cover && sec.querySelector('ul') && ![...sec.querySelectorAll('ul')].every((u) => u.closest('.txt, .card, table')))
      out.flags.push('LIST outside .txt: wrap the text of the slide in one .txt block');

    // A table or flow with no text block: flag a slide that leaves the lower 40% empty
    if (!out.cover && !sec.querySelector('.txt') && bottom > 0 && bottom < cfg.top + 0.6 * (cfg.bottom - cfg.top))
      out.flags.push(`UNDERUSED: content ends at y ${out.bottom}. Enlarge the table or boxes (tables up to 44px, flow boxes up to 36px)`);

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
      let best = null, fillBest = null;
      for (let s = cfg.max; s >= cfg.min; s -= 2) {
        txt.style.fontSize = s + 'px';
        const h = contentHeight(txt);
        if (h <= avail * cfg.safety && !tooWide(txt)) { best = s; fillBest = h / avail; break; }
      }
      txt.style.fontSize = keep;
      const t = { cur, best, fill: Math.round(fillNow * 100), fillBest: best ? Math.round(fillBest * 100) : null };
      out.txt.push(t);
      if (best === null) out.flags.push(`TEXT TOO LONG: does not fit even at ${cfg.min}px. Move detail to the notes or split the slide`);
      else if (cur > best) out.flags.push(`TEXT TOO BIG at ${cur}px (fits at ${best}px). Prefer cutting text; otherwise set font-size:${best}px`);
      else if (best - cur >= cfg.step) out.flags.push(`GROW: set .txt font-size:${best}px (now ${cur}px, fill ${t.fill}% -> ${t.fillBest}%)`);
      if (best !== null && cur <= best && fillBest < (txt.parentElement === sec ? cfg.lowFillSolo : cfg.lowFill))
        out.flags.push(`UNDERFILL: only ${t.fillBest}% even at ${best}px. Rebalance the layout (see "Fill the slide", step 5)`);
    });
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
      return route.fulfill({ body: html, contentType: 'text/html; charset=utf-8' });
    }
    if (u.pathname === '/project/deck.css')
      return route.fulfill({ body: fs.readFileSync(path.join(root, 'project', 'deck.css')), contentType: 'text/css' });
    return route.abort('aborted'); // images and fonts are not served locally
  });
  await page.goto('http://deck.local/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);

  const rows = await page.evaluate(measure, cfg);
  let bad = 0;
  console.log(['#', 'id', 'top', 'bottom', 'size', 'best', 'fill'].join('\t'));
  for (const r of rows) {
    const t = r.txt[0];
    console.log([r.n, r.id, r.top ?? '-', r.bottom || '-', t ? t.cur : '-', t && t.best ? t.best : '-', t ? t.fill + '%' : '-'].join('\t'));
    for (const f of r.flags) { bad++; console.log('\t! ' + f); }
  }
  console.log(bad ? `\n${bad} thing(s) to fix. Fix them and run again.` : '\nLayout clean.');

  if (shots) {
    fs.mkdirSync(shots, { recursive: true });
    const secs = await page.$$('body > section');
    for (let i = 0; i < secs.length; i++) {
      await secs[i].scrollIntoViewIfNeeded();
      await secs[i].screenshot({ path: path.join(shots, String(i + 1).padStart(2, '0') + '-' + rows[i].id + '.png'), animations: 'disabled' });
    }
    console.log(`Screenshots: ${shots} (figures show as empty boxes locally)`);
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(2); });
