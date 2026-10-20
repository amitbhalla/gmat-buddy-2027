// Today: one clear next step, the rest of the day, optional extras folded away.
import * as store from '../store.js';
import * as content from '../content.js';
import { buildPlan, usualCapacity } from '../planner.js';
import { icon } from '../icons.js';
import { esc, fmtDate, fmtMinutes, todayStr, daysBetween, addDays, toast } from '../util.js';
import { itemRow, itemTitle, itemSubtitle, itemHref, sheet, deferSheet, greeting, coachLine, checkAchievements } from './common.js';

export async function loadPlan() {
  const [cur, timeline] = await Promise.all([content.curriculum(), content.admissionsTimeline()]);
  const s = store.get();
  const today = todayStr();
  const doneTodayMin = Object.values(s.done).filter((d) => d.date === today).reduce((a, d) => a + (d.minutes || 0), 0);
  const plan = buildPlan({ curriculum: cur, state: s, today, timeline, doneToday: doneTodayMin });
  return { cur, plan, timeline };
}

// Items finished today that have left the plan (sequence items), rebuilt for display.
function doneTodayItems(s, cur, planKeys) {
  const today = todayStr();
  const out = [];
  for (const [key, d] of Object.entries(s.done)) {
    if (d.date !== today || planKeys.has(key)) continue;
    const seq = cur.sequence.find((x) => x.key === key);
    if (seq) out.push({ key, kind: seq.k, title: seq.title, minutes: seq.minutes, ref: seq });
    else if (key.startsWith('lesson:')) out.push({ key, kind: 'lesson', minutes: d.minutes, ref: { id: key.slice(7) } });
  }
  return out;
}

