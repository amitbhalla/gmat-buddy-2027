// Today: one clear next step, the rest of the day, optional extras folded away.
import * as store from '../store.js';
import * as content from '../content.js';
import { buildPlan, usualCapacity, phaseRanges } from '../planner.js';
import { lessonOutline } from '../md.js';
import { icon } from '../icons.js';
import { esc, fmtDate, fmtMinutes, todayStr, daysBetween, addDays, weekday, DAY_NAMES, toast } from '../util.js';
import { keyDates } from '../planner.js';
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

export async function render({ view, setTop, desktop }) {
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
    nextCard = `<div class="card tint"><img class="cover slim" src="img/gen/test-day-illus.jpg" alt="" onerror="this.remove()"><div class="eyebrow">Today</div><h2>It's GMAT day.</h2><p class="muted">Passport, water, a calm breakfast. You've prepared for this for months. Trust it.</p><a class="btn" href="#/checklist">Open test-day checklist</a></div>`;
  } else if (isRest) {
    nextCard = `<div class="card good"><img class="cover slim" src="img/gen/rest-day.jpg" alt="" onerror="this.remove()"><div class="eyebrow">Today</div><h2>Rest day.</h2><p class="muted">Rest is part of the plan. Your brain consolidates what you learned while you're off.</p>${s.skipped[today] ? '<button class="btn sm" data-unskip>Actually, I want to study today</button>' : ''}</div>`;
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
    nextCard = `<div class="card good"><img class="cover slim" src="img/gen/all-done.jpg" alt="" onerror="this.remove()"><div class="eyebrow">Today</div><h2>All done for today.</h2><p class="muted">${esc(coachLine(coach, 'motivation', today) || 'Nicely done. Close the app and enjoy your evening.')}</p></div>`;
  }

  const rest = allReq.filter((i) => i !== next && i.kind !== 'test');
  const tip = coachLine(coach, 'dailyTips', today);
  const g = greeting(coach, s.settings.name);
  const cut = g.search(/[.!?](\s|$)/);
  const greetHead = cut > 0 ? g.slice(0, cut + 1) : g;
  const greetRest = cut > 0 ? g.slice(cut + 1).trim() : '';

  if (desktop) {
    view.innerHTML = await desktopToday({ s, cur, plan, coach, day, next, rest, optional, nudge, nextCard, isRest, testDay, pctDone, daysToTest, dayN, streak, minutesToday, greetHead, greetRest, tip, today });
  } else view.innerHTML = `<div class="layout"><div class="main-col">
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
    ${tip ? `<div class="card flat mobile-only" style="margin-top:14px"><div class="eyebrow">Tip of the day</div><p style="margin:0">${esc(tip)}</p></div>` : ''}
    <div class="btn-row" style="margin-top:12px;justify-content:space-between">
      <a class="btn ghost sm mobile-only" href="#/plan">${icon('calendar')} This week &amp; roadmap</a>
      ${!isRest && !testDay ? '<button class="btn ghost sm" data-notfeeling>Not feeling it today?</button>' : ''}
    </div>
    </div>
    <aside class="side-col side-only">${sidePanel(s, plan, cur, tip, today)}</aside>
    </div>`;

  const onClick = async (e) => {
    const toggle = e.target.closest('[data-toggle]');
    if (toggle) {
      e.preventDefault();
      e.stopPropagation();
      toggleItem(toggle.dataset.toggle, Number(toggle.dataset.min), cur);
      checkAchievements(coach, cur);
      render({ view, setTop, desktop });
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
        render({ view, setTop, desktop });
      }
      return;
    }
    const pace = e.target.closest('[data-pace]');
    if (pace) {
      const v = pace.dataset.pace;
      const usual = usualCapacity(s.settings, today) || s.settings.weekdayMinutes;
      if (v === 'off') store.update((st) => (st.skipped[today] = true), true);
      else store.setDayMinutes(today, v === 'normal' ? null : v === 'busy' ? 20 : Math.max(usual * 2, 90));
      render({ view, setTop, desktop });
      return;
    }
    const task = e.target.closest('[data-task]');
    if (task) {
      e.preventDefault();
      const it = [...items, ...finished].find((i) => i.key === task.dataset.task);
      if (it) taskSheet(it, cur, () => render({ view, setTop, desktop }));
      return;
    }
    if (e.target.closest('[data-backup]')) {
      store.downloadBackup();
      toast('Backup saved to your downloads.', { kind: 'good' });
      render({ view, setTop, desktop });
      return;
    }
    if (e.target.closest('[data-unskip]')) {
      store.update((st) => delete st.skipped[today], true);
      render({ view, setTop, desktop });
      return;
    }
    if (e.target.closest('[data-ahead]')) {
      const upcoming = plan.days.slice(1).flatMap((d) => d.items).find((i) => !i.habit && !i.optional && i.kind !== 'admissions' && itemHref(i));
      if (upcoming) location.hash = itemHref(upcoming);
      else toast('Nothing left to pull forward. You are fully ahead.');
      return;
    }
    if (e.target.closest('[data-notfeeling]')) notFeelingSheet(today, () => render({ view, setTop, desktop }));
  };
  // render() calls itself after every tap; keep exactly one click handler on the view.
  if (view._todayClick) view.removeEventListener('click', view._todayClick);
  view._todayClick = onClick;
  view.addEventListener('click', onClick);
  return () => view.removeEventListener('click', view._todayClick);
}

