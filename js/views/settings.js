// Settings: dates, daily time, pace, breaks, materials, appearance and data.
import * as store from '../store.js';
import { icon } from '../icons.js';
import { esc, fmtDate, daysBetween, DAY_NAMES, toast } from '../util.js';
import { confirmSheet } from './common.js';
import { loadPlan } from './today.js';

const WEEKDAY_MIN = [30, 45, 60, 90, 120];
const WEEKEND_MIN = [60, 90, 120, 180, 240];
const PACES = [
  ['slow', 'Gentle', 'More breathing room before mock season. Lighter days, longer runway.'],
  ['normal', 'Balanced', 'A steady pace with about three weeks of buffer before mocks.'],
  ['fast', 'Fast-track', 'Finish lessons early and spend more time on mocks.'],
];
const mins = (m) => (m >= 60 ? `${m / 60 === Math.floor(m / 60) ? m / 60 : (m / 60).toFixed(1)} h` : `${m} min`);

export async function render({ view, setTop }) {
  setTop({ title: 'Settings', back: '#/more' });
  const save = (fn, { quiet = false, repaint = false } = {}) => {
    store.update(fn, true);
    if (!quiet) toast('Saved', { ms: 1200 });
    if (repaint) paint();
    else updatePace();
  };

  const seg = (key, value, label, group) => `<button class="${group === value ? 'on' : ''}" data-seg="${key}" data-v="${value}" aria-pressed="${group === value}">${label}</button>`;

  async function updatePace() {
    const el = view.querySelector('#pace-note');
    if (!el) return;
    try {
      const { plan } = await loadPlan();
      const st = plan.status;
      el.innerHTML = `${st.finish ? `<strong>Lessons finish by ${fmtDate(st.finish, { year: true })}.</strong> ` : ''}${esc(st.message || '')}`;
    } catch (e) {
      el.textContent = '';
    }
  }

  function paint() {
    const s = store.get().settings;
    const dayOpts = (cur) => DAY_NAMES.map((d, i) => `<option value="${i}" ${Number(cur) === i ? 'selected' : ''}>${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]}</option>`).join('');
    const pace = PACES.find((p) => p[0] === s.speed) || PACES[1];
    view.innerHTML = `
      <div class="section-title" style="margin-top:6px"><h2>Your test</h2></div>
      <div class="card">
        <label class="field"><span>Your name</span><input type="text" id="s-name" value="${esc(s.name)}"></label>
        <label class="field"><span>First attempt date</span><input type="date" id="s-test" value="${esc(s.testDate)}"></label>
        <label class="field" style="margin-bottom:0"><span>Backup attempt date</span><input type="date" id="s-backup" value="${esc(s.backupDate || '')}"></label>
        <div id="date-msg" class="small" style="color:var(--red);margin-top:8px" role="alert"></div>
      </div>

      <div class="section-title"><h2>Daily time</h2></div>
      <div class="card">
        <div class="faint" style="margin-bottom:6px">Weekdays</div>
        <div class="seg">${WEEKDAY_MIN.map((m) => seg('weekdayMinutes', m, mins(m), s.weekdayMinutes)).join('')}</div>
        <div class="faint" style="margin:14px 0 6px">Weekends</div>
        <div class="seg">${WEEKEND_MIN.map((m) => seg('weekendMinutes', m, mins(m), s.weekendMinutes)).join('')}</div>
        <div class="faint" style="margin:14px 0 6px">Study days (at least 3)</div>
        <div class="daypick">${DAY_NAMES.map((d, i) => `<button class="${s.studyDays[i] ? 'on' : ''}" data-day="${i}" aria-pressed="${!!s.studyDays[i]}">${d}</button>`).join('')}</div>
        <div id="day-msg" class="small" style="color:var(--red);margin-top:6px" role="alert"></div>
        <div class="grid2" style="margin-top:14px">
          <label class="field" style="margin:0"><span>Mock test day</span><select id="s-mock">${dayOpts(s.mockDay)}</select></label>
          <label class="field" style="margin:0"><span>Review day</span><select id="s-review">${dayOpts(s.reviewDay)}</select></label>
        </div>
      </div>

      <div class="section-title"><h2>Pace</h2></div>
      <div class="card">
        <div class="seg">${PACES.map(([k, l]) => seg('speed', k, l, s.speed)).join('')}</div>
        <p class="muted small" style="margin:12px 0 4px">${esc(pace[2])}</p>
        <p class="small" id="pace-note" style="margin:0"></p>
      </div>

      <div class="section-title"><h2>Breaks &amp; holidays</h2></div>
      <div class="card">
        ${(s.breaks || []).length ? `<div class="list" style="margin-bottom:14px">${s.breaks.map((b, i) => `<div class="item"><div class="ic">${icon('calendar')}</div><div class="body"><div class="t">${esc(b.label || 'Break')}</div><div class="s">${fmtDate(b.from)} to ${fmtDate(b.to, { year: true })}</div></div><button class="btn ghost sm" data-delbreak="${i}">Remove</button></div>`).join('')}</div>` : '<p class="muted small" style="margin-top:0">No breaks yet. Add a holiday or a busy stretch and the plan will work around it.</p>'}
        <details class="reveal"><summary style="cursor:pointer;font-weight:650">Add a break</summary>
          <div style="margin-top:12px">
            <div class="grid2"><label class="field"><span>From</span><input type="date" id="b-from"></label><label class="field"><span>To</span><input type="date" id="b-to"></label></div>
            <label class="field"><span>What is it?</span><input type="text" id="b-label" placeholder="Diwali, work trip"></label>
            <div id="break-msg" class="small" style="color:var(--red);margin-bottom:8px" role="alert"></div>
            <button class="btn primary" id="b-add">Add break</button>
          </div>
        </details>
      </div>

      <div class="section-title"><h2>Materials I own</h2></div>
      <div class="card" style="padding-top:4px;padding-bottom:4px">
        <label class="switch"><span>Official Guide 2026-2027</span><input type="checkbox" data-own="hasOfficialGuide" ${s.hasOfficialGuide ? 'checked' : ''}></label>
        <label class="switch" style="border-bottom:0"><span>Official Practice Exams 3-6</span><input type="checkbox" data-own="hasOfficialExams36" ${s.hasOfficialExams36 ? 'checked' : ''}></label>
      </div>

      <div class="section-title"><h2>Appearance</h2></div>
      <div class="seg">${[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([k, l]) => seg('theme', k, l, s.theme)).join('')}</div>

      <div class="section-title"><h2>Your data</h2></div>
      <div class="card">
        <p class="muted small" style="margin-top:0">Your progress lives in this browser on this device. A backup file lets you move it or recover it.</p>
        <div class="btn-row">
          <button class="btn" id="d-backup">${icon('download')} Download backup</button>
          <button class="btn" id="d-restore">${icon('upload')} Restore from backup</button>
        </div>
        <input type="file" id="d-file" accept="application/json,.json" hidden>
        <div style="margin-top:18px"><button class="btn ghost sm danger" id="d-reset">Reset everything</button></div>
      </div>`;
    updatePace();
  }

  const onClick = async (e) => {
    const sg = e.target.closest('[data-seg]');
    if (sg) {
      const key = sg.dataset.seg;
      const v = ['speed', 'theme'].includes(key) ? sg.dataset.v : Number(sg.dataset.v);
      save((st) => (st.settings[key] = v), { repaint: true });
      return;
    }
    const dp = e.target.closest('[data-day]');
    if (dp) {
      const i = Number(dp.dataset.day);
      const days = store.get().settings.studyDays.slice();
      days[i] = !days[i];
      if (days.filter(Boolean).length < 3) {
        view.querySelector('#day-msg').textContent = 'Keep at least 3 study days on.';
        return;
      }
      save((st) => (st.settings.studyDays = days), { repaint: true });
      return;
    }
    const db = e.target.closest('[data-delbreak]');
    if (db) {
      save((st) => st.settings.breaks.splice(Number(db.dataset.delbreak), 1), { repaint: true });
      return;
    }
    if (e.target.closest('#b-add')) {
      const from = view.querySelector('#b-from').value;
      const to = view.querySelector('#b-to').value;
      const label = view.querySelector('#b-label').value.trim();
      const msg = view.querySelector('#break-msg');
      if (!from || !to) return void (msg.textContent = 'Pick a start and an end date.');
      if (to < from) return void (msg.textContent = 'The end date has to be on or after the start date.');
      save((st) => (st.settings.breaks = [...(st.settings.breaks || []), { from, to, label }].sort((a, b) => (a.from < b.from ? -1 : 1))), { repaint: true });
      return;
    }
    if (e.target.closest('#d-backup')) {
      store.downloadBackup();
      toast('Backup saved to your downloads.', { kind: 'good' });
    } else if (e.target.closest('#d-restore')) {
      view.querySelector('#d-file').click();
    } else if (e.target.closest('#d-reset')) {
      if (!(await confirmSheet('Reset everything?', 'This clears your progress, notes and settings on this device.', 'Continue'))) return;
      if (!(await confirmSheet('Really erase it all?', 'This cannot be undone unless you have a backup file.', 'Erase everything'))) return;
      store.resetAll();
      location.hash = '#/welcome';
    }
  };

  const onChange = async (e) => {
    const t = e.target;
    if (t.id === 's-name') return save((st) => (st.settings.name = t.value.trim() || 'Maria'));
    if (t.id === 's-test' || t.id === 's-backup') {
      const s = store.get().settings;
      const test = t.id === 's-test' ? t.value : s.testDate;
      const backup = t.id === 's-backup' ? t.value : s.backupDate;
      const msg = view.querySelector('#date-msg');
      if (!test) return void (msg.textContent = 'Pick a date for your first attempt.');
      if (backup && daysBetween(test, backup) < 16) return void (msg.textContent = 'The backup attempt needs to be at least 16 days after the first one. It was not saved.');
      msg.textContent = '';
      return save((st) => {
        st.settings.testDate = test;
        st.settings.backupDate = backup || null;
      });
    }
    if (t.id === 's-mock') return save((st) => (st.settings.mockDay = Number(t.value)));
    if (t.id === 's-review') return save((st) => (st.settings.reviewDay = Number(t.value)));
    if (t.dataset.own) return save((st) => (st.settings[t.dataset.own] = t.checked));
    if (t.id === 'd-file' && t.files[0]) {
      const file = t.files[0];
      t.value = '';
      if (!(await confirmSheet('Restore this backup?', 'It replaces the progress currently on this device.', 'Restore'))) return;
      try {
        store.importJSON(await file.text());
        toast('Backup restored.', { kind: 'good' });
        paint();
      } catch (err) {
        toast(err.message || 'That file could not be read.', { kind: 'warn', ms: 4000 });
      }
    }
  };

  view.addEventListener('click', onClick);
  view.addEventListener('change', onChange);
  paint();
  return () => {
    view.removeEventListener('click', onClick);
    view.removeEventListener('change', onChange);
  };
}
