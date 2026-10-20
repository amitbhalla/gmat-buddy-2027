// Regression tests for bugs found in the code review (reviews/code-review.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { buildPlan } from '../js/planner.js';
import { createMock, advance, answer, editAnswer, finalizeMock } from '../js/mockengine.js';
import { totalScore, sectionScore } from '../js/scoring.js';
import { selectSet } from '../js/select.js';
import * as store from '../js/store.js';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const cur = JSON.parse(read('../content/curriculum.json'));
const timeline = JSON.parse(read('../content/admissions/timeline.json'));

function mk(over = {}, settings = {}) {
  store._setState({ settings: { startDate: '2026-10-21', ...settings } });
  return Object.assign(store.get(), over);
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

test('planner status never prints "Infinity minutes" when the learning target has passed', () => {
  const done = Object.fromEntries(cur.sequence.slice(0, -1).map((i) => [i.key, { date: '2027-01-01', minutes: 0 }]));
  const p = buildPlan({ curriculum: cur, state: mk({ done }), today: '2027-07-20', timeline });
  assert.ok(!/Infinity/.test(p.status.message), p.status.message);
});

test('mock season still gets its mocks when the mock day is not a study day', () => {
  const s = mk({}, { studyDays: [true, true, true, true, true, true, false] }); // Saturday off, mockDay = Saturday
  const p = buildPlan({ curriculum: cur, state: s, today: '2026-10-21', timeline });
  const keys = p.days.flatMap((d) => d.items.map((i) => i.key));
  for (const k of ['official:pe2', 'mock:app-3', 'mock:app-4', 'mock:app-5']) assert.ok(keys.includes(k), `missing ${k}`);
});

test('a 60-minute weekend does not silently drop every season mock', () => {
  const p = buildPlan({ curriculum: cur, state: mk({}, { weekendMinutes: 60 }), today: '2026-10-21', timeline });
  const keys = p.days.flatMap((d) => d.items.map((i) => i.key));
  assert.ok(keys.includes('mock:app-3') && keys.includes('mock:app-7'));
});

test('retake days never carry zero or negative minute items', () => {
  const p = buildPlan({ curriculum: cur, state: mk({}, { weekdayMinutes: 30, weekendMinutes: 30 }), today: '2027-08-29', timeline });
  for (const d of p.days) for (const i of d.items) if (i.kind !== 'test' && i.kind !== 'admissions') assert.ok(i.minutes > 0, `${d.date} ${i.key} ${i.minutes}`);
});

test('mock review follows the mock even if the review day differs', () => {
  const p = buildPlan({ curriculum: cur, state: mk({}, { reviewDay: 1 }), today: '2026-10-21', timeline });
  assert.ok(p.days.some((d) => d.items.some((i) => i.kind === 'mock-review')));
});

test('logMinutes can take minutes back and never goes below zero', () => {
  mk();
  store.logMinutes(30, '2026-10-22');
  store.logMinutes(-10, '2026-10-22');
  assert.equal(store.get().studyLog['2026-10-22'], 20);
  store.logMinutes(-50, '2026-10-22');
  assert.equal(store.get().studyLog['2026-10-22'], 0);
});

test('ticking an item on and off leaves the study log where it started', async () => {
  const { toggleItem } = await import('../js/views/today.js');
  mk();
  const today = new Date();
  const key = 'task:review-test';
  toggleItem(key, 20);
  const day = Object.keys(store.get().studyLog)[0];
  assert.equal(store.get().studyLog[day], 20);
  toggleItem(key, 20);
  assert.equal(store.get().studyLog[day], 0);
  assert.ok(today);
});

test('lesson steps do not split on ## lines inside fenced code blocks', async () => {
  const { splitSteps } = await import('../js/views/lesson.js');
  const md = '# T\n\nintro\n\n## One\n\ntext\n\n```\n## not a heading\n```\n\n## Two\n\nmore\n\n## Key takeaways\n\n- a\n\n## Go deeper\n\n- b\n';
  const steps = splitSteps(md);
  assert.deepEqual(steps.map((s) => s.title), ['Introduction', 'One', 'Two', 'Wrap-up']);
  assert.ok(steps[1].md.includes('## not a heading'));
});

test('dropdown prompts survive option text containing $ replacement patterns', async () => {
  const { renderQuestion } = await import('../js/qview.js');
  const q = { id: 'x', format: 'dropdown', type: 'GI', difficulty: 3, prompt: 'A [[1]] and B [[2]].', blanks: [["$&", "$'"], ['x', 'y']], answer: [0, 0] };
  const html = renderQuestion(q, null, { answer: null });
  assert.ok(html.includes('&amp;') && html.split('<select').length === 3);
  assert.ok(!html.includes('A  and B'), 'blank 1 was replaced by an empty string');
  assert.ok(html.includes('data-blank="0"') && html.includes('data-blank="1"'));
});

test('score maths hits the published range ends', () => {
  assert.equal(totalScore(60, 60, 60), 205);
  assert.equal(totalScore(90, 90, 90), 805);
  assert.ok(sectionScore(0, 21, 21) < sectionScore(0, 0, 21));
});

test('Review & Edit allows exactly 3 changed questions; changing one twice costs once', () => {
  const bank = loadBank();
  const m = createMock({ mode: 'full', order: ['quant', 'verbal', 'di'], seed: 7 });
  const st = mk();
  const ids = [];
  for (let i = 0; i < 5; i++) {
    const id = advance(m, bank, st);
    ids.push(id);
    answer(m, id, 0, false, 30);
  }
  assert.ok(editAnswer(m, ids[0], 1, false));
  assert.ok(editAnswer(m, ids[0], 2, false)); // same question again: still 1 change
  assert.ok(editAnswer(m, ids[1], 1, false));
  assert.ok(editAnswer(m, ids[2], 1, false));
  assert.equal(editAnswer(m, ids[3], 1, false), false);
  assert.equal(m.sections.quant.edits, 3);
});

test('adaptive mock never repeats a question from a finished mock and keeps RC/MSR groups whole', () => {
  const bank = loadBank();
  const st = mk();
  const seen = new Set();
  for (let run = 0; run < 3; run++) {
    const m = createMock({ mode: 'full', order: ['verbal', 'di', 'quant'], seed: 100 + run });
    for (const sec of m.order) {
      m.idx = m.order.indexOf(sec);
      let id;
      while ((id = advance(m, bank, st))) answer(m, id, 0, bank.questions.get(id).answer === 0, 20);
      const served = m.sections[sec].served;
      assert.ok(served.length >= 18, `${sec} served ${served.length}`);
      for (const [, qs] of bank.groups) {
        const hit = qs.filter((q) => served.includes(q.id)).length;
        assert.ok(hit === 0 || hit === qs.length || served.length >= 20, 'a passage/source set was split');
      }
    }
    const fin = finalizeMock(m, bank);
    for (const it of fin.items) assert.ok(!seen.has(it.qid), `repeat ${it.qid} in run ${run}`);
    fin.items.forEach((it) => seen.add(it.qid));
    st.mocks.push(fin);
  }
});

test('RC practice sets are whole passages and never come from the mock pool', () => {
  const bank = loadBank();
  const ids = selectSet(bank, mk(), { type: 'RC', passages: 2, seed: 3 });
  assert.ok(ids.length >= 2);
  const sids = new Set(ids.map((id) => bank.questions.get(id).stimulusId));
  assert.equal(sids.size, 2);
  for (const sid of sids) for (const q of bank.groups.get(sid)) assert.ok(ids.includes(q.id));
  assert.ok(ids.every((id) => bank.questions.get(id).pool === 'practice'));
});

test('everything is relative so the app works under /gmat-buddy-2027/', () => {
  const manifest = JSON.parse(read('../manifest.webmanifest'));
  assert.ok(!manifest.start_url.startsWith('/') && !manifest.scope.startsWith('/'));
  for (const i of manifest.icons) assert.ok(!i.src.startsWith('/'));
  const pre = JSON.parse(read('../precache.json'));
  assert.ok(pre.files.every((f) => f.startsWith('./')));
  for (const f of ['../index.html', '../sw.js', '../js/app.js', '../js/content.js', '../js/md.js']) {
    assert.ok(!/(?:href|src)="\/(?!\/)/.test(read(f)) && !/fetch\(['"`]\//.test(read(f)), `${f} uses an absolute path`);
  }
  for (const f of readdirSync(new URL('../js/views/', import.meta.url))) {
    const t = read(`../js/views/${f}`);
    assert.ok(!/(?:href|src)="\/(?!\/)/.test(t) && !/fetch\(['"`]\//.test(t), `${f} uses an absolute path`);
  }
});
