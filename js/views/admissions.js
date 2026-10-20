// Admissions tracker: realistic paths, your shortlist, the programme catalogue and what is coming up.
import * as store from '../store.js';
import * as content from '../content.js';
import { icon } from '../icons.js';
import { esc, fmtDate, todayStr } from '../util.js';

const STATUSES = ['Researching', 'Shortlisted', 'Writing essays', 'Submitted', 'Interview', 'Admitted', 'Waitlisted', 'Not this time'];
const FIT = {
  now: ['Fits now', 'green'],
  edge: ['Edge', 'amber'],
  later: ['Later', ''],
  'not eligible': ['Not eligible', ''],
};
const FILTERS = [['all', 'All'], ['now', 'Fits now'], ['edge', 'Edge'], ['later', 'Later']];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export async function render({ view, setTop }) {
  setTop({ title: 'Admissions', back: '#/more' });
  const [schools, timeline] = await Promise.all([content.schools(), content.admissionsTimeline()]);
  const byId = new Map(schools.map((s) => [s.id, s]));
  let filter = 'all';

  const schoolCard = (sc, tracked) => {
    const [fitLabel, fitTone] = FIT[sc.fitForMaria] || ['', ''];
    return `<div class="card flat" style="margin-bottom:10px">
      <div style="font-weight:700">${esc(sc.school)}</div>
      <div class="muted small">${esc(sc.name)}</div>
      <div class="chips" style="margin:10px 0">
        <span class="chip">${esc(sc.country)}</span><span class="chip">${esc(sc.type)}</span>
        ${fitLabel ? `<span class="chip ${fitTone}">${fitLabel}</span>` : ''}
      </div>
      <details class="reveal"><summary style="cursor:pointer;font-weight:600">Details</summary>
        <div class="small" style="margin-top:8px;display:grid;gap:6px">
          ${sc.avgGmat ? `<div><strong>GMAT:</strong> ${esc(sc.avgGmat)}</div>` : ''}
          ${sc.fees ? `<div><strong>Fees:</strong> ${esc(sc.fees)}</div>` : ''}
          ${sc.rounds ? `<div><strong>Rounds:</strong> ${esc(sc.rounds)}</div>` : ''}
          ${sc.experienceRule ? `<div><strong>Experience:</strong> ${esc(sc.experienceRule)}</div>` : ''}
          ${sc.notes ? `<div class="muted">${esc(sc.notes)}</div>` : ''}
        </div>
      </details>
      ${sc.verified === false ? '<div class="faint" style="margin-top:8px">Not verified, check the official site.</div>' : ''}
      <div class="btn-row" style="margin-top:12px">
        ${tracked ? `<span class="chip green">${icon('check')} On your list</span>` : `<button class="btn sm primary" data-track="${esc(sc.id)}">Track</button>`}
        ${sc.url ? `<a class="btn sm" href="${esc(sc.url)}" target="_blank" rel="noopener">Official site</a>` : ''}
      </div>
    </div>`;
  };

  const myCard = (id, t) => {
    const sc = byId.get(id);
    const name = sc ? sc.school : id;
    return `<div class="card" style="margin-bottom:10px" data-my="${esc(id)}">
      <div style="font-weight:700">${esc(name)}</div>
      ${sc ? `<div class="muted small">${esc(sc.name)}</div>` : ''}
      <label class="field" style="margin:12px 0"><span>Status</span>
        <select data-f="status">${STATUSES.map((s) => `<option value="${slug(s)}" ${t.status === slug(s) ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <div class="grid2">
        <label class="field" style="margin:0"><span>Round</span><input type="text" data-f="round" value="${esc(t.round)}" placeholder="e.g. Round 2"></label>
        <label class="field" style="margin:0"><span>Deadline</span><input type="date" data-f="deadline" value="${esc(t.deadline)}"></label>
      </div>
      <details class="reveal" style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">Notes</summary>
        <textarea data-f="notes" placeholder="Anything you want to remember" style="margin-top:8px">${esc(t.notes)}</textarea></details>
      <div class="btn-row" style="margin-top:12px;justify-content:space-between">
        ${sc?.url ? `<a class="btn ghost sm" href="${esc(sc.url)}" target="_blank" rel="noopener">Official site</a>` : '<span></span>'}
        <button class="btn ghost sm danger" data-remove="${esc(id)}">Remove</button>
      </div>
    </div>`;
  };

  const paint = () => {
    const s = store.get();
    const mine = Object.entries(s.admissions.schools || {});
    const today = todayStr();
    const upcoming = timeline.filter((t) => t.date >= today).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, 5);
    const list = schools.filter((x) => filter === 'all' || x.fitForMaria === filter);
    const catalogue = `<div class="seg" style="margin:4px 0 14px">${FILTERS.map(([k, l]) => `<button data-filter="${k}" class="${filter === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      ${list.length ? list.map((x) => schoolCard(x, !!s.admissions.schools[x.id])).join('') : '<p class="muted">Nothing in this group.</p>'}`;

    view.innerHTML = `
      <div class="card tint" style="margin-top:6px">
        <div class="eyebrow">Your realistic paths</div>
        <p style="margin:0 0 8px"><strong>ISB PGP</strong> for the 2028 intake, a <strong>European MiM or marketing masters</strong>, or an <strong>experienced MBA</strong> later on.</p>
        <p class="muted small" style="margin:0 0 12px">You do not need to choose yet. Track a few and see what feels right.</p>
        <a class="btn sm" href="#/lesson/a-roadmap">Read the roadmap lesson</a>
      </div>
      ${mine.length ? `<div class="section-title"><h2>My list (${mine.length})</h2></div>${mine.map(([id, t]) => myCard(id, t)).join('')}` : ''}
      ${upcoming.length ? `<div class="section-title"><h2>Coming up</h2></div><div class="list">${upcoming.map((t) => `<div class="item"><div class="ic">${icon('calendar')}</div><div class="body"><div class="faint small">${fmtDate(t.date, { year: true })}</div><div class="t">${esc(t.title)}</div>${t.detail ? `<div class="s">${esc(t.detail)}</div>` : ''}${t.lesson ? `<a class="small" href="#/lesson/${esc(t.lesson)}" style="font-weight:600">Read the lesson</a>` : ''}</div></div>`).join('')}</div>` : ''}
      <div class="section-title"><h2>Programmes</h2></div>
      ${mine.length ? `<details class="card flat reveal" ${view.dataset.open ? 'open' : ''} id="browse"><summary style="cursor:pointer;font-weight:650">Browse programmes (${schools.length})</summary><div style="margin-top:12px">${catalogue}</div></details>` : catalogue}`;
  };

  paint();
  const keepOpen = (fn) => {
    const d = view.querySelector('#browse');
    view.dataset.open = d && d.open ? '1' : '';
    fn();
  };
  const onClick = (e) => {
    const tr = e.target.closest('[data-track]');
    const rm = e.target.closest('[data-remove]');
    const fl = e.target.closest('[data-filter]');
    if (tr) {
      store.update((s) => {
        s.admissions.schools[tr.dataset.track] = { status: 'researching', round: '', deadline: '', notes: '' };
      }, true);
      keepOpen(paint);
    } else if (rm) {
      store.update((s) => delete s.admissions.schools[rm.dataset.remove], true);
      keepOpen(paint);
    } else if (fl) {
      filter = fl.dataset.filter;
      keepOpen(paint);
    }
  };
  const onChange = (e) => {
    const f = e.target.closest('[data-f]');
    const card = e.target.closest('[data-my]');
    if (!f || !card) return;
    store.update((s) => {
      const t = s.admissions.schools[card.dataset.my];
      if (t) t[f.dataset.f] = f.value;
    }, true);
  };
  view.addEventListener('click', onClick);
  view.addEventListener('change', onChange);
  return () => {
    view.removeEventListener('click', onClick);
    view.removeEventListener('change', onChange);
    delete view.dataset.open;
  };
}
