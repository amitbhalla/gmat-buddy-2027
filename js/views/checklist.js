// Test-day checklist: five short groups, progress saved as you tick.
import * as store from '../store.js';
import { icon } from '../icons.js';
import { esc, toast } from '../util.js';

const GROUPS = [
  ['booking', 'Booking (6-8 weeks before)', [
    ['book-mba', 'Book your test on mba.com and pick a test centre slot'],
    ['book-centre', 'Choose the test centre, not online. ISB reportedly does not accept online-exam scores, so confirm on isb.edu'],
    ['book-name', 'Check your name matches your mba.com registration exactly, letter for letter'],
    ['book-passport', 'Check your passport is valid well past test day (your passport is your ID)'],
    ['book-sections', 'Pick the section order you have practised and keep it'],
    ['book-reports', 'Decide which 5 schools get your free score reports'],
    ['book-backup', 'Note your backup test date in case you want a second try'],
  ]],
  ['week', 'The week before', [
    ['week-route', 'Look up the route to the centre in Delhi NCR and the travel time at that hour'],
    ['week-sleep', 'Move your sleep schedule to match test-morning wake-up time'],
    ['week-mock', 'Do one last full practice at the same time of day as your test'],
    ['week-review', 'Skim your formula sheet and mistake log, nothing new'],
    ['week-bag', 'Lay out your passport, confirmation email and a printed copy'],
    ['week-light', 'Keep other commitments light and say no to extras'],
  ]],
  ['night', 'The night before', [
    ['night-nocram', 'Do not cram. A short, calm review is the most you need'],
    ['night-pack', 'Pack passport, confirmation, water and a snack for the break'],
    ['night-clothes', 'Pick comfortable layers, since centres can run cold'],
    ['night-alarm', 'Set two alarms and check the route once more'],
    ['night-meal', 'Eat a normal dinner, nothing new or heavy'],
    ['night-sleep', 'Be in bed early, phone away'],
  ]],
  ['morning', 'Test morning', [
    ['morn-breakfast', 'Eat a light, familiar breakfast'],
    ['morn-water', 'Drink water, but not so much that you need frequent breaks'],
    ['morn-docs', 'Check you have your passport and confirmation before leaving'],
    ['morn-leave', 'Leave early so you can arrive 30 minutes before your slot'],
    ['morn-warm', 'Do a few easy warm-up questions, not hard ones'],
    ['morn-calm', 'Take five slow breaths before you walk in'],
  ]],
  ['centre', 'At the centre', [
    ['at-checkin', 'Arrive 30 minutes early and complete check-in calmly'],
    ['at-order', 'Choose your section order as you practised'],
    ['at-break', 'Use the optional breaks for water and a snack'],
    ['at-pace', 'Keep to your pacing plan and move on from stuck questions'],
    ['at-score', 'Choose your free score report schools when prompted'],
    ['at-after', 'Plan something kind for yourself afterwards'],
  ]],
];
const ALL_IDS = GROUPS.flatMap(([, , items]) => items.map(([id]) => id));

export async function render({ view, setTop, query }) {
  setTop({ title: 'Test-day checklist', back: '#/more' });
  const paint = () => {
    const done = store.get().checklists['test-day'] || {};
    const n = ALL_IDS.filter((id) => done[id]).length;
    const firstOpen = GROUPS.findIndex(([, , items]) => items.some(([id]) => !done[id]));
    view.innerHTML = `
      <div class="card tint" style="margin-top:6px">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><strong>${n} of ${ALL_IDS.length} done</strong><span class="faint">Saved as you tick</span></div>
        <div class="bar" style="margin-top:10px"><span style="width:${Math.round((n / ALL_IDS.length) * 100)}%"></span></div>
      </div>
      ${GROUPS.map(([gid, title, items], gi) => {
        const c = items.filter(([id]) => done[id]).length;
        return `<details class="card flat reveal" style="margin-top:12px" ${gi === Math.max(firstOpen, 0) ? 'open' : ''} data-g="${gid}">
          <summary style="cursor:pointer;font-weight:650">${esc(title)} <span class="faint">${c}/${items.length}</span></summary>
          <div style="margin-top:8px">${items.map(([id, text]) => `<label class="switch" style="cursor:pointer"><span style="flex:1;${done[id] ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(text)}</span><input type="checkbox" data-id="${id}" ${done[id] ? 'checked' : ''}></label>`).join('')}</div>
        </details>`;
      }).join('')}
      ${query.item ? `<div class="btn-row" style="margin-top:20px"><button class="btn primary block" id="mark-done">${icon('check')} Mark today's checklist task done</button></div>` : ''}`;
  };
  paint();
  const onChange = (e) => {
    const box = e.target.closest('[data-id]');
    if (!box) return;
    const open = Array.from(view.querySelectorAll('details')).map((d) => d.open);
    store.update((s) => {
      const m = (s.checklists['test-day'] ||= {});
      if (box.checked) m[box.dataset.id] = true;
      else delete m[box.dataset.id];
    }, true);
    paint();
    view.querySelectorAll('details').forEach((d, i) => (d.open = open[i]));
  };
  const onClick = (e) => {
    if (!e.target.closest('#mark-done')) return;
    store.markDone(query.item, 15);
    store.logMinutes(15);
    toast('Done. Nicely handled.', { kind: 'good' });
    location.hash = '#/today';
  };
  view.addEventListener('change', onChange);
  view.addEventListener('click', onClick);
  return () => {
    view.removeEventListener('change', onChange);
    view.removeEventListener('click', onClick);
  };
}
