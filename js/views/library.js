// Library: resources, glossary and a printable formula sheet.
import * as content from '../content.js';
import { icon } from '../icons.js';
import { md } from '../md.js';
import { esc } from '../util.js';

const TABS = [['resources', 'Resources'], ['glossary', 'Glossary'], ['formulas', 'Formulas']];
const TITLES = { resources: 'Resources', glossary: 'Glossary', formulas: 'Formula sheet' };

const CAT_HEAD = [
  ['official', 'Official'],
  ['free', 'Free'],
  ['course', 'Courses'],
  ['reading', 'Reading'],
  ['tool', 'Tools'],
  ['community', 'Community'],
];

const TOPIC_NAMES = {
  'q-arith': 'Number sense', 'q-fractions': 'Fractions', 'q-percents': 'Percents', 'q-ratios': 'Ratios',
  'q-exponents': 'Exponents & roots', 'q-numprops': 'Number properties', 'q-divisibility': 'Factors & primes',
  'q-remainders': 'Remainders', 'q-linear': 'Linear equations', 'q-quadratics': 'Quadratics',
  'q-inequalities': 'Inequalities', 'q-functions': 'Functions & sequences', 'q-wordprob': 'Word problems',
  'q-rates': 'Rates & work', 'q-mixtures': 'Mixtures & interest', 'q-stats': 'Statistics', 'q-sets': 'Sets',
  'q-counting': 'Counting', 'q-probability': 'Probability',
};
const DI_NAMES = {
  'd-ds': 'Data Sufficiency', 'd-ta': 'Table Analysis', 'd-gi': 'Graphics Interpretation',
  'd-tpa': 'Two-Part Analysis', 'd-msr': 'Multi-Source Reasoning', 'd-intro': 'Data Insights basics',
  'd-data-literacy': 'Data literacy',
};
const topicName = (t) => TOPIC_NAMES[t] || DI_NAMES[t] || 'General';

export async function render({ view, params, setTop }) {
  const tab = TABS.some(([k]) => k === params[0]) ? params[0] : 'resources';
  setTop({ title: TITLES[tab], back: '#/more' });
  view.innerHTML = `
    <div class="seg" role="tablist" style="margin:6px 0 16px">${TABS.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}" role="tab" aria-selected="${k === tab}">${l}</button>`).join('')}</div>
    <div id="lib-body"></div>`;
  const body = view.querySelector('#lib-body');
  const onClick = (e) => {
    const t = e.target.closest('[data-tab]');
    if (t && t.dataset.tab !== tab) location.hash = `#/library/${t.dataset.tab}`;
  };
  view.addEventListener('click', onClick);
  if (tab === 'resources') await resourcesTab(body);
  else if (tab === 'glossary') await glossaryTab(body, view);
  else await formulasTab(body);
  return () => view.removeEventListener('click', onClick);
}

// ---------- resources
function resCard(r) {
  return `<a class="item" href="${esc(r.url)}" target="_blank" rel="noopener">
    <div class="ic">${icon('external')}</div>
    <div class="body">
      <div class="t">${esc(r.title)} ${r.cost ? `<span class="chip ${/^free/i.test(r.cost) ? 'green' : 'amber'}" style="margin-left:4px">${esc(r.cost)}</span>` : ''}</div>
      <div class="s">${esc(r.why)}</div>
      ${r.when ? `<div class="faint small" style="margin-top:2px">Best for: ${esc(r.when)}</div>` : ''}
    </div>
  </a>`;
}

async function resourcesTab(body) {
  const all = await content.resources();
  const groups = CAT_HEAD.map(([k, h]) => [k, h, all.filter((r) => r.category === k)]).filter(([, , l]) => l.length);
  const known = new Set(CAT_HEAD.map(([k]) => k));
  const other = all.filter((r) => !known.has(r.category));
  if (other.length) groups.push(['other', 'More', other]);
  body.innerHTML = `<p class="muted" style="margin-top:0">The official materials come first. Everything else is optional.</p>` + groups
    .map(([k, h, list]) => {
      const inner = `<div class="list">${list.map(resCard).join('')}</div>`;
      if (k === 'official') return `<div class="section-title" style="margin-top:8px"><h2>${h}</h2></div>${inner}`;
      return `<details class="card flat reveal" style="margin-top:12px"><summary style="cursor:pointer;font-weight:650">${h} (${list.length})</summary><div style="margin-top:12px">${inner}</div></details>`;
    })
    .join('');
}

