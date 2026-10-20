// Renders any question format and its stimulus; reads answers; grades.
import { md, mdInline } from './md.js';
import { renderChart } from './charts.js';
import { esc, LETTERS, TYPE_NAMES } from './util.js';

export const DS_CHOICES = [
  'Statement (1) ALONE is sufficient, but statement (2) alone is not sufficient.',
  'Statement (2) ALONE is sufficient, but statement (1) alone is not sufficient.',
  'BOTH statements TOGETHER are sufficient, but NEITHER statement ALONE is sufficient.',
  'EACH statement ALONE is sufficient.',
  'Statements (1) and (2) TOGETHER are NOT sufficient.',
];

export const DS_DIRECTIONS =
  'This data sufficiency problem consists of a question and two statements, labelled (1) and (2), in which certain data are given. Decide whether the data given in the statements are sufficient to answer the question.';

export function choicesFor(q) {
  return q.type === 'DS' ? DS_CHOICES : q.choices || [];
}

// ---------- grading
export function isComplete(q, a) {
  if (a == null) return false;
  if (q.format === 'mc') return Number.isInteger(a);
  if (Array.isArray(a)) return a.length === (q.format === 'yesno' ? 3 : 2) && a.every((x) => Number.isInteger(x));
  return false;
}

export function isCorrect(q, a) {
  if (!isComplete(q, a)) return false;
  if (q.format === 'mc') return a === q.answer;
  return q.answer.every((x, i) => x === a[i]);
}

export function answerLabel(q, a) {
  if (!isComplete(q, a)) return 'No answer';
  if (q.format === 'mc') return LETTERS[a];
  if (q.format === 'yesno') return a.map((x) => q.labels[x]).join(' / ');
  if (q.format === 'dropdown') return a.map((x, i) => q.blanks[i][x]).join(' / ');
  if (q.format === 'tpa') return `${q.labels[0]}: ${q.choices[a[0]]}; ${q.labels[1]}: ${q.choices[a[1]]}`;
  return '';
}

// ---------- stimulus
function renderTable(t, id) {
  const head = t.columns.map((c, i) => `<th scope="col"><button class="sort-btn" data-col="${i}" aria-label="Sort by ${esc(c)}">${esc(c)}<span class="sort-ind" aria-hidden="true"></span></button></th>`).join('');
  const rows = t.rows.map((r) => `<tr>${r.map((c) => `<td>${typeof c === 'number' ? c.toLocaleString('en-US', { maximumFractionDigits: 4 }) : esc(c)}</td>`).join('')}</tr>`).join('');
  return `<div class="table-wrap"><table class="data-table sortable" data-table="${esc(id)}"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div><p class="hint">Tap a column heading to sort, as on the real exam.</p>`;
}

function renderPart(part, id) {
  let html = '';
  if (part.intro) html += `<div class="stim-intro">${md(part.intro)}</div>`;
  if (part.body) html += `<div class="stim-body prose">${md(part.body)}</div>`;
  if (part.table) html += renderTable(part.table, id);
  if (part.chart) html += `<figure class="chart-fig">${renderChart(part.chart, { ariaLabel: part.title || 'Chart' })}</figure>`;
  return html;
}

export function renderStimulus(stim) {
  if (!stim) return '';
  const title = stim.title ? `<h3 class="stim-title">${esc(stim.title)}</h3>` : '';
  if (stim.kind === 'msr') {
    const tabs = stim.tabs
      .map((t, i) => `<button role="tab" class="tab${i === 0 ? ' active' : ''}" data-tab="${i}" aria-selected="${i === 0}">${esc(t.title)}</button>`)
      .join('');
    const panels = stim.tabs.map((t, i) => `<div role="tabpanel" class="tab-panel" data-panel="${i}"${i === 0 ? '' : ' hidden'}>${renderPart(t, `${stim.id}-${i}`)}</div>`).join('');
    return `${title}<div class="tabs" role="tablist">${tabs}</div>${panels}`;
  }
  return title + renderPart(stim, stim.id);
}

// ---------- question body
function choiceButton(i, text, sel, reveal, q) {
  const cls = ['choice'];
  if (sel === i) cls.push('selected');
  if (reveal) {
    if (q.answer === i) cls.push('correct');
    else if (sel === i) cls.push('wrong');
  }
  return `<button class="${cls.join(' ')}" role="radio" aria-checked="${sel === i}" data-choice="${i}"${reveal ? ' disabled' : ''}><span class="letter">${LETTERS[i]}</span><span class="choice-text">${mdInline(text)}</span></button>`;
}

function renderMC(q, a, reveal) {
  const choices = choicesFor(q);
  return `<div class="choices"${q.type === 'DS' ? ' data-ds' : ''} role="radiogroup" aria-label="Answer choices">${choices.map((c, i) => choiceButton(i, c, a, reveal, q)).join('')}</div>`;
}

