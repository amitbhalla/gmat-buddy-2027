// Persistent learner state in localStorage, with export/import and migrations.
import { todayStr, addDays, daysBetween } from './util.js';

const KEY = 'gmatbuddy:v1';
const listeners = new Set();
let state = null;
let saveTimer = null;

export const DEFAULT_SETTINGS = {
  name: 'Maria',
  startDate: null,
  testDate: '2027-08-28',
  backupDate: '2027-10-16',
  weekdayMinutes: 60,
  weekendMinutes: 120,
  studyDays: [true, true, true, true, true, true, true], // Sun..Sat
  reviewDay: 0, // Sunday: weekly review + mock review in mock season
  mockDay: 6, // Saturday
  speed: 'normal', // slow | normal | fast
  breaks: [], // [{from, to, label}]
  hasOfficialGuide: false,
  hasOfficialExams36: false,
  theme: 'auto',
  sound: false,
  dailyCards: 20,
};

function fresh() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    onboarded: false,
    settings: { ...DEFAULT_SETTINGS },
    done: {}, // itemKey -> {at, date, minutes}
    lessons: {}, // id -> {openedAt, completedAt, pct}
    attempts: [], // {qid, at, date, correct, secs, mode, sid, answer}
    qstats: {}, // qid -> {seen, correct, last, lastCorrect, box, due}
    errors: {}, // qid -> {reason, note, at, resolved}
    cards: {}, // cardId -> {ef, interval, reps, due, lapses, last}
    sessions: [], // summaries
    mocks: [], // completed mock results (app + official self-reported)
    activeSession: null,
    activeMock: null,
    studyLog: {}, // date -> minutes
    journal: [], // weekly check-ins
    notes: {}, // lessonId -> text
    bookmarks: [],
    achievements: {}, // key -> date
    admissions: { schools: {}, custom: [] },
    checklists: {},
    skipped: {}, // date -> true (rest days she chose)
    deferred: {}, // itemKey -> 'YYYY-MM-DD' (not shown before that date)
    dayMinutes: {}, // date -> minutes override for that day (busy/free days)
    lastBackup: null,
    seenTips: 0,
  };
}

function migrate(s) {
  const base = fresh();
  const out = { ...base, ...s };
  out.settings = { ...base.settings, ...(s.settings || {}) };
  out.admissions = { ...base.admissions, ...(s.admissions || {}) };
  return out;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? migrate(JSON.parse(raw)) : fresh();
  } catch (e) {
    console.warn('State load failed, starting fresh', e);
    state = fresh();
  }
  if (!state.settings.startDate) state.settings.startDate = todayStr();
  return state;
}

export function get() {
  return state || load();
}

export function save(immediate = false) {
  clearTimeout(saveTimer);
  const write = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Save failed', e);
    }
  };
  if (immediate) write();
  else saveTimer = setTimeout(write, 150);
  listeners.forEach((fn) => fn(state));
}

// A save is debounced by 150 ms; flush it if the tab is closed or hidden in that window.
if (typeof window !== 'undefined' && window.addEventListener) {
  const flush = () => {
    if (state && saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) { /* storage full or unavailable */ }
    }
  };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => document.hidden && flush());
}

export function update(fn, immediate = false) {
  fn(get());
  save(immediate);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---------- study time & streaks
export function logMinutes(min, date = todayStr()) {
  if (!min) return;
  update((s) => {
    // Negative values undo a tick (e.g. un-marking an item); the day never goes below zero.
    s.studyLog[date] = Math.max(0, Math.round(((s.studyLog[date] || 0) + min) * 10) / 10);
  });
}

export function streak(s = get(), today = todayStr()) {
  // Counts consecutive days with >= 5 minutes logged. Today counts if done; if not, streak runs to yesterday.
  const active = (d) => (s.studyLog[d] || 0) >= 5 || s.skipped[d];
  let d = active(today) ? today : addDays(today, -1);
  let n = 0;
  while (active(d)) {
    if ((s.studyLog[d] || 0) >= 5) n++;
    d = addDays(d, -1);
    if (n > 2000) break;
  }
  return n;
}

export function totalMinutes(s = get()) {
  return Object.values(s.studyLog).reduce((a, b) => a + b, 0);
}

// ---------- items & lessons
export function markDone(key, minutes = 0) {
  update((s) => {
    if (!s.done[key]) s.done[key] = { at: new Date().toISOString(), date: todayStr(), minutes };
  }, true);
}

export function unmarkDone(key) {
  update((s) => {
    delete s.done[key];
  }, true);
}

export function deferItem(key, date) {
  update((s) => {
    s.deferred[key] = date;
  }, true);
}

export function setDayMinutes(date, minutes) {
  update((s) => {
    if (minutes == null) delete s.dayMinutes[date];
    else s.dayMinutes[date] = minutes;
    delete s.skipped[date];
  }, true);
}

export function isDone(key) {
  return !!get().done[key];
}

// ---------- attempts & question stats (Leitner boxes for resurfacing missed questions)
const BOX_DAYS = [0, 1, 3, 7, 16, 35];

export function recordAttempt({ qid, correct, secs, mode, sid, answer }) {
  const date = todayStr();
  update((s) => {
    s.attempts.push({ qid, at: Date.now(), date, correct, secs: Math.round(secs), mode, sid, answer });
    const st = (s.qstats[qid] ||= { seen: 0, correct: 0, box: 0 });
    st.seen++;
    if (correct) st.correct++;
    st.last = date;
    st.lastCorrect = correct;
    st.box = correct ? Math.min(5, (st.box || 0) + 1) : 1;
    st.due = addDays(date, BOX_DAYS[st.box]);
    if (!correct && mode !== 'mock-hidden') {
      s.errors[qid] ||= { reason: null, note: '', at: date, resolved: false };
      s.errors[qid].resolved = false;
      s.errors[qid].lastWrong = date;
    } else if (correct && s.errors[qid] && mode === 'redo') {
      s.errors[qid].resolved = true;
      s.errors[qid].resolvedAt = date;
    }
  });
}

// ---------- export / import
export function exportJSON() {
  const s = get();
  return JSON.stringify({ app: 'gmat-buddy-2027', exportedAt: new Date().toISOString(), state: s }, null, 0);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== 'gmat-buddy-2027' || !data.state) throw new Error('This file is not a GMAT Buddy backup.');
  state = migrate(data.state);
  save(true);
}

export function downloadBackup() {
  const blob = new Blob([exportJSON()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `gmat-buddy-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
  update((s) => {
    s.lastBackup = todayStr();
  }, true);
}

export function backupOverdue(s = get()) {
  const ref = s.lastBackup || s.settings.startDate;
  return daysBetween(ref, todayStr()) >= 7 && totalMinutes(s) > 30;
}

export function resetAll() {
  state = fresh();
  state.settings.startDate = todayStr();
  save(true);
}

// For tests: swap in an in-memory state.
export function _setState(s) {
  state = migrate(s);
}
