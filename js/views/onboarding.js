// First-run setup: five short steps, one decision each.
import * as store from '../store.js';
import * as content from '../content.js';
import { buildPlan, keyDates, SPEED_LABEL } from '../planner.js';
import { esc, fmtDate, todayStr, daysBetween, addDays } from '../util.js';
import { icon } from '../icons.js';

const WEEKDAY_OPTS = [30, 45, 60, 90];
const WEEKEND_OPTS = [60, 90, 120, 180];

export async function render({ view, setTop, focusMode }) {
  focusMode(true);
  const cur = await content.curriculum();
  const s = store.get();
  const draft = { ...s.settings };
  let step = 0;

  const projected = (speed) => {
    const st = { ...s, settings: { ...draft, speed, startDate: todayStr() }, done: {}, lessons: {} };
    const plan = buildPlan({ curriculum: cur, state: st, today: todayStr() });
    return plan.status;
  };

  const steps = [
    () => `
      <img class="cover" src="img/gen/welcome.jpg" alt="" onerror="this.remove()">
      <div class="eyebrow">Step 1 of 5</div>
      <h1>Hi! I'm your GMAT Buddy.</h1>
      <p class="muted">I'll take you from "where do I even start?" to test day and your applications. One small step at a time, every day. You won't need anything else open.</p>
      <label class="field"><span>What should I call you?</span><input type="text" id="name" value="${esc(draft.name)}" autocomplete="given-name"></label>`,
    () => {
      const days = daysBetween(todayStr(), draft.testDate);
      return `
      <div class="eyebrow">Step 2 of 5</div>
      <h1>When is your GMAT?</h1>
      <p class="muted">The GMAT runs all year, so you pick the day. I suggest <strong>Saturday 28 August 2027</strong>. That gives you about ten months to prepare, and still leaves room for a second try in October, before ISB Round 2 and most European Masters deadlines. With the new superscore, your best section scores across attempts count.</p>
      <label class="field"><span>First attempt</span><input type="date" id="test" value="${esc(draft.testDate)}" min="${addDays(todayStr(), 30)}"></label>
      <label class="field"><span>Backup attempt (optional, at least 16 days later)</span><input type="date" id="backup" value="${esc(draft.backupDate || '')}"></label>
      <p class="faint">${days > 0 ? `That's ${days} days from today.` : ''} You can change these any time in Settings.</p>`;
    },
    () => {
      const weekly = draft.weekdayMinutes * 5 + draft.weekendMinutes * 2;
      return `
      <div class="eyebrow">Step 3 of 5</div>
      <h1>How much time on a normal day?</h1>
      <p class="muted">Be honest. A steady hour beats a heroic three hours you can't keep up. The plan fits around your job.</p>
      <label class="field"><span>Weekdays</span><div class="seg" data-seg="weekdayMinutes">${WEEKDAY_OPTS.map((m) => `<button data-v="${m}" class="${draft.weekdayMinutes === m ? 'on' : ''}">${m} min</button>`).join('')}</div></label>
      <label class="field"><span>Weekends</span><div class="seg" data-seg="weekendMinutes">${WEEKEND_OPTS.map((m) => `<button data-v="${m}" class="${draft.weekendMinutes === m ? 'on' : ''}">${m >= 60 ? m / 60 + ' h' : m + ' min'}</button>`).join('')}</div></label>
      <div class="card tint"><strong>${Math.round(weekly / 6) / 10} hours a week.</strong> <span class="muted">${weekly >= 480 ? 'A strong, sustainable rhythm for a 655-705+ target.' : weekly >= 330 ? 'Workable. Your plan will lean on smart practice to make every minute count.' : 'Tight for ten months of material. You can add time later as you get into a routine.'}</span></div>`;
    },
    () => {
      const opts = ['slow', 'normal', 'fast'].map((sp) => {
        const st = projected(sp);
        const desc = { slow: 'Lessons spread across the whole year. Lightest days.', normal: 'Lessons done about three weeks before mock season. Recommended.', fast: 'Lessons done early, leaving two extra months of hard practice.' }[sp];
        return `<button class="item${draft.speed === sp ? ' selected-item' : ''}" data-speed="${sp}" style="text-align:left;width:100%;${draft.speed === sp ? 'border-color:var(--primary);background:var(--indigo-soft)' : ''}">
          <div class="ic">${icon(sp === 'fast' ? 'bolt' : sp === 'slow' ? 'heart' : 'target')}</div>
          <div class="body"><div class="t">${SPEED_LABEL[sp]}</div><div class="s">${desc}${st.finish ? ` Lessons finish by ${fmtDate(st.finish, { year: true })}.` : ''}</div></div></button>`;
      });
      return `
      <div class="eyebrow">Step 4 of 5</div>
      <h1>Pick your pace</h1>
      <p class="muted">You can speed up or slow down whenever you like. The plan rebalances itself, and missed days roll forward without guilt.</p>
      <div class="list">${opts.join('')}</div>`;
    },
    () => {
      const kd = keyDates(draft);
      const st = projected(draft.speed);
      return `
      <img class="cover slim" src="img/gen/journey.jpg" alt="Your 10-month GMAT journey: October 2026 orientation, November foundations, December to February core skills, March to June advanced practice, July to August mock season, test day 28 August 2027, applications from September 2027." onerror="this.remove()">
      <div class="eyebrow">Step 5 of 5</div>
      <h1>Your plan is ready, ${esc(draft.name)}.</h1>
      <div class="timeline" style="margin:18px 0">
        <div class="tl now"><div class="when">${fmtDate(todayStr(), { weekday: true })}</div><div class="t"><strong>Day 1:</strong> a 15-minute welcome and your first flashcards</div></div>
        <div class="tl"><div class="when">First week</div><div>Learn how the GMAT works, then a short diagnostic test</div></div>
        <div class="tl"><div class="when">Until ${st.finish ? fmtDate(st.finish, { year: true }) : 'mid 2027'}</div><div>Foundations, then every topic, one lesson and drill at a time</div></div>
        <div class="tl"><div class="when">From ${fmtDate(kd.mockStart, { year: true })}</div><div>Mock season: a full practice test every week</div></div>
        <div class="tl"><div class="when">${fmtDate(kd.test, { weekday: true, year: true })}</div><div><strong>GMAT day</strong></div></div>
        <div class="tl"><div class="when">Autumn 2027</div><div>Applications: ISB, European Masters, and more</div></div>
      </div>
      <p class="muted">Each day you'll see just today's plan. Tap the first thing, do it, tick it off. That's all you need to remember.</p>`;
    },
  ];

  const paint = () => {
    view.className = 'immersive';
    view.innerHTML = `<div style="max-width:620px;margin:0 auto;padding-top:24px">
      <div class="bar" style="margin-bottom:22px"><span style="width:${((step + 1) / steps.length) * 100}%"></span></div>
      ${steps[step]()}
    </div>
    <div class="action-bar" style="margin-left:0">
      ${step > 0 ? '<button class="btn" data-prev>Back</button>' : ''}
      <button class="btn primary" data-next>${step === steps.length - 1 ? 'Start day 1' : 'Continue'}</button>
    </div>`;
  };

  const collect = () => {
    const name = view.querySelector('#name');
    if (name) draft.name = name.value.trim() || 'Maria';
    const t = view.querySelector('#test');
    if (t && t.value) draft.testDate = t.value;
    const b = view.querySelector('#backup');
    if (b) draft.backupDate = b.value && daysBetween(draft.testDate, b.value) >= 16 ? b.value : null;
  };

  view.addEventListener('click', (e) => {
    const seg = e.target.closest('[data-seg] button');
    if (seg) {
      e.preventDefault();
      draft[seg.parentElement.dataset.seg] = Number(seg.dataset.v);
      paint();
      return;
    }
    const sp = e.target.closest('[data-speed]');
    if (sp) {
      draft.speed = sp.dataset.speed;
      paint();
      return;
    }
    if (e.target.closest('[data-prev]')) {
      collect();
      step = Math.max(0, step - 1);
      paint();
      return;
    }
    if (e.target.closest('[data-next]')) {
      collect();
      if (step === 1 && daysBetween(todayStr(), draft.testDate) < 30) {
        alertInline(view, 'Pick a test date at least a month away so the plan has room to work.');
        return;
      }
      if (step < steps.length - 1) {
        step++;
        paint();
        window.scrollTo(0, 0);
      } else {
        store.update((st) => {
          st.settings = { ...st.settings, ...draft, startDate: st.settings.startDate || todayStr() };
          st.onboarded = true;
        }, true);
        location.hash = '#/today';
      }
    }
  });
  paint();
}

function alertInline(view, msg) {
  let el = view.querySelector('.inline-alert');
  if (!el) {
    el = document.createElement('div');
    el.className = 'card warn inline-alert';
    view.firstElementChild.appendChild(el);
  }
  el.textContent = msg;
}
