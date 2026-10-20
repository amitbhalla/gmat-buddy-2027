// Shared view helpers: plan item display, sheets, achievements, coach lines.
import { icon, KIND_ICON } from '../icons.js';
import { esc, fmtMinutes, fmtDate, todayStr, addDays, weekday, seededRandom, pick, toast } from '../util.js';
import * as store from '../store.js';

export function itemTitle(it, cur) {
  if (it.kind === 'lesson') return cur.lessons[it.ref?.id || it.key.slice(7)]?.title || 'Lesson';
  return it.title || it.ref?.title || 'Task';
}

export function itemSubtitle(it, cur) {
  const m = it.minutes ? fmtMinutes(it.minutes) : '';
  const map = {
    lesson: () => `Lesson · ${sectionLabel(cur.lessons[it.ref?.id || it.key.slice(7)]?.section)}`,
    drill: () => `${it.ref?.n || it.ref?.passages ? (it.ref.passages ? `${it.ref.passages} passage${it.ref.passages > 1 ? 's' : ''}` : `${it.ref.n} questions`) : ''}${it.ref?.timed ? ' · timed' : ' · with explanations'}`,
    checkpoint: () => `${it.ref?.n} questions · timed`,
    mock: () => (it.ref?.mode === 'diagnostic' || it.key === 'mock:diagnostic' ? 'About 65 minutes · 3 short sections' : '3 sections · 2 h 15 min'),
    official: () => 'On mba.com · log your score here',
    cards: () => 'Spaced repetition',
    smart: () => 'Picked from your weakest topics',
    'weekly-review': () => 'Lock in the week',
    admissions: () => 'Admissions',
    reading: () => 'Builds RC stamina',
    og: () => 'Official Guide 2026-2027',
  };
  const lead = map[it.kind] ? map[it.kind]() : '';
  return [lead, m].filter(Boolean).join(' · ');
}

export function sectionLabel(s) {
  return { start: 'Start here', quant: 'Quant', verbal: 'Verbal', di: 'Data Insights', strategy: 'Strategy', admissions: 'Admissions' }[s] || '';
}

// Where tapping a plan item goes.
export function itemHref(it) {
  const k = it.kind;
  if (k === 'lesson') return `#/lesson/${it.ref?.id || it.key.slice(7)}?item=${encodeURIComponent(it.key)}`;
  if (k === 'drill' || k === 'checkpoint') return `#/session/item/${encodeURIComponent(it.key)}`;
  if (k === 'mock') return `#/mock/start/${encodeURIComponent(it.key)}`;
  if (k === 'official') return `#/mock/official/${encodeURIComponent(it.key)}`;
  if (k === 'cards') return `#/cards?item=${encodeURIComponent(it.key)}`;
  if (k === 'smart' || k === 'weekly-review') return `#/session/smart?item=${encodeURIComponent(it.key)}`;
  if (k === 'redo') return `#/session/redo?item=${encodeURIComponent(it.key)}`;
  if (k === 'section-test') return `#/session/section/${it.ref.section}?item=${encodeURIComponent(it.key)}`;
  if (k === 'mock-review') return `#/mock/review/${encodeURIComponent(it.ref.mockKey)}?item=${encodeURIComponent(it.key)}`;
  if (k === 'checklist') return `#/checklist?item=${encodeURIComponent(it.key)}`;
  if (k === 'log-score') return `#/mock/official/official:real-1?item=${encodeURIComponent(it.key)}`;
  if (k === 'admissions' && it.lesson) return `#/lesson/${it.lesson}?item=${encodeURIComponent(it.key)}`;
  return null; // tasks completed in place
}

export function itemRow(it, cur, { done = false, compact = false } = {}) {
  const [ic, tone] = KIND_ICON[it.kind] || ['info', ''];
  const href = itemHref(it);
  const tag = href ? 'a' : 'div';
  const check = `<button class="check${done ? ' on' : ''}" data-toggle="${esc(it.key)}" data-min="${it.minutes || 0}" aria-label="${done ? 'Mark not done' : 'Mark done'}">${done ? icon('check') : ''}</button>`;
  const move = !done && it.kind !== 'test' && it.kind !== 'cards' ? `<button class="icon-btn move-btn" data-defer="${esc(it.key)}" aria-label="Move to another day" title="Move to another day">${icon('calendar')}</button>` : '';
  return `<${tag} class="item${done ? ' done' : ''}${it.optional ? ' optional' : ''}"${href ? ` href="${href}"` : ` data-task="${esc(it.key)}"`}>
    <div class="ic ${tone}">${icon(ic)}</div>
    <div class="body"><div class="t">${esc(itemTitle(it, cur))}</div>${compact ? '' : `<div class="s">${esc(itemSubtitle(it, cur))}</div>`}</div>
    ${move}${check}
  </${tag}>`;
}