function sidePanel(s, plan, cur, tip, today) {
  const kd = keyDates(s.settings);
  const week = plan.days.slice(0, 7);
  const toMocks = daysBetween(today, kd.mockStart);
  const heat = [];
  for (let i = 27; i >= 0; i--) {
    const d = addDays(today, -i);
    const m = s.studyLog[d] || 0;
    heat.push(`<i class="l${m >= 90 ? 4 : m >= 50 ? 3 : m >= 25 ? 2 : m >= 5 ? 1 : 0}${d === today ? ' today' : ''}" title="${fmtDate(d)}: ${Math.round(m)} min"></i>`);
  }
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline"><h3 style="margin:0">This week</h3><a class="small" href="#/plan">Open plan</a></div>
      <div class="list" style="margin-top:12px;gap:6px">${week.map((d) => {
        const main = d.items.filter((i) => !i.habit && !i.optional);
        const label = d.rest ? 'Rest day' : main.length ? main.map((i) => (i.kind === 'lesson' ? cur.lessons[i.ref?.id || i.key.slice(7)]?.title : i.title)).filter(Boolean)[0] + (main.length > 1 ? ` +${main.length - 1}` : '') : 'Flashcards only';
        return `<a href="#/plan?d=${d.date}" style="display:flex;gap:10px;align-items:center;text-decoration:none;color:inherit;padding:6px 4px;border-radius:10px">
          <span style="width:38px;text-align:center;flex-shrink:0"><span class="faint" style="font-size:11px;display:block">${DAY_NAMES[weekday(d.date)]}</span><strong>${Number(d.date.slice(8))}</strong></span>
          <span style="flex:1;min-width:0;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${d.date === today ? 'font-weight:650' : 'color:var(--text-2)'}">${esc(label)}</span></a>`;
      }).join('')}</div>
    </div>
    <div class="card">
      <h3>Milestones</h3>
      <div class="grid2" style="margin-top:10px">
        <div><div style="font-size:26px;font-weight:800">${Object.values(s.lessons).filter((l) => l.completedAt).length}<span class="faint" style="font-size:15px;font-weight:600">/${Object.keys(cur.lessons).length}</span></div><div class="faint">lessons done</div></div>
        <div><div style="font-size:26px;font-weight:800">${Math.max(0, toMocks)}</div><div class="faint">days to mock season</div></div>
      </div>
      <p class="faint" style="margin:10px 0 0">Test day: ${fmtDate(kd.test, { weekday: true, year: true })}</p>
    </div>
    <div class="card">
      <h3>Last 4 weeks</h3>
      <div class="heat" style="margin-top:10px">${heat.join('')}</div>
      <p class="faint" style="margin:8px 0 0">Streak: ${store.streak(s)} days</p>
    </div>
    ${tip ? `<div class="card flat"><div class="eyebrow">Tip of the day</div><p style="margin:0">${esc(tip)}</p></div>` : ''}`;
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
    const rec = s.done[key];
    store.unmarkDone(key);
    if (key.startsWith('lesson:')) store.update((st) => st.lessons[key.slice(7)] && delete st.lessons[key.slice(7)].completedAt);
    // Take back the minutes that ticking it added (only if it was ticked today).
    if (rec && rec.date === todayStr() && rec.minutes) store.logMinutes(-rec.minutes);
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

// ---------- desktop: a study dashboard, not a stretched phone screen
async function desktopToday(c) {
  const { s, cur, plan, day, next, rest, optional, nudge, isRest, testDay, pctDone, daysToTest, dayN, streak, minutesToday, greetHead, greetRest, tip, today } = c;
  const kd = keyDates(s.settings);
  let preview = '';
  if (next && next.kind === 'lesson') {
    const id = next.ref?.id || next.key.slice(7);
    const meta = cur.lessons[id];
    let outline = [];
    try {
      outline = lessonOutline(await content.lessonMarkdown(id)).filter((h) => !/^(key takeaways|go deeper|quick check)/i.test(h)).slice(0, 6);
    } catch {}
    preview = `<p class="muted" style="margin:6px 0 12px">${esc(meta?.summary || '')}</p>
      ${outline.length ? `<div class="faint" style="margin-bottom:6px">In this lesson</div><ol class="outline">${outline.map((h) => `<li>${esc(h)}</li>`).join('')}</ol>` : ''}`;
  } else if (next) {
    preview = `<p class="muted" style="margin:6px 0 12px">${esc(next.detail || itemSubtitle(next, cur))}</p>`;
  }
  const href = next ? itemHref(next) : null;
  const hero = testDay
    ? `<div class="panel tint"><img class="cover slim" src="img/gen/test-day-illus.jpg" alt="" onerror="this.remove()"><h2>It's GMAT day.</h2><p class="muted">Passport, water, a calm breakfast. You have prepared for this for months. Trust it.</p><a class="btn" href="#/checklist">Open test-day checklist</a></div>`
    : isRest
      ? `<div class="panel good" style="display:grid;grid-template-columns:1fr 1.2fr;gap:24px;align-items:center"><img class="cover" style="margin:0" src="img/gen/rest-day.jpg" alt="" onerror="this.remove()"><div><div class="eyebrow">Today</div><h2>Rest day.</h2><p class="muted">Rest is part of the plan. Your brain consolidates what you learned while you are off.</p>${s.skipped[today] ? '<button class="btn sm" data-unskip>Actually, I want to study today</button>' : ''}</div></div>`
      : next
        ? `<div class="panel next-panel">
            <div class="next-head"><div class="eyebrow">Next up</div><span class="chip">${esc(itemSubtitle(next, cur))}</span></div>
            <h2 class="next-title">${esc(itemTitle(next, cur))}</h2>
            ${preview}
            <div class="btn-row">${href ? `<a class="btn primary" href="${href}">${icon('play')} Start</a>` : `<button class="btn primary" data-task="${esc(next.key)}">Open</button>`}<button class="btn" data-defer="${esc(next.key)}">${icon('calendar')} Move to another day</button></div>
          </div>`
        : `<div class="panel good" style="display:grid;grid-template-columns:1fr 1.2fr;gap:24px;align-items:center"><img class="cover" style="margin:0" src="img/gen/all-done.jpg" alt="" onerror="this.remove()"><div><div class="eyebrow">Today</div><h2>All done for today.</h2><p class="muted">Nicely done. Close the laptop and enjoy your evening. Or get ahead from the list below.</p></div></div>`;
  const left = rest.filter((i) => !i.done).reduce((a, b) => a + (b.minutes || 0), 0);
  const ranges = phaseRanges(plan).filter((r) => !['test', 'apply', 'retake'].includes(r.phase));
  const span = Math.max(1, daysBetween(ranges[0]?.start || today, kd.test));
  return `
    <header class="dash-head">
      <div>
        <div class="faint">${fmtDate(today, { weekday: true, year: true })} · Day ${dayN}</div>
        <h1 style="margin:2px 0 2px">${esc(greetHead)}</h1>
        ${greetRest ? `<div class="muted">${esc(greetRest)}</div>` : ''}
      </div>
      <div class="dash-stats">
        <div class="dstat"><b>${Math.max(0, daysToTest)}</b><span>days to GMAT</span></div>
        <div class="dstat"><b>${streak}</b><span>day streak</span></div>
        <div class="dstat"><b>${minutesToday}</b><span>min today</span></div>
        <div class="ring" style="--p:${pctDone};--size:58px"><span>${pctDone}%</span></div>
      </div>
    </header>
    <div class="phase-track" aria-label="Your phases">${ranges.map((r) => {
      const w = Math.max(4, (daysBetween(r.start, r.end) + 1) / span * 100);
      const meta = cur.phases.find((p) => p.id === r.phase);
      const state = r.end < today ? 'past' : r.start <= today ? 'now' : '';
      return `<div class="phase-seg ${state}" style="flex:${w}" title="${esc(meta?.title || r.phase)}: ${fmtDate(r.start)} to ${fmtDate(r.end)}"><span>${esc(meta?.title || phaseName(r.phase))}</span></div>`;
    }).join('')}<div class="phase-seg test" style="flex:3"><span>Test</span></div></div>
    ${nudge}
    <div class="layout">
      <div class="main-col">
        ${testDay ? '' : `<div class="pace-row">${dayPace(s, today)}<button class="btn ghost sm" data-notfeeling>Not feeling it today?</button></div>`}
        ${hero}
        ${rest.length ? `<div class="section-title"><h2>Rest of today</h2><span class="faint">${fmtMinutes(left)} left</span></div><div class="list">${rest.sort((a, b) => a.done - b.done).map((i) => itemRow(i, cur, { done: i.done })).join('')}</div>` : ''}
        ${!isRest && !testDay ? `<div class="section-title"><h2>If you have extra time</h2><span class="faint">Optional</span></div>
          <div class="list two">${optional.map((i) => itemRow(i, cur)).join('')}<button class="item" data-ahead style="width:100%;text-align:left"><div class="ic green">${icon('bolt')}</div><div class="body"><div class="t">Get ahead</div><div class="s">Start tomorrow's first item now</div></div></button></div>` : ''}
      </div>
      <aside class="side-col">${sidePanel(s, plan, cur, tip, today)}</aside>
    </div>`;
}
