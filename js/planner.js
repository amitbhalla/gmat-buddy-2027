// Plan generator. Pure: (curriculum, state, today, timeline) -> day-by-day plan + status.
// The plan is recomputed from "today" on every render, so missed days reflow automatically.
import { addDays, daysBetween, weekday, parseDate, fmtDate } from './util.js';

export const SPEED_BUFFER = { slow: 3, normal: 21, fast: 63 }; // days between finishing lessons and mock season
export const SPEED_LABEL = { slow: 'Gentle', normal: 'Balanced', fast: 'Fast-track' };
const BIG_ITEM = 70; // minutes; big items (diagnostic, mocks) wait for the roomiest day of the week
const CARDS_MIN = 10;
const WEEKLY_REVIEW_MIN = 40;

export function keyDates(settings) {
  const T = settings.testDate;
  return {
    test: T,
    mockStart: addDays(T, -49),
    taperStart: addDays(T, -6),
    backup: settings.backupDate && daysBetween(T, settings.backupDate) >= 16 ? settings.backupDate : null,
  };
}

function inBreak(settings, date) {
  return (settings.breaks || []).some((b) => b.from <= date && date <= b.to);
}

export function capacityFor(state, date) {
  const s = state.settings;
  const wd = weekday(date);
  if (state.skipped[date] || inBreak(s, date)) return 0;
  const override = state.dayMinutes?.[date];
  if (override != null) return override;
  if (!s.studyDays[wd]) return 0;
  return wd === 0 || wd === 6 ? s.weekendMinutes : s.weekdayMinutes;
}

export function usualCapacity(settings, date) {
  const wd = weekday(date);
  if (!settings.studyDays[wd]) return 0;
  return wd === 0 || wd === 6 ? settings.weekendMinutes : settings.weekdayMinutes;
}

function seasonMocks(settings) {
  return settings.hasOfficialExams36
    ? ['official:pe2', 'mock:app-3', 'official:pe3', 'mock:app-4', 'official:pe4', 'official:pe5']
    : ['official:pe2', 'mock:app-3', 'mock:app-4', 'mock:app-5', 'mock:app-6', 'mock:app-7'];
}

export const MOCK_META = {
  'official:pe2': { title: 'GMAT Official Practice Exam 2', official: true, detail: 'Free in your mba.com Starter Kit. Take it in one sitting, real conditions, then log your scores.' },
  'official:pe3': { title: 'GMAT Official Practice Exam 3', official: true, detail: 'Paid (Official Practice Exams 3-6 bundle on mba.com). Real conditions, then log your scores.' },
  'official:pe4': { title: 'GMAT Official Practice Exam 4', official: true, detail: 'Real conditions, then log your scores.' },
  'official:pe5': { title: 'GMAT Official Practice Exam 5', official: true, detail: 'Real conditions, then log your scores.' },
  'official:pe6': { title: 'GMAT Official Practice Exam 6', official: true, detail: 'Your final dress rehearsal.' },
  'mock:app-3': { title: 'Full mock 3 (GMAT Buddy)' },
  'mock:app-4': { title: 'Full mock 4 (GMAT Buddy)' },
  'mock:app-5': { title: 'Full mock 5 (GMAT Buddy)' },
  'mock:app-6': { title: 'Full mock 6 (GMAT Buddy)' },
  'mock:app-7': { title: 'Full mock 7 (GMAT Buddy)' },
};

function seqToItem(it) {
  const kind = it.k;
  return {
    key: it.key,
    kind,
    title: it.title || null, // lesson titles are filled in by the view from curriculum.lessons
    minutes: it.minutes,
    ref: it,
    phase: it.phase,
  };
}

function habitItems(state, date, phase, dateCtx) {
  const items = [{ key: `habit:cards:${date}`, kind: 'cards', title: 'Flashcards', minutes: CARDS_MIN, habit: true, phase }];
  const wd = weekday(date);
  const started = daysBetween(state.settings.startDate, date) >= 6;
  if (wd === state.settings.reviewDay && started && phase !== 'taper' && phase !== 'mocks') {
    items.push({ key: `review:week:${date}`, kind: 'weekly-review', title: 'Weekly review: redo mistakes + mixed set', minutes: WEEKLY_REVIEW_MIN, phase });
  }
  return items;
}

