import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { buildPlan, keyDates } from '../js/planner.js';
import { totalScore, sectionScore, estimateTheta, totalPercentile } from '../js/scoring.js';
import { createMock, advance, answer, editAnswer, finalizeMock } from '../js/mockengine.js';
import { schedule, GRADES } from '../js/srs.js';
import * as store from '../js/store.js';

const cur = JSON.parse(readFileSync(new URL('../content/curriculum.json', import.meta.url)));

function freshState(overrides = {}) {
  store._setState({ settings: { startDate: '2026-10-21' } });
  const s = store.get();
  Object.assign(s, overrides);
  return s;
}

function loadBank() {
  const dir = new URL('../content/questions/', import.meta.url);
  const questions = new Map();
  const stimuli = new Map();
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json') && n !== 'index.json')) {
    const d = JSON.parse(readFileSync(new URL(f, dir)));
    d.stimuli.forEach((s) => stimuli.set(s.id, s));
    d.questions.forEach((q) => questions.set(q.id, q));
  }
  const list = [...questions.values()];
  const groups = new Map();
  for (const q of list) if (q.stimulusId && (q.type === 'RC' || q.type === 'MSR')) (groups.get(q.stimulusId) || groups.set(q.stimulusId, []).get(q.stimulusId)).push(q);
  return { questions, stimuli, list, groups };
}

test('plan schedules every sequence item before mock season at default settings', () => {
  const s = freshState();
  const p = buildPlan({ curriculum: cur, state: s, today: '2026-10-21' });
  assert.equal(p.status.level, 'ok');
  assert.ok(p.status.finish < keyDates(s.settings).mockStart);
  const keys = new Set(p.days.flatMap((d) => d.items.map((i) => i.key)));
  for (const it of cur.sequence) assert.ok(keys.has(it.key), `missing ${it.key}`);
});

test('a day never exceeds its time by more than one item, and rest days are empty', () => {
  const s = freshState({ skipped: { '2026-10-23': true } });
  const p = buildPlan({ curriculum: cur, state: s, today: '2026-10-21' });
  const rest = p.days.find((d) => d.date === '2026-10-23');
  assert.equal(rest.items.length, 0);
  for (const d of p.days.filter((x) => x.date < '2027-07-01' && !x.rest)) {
    const req = d.items.filter((i) => !i.optional && i.kind !== 'mock' && i.kind !== 'official');
    const total = req.reduce((a, b) => a + b.minutes, 0);
    assert.ok(total <= d.capacity + 75, `${d.date} has ${total} min for ${d.capacity}`);
  }
});

test('busy and free days change how much is scheduled', () => {
  const base = buildPlan({ curriculum: cur, state: freshState(), today: '2026-10-21' });
  const s = freshState({ dayMinutes: { '2026-10-22': 15, '2026-10-24': 240 } });
  const p = buildPlan({ curriculum: cur, state: s, today: '2026-10-21' });
  const seq = (plan, d) => plan.days.find((x) => x.date === d).items.filter((i) => i.ref?.phase).length;
  assert.equal(seq(p, '2026-10-22'), 0);
  assert.ok(seq(p, '2026-10-24') >= seq(base, '2026-10-24'));
});

test('deferred items move to their new date', () => {
  const s = freshState({ deferred: { 'lesson:s-welcome': '2026-10-25' } });
  const p = buildPlan({ curriculum: cur, state: s, today: '2026-10-21' });
  const day = p.days.find((d) => d.items.some((i) => i.key === 'lesson:s-welcome'));
  assert.ok(day.date >= '2026-10-25');
});

test('faster pace finishes lessons earlier', () => {
  const slow = buildPlan({ curriculum: cur, state: freshState({ settings: { ...store.DEFAULT_SETTINGS, startDate: '2026-10-21', speed: 'slow' } }), today: '2026-10-21' });
  const fast = buildPlan({ curriculum: cur, state: freshState({ settings: { ...store.DEFAULT_SETTINGS, startDate: '2026-10-21', speed: 'fast' } }), today: '2026-10-21' });
  assert.ok(fast.status.finish < slow.status.finish);
});

test('test day and taper are in place', () => {
  const p = buildPlan({ curriculum: cur, state: freshState(), today: '2026-10-21' });
  assert.ok(p.days.find((d) => d.date === '2027-08-28').items.some((i) => i.kind === 'test'));
  assert.ok(p.days.find((d) => d.date === '2027-08-27').items.some((i) => i.kind === 'rest-day'));
});

test('scoring scales match GMAT ranges', () => {
  assert.equal(totalScore(60, 60, 60), 205);
  assert.equal(totalScore(90, 90, 90), 805);
  assert.equal(totalScore(80, 80, 80), 605);
  assert.ok(sectionScore(5) === 90 && sectionScore(-5) === 60);
  assert.ok(estimateTheta([{ difficulty: 5, correct: true }, { difficulty: 5, correct: true }]) > estimateTheta([{ difficulty: 1, correct: false }]));
  assert.ok(totalPercentile(705) >= 97 && totalPercentile(555) <= 50);
});

test('full mock serves the right counts, never repeats, groups RC passages', () => {
  const bank = loadBank();
  const m = createMock({ mode: 'full', order: ['quant', 'verbal', 'di'], seed: 42 });
  const state = { mocks: [], qstats: {} };
  const seen = new Set();
  for (let i = 0; i < 3; i++) {
    m.idx = i;
    let id;
    while ((id = advance(m, bank, state))) {
      assert.ok(!seen.has(id), `repeat ${id}`);
      seen.add(id);
      const q = bank.questions.get(id);
      answer(m, id, q.answer, true, 60);
    }
  }
  assert.equal(m.sections.quant.served.length, 21);
  assert.equal(m.sections.verbal.served.length, 23);
  assert.equal(m.sections.di.served.length, 20);
  const rc = m.sections.verbal.served.filter((id) => bank.questions.get(id).type === 'RC');
  assert.ok(rc.length >= 9, `only ${rc.length} RC`);
  const r = finalizeMock(m, bank);
  assert.ok(r.total >= 705, `all-correct mock scored ${r.total}`);
});

test('review & edit allows at most 3 changes per section', () => {
  const m = createMock({ mode: 'diagnostic', seed: 1 });
  const s = m.sections.quant;
  s.served = ['a', 'b', 'c', 'd'];
  for (const id of s.served) s.answers[id] = { value: 0, correct: false };
  assert.ok(editAnswer(m, 'a', 1, true));
  assert.ok(editAnswer(m, 'b', 1, true));
  assert.ok(editAnswer(m, 'c', 1, true));
  assert.equal(editAnswer(m, 'd', 1, true), false);
  assert.ok(editAnswer(m, 'a', 2, false), 'changing an already-edited answer again is free');
});

test('flashcard intervals grow with good answers and reset on again', () => {
  let c = schedule({}, GRADES.good, '2026-10-21');
  c = schedule(c, GRADES.good, '2026-10-22');
  const c3 = schedule(c, GRADES.good, '2026-10-28');
  assert.ok(c3.interval > c.interval);
  assert.equal(schedule(c3, GRADES.again, '2026-11-10').interval, 1);
});
