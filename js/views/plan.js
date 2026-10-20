// Week strip + day detail (set any day's time ahead) + phase roadmap.
import * as store from '../store.js';
import { phaseRanges, usualCapacity, keyDates, SPEED_LABEL } from '../planner.js';
import { icon } from '../icons.js';
import { esc, fmtDate, fmtMinutes, todayStr, addDays, weekday, daysBetween, DAY_NAMES, toast } from '../util.js';
import { itemRow, itemTitle, deferSheet } from './common.js';
import { loadPlan, phaseName, toggleItem } from './today.js';

export async function render({ view, setTop, query, desktop }) {
  setTop({ title: 'Your plan', back: '#/today' });
  const today = todayStr();
  let sel = query.d && query.d >= today ? query.d : today;
  const monday = (d) => addDays(d, -((weekday(d) + 6) % 7));
  let weekOffset = Math.max(0, Math.round(daysBetween(monday(today), monday(sel)) / 7));

  const paint = async () => {
    const s = store.get();
    const { cur, plan } = await loadPlan();
    const byDate = new Map(plan.days.map((d) => [d.date, d]));
    // Week starting Monday containing today + offset
    let start = addDays(today, -((weekday(today) + 6) % 7) + weekOffset * 7);
    const week = Array.from({ length: desktop ? 35 : 7 }, (_, i) => addDays(start, i));
    if (!week.includes(sel)) sel = week.find((d) => d >= today) || week[0];
    const day = byDate.get(sel);
    const isPast = sel < today;
    const usual = usualCapacity(s.settings, sel);
    const override = s.dayMinutes?.[sel];
    const off = s.skipped[sel];
    const cap = day ? day.capacity : 0;
    const items = day ? day.items.map((i) => ({ ...i, done: !!s.done[i.key] })) : [];
    const req = items.filter((i) => !i.optional);
    const opt = items.filter((i) => i.optional);
    const paceOpt = (k, label) => {
      const on = (k === 'off' && off) || (!off && k === 'normal' && override == null) || (!off && override != null && ((k === 'busy' && override <= 30) || (k === 'free' && override > 30)));
      return `<button data-pace="${k}" class="${on ? 'on' : ''}">${label}</button>`;
    };
    const ranges = phaseRanges(plan).filter((r) => r.phase !== 'test');
    const kd = keyDates(s.settings);

    const nav = `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px">
        <button class="icon-btn" data-week="-${desktop ? 5 : 1}" aria-label="Earlier" ${weekOffset <= 0 ? 'disabled' : ''}>${icon('back')}</button>
        <strong>${fmtDate(week[0], { year: desktop })} – ${fmtDate(week[week.length - 1], { year: desktop })}</strong>
        <button class="icon-btn" data-week="${desktop ? 5 : 1}" aria-label="Later">${icon('chevron')}</button>
      </div>`;
    const strip = `<div class="week">${week
        .map((d) => {
          const dd = byDate.get(d);
          const n = dd ? dd.items.filter((i) => !i.optional && !i.habit).length : 0;
          const cls = ['d', d === sel ? 'sel' : '', dd?.rest ? 'rest' : '', d < today ? 'rest' : ''].join(' ');
          return `<button class="${cls}" data-day="${d}" ${d < today ? 'disabled' : ''}>${DAY_NAMES[weekday(d)]}<b>${Number(d.slice(8))}</b><div class="dots">${'<i></i>'.repeat(Math.min(3, n))}</div></button>`;
        })
        .join('')}</div>`;
    const month = `<div class="cal">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((x) => `<div class="cal-h">${x}</div>`).join('')}${week
        .map((d) => {
          const dd = byDate.get(d);
          const main = dd ? dd.items.filter((i) => !i.optional && !i.habit) : [];
          const mins = main.reduce((a, b) => a + (b.minutes || 0), 0);
          const past = d < today;
          const cls = ['cal-d', d === sel ? 'sel' : '', d === today ? 'today' : '', dd?.rest || s.skipped[d] ? 'rest' : '', past ? 'past' : '', dd ? `ph-${dd.phase}` : ''].join(' ');
          const label = (i) => (i.kind === 'lesson' ? cur.lessons[i.ref?.id || i.key.slice(7)]?.title : i.title) || '';
          return `<button class="${cls}" data-day="${d}" ${past ? 'disabled' : ''}>
            <div class="cal-top"><span class="cal-n">${Number(d.slice(8))}${d.slice(8) === '01' ? ` <small>${fmtDate(d).split(' ')[1]}</small>` : ''}</span>${mins ? `<span class="cal-m">${fmtMinutes(mins)}</span>` : ''}</div>
            ${dd?.rest || s.skipped[d] ? '<div class="cal-i faint">Rest</div>' : !main.length ? '<div class="cal-light">Light day · flashcards</div>' : main.slice(0, 2).map((i) => `<div class="cal-i k-${i.kind}">${esc(label(i))}</div>`).join('')}${main.length > 2 ? `<div class="cal-more">+${main.length - 2} more</div>` : ''}
          </button>`;
        })
        .join('')}</div>`;
    const dayCard = `<div class="card" style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
          <h2 style="margin:0">${fmtDate(sel, { weekday: true })}${sel === today ? ' · Today' : ''}</h2>
          <span class="chip indigo">${day ? phaseName(day.phase) : ''}</span>
        </div>
        ${isPast ? '' : `<p class="faint" style="margin:6px 0 10px">How much time will you have? Usually ${usual ? fmtMinutes(usual) : 'a rest day'}.</p>
        <div class="seg" role="group" aria-label="Time for this day">${paceOpt('busy', 'Busy')}${paceOpt('normal', 'Normal')}${paceOpt('free', 'Free')}${paceOpt('off', 'Off')}</div>`}
        <div style="margin-top:14px">
          ${day?.rest || off ? `<p class="muted">${off ? 'Day off.' : 'Rest day.'} Nothing planned.</p>` : ''}
          <div class="list">${req.map((i) => itemRow(i, cur, { done: i.done })).join('') || (day?.rest ? '' : '<p class="muted">Just your flashcards today.</p>')}</div>
          ${opt.length ? `<details style="margin-top:10px"><summary class="faint" style="cursor:pointer">Optional extras (${opt.length})</summary><div class="list" style="margin-top:8px">${opt.map((i) => itemRow(i, cur)).join('')}</div></details>` : ''}
        </div>
        ${!isPast && cap ? `<p class="faint" style="margin:12px 0 0">Planned: about ${fmtMinutes(req.reduce((a, b) => a + (b.minutes || 0), 0))} of ${fmtMinutes(cap)}.</p>` : ''}
      </div>`;
    const road = `<div class="section-title"><h2>The road to ${fmtDate(kd.test, { year: true })}</h2></div>
      <div class="card flat">
        <p class="muted small" style="margin-top:0">Pace: <strong>${SPEED_LABEL[s.settings.speed]}</strong>. ${esc(plan.status.message)} <a href="#/settings">Change</a></p>
        <div class="timeline">${ranges
          .map((r) => {
            const meta = cur.phases.find((p) => p.id === r.phase);
            const cls = r.end < today ? 'past' : r.start <= today ? 'now' : '';
            return `<div class="tl ${cls}"><div class="when">${fmtDate(r.start, { year: true })} – ${fmtDate(r.end, { year: true })}</div><div><strong>${esc(meta?.title || phaseName(r.phase))}</strong></div><div class="faint">${esc(meta?.blurb || '')}</div></div>`;
          })
          .join('')}
          <div class="tl"><div class="when">${fmtDate(kd.test, { weekday: true, year: true })}</div><div><strong>GMAT day</strong></div></div>
        </div>
      </div>`;
    view.innerHTML = desktop
      ? `<div class="layout plan-desk"><div><h1 style="margin:0 0 4px">Your plan</h1><p class="muted" style="margin:0 0 6px">Click any day to see it, set how busy you'll be, or move things around.</p>${nav}${month}</div><aside class="side-col">${dayCard}${road}</aside></div>`
      : `${nav}${strip}${dayCard}${road}`;
  };

  const onClick = async (e) => {
    const w = e.target.closest('[data-week]');
    if (w) {
      weekOffset = Math.max(0, weekOffset + Number(w.dataset.week));
      sel = null;
      return paint();
    }
    const d = e.target.closest('[data-day]');
    if (d) {
      sel = d.dataset.day;
      return paint();
    }
    const p = e.target.closest('[data-pace]');
    if (p) {
      const s = store.get();
      const usual = usualCapacity(s.settings, sel) || s.settings.weekdayMinutes;
      const v = p.dataset.pace;
      if (v === 'off') store.update((st) => (st.skipped[sel] = true), true);
      else store.setDayMinutes(sel, v === 'normal' ? null : v === 'busy' ? 20 : Math.max(usual * 2, 90));
      return paint();
    }
    const t = e.target.closest('[data-toggle]');
    if (t) {
      e.preventDefault();
      if (sel !== todayStr()) return toast('You can tick items off on the day itself.');
      toggleItem(t.dataset.toggle, Number(t.dataset.min));
      return paint();
    }
    const df = e.target.closest('[data-defer]');
    if (df) {
      e.preventDefault();
      const date = await deferSheet('');
      if (date) {
        store.deferItem(df.dataset.defer, date);
        toast(`Moved to ${fmtDate(date, { weekday: true })}.`);
        paint();
      }
    }
  };
  view.addEventListener('click', onClick);
  await paint();
  return () => view.removeEventListener('click', onClick);
}
