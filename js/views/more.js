// More: a calm menu of everything that is not part of the daily loop.
import * as store from '../store.js';
import { icon } from '../icons.js';
import { esc, toast } from '../util.js';
import { BADGES } from './common.js';

const SECTIONS = [
  ['Study tools', [
    ['#/cards', 'cards', 'Flashcards', 'A few minutes of quick review'],
    ['#/errors', 'redo', 'Mistake log', 'Questions you missed, and why'],
    ['#/library/formulas', 'calc', 'Formula sheet', 'Every quant formula in one place'],
    ['#/library/glossary', 'book', 'Glossary', 'Plain definitions for GMAT and MBA terms'],
  ]],
  ['Plan', [
    ['#/plan', 'calendar', 'Your plan & roadmap', 'This week and the road to test day'],
    ['#/checklist', 'checklist', 'Test-day checklist', 'Booking, the week before, and the day itself'],
  ]],
  ['Admissions', [
    ['#/admissions', 'admissions', 'Admissions tracker', 'Programmes, deadlines and your shortlist'],
    ['#/learn?unit=admissions', 'lesson', 'Admissions lessons', 'Short reads on how to apply well'],
  ]],
  ['Library', [
    ['#/library/resources', 'globe', 'Resources & official materials', 'Where to find the good stuff'],
  ]],
  ['App', [
    ['#/settings', 'settings', 'Settings', 'Dates, daily time, pace and your data'],
    ['backup', 'download', 'Backup now', 'Save a copy of your progress to this device'],
    ['about', 'info', 'About', 'What GMAT Buddy is'],
  ]],
];

function row([href, ic, title, sub]) {
  const inner = `<div class="ic">${icon(ic)}</div><div class="body"><div class="t">${esc(title)}</div><div class="s">${esc(sub)}</div></div>`;
  if (href.startsWith('#')) return `<a class="item" href="${href}">${inner}</a>`;
  return `<button class="item" data-act="${href}" style="width:100%;text-align:left">${inner}</button>`;
}

export async function render({ view, setTop }) {
  setTop({ title: 'More' });
  const s = store.get();
  const earned = BADGES.filter(([k]) => s.achievements[k]);
  view.innerHTML = `
    <div class="eyebrow" style="margin-top:6px">Everything else</div>
    ${SECTIONS.map(([h, rows]) => `<div class="section-title"><h2>${h}</h2></div><div class="list">${rows.map(row).join('')}</div>`).join('')}
    <details class="card flat reveal" style="margin-top:24px">
      <summary style="cursor:pointer;font-weight:650">Your milestones (${earned.length}/${BADGES.length})</summary>
      <div class="badge-grid" style="margin-top:12px">${BADGES.map(([k, label, ic]) => `<div class="badge${s.achievements[k] ? '' : ' locked'}"><div class="medal">${icon(ic)}</div>${esc(label)}</div>`).join('')}</div>
    </details>`;

  const onClick = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'backup') {
      store.downloadBackup();
      toast('Backup saved to your downloads.', { kind: 'good' });
    } else if (b.dataset.act === 'about') {
      toast('GMAT Buddy 2027. Made for Maria. Your progress stays on this device.', { ms: 4200 });
    }
  };
  view.addEventListener('click', onClick);
  return () => view.removeEventListener('click', onClick);
}