function extraItems(state, date, phase, room, ctx) {
  const out = [];
  const wd = weekday(date);
  const add = (it) => {
    if (room >= Math.min(it.minutes, 15)) {
      out.push({ ...it, optional: true, minutes: Math.min(it.minutes, Math.max(15, room)) });
      room -= it.minutes;
    }
  };
  if (ctx.learnedTopics > 0) add({ key: `extra:smart:${date}`, kind: 'smart', title: 'Smart practice: your weak spots', minutes: 25, phase });
  if ([2, 4, 6].includes(wd) || ctx.learnedTopics === 0) add({ key: `extra:read:${date}`, kind: 'reading', title: 'Reading habit: one long article', minutes: 20, phase });
  if (state.settings.hasOfficialGuide && ctx.learnedTopics >= 3) add({ key: `extra:og:${date}`, kind: 'og', title: 'Official Guide set (10 questions)', minutes: 25, phase });
  return out;
}

export function buildPlan({ curriculum, state, today, timeline = [], doneToday = 0 }) {
  const s = state.settings;
  const kd = keyDates(s);
  const speed = SPEED_BUFFER[s.speed] ?? SPEED_BUFFER.normal;
  const learnTarget = addDays(kd.mockStart, -speed);
  const done = state.done;

  const remaining = curriculum.sequence.filter((it) => !done[it.key]).map(seqToItem);
  const remainingMinutes = remaining.reduce((a, b) => a + b.minutes, 0);
  const learnedTopics = Object.keys(state.lessons).filter((id) => state.lessons[id]?.completedAt && curriculum.lessons[id]?.topic).length;

  // Study days left before the learning target (to set a daily quota).
  let studyDaysLeft = 0;
  for (let d = today; d < learnTarget; d = addDays(d, 1)) if (capacityFor(state, d) > 0) studyDaysLeft++;
  const quota = studyDaysLeft > 0 ? remainingMinutes / studyDaysLeft : Infinity;

  const end = addDays(kd.backup || kd.test, 120);
  const days = [];
  const queue = remaining.slice();
  const held = []; // big items waiting for a roomy day
  let placedTopics = 0;
  let credit = 0;
  const maxCap = Math.max(...[0, 1, 2, 3, 4, 5, 6].map((wd) => (s.studyDays[wd] ? (wd === 0 || wd === 6 ? s.weekendMinutes : s.weekdayMinutes) : 0)));
  let lastSeqDate = null;
  const mockQueue = seasonMocks(s).filter((k) => !done[k]);
  const deferred = state.deferred || {};
  const timelineByDate = new Map();
  timeline.forEach((t, i) => {
    const key = `adm:${t.date}:${i}`;
    const on = deferred[key] && deferred[key] > t.date ? deferred[key] : t.date;
    if (!timelineByDate.has(on)) timelineByDate.set(on, []);
    timelineByDate.get(on).push({ key, kind: 'admissions', title: t.title, minutes: t.minutes || 20, detail: t.detail, lesson: t.lesson, ref: t });
  });
  const applyLessons = Object.values(curriculum.lessons)
    .filter((l) => l.section === 'admissions' && !curriculum.sequence.some((x) => x.key === `lesson:${l.id}`))
    .map((l) => l.id);
  let sectionRot = 0;

  const waiting = []; // deferred sequence items: re-enter the queue on their date
  for (let i = queue.length - 1; i >= 0; i--) {
    if (deferred[queue[i].key] && deferred[queue[i].key] > today) waiting.push(...queue.splice(i, 1));
  }
  for (let date = today; date <= end; date = addDays(date, 1)) {
    for (let i = waiting.length - 1; i >= 0; i--) {
      if (deferred[waiting[i].key] <= date) queue.unshift(...waiting.splice(i, 1));
    }
    let cap = capacityFor(state, date);
    if (date === today) cap = Math.max(0, cap - doneToday);
    const phase = phaseFor(date, kd, queue);
    const day = { date, phase, items: [], capacity: capacityFor(state, date), rest: capacityFor(state, date) === 0 };
    const adm = timelineByDate.get(date) || [];

    if (date === kd.test || date === kd.backup) {
      day.items.push({ key: date === kd.test ? 'test:1' : 'test:2', kind: 'test', title: date === kd.test ? 'GMAT test day' : 'GMAT attempt 2', minutes: 0, phase: 'test' });
      day.phase = 'test';
      days.push(day);
      continue;
    }
    if (day.rest) {
      day.items.push(...adm);
      days.push(day);
      continue;
    }

    let room = cap;
    const push = (it) => {
      if (deferred[it.key] && deferred[it.key] > date && !it.ref?.phase) return; // moved to a later day
      day.items.push(it);
      room -= it.minutes;
    };
    for (const h of habitItems(state, date, phase, kd)) push(h);
    for (const a of adm) push(a);

    if (date < kd.mockStart) {
      // Learning phases: place sequence items up to today's quota.
      // Big items (full mocks) wait for the roomiest day of the week and get that day to themselves.
      const roomy = capacityFor(state, date) >= maxCap;
      if (held.length && roomy) {
        const it = held.shift();
        push(it);
        credit -= it.minutes;
        lastSeqDate = date;
        days.push(day);
        continue;
      }
      // Running allowance: each study day adds its share of the remaining material; items are
      // placed while the allowance covers most of the next item, and never beyond the day's room.
      const usual = usualCapacity(s, date) || maxCap || 60;
      const scale = state.dayMinutes?.[date] != null ? Math.max(0, capacityFor(state, date) / usual) : 1;
      credit += quota === Infinity ? room : quota * scale;
      let used = 0;
      const fits = (it) => it.minutes <= room + 5 && credit >= it.minutes * 0.6;
      while (queue.length && room > 0) {
        const it = queue[0];
        if (it.minutes >= BIG_ITEM) {
          if (roomy && used === 0 && credit >= it.minutes * 0.4) {
            push(queue.shift());
            credit -= it.minutes;
            lastSeqDate = date;
            used += it.minutes;
            break;
          }
          if (held.length < 3) {
            held.push(queue.shift());
            continue;
          }
          break;
        }
        if (!fits(it) && !(used === 0 && credit >= it.minutes * 0.6 && room >= it.minutes * 0.6)) break;
        const placed = queue.shift();
        push(placed);
        credit -= placed.minutes;
        if (placed.kind === 'lesson' && curriculum.lessons[placed.ref.id]?.topic) placedTopics++;
        used += it.minutes;
        lastSeqDate = date;
      }
      if (room >= 15) for (const x of extraItems(state, date, phase, room, { learnedTopics: learnedTopics + placedTopics })) push(x);
    } else if (date < kd.taperStart) {
      // Mock season.
      const wd = weekday(date);
      const mockWd = effectiveMockDay(s);
      if (held.length) queue.unshift(...held.splice(0));
      if (wd === mockWd && mockQueue.length && cap >= 60 && !(deferred[mockQueue[0]] > date)) {
        const k = mockQueue.shift();
        const meta = MOCK_META[k];
        push({ key: k, kind: meta.official ? 'official' : 'mock', title: meta.title, detail: meta.detail, minutes: 165, phase: 'mocks', ref: { mode: 'full', key: k } });
      } else if (days.length && days[days.length - 1].items.some((x) => x.kind === 'mock' || x.kind === 'official')) {
        const prev = days[days.length - 1].items.find((x) => x.kind === 'mock' || x.kind === 'official');
        push({ key: `review:mock:${prev.key}`, kind: 'mock-review', title: `Deep review: ${prev.title}`, minutes: 90, phase: 'mocks', ref: { mockKey: prev.key } });
      } else {
        while (queue.length && room >= Math.min(queue[0].minutes, 30)) {
          const it = queue.shift();
          push(it);
          lastSeqDate = date;
        }
        if (room >= 20 && wd === 3) {
          const sec = ['quant', 'verbal', 'di'][sectionRot++ % 3];
          push({ key: `section:${date}`, kind: 'section-test', title: `Timed section test: ${sec === 'di' ? 'Data Insights' : sec === 'quant' ? 'Quant' : 'Verbal'}`, minutes: 50, phase: 'mocks', ref: { section: sec } });
        }
        if (room >= 15) push({ key: `season:targeted:${date}`, kind: 'smart', title: 'Targeted practice: your weakest topics', minutes: Math.min(30, room), phase: 'mocks' });
        if (room >= 15) push({ key: `season:redo:${date}`, kind: 'redo', title: 'Redo mistakes from your error log', minutes: Math.min(20, room), phase: 'mocks', optional: true });
      }
    } else if (date < kd.test) {
      // Taper: light and confidence-building.
      const left = daysBetween(date, kd.test);
      if (left === 1) {
        day.items = day.items.filter((x) => x.kind === 'admissions');
        day.items.push({ key: `taper:rest:${date}`, kind: 'rest-day', title: 'Rest day: checklist, early night', minutes: 10, phase: 'taper' });
      } else {
        if (!done['lesson:s-test-day-india'] && !day.items.some((x) => x.key === 'lesson:s-test-day-india') && !days.some((d) => d.items.some((x) => x.key === 'lesson:s-test-day-india'))) {
          push({ key: 'lesson:s-test-day-india', kind: 'lesson', minutes: 25, phase: 'taper', ref: { id: 's-test-day-india', k: 'lesson' } });
        }
        push({ key: `taper:light:${date}`, kind: 'smart', title: 'Light mixed set (stay sharp, no cramming)', minutes: 25, phase: 'taper', optional: false });
        if (left === 3) push({ key: 'checklist:test-day', kind: 'checklist', title: 'Test-day checklist', minutes: 15, phase: 'taper' });
      }
    } else {
      // After the first test: retake prep window, then applications.
      const retake = kd.backup && date < kd.backup;
      if (date === addDays(kd.test, 1) && !done['lesson:s-scores-retakes']) {
        push({ key: 'lesson:s-scores-retakes', kind: 'lesson', minutes: 20, phase: 'apply', ref: { id: 's-scores-retakes', k: 'lesson' } });
        push({ key: 'task:log-official-score', kind: 'log-score', title: 'Log your official GMAT score', minutes: 5, phase: 'apply' });
      }
      if (retake && daysBetween(date, kd.backup) > 2) {
        day.phase = 'retake';
        if (weekday(date) === s.mockDay && daysBetween(date, kd.backup) >= 6) {
          push({ key: `retake:mock:${date}`, kind: 'mock', title: 'Full mock (retake prep)', minutes: 165, phase: 'retake', ref: { mode: 'full', key: `retake:mock:${date}` } });
        } else {
          if (room >= 15) push({ key: `retake:targeted:${date}`, kind: 'smart', title: 'Targeted practice: weakest section', minutes: Math.min(45, room), phase: 'retake' });
        }
      } else {
        day.phase = 'apply';
        if (applyLessons.length && date >= addDays(kd.test, 2) && daysBetween(kd.test, date) % 2 === 0) {
          const id = applyLessons.shift();
          if (!done[`lesson:${id}`]) push({ key: `lesson:${id}`, kind: 'lesson', minutes: curriculum.lessons[id].minutes, phase: 'apply', ref: { id, k: 'lesson' } });
        }
      }
    }
    days.push(day);
  }

  const status = planStatus({ kd, learnTarget, lastSeqDate, queueLeft: queue.length + held.length + waiting.length, remainingMinutes, quota, state, today, studyDaysLeft });
  return { days, status, keyDates: kd, learnTarget };
}

