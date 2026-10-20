// Spaced repetition for flashcards (SM-2 variant with 4 grades) and helpers for due queues.
import { addDays } from './util.js';

export const GRADES = { again: 0, hard: 1, good: 2, easy: 3 };

export function schedule(card = {}, grade, today) {
  let { ef = 2.5, interval = 0, reps = 0, lapses = 0 } = card;
  if (grade === GRADES.again) {
    reps = 0;
    lapses++;
    interval = 1;
    ef = Math.max(1.3, ef - 0.2);
  } else {
    const q = grade === GRADES.hard ? 3 : grade === GRADES.good ? 4 : 5;
    ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    reps++;
    if (reps === 1) interval = grade === GRADES.easy ? 3 : 1;
    else if (reps === 2) interval = grade === GRADES.hard ? 3 : grade === GRADES.easy ? 8 : 6;
    else interval = Math.round(interval * (grade === GRADES.hard ? 1.2 : grade === GRADES.easy ? ef * 1.3 : ef));
    interval = Math.min(interval, 180);
  }
  return { ef: Math.round(ef * 100) / 100, interval, reps, lapses, due: addDays(today, interval), last: today };
}

// Preview of the next interval per grade, for button labels.
export function previewIntervals(card, today) {
  return Object.fromEntries(Object.entries(GRADES).map(([k, g]) => [k, schedule(card, g, today).interval]));
}

// Cards due today plus up to `newLimit` new cards, unlocked by the decks/topics she has reached.
export function dueCards(all, cardState, today, { newLimit = 10, unlockedTopics = null, decks = null } = {}) {
  const due = [];
  const fresh = [];
  for (const c of all) {
    if (decks && !decks.includes(c.deck)) continue;
    const st = cardState[c.id];
    if (st) {
      if (st.due <= today) due.push(c);
    } else if (!unlockedTopics || !c.topic || unlockedTopics.has(c.topic)) {
      fresh.push(c);
    }
  }
  due.sort((a, b) => (cardState[a.id].due < cardState[b.id].due ? -1 : 1));
  return { due, fresh: fresh.slice(0, newLimit), totalNew: fresh.length };
}

export function cardStats(all, cardState, today) {
  let learned = 0;
  let mature = 0;
  let due = 0;
  for (const c of all) {
    const st = cardState[c.id];
    if (!st) continue;
    learned++;
    if (st.interval >= 21) mature++;
    if (st.due <= today) due++;
  }
  return { total: all.length, learned, mature, due };
}