// ---------- glossary
async function glossaryTab(body) {
  const all = (await content.glossary()).slice().sort((a, b) => a.term.localeCompare(b.term));
  const cats = ['all', 'exam', 'quant', 'verbal', 'di', 'strategy', 'admissions'];
  const label = { all: 'All', exam: 'Exam', quant: 'Quant', verbal: 'Verbal', di: 'Data Insights', strategy: 'Strategy', admissions: 'Admissions' };
  let cat = 'all';
  let q = '';
  body.innerHTML = `
    <input type="search" id="gl-q" placeholder="Search terms" aria-label="Search glossary" autocomplete="off">
    <div class="chips" id="gl-cats" style="margin:12px 0 14px">${cats.map((c) => `<button class="chip${c === 'all' ? ' indigo' : ''}" data-cat="${c}" style="border:0;cursor:pointer;min-height:36px">${label[c]}</button>`).join('')}</div>
    <div id="gl-list" class="list"></div>`;
  const listEl = body.querySelector('#gl-list');
  const paint = () => {
    const needle = q.trim().toLowerCase();
    const rows = all.filter((g) => (cat === 'all' || g.category === cat) && (!needle || `${g.term} ${g.definition}`.toLowerCase().includes(needle)));
    listEl.innerHTML = rows.length
      ? rows.map((g) => `<div class="card flat" style="padding:14px 16px"><div style="font-weight:650">${esc(g.term)}</div><div class="muted" style="margin-top:2px">${esc(g.definition)}</div>${g.example ? `<div class="faint" style="margin-top:6px">${esc(g.example)}</div>` : ''}</div>`).join('')
      : `<div class="empty">${icon('search')}<p>Nothing matches that. Try a shorter word.</p></div>`;
  };
  body.querySelector('#gl-q').addEventListener('input', (e) => {
    q = e.target.value;
    paint();
  });
  body.querySelector('#gl-cats').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    cat = b.dataset.cat;
    body.querySelectorAll('#gl-cats .chip').forEach((c) => c.classList.toggle('indigo', c === b));
    paint();
  });
  paint();
}

// ---------- formulas
async function formulasTab(body) {
  const cards = (await content.flashcards()).filter((c) => ['quant-formulas', 'quant-facts', 'di'].includes(c.deck));
  const groups = new Map();
  for (const c of cards) {
    const k = c.topic && (TOPIC_NAMES[c.topic] || DI_NAMES[c.topic]) ? c.topic : 'general';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c);
  }
  const order = [...Object.keys(TOPIC_NAMES), ...Object.keys(DI_NAMES), 'general'];
  const keys = order.filter((k) => groups.has(k));
  body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px">
      <p class="muted" style="margin:0">${cards.length} quick facts, grouped by topic.</p>
      <button class="btn ghost sm" id="print-btn">${icon('download')} Print</button>
    </div>
    ${keys.map((k, i) => `<details class="card flat reveal" style="margin-top:10px" ${i === 0 ? 'open' : ''}>
      <summary style="cursor:pointer;font-weight:650">${esc(topicName(k === 'general' ? null : k))} (${groups.get(k).length})</summary>
      <div class="list" style="margin-top:12px">${groups.get(k).map((c) => `<div style="padding:10px 0;border-top:1px solid var(--border)"><div style="font-weight:700">${esc(c.front)}</div><div class="prose" style="font-size:15px">${md(c.back)}</div></div>`).join('')}</div>
    </details>`).join('')}`;
  body.querySelector('#print-btn').addEventListener('click', () => {
    body.querySelectorAll('details').forEach((d) => (d.open = true));
    window.print();
  });
}