// The weekly mock goes on the chosen day; if that is not a study day, on the next study day after it.
function effectiveMockDay(s) {
  for (let i = 0; i < 7; i++) {
    const wd = (s.mockDay + i) % 7;
    if (s.studyDays[wd]) return wd;
  }
  return s.mockDay;
}

function phaseFor(date, kd, queue) {
  if (date >= kd.test) return 'apply';
  if (date >= kd.taperStart) return 'taper';
  if (date >= kd.mockStart) return 'mocks';
  return queue.length ? queue[0].phase : 'advanced';
}

function planStatus({ kd, learnTarget, lastSeqDate, queueLeft, remainingMinutes, quota, state, today, studyDaysLeft }) {
  const out = { remainingMinutes, quota: Number.isFinite(quota) ? Math.round(quota) : null, learnTarget, finish: lastSeqDate, studyDaysLeft };
  if (remainingMinutes === 0) return { ...out, level: 'done', message: 'Every lesson and drill is done. Mock season mode: full tests and targeted fixes.' };
  if (queueLeft > 0) {
    return { ...out, level: 'behind', message: `At your current daily time, some lessons spill past the start of mock season. Add study time in Settings, or move your test date.` };
  }
  const slack = daysBetween(lastSeqDate, learnTarget);
  const cap = averageCapacity(state, today);
  if (Number.isFinite(quota) && quota > cap * 0.9) {
    return { ...out, level: 'tight', message: `You need about ${Math.round(quota)} minutes of new material per study day to finish lessons on time. That's most of your daily time. Consider adding 15-30 minutes a day.` };
  }
  if (slack < -3) return { ...out, level: 'behind', message: `You're about ${-slack} days behind your lesson target. The plan has absorbed it, but days will feel fuller.` };
  return { ...out, level: 'ok', message: `On track. All lessons done by ${fmtDate(lastSeqDate, { year: true })}, then mock season from ${fmtDate(kd.mockStart, { year: true })}.` };
}

function averageCapacity(state, today) {
  let sum = 0;
  for (let i = 0; i < 14; i++) sum += capacityFor(state, addDays(today, i));
  return sum / 14 || 1;
}

// Expected progress by a date, used for "ahead/behind" by item count.
export function expectedDoneBy(plan, date) {
  return plan.days.filter((d) => d.date <= date).reduce((n, d) => n + d.items.filter((x) => x.ref?.phase).length, 0);
}

export function phaseRanges(plan) {
  const ranges = [];
  for (const d of plan.days) {
    const last = ranges[ranges.length - 1];
    if (last && last.phase === d.phase) last.end = d.date;
    else ranges.push({ phase: d.phase, start: d.date, end: d.date });
  }
  return ranges;
}

export function weeksUntil(today, date) {
  return Math.max(0, Math.ceil(daysBetween(today, date) / 7));
}

export { parseDate };