// Bottom sheet modal. Returns a close function.
export function sheet(html, { onClose } = {}) {
  const bd = document.createElement('div');
  bd.className = 'sheet-backdrop';
  bd.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  const close = () => {
    bd.remove();
    document.removeEventListener('keydown', onKey);
    onClose && onClose();
  };
  const onKey = (e) => e.key === 'Escape' && close();
  bd.addEventListener('click', (e) => {
    if (e.target === bd || e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(bd);
  const first = bd.querySelector('button, a, input, select, textarea');
  first && first.focus();
  return { close, el: bd.querySelector('.sheet') };
}

// "Move to another day" sheet. Resolves with the chosen date or null.
export function deferSheet(title) {
  const today = todayStr();
  const nextSat = (() => {
    let d = addDays(today, 1);
    while (weekday(d) !== 6) d = addDays(d, 1);
    return d;
  })();
  const nextMon = (() => {
    let d = addDays(today, 1);
    while (weekday(d) !== 1) d = addDays(d, 1);
    return d;
  })();
  const opts = [
    ['Tomorrow', addDays(today, 1)],
    ['This weekend', nextSat],
    ['Next week', nextMon],
  ];
  return new Promise((resolve) => {
    let picked = false;
    const sh = sheet(`<h2>Move to another day</h2><p class="muted">${esc(title)}</p>
      <div class="list">${opts.map(([l, d]) => `<button class="item" data-date="${d}" style="width:100%;text-align:left"><div class="ic">${icon('calendar')}</div><div class="body"><div class="t">${l}</div><div class="s">${fmtDate(d, { weekday: true })}</div></div></button>`).join('')}</div>
      <label class="field" style="margin-top:14px"><span>Or pick a date</span><input type="date" id="defer-date" min="${addDays(today, 1)}"></label>
      <div class="btn-row"><button class="btn primary" data-pick>Move</button><button class="btn" data-close>Cancel</button></div>
      <p class="faint" style="margin-top:12px">Everything after it slides up to fill the gap, so you won't fall behind.</p>`, { onClose: () => !picked && resolve(null) });
    sh.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-date]');
      const p = e.target.closest('[data-pick]');
      const v = b ? b.dataset.date : p ? sh.el.querySelector('#defer-date').value : null;
      if (v && v > today) {
        picked = true;
        sh.close();
        resolve(v);
      }
    });
  });
}

export function confirmSheet(title, text, okLabel = 'Yes') {
  return new Promise((resolve) => {
    let answered = false;
    const s = sheet(`<h2>${esc(title)}</h2><p class="muted">${esc(text)}</p><div class="btn-row"><button class="btn primary" data-ok>${esc(okLabel)}</button><button class="btn" data-close>Cancel</button></div>`, {
      onClose: () => !answered && resolve(false),
    });
    s.el.querySelector('[data-ok]').addEventListener('click', () => {
      answered = true;
      s.close();
      resolve(true);
    });
  });
}

// ---------- achievements
export const BADGES = [
  ['firstLesson', 'First lesson', 'learn'],
  ['firstPractice', 'First practice', 'practice'],
  ['streak3', '3-day streak', 'flame'],
  ['streak7', '7-day streak', 'flame'],
  ['streak14', '14-day streak', 'flame'],
  ['streak30', '30-day streak', 'flame'],
  ['streak60', '60-day streak', 'flame'],
  ['streak100', '100-day streak', 'flame'],
  ['lessons10', '10 lessons', 'book'],
  ['lessons25', '25 lessons', 'book'],
  ['lessonsAll', 'Every lesson', 'trophy'],
  ['questions100', '100 questions', 'target'],
  ['questions500', '500 questions', 'target'],
  ['questions1000', '1,000 questions', 'target'],
  ['firstMock', 'First mock', 'mock'],
  ['mockPersonalBest', 'Mock personal best', 'star'],
];

export function checkAchievements(coach, cur) {
  const s = store.get();
  const got = [];
  const award = (k, cond) => {
    if (cond && !s.achievements[k]) {
      s.achievements[k] = todayStr();
      got.push(k);
    }
  };
  const lessonsDone = Object.values(s.lessons).filter((l) => l.completedAt).length;
  const streak = store.streak(s);
  award('firstLesson', lessonsDone >= 1);
  award('firstPractice', s.attempts.length >= 1);
  for (const n of [3, 7, 14, 30, 60, 100]) award(`streak${n}`, streak >= n);
  award('lessons10', lessonsDone >= 10);
  award('lessons25', lessonsDone >= 25);
  award('lessonsAll', cur && lessonsDone >= Object.keys(cur.lessons).length);
  award('questions100', s.attempts.length >= 100);
  award('questions500', s.attempts.length >= 500);
  award('questions1000', s.attempts.length >= 1000);
  award('firstMock', s.mocks.some((m) => m.kind !== 'diagnostic'));
  if (got.length) {
    store.save(true);
    const msg = coach?.milestones?.[got[got.length - 1]] || 'New milestone unlocked.';
    setTimeout(() => toast(msg, { kind: 'good', ms: 4200 }), 300);
  }
  return got;
}

export function coachLine(coach, list, seed) {
  const arr = coach?.[list];
  if (!Array.isArray(arr) || !arr.length) return '';
  return pick(arr, seededRandom(seed));
}

export function greeting(coach, name) {
  const h = new Date().getHours();
  const slot = h < 5 ? 'late' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 22 ? 'evening' : 'late';
  const arr = coach?.greetings?.[slot];
  const fallback = { morning: 'Good morning, {name}.', afternoon: 'Good afternoon, {name}.', evening: 'Good evening, {name}.', late: 'Still up, {name}?' }[slot];
  const line = arr?.length ? pick(arr, seededRandom(todayStr() + slot)) : fallback;
  return line.replace(/\{name\}/g, name || 'Maria');
}

export function loading(view) {
  view.innerHTML = '<div class="loading"><div class="spinner" role="status" aria-label="Loading"></div></div>';
}