function renderYesNo(q, a, reveal) {
  a = a || [];
  const rows = q.statements
    .map((st, r) => {
      const cells = q.labels
        .map((lab, c) => {
          const sel = a[r] === c;
          let cls = 'yn-cell';
          if (reveal && q.answer[r] === c) cls += ' correct';
          else if (reveal && sel) cls += ' wrong';
          return `<td class="${cls}"><button class="yn-btn${sel ? ' selected' : ''}" role="radio" aria-checked="${sel}" aria-label="${esc(lab)}" data-row="${r}" data-col="${c}"${reveal ? ' disabled' : ''}><span class="dot"></span></button></td>`;
        })
        .join('');
      return `<tr>${cells}<td class="yn-text">${mdInline(st)}</td></tr>`;
    })
    .join('');
  return `<div class="table-wrap"><table class="yn-table"><thead><tr>${q.labels.map((l) => `<th>${esc(l)}</th>`).join('')}<th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderTPA(q, a, reveal) {
  a = a || [];
  const rows = q.choices
    .map((ch, r) => {
      const cells = [0, 1]
        .map((col) => {
          const sel = a[col] === r;
          let cls = 'yn-cell';
          if (reveal && q.answer[col] === r) cls += ' correct';
          else if (reveal && sel) cls += ' wrong';
          return `<td class="${cls}"><button class="yn-btn${sel ? ' selected' : ''}" role="radio" aria-checked="${sel}" aria-label="${esc(q.labels[col])}: ${esc(ch)}" data-tpa-col="${col}" data-tpa-row="${r}"${reveal ? ' disabled' : ''}><span class="dot"></span></button></td>`;
        })
        .join('');
      return `<tr>${cells}<td class="yn-text">${mdInline(ch)}</td></tr>`;
    })
    .join('');
  return `<div class="table-wrap"><table class="yn-table tpa-table"><thead><tr><th>${esc(q.labels[0])}</th><th>${esc(q.labels[1])}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderDropdownPrompt(q, a, reveal) {
  a = a || [];
  let html = md(q.prompt);
  q.blanks.forEach((opts, i) => {
    let cls = 'dd-select';
    if (reveal) cls += a[i] === q.answer[i] ? ' correct' : ' wrong';
    const sel = `<select class="${cls}" data-blank="${i}" aria-label="Blank ${i + 1}"${reveal ? ' disabled' : ''}><option value="">Select…</option>${opts
      .map((o, j) => `<option value="${j}"${a[i] === j ? ' selected' : ''}>${esc(o)}</option>`)
      .join('')}</select>${reveal && a[i] !== q.answer[i] ? `<span class="dd-correct">Answer: ${esc(opts[q.answer[i]])}</span>` : ''}`;
    html = html.replace(`[[${i + 1}]]`, () => sel);
  });
  return `<div class="prompt prose">${html}</div>`;
}

function renderDSPrompt(q) {
  // Put statements on their own styled lines.
  const parts = q.prompt.split(/\n\s*\n/);
  const stem = [];
  const stmts = [];
  for (const p of parts) (/^\s*\([12]\)/.test(p) ? stmts : stem).push(p);
  return `<div class="prompt prose">${md(stem.join('\n\n'))}</div><div class="ds-statements">${stmts.map((s) => `<div class="ds-stmt">${mdInline(s.trim())}</div>`).join('')}</div>`;
}

export function renderQuestion(q, stim, { answer = null, reveal = false, header = '', showMeta = false } = {}) {
  let body;
  if (q.format === 'dropdown') body = renderDropdownPrompt(q, answer, reveal);
  else {
    const prompt = q.type === 'DS' ? renderDSPrompt(q) : `<div class="prompt prose">${md(q.prompt)}</div>`;
    const input = q.format === 'mc' ? renderMC(q, answer, reveal) : q.format === 'yesno' ? renderYesNo(q, answer, reveal) : renderTPA(q, answer, reveal);
    body = prompt + input;
  }
  const meta = showMeta ? `<div class="q-meta"><span class="chip">${esc(TYPE_NAMES[q.type])}</span><span class="chip">Level ${q.difficulty}</span></div>` : '';
  const dsNote = q.type === 'DS' ? `<details class="ds-dir"><summary>Data Sufficiency directions</summary><p>${esc(DS_DIRECTIONS)}</p></details>` : '';
  const qHtml = `<div class="q-main">${header}${meta}${dsNote}${body}</div>`;
  if (!stim) return `<div class="question single">${qHtml}</div>`;
  const label = stim.kind === 'passage' ? 'Passage' : stim.kind === 'msr' ? 'Sources' : stim.kind === 'table' ? 'Table' : 'Graph';
  return `<div class="question split"><section class="stimulus" aria-label="${label}"><div class="stim-toggle"><span>${label}</span><button class="link-btn stim-collapse" aria-expanded="true">Hide</button></div><div class="stim-scroll">${renderStimulus(stim)}</div></section>${qHtml}</div>`;
}

export function renderExplanation(q, answer) {
  const ok = isCorrect(q, answer);
  const verdict = answer == null || !isComplete(q, answer)
    ? `<div class="verdict skipped">Not answered. Correct answer: <strong>${esc(answerLabel(q, q.answer))}</strong></div>`
    : ok
      ? `<div class="verdict right">Correct</div>`
      : `<div class="verdict wrong">Not quite. You chose ${esc(answerLabel(q, answer))}. Correct: <strong>${esc(answerLabel(q, q.answer))}</strong></div>`;
  return `<div class="explanation">${verdict}<div class="prose">${md(q.explanation)}</div>
  <aside class="callout callout-tip"><div class="callout-title">Takeaway</div><p>${mdInline(q.tip)}</p></aside>
  <aside class="callout callout-trap"><div class="callout-title">The trap</div><p>${mdInline(q.trap)}</p></aside></div>`;
}

// ---------- interaction
export function bindQuestion(root, q, getAnswer, setAnswer) {
  root.addEventListener('click', (e) => {
    const c = e.target.closest('[data-choice]');
    if (c && !c.disabled) {
      setAnswer(Number(c.dataset.choice));
      for (const b of root.querySelectorAll('[data-choice]')) {
        const on = b === c;
        b.classList.toggle('selected', on);
        b.setAttribute('aria-checked', on);
      }
      return;
    }
    const yn = e.target.closest('[data-row]');
    if (yn && !yn.disabled) {
      const a = (getAnswer() || [null, null, null]).slice();
      a[Number(yn.dataset.row)] = Number(yn.dataset.col);
      setAnswer(a);
      for (const b of root.querySelectorAll(`[data-row="${yn.dataset.row}"]`)) {
        const on = b === yn;
        b.classList.toggle('selected', on);
        b.setAttribute('aria-checked', on);
      }
      return;
    }
    const tp = e.target.closest('[data-tpa-col]');
    if (tp && !tp.disabled) {
      const a = (getAnswer() || [null, null]).slice();
      a[Number(tp.dataset.tpaCol)] = Number(tp.dataset.tpaRow);
      setAnswer(a);
      for (const b of root.querySelectorAll(`[data-tpa-col="${tp.dataset.tpaCol}"]`)) {
        const on = b === tp;
        b.classList.toggle('selected', on);
        b.setAttribute('aria-checked', on);
      }
      return;
    }
    const tab = e.target.closest('[role="tab"]');
    if (tab) {
      const wrap = tab.closest('.stimulus') || root;
      for (const t of wrap.querySelectorAll('[role="tab"]')) {
        const on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on);
      }
      for (const p of wrap.querySelectorAll('[data-panel]')) p.hidden = p.dataset.panel !== tab.dataset.tab;
      return;
    }
    const sort = e.target.closest('.sort-btn');
    if (sort) return sortTable(sort);
    const col = e.target.closest('.stim-collapse');
    if (col) {
      const sec = col.closest('.stimulus');
      const collapsed = sec.classList.toggle('collapsed');
      col.textContent = collapsed ? 'Show' : 'Hide';
      col.setAttribute('aria-expanded', !collapsed);
    }
  });
  root.addEventListener('change', (e) => {
    const s = e.target.closest('[data-blank]');
    if (!s) return;
    const a = (getAnswer() || [null, null]).slice();
    a[Number(s.dataset.blank)] = s.value === '' ? null : Number(s.value);
    setAnswer(a);
  });
}

function sortTable(btn) {
  const table = btn.closest('table');
  const col = Number(btn.dataset.col);
  const asc = table.dataset.sortCol === String(col) ? table.dataset.sortDir !== 'asc' : true;
  const rows = Array.from(table.tBodies[0].rows);
  const val = (tr) => {
    const t = tr.cells[col].textContent.trim();
    const n = Number(t.replace(/[,%$₹]/g, ''));
    return Number.isFinite(n) && t !== '' ? n : t.toLowerCase();
  };
  rows.sort((a, b) => {
    const x = val(a);
    const y = val(b);
    const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
    return asc ? cmp : -cmp;
  });
  rows.forEach((r) => table.tBodies[0].appendChild(r));
  table.dataset.sortCol = col;
  table.dataset.sortDir = asc ? 'asc' : 'desc';
  for (const b of table.querySelectorAll('.sort-btn')) b.querySelector('.sort-ind').textContent = b === btn ? (asc ? ' ▲' : ' ▼') : '';
}