export async function render({ view, setTop }) {
  const s = store.get();
  const coach = await content.coach();
  const { cur, plan } = await loadPlan();
  const today = todayStr();
  const day = plan.days[0];
  const planKeys = new Set(day.items.map((i) => i.key));
  const items = day.items.map((i) => ({ ...i, done: !!s.done[i.key] }));
  const finished = doneTodayItems(s, cur, planKeys).map((i) => ({ ...i, done: true }));
  const required = items.filter((i) => !i.optional);
  const optional = items.filter((i) => i.optional && !i.done);
  // The main study item leads; habits like flashcards come after it.
  const next = required.find((i) => !i.done && i.kind !== 'test' && !i.habit) || required.find((i) => !i.done && i.kind !== 'test');
  const allReq = [...required, ...finished];
  const doneCount = allReq.filter((i) => i.done).length;
  const pctDone = allReq.length ? Math.round((doneCount / allReq.length) * 100) : 0;
  const daysToTest = daysBetween(today, s.settings.testDate);
  const dayN = daysBetween(s.settings.startDate, today) + 1;
  const streak = store.streak(s);
  const minutesToday = Math.round(s.studyLog[today] || 0);

  // One nudge only, highest priority first.
  const lastActive = Object.keys(s.studyLog).filter((d) => s.studyLog[d] >= 5).sort().pop();
  const gap = lastActive ? daysBetween(lastActive, today) : 0;
  let nudge = '';
  if (gap >= 3) nudge = `<div class="card good"><strong>Welcome back.</strong> <span class="muted">${esc(coachLine(coach, 'comeback', today) || 'Missed days happen. The plan has already moved everything forward. Just do the next thing.')}</span></div>`;
  else if (plan.status.level === 'behind' || plan.status.level === 'tight') nudge = `<a class="card warn" href="#/settings" style="display:block;text-decoration:none;color:inherit"><strong>Heads up.</strong> <span class="muted">${esc(plan.status.message)}</span> <span style="color:var(--primary);font-weight:600">Adjust</span></a>`;
  else if (store.backupOverdue(s)) nudge = `<button class="card tint" data-backup style="display:block;width:100%;text-align:left;cursor:pointer;border:0"><strong>Save a backup of your progress.</strong> <span class="muted">Your progress lives in this browser. One tap saves a file you can restore anywhere.</span></button>`;

  const isRest = day.rest || s.skipped[today];
  const testDay = day.items.find((i) => i.kind === 'test');

  let nextCard = '';
  if (testDay) {
    nextCard = `<div class="card tint"><div class="eyebrow">Today</div><h2>It's GMAT day.</h2><p class="muted">Passport, water, a calm breakfast. You've prepared for this for months. Trust it.</p><a class="btn" href="#/checklist">Open test-day checklist</a></div>`;
  } else if (isRest) {
    nextCard = `<div class="card good"><div class="eyebrow">Today</div><h2>Rest day.</h2><p class="muted">Rest is part of the plan. Your brain consolidates what you learned while you're off.</p>${s.skipped[today] ? '<button class="btn sm" data-unskip>Actually, I want to study today</button>' : ''}</div>`;
  } else if (next) {
    const href = itemHref(next);
    nextCard = `<div class="card" style="border-color:color-mix(in srgb,var(--primary) 35%,var(--border))">
      <div class="eyebrow">Next up</div>
      <h2 style="margin-bottom:4px">${esc(itemTitle(next, cur))}</h2>
      <p class="muted small" style="margin-bottom:14px">${esc(itemSubtitle(next, cur))}</p>
      <div class="btn-row">
        ${href ? `<a class="btn primary" style="flex:1" href="${href}">${icon('play')} Start</a>` : `<button class="btn primary" style="flex:1" data-task="${esc(next.key)}">Open</button>`}
        <button class="btn" data-defer="${esc(next.key)}">${icon('calendar')} Later</button>
      </div>
    </div>`;
  } else {
    nextCard = `<div class="card good"><div class="eyebrow">Today</div><h2>All done for today.</h2><p class="muted">${esc(coachLine(coach, 'motivation', today) || 'Nicely done. Close the app and enjoy your evening.')}</p></div>`;
  }

  const rest = allReq.filter((i) => i !== next && i.kind !== 'test');
  const tip = coachLine(coach, 'dailyTips', today);
  const g = greeting(coach, s.settings.name);
  const cut = g.search(/[.!?](\s|$)/);
  const greetHead = cut > 0 ? g.slice(0, cut + 1) : g;
  const greetRest = cut > 0 ? g.slice(cut + 1).trim() : '';

  view.innerHTML = `
    <section class="hero">
      <div style="display:flex;gap:16px;align-items:center">
        <div style="flex:1;min-width:0">
          <div class="faint">${fmtDate(today, { weekday: true })} · Day ${dayN} · ${phaseName(day.phase)}</div>
          <h1>${esc(greetHead)}</h1>
          ${greetRest ? `<div class="muted small" style="margin:-2px 0 4px">${esc(greetRest)}</div>` : ''}
          <div class="muted small">${daysToTest > 0 ? `${daysToTest} days to your GMAT` : daysToTest === 0 ? 'Test day' : 'Application season'}</div>
        </div>
        <div class="ring" style="--p:${pctDone};--size:68px"><span>${pctDone}%</span></div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><div class="n">${streak}</div><div class="l">day streak</div></div>
        <div class="hero-stat"><div class="n">${minutesToday}</div><div class="l">minutes today</div></div>
      </div>
    </section>
    ${testDay ? '' : dayPace(s, today)}
    ${nudge}
    ${nextCard}
    ${rest.length ? `<div class="section-title"><h2>Rest of today</h2><span class="faint">${fmtMinutes(rest.filter((i) => !i.done).reduce((a, b) => a + (b.minutes || 0), 0))} left</span></div>
    <div class="list">${rest.sort((a, b) => a.done - b.done).map((i) => itemRow(i, cur, { done: i.done })).join('')}</div>` : ''}
    ${!isRest && !testDay ? `<details class="card flat" style="margin-top:18px" ${optional.length && !next ? 'open' : ''}>
      <summary style="cursor:pointer;font-weight:650">If you have extra time</summary>
      <div class="list" style="margin-top:12px">
        ${optional.map((i) => itemRow(i, cur)).join('')}
        <button class="item" data-ahead style="width:100%;text-align:left"><div class="ic green">${icon('bolt')}</div><div class="body"><div class="t">Get ahead</div><div class="s">Start tomorrow's first item now</div></div></button>
      </div>
    </details>` : ''}
    ${tip ? `<div class="card flat" style="margin-top:14px"><div class="eyebrow">Tip of the day</div><p style="margin:0">${esc(tip)}</p></div>` : ''}
    <div class="btn-row" style="margin-top:12px;justify-content:space-between">
      <a class="btn ghost sm" href="#/plan">${icon('calendar')} This week &amp; roadmap</a>
      ${!isRest && !testDay ? '<button class="btn ghost sm" data-notfeeling>Not feeling it today?</button>' : ''}
    </div>`;

  const onClick = async (e) => {
    const toggle = e.target.closest('[data-toggle]');
    if (toggle) {
      e.preventDefault();
      e.stopPropagation();
      toggleItem(toggle.dataset.toggle, Number(toggle.dataset.min), cur);
      checkAchievements(coach, cur);
      render({ view, setTop });
      return;
    }
    const defer = e.target.closest('[data-defer]');
    if (defer) {
      e.preventDefault();
      e.stopPropagation();
      const it = items.find((i) => i.key === defer.dataset.defer);
      const date = await deferSheet(it ? itemTitle(it, cur) : '');
      if (date) {
        store.deferItem(defer.dataset.defer, date);
        toast(`Moved to ${fmtDate(date, { weekday: true })}.`);
        render({ view, setTop });
      }
      return;
    }
    const pace = e.target.closest('[data-pace]');
    if (pace) {
      const v = pace.dataset.pace;
      const usual = usualCapacity(s.settings, today) || s.settings.weekdayMinutes;
      if (v === 'off') store.update((st) => (st.skipped[today] = true), true);
      else store.setDayMinutes(today, v === 'normal' ? null : v === 'busy' ? 20 : Math.max(usual * 2, 90));
      render({ view, setTop });
      return;
    }
    const task = e.target.closest('[data-task]');
    if (task) {
      e.preventDefault();
      const it = [...items, ...finished].find((i) => i.key === task.dataset.task);
      if (it) taskSheet(it, cur, () => render({ view, setTop }));
      return;
    }
    if (e.target.closest('[data-backup]')) {
      store.downloadBackup();
      toast('Backup saved to your downloads.', { kind: 'good' });
      render({ view, setTop });
      return;
    }
    if (e.target.closest('[data-unskip]')) {
      store.update((st) => delete st.skipped[today], true);
      render({ view, setTop });
      return;
    }
    if (e.target.closest('[data-ahead]')) {
      const upcoming = plan.days.slice(1).flatMap((d) => d.items).find((i) => !i.habit && !i.optional && i.kind !== 'admissions' && itemHref(i));
      if (upcoming) location.hash = itemHref(upcoming);
      else toast('Nothing left to pull forward. You are fully ahead.');
      return;
    }
    if (e.target.closest('[data-notfeeling]')) notFeelingSheet(today, () => render({ view, setTop }));
  };
  view.addEventListener('click', onClick);
  return () => view.removeEventListener('click', onClick);
}

function dayPace(s, today) {
  const usual = usualCapacity(s.settings, today) || s.settings.weekdayMinutes;
  const o = s.dayMinutes?.[today];
  const cur = s.skipped[today] ? 'off' : o == null ? 'normal' : o <= 30 ? 'busy' : 'free';
  const opt = (k, label) => `<button data-pace="${k}" class="${cur === k ? 'on' : ''}" aria-pressed="${cur === k}">${label}</button>`;
  return `<div class="daypace" role="group" aria-label="How much time do you have today?"><span class="lbl">Today I'm</span>
    <div class="seg">${opt('busy', 'Busy')}${opt('normal', 'Normal')}${opt('free', 'Free')}${opt('off', 'Off')}</div></div>`;
}

export function phaseName(p) {
  return { orientation: 'Orientation', foundations: 'Foundations', core: 'Core', advanced: 'Advanced', mocks: 'Mocks', taper: 'Taper', test: 'Test', retake: 'Retake prep', apply: 'Apply' }[p] || '';
}

export function toggleItem(key, minutes, cur) {
  const s = store.get();
  if (s.done[key]) {
    store.unmarkDone(key);
    if (key.startsWith('lesson:')) store.update((st) => st.lessons[key.slice(7)] && delete st.lessons[key.slice(7)].completedAt);
    if (minutes) store.logMinutes(-Math.min(minutes, s.studyLog[todayStr()] || 0));
  } else {
    store.markDone(key, minutes);
    if (key.startsWith('lesson:')) store.update((st) => ((st.lessons[key.slice(7)] ||= {}).completedAt = new Date().toISOString()));
    if (minutes) store.logMinutes(minutes);
  }
}

function taskSheet(it, cur, after) {
  const s = store.get();
  const done = !!s.done[it.key];
  const detail = it.detail || it.ref?.detail || '';
  const sh = sheet(`<div class="eyebrow">${it.kind === 'admissions' ? 'Admissions' : 'Task'}</div><h2>${esc(itemTitle(it, cur))}</h2>
    ${detail ? `<p class="muted">${esc(detail)}</p>` : ''}
    ${it.ref?.lesson ? `<p><a href="#/lesson/${it.ref.lesson}" data-close>Read the related lesson</a></p>` : ''}
    ${it.ref?.url ? `<p><a href="${esc(it.ref.url)}" target="_blank" rel="noopener">Open ${esc(new URL(it.ref.url).hostname)}</a></p>` : ''}
    <div class="btn-row"><button class="btn primary" data-done>${done ? 'Mark not done' : 'Mark done'}</button><button class="btn" data-close>Close</button></div>`);
  sh.el.querySelector('[data-done]').addEventListener('click', () => {
    toggleItem(it.key, it.minutes || 0, cur);
    sh.close();
    after();
  });
}

function notFeelingSheet(today, after) {
  const sh = sheet(`<h2>Not feeling it today?</h2><p class="muted">Totally fine. Pick what fits. The plan rebalances either way.</p>
    <div class="list">
      <button class="item" data-opt="light" style="width:100%;text-align:left"><div class="ic green">${icon('cards')}</div><div class="body"><div class="t">Just 10 minutes</div><div class="s">Do your flashcards and keep the streak alive</div></div></button>
      <button class="item" data-opt="off" style="width:100%;text-align:left"><div class="ic blue">${icon('moon')}</div><div class="body"><div class="t">Take today off</div><div class="s">Today's items move to the coming days</div></div></button>
      <a class="item" href="#/settings" data-close><div class="ic">${icon('settings')}</div><div class="body"><div class="t">Change my pace or daily time</div><div class="s">For when life gets busier for a while</div></div></a>
    </div>`);
  sh.el.addEventListener('click', (e) => {
    const o = e.target.closest('[data-opt]');
    if (!o) return;
    if (o.dataset.opt === 'off') {
      store.update((st) => (st.skipped[today] = true), true);
      toast('Enjoy your day off. See you tomorrow.');
      sh.close();
      after();
    } else {
      sh.close();
      location.hash = '#/cards';
    }
  });
}
