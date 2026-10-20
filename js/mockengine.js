// Adaptive mock exam engine (pure logic; the view lives in views/mock.js).
import { seededRandom, shuffle, uid, todayStr } from './util.js';
import { estimateTheta, nextDifficulty, sectionScore, totalScore, totalPercentile } from './scoring.js';

export const SECTION_SPEC = {
  full: {
    quant: { n: 21, secs: 45 * 60 },
    verbal: { n: 23, secs: 45 * 60 },
    di: { n: 20, secs: 45 * 60 },
  },
  diagnostic: {
    quant: { n: 10, secs: 21 * 60 },
    verbal: { n: 11, secs: 22 * 60 },
    di: { n: 9, secs: 20 * 60 },
  },
};

const VERBAL_PATTERN = {
  full: ['CR', 'RC', 'CR', 'CR', 'RC', 'CR', 'CR', 'RC', 'CR', 'CR', 'RC', 'CR', 'CR', 'CR', 'CR'],
  diagnostic: ['CR', 'CR', 'RC', 'CR', 'CR', 'CR', 'RC', 'CR', 'CR'],
};

function diPattern(mode, rand) {
  if (mode === 'diagnostic') return shuffle(['DS', 'DS', 'DS', 'DS', 'TPA', 'TPA', 'TA', 'GI', 'GI'], rand);
  const singles = shuffle(['DS', 'DS', 'DS', 'DS', 'DS', 'DS', 'DS', 'TPA', 'TPA', 'TPA', 'TPA', 'TA', 'TA', 'TA', 'GI', 'GI', 'GI'], rand);
  const at = 6 + Math.floor(rand() * 6);
  return [...singles.slice(0, at), 'MSR', ...singles.slice(at)];
}

export function createMock({ key = null, mode = 'full', order = ['quant', 'verbal', 'di'], seed = Date.now() }) {
  const rand = seededRandom(seed);
  const sections = {};
  for (const sec of order) {
    sections[sec] = {
      pattern: sec === 'verbal' ? VERBAL_PATTERN[mode] : sec === 'di' ? diPattern(mode, rand) : null,
      slot: 0,
      queue: [], // remaining questions of the current RC/MSR group
      served: [],
      answers: {},
      times: {},
      bookmarks: [],
      edits: 0,
      editedIds: [],
      elapsed: 0,
      finished: false,
      timeUp: false,
    };
  }
  return { id: uid('mock'), key, mode, order, seed, idx: 0, phase: 'intro', current: null, breakTaken: false, breakEndsAt: null, startedAt: Date.now(), sections, reviewing: null };
}

export function spec(mock, sec) {
  return SECTION_SPEC[mock.mode][sec];
}

function usedIds(state, mock) {
  const used = new Set();
  for (const m of state.mocks || []) for (const it of m.items || []) used.add(it.qid);
  for (const s of Object.values(mock.sections)) for (const id of s.served) used.add(id);
  return used;
}

function thetaFor(mock, sec, bank) {
  const s = mock.sections[sec];
  return estimateTheta(
    s.served.filter((id) => s.answers[id] != null).map((id) => ({ difficulty: bank.questions.get(id).difficulty, correct: s.answers[id]?.correct }))
  );
}

function candidates(bank, type, section, used, pools = ['mock', 'practice']) {
  for (const pool of pools) {
    const list = bank.list.filter((q) => q.pool === pool && q.section === section && (!type || q.type === type) && !used.has(q.id));
    if (list.length) return list;
  }
  // Everything has been used: allow repeats from the mock pool.
  return bank.list.filter((q) => q.pool === 'mock' && q.section === section && (!type || q.type === type));
}

function pickSingle(list, target, rand, avoidTopic) {
  const scored = list.map((q) => [Math.abs(q.difficulty - target) + (q.topic === avoidTopic ? 0.6 : 0) + rand() * 0.9, q]);
  scored.sort((a, b) => a[0] - b[0]);
  return scored[0]?.[1] || null;
}

function pickGroup(bank, type, used, target, maxLen, rand) {
  const tryPools = ['mock', 'practice', 'any'];
  for (const pool of tryPools) {
    const groups = [];
    for (const [sid, qs] of bank.groups) {
      if (!qs.length || qs[0].type !== type) continue;
      if (pool !== 'any' && qs[0].pool !== pool) continue;
      if (pool !== 'any' && qs.some((q) => used.has(q.id))) continue;
      if (qs.length > maxLen) continue;
      const avg = qs.reduce((a, q) => a + q.difficulty, 0) / qs.length;
      groups.push([Math.abs(avg - target) + rand() * 0.8, qs]);
    }
    if (groups.length) {
      groups.sort((a, b) => a[0] - b[0]);
      return groups[0][1].map((q) => q.id);
    }
  }
  return [];
}

// Decide and record the next question id for the current section. Returns null when the section is complete.
export function advance(mock, bank, state) {
  const sec = mock.order[mock.idx];
  const s = mock.sections[sec];
  const sp = spec(mock, sec);
  if (s.served.length >= sp.n) return null;
  if (s.queue.length) {
    const id = s.queue.shift();
    s.served.push(id);
    mock.current = id;
    return id;
  }
  const rand = seededRandom(`${mock.seed}:${sec}:${s.served.length}`);
  const target = nextDifficulty(thetaFor(mock, sec, bank));
  const used = usedIds(state, mock);
  const remaining = sp.n - s.served.length;
  let type = sec === 'quant' ? 'PS' : s.pattern[s.slot % s.pattern.length];
  s.slot++;
  if ((type === 'RC' || type === 'MSR') && remaining >= 3) {
    const ids = pickGroup(bank, type, used, target, remaining, rand);
    if (ids.length) {
      s.queue = ids.slice(1);
      s.served.push(ids[0]);
      mock.current = ids[0];
      return ids[0];
    }
  }
  if (type === 'RC') type = 'CR';
  if (type === 'MSR') type = 'DS';
  const lastTopic = s.served.length ? bank.questions.get(s.served[s.served.length - 1])?.topic : null;
  const q = pickSingle(candidates(bank, type, sec, used), target, rand, lastTopic);
  if (!q) return null;
  s.served.push(q.id);
  mock.current = q.id;
  return q.id;
}

export function answer(mock, qid, value, correct, secs) {
  const sec = mock.order[mock.idx];
  const s = mock.sections[sec];
  const prev = s.answers[qid];
  s.answers[qid] = { value, correct };
  s.times[qid] = (s.times[qid] || 0) + secs;
  return prev;
}

// During Review & Edit: change an answer if edits remain.
export function editAnswer(mock, qid, value, correct) {
  const sec = mock.order[mock.idx];
  const s = mock.sections[sec];
  const prev = s.answers[qid];
  const same = prev && JSON.stringify(prev.value) === JSON.stringify(value);
  if (same) return true;
  if (!s.editedIds.includes(qid)) {
    if (s.edits >= 3) return false;
    s.edits++;
    s.editedIds.push(qid);
  }
  s.answers[qid] = { value, correct };
  return true;
}

export function toggleBookmark(mock, qid) {
  const s = mock.sections[mock.order[mock.idx]];
  const i = s.bookmarks.indexOf(qid);
  if (i >= 0) s.bookmarks.splice(i, 1);
  else s.bookmarks.push(qid);
}

export function scoreMock(mock, bank) {
  const scores = {};
  const per = {};
  const items = [];
  for (const sec of mock.order) {
    const s = mock.sections[sec];
    const sp = spec(mock, sec);
    const resp = s.served.filter((id) => s.answers[id]).map((id) => ({ difficulty: bank.questions.get(id).difficulty, correct: s.answers[id].correct }));
    const unanswered = sp.n - resp.length;
    const theta = estimateTheta(resp);
    scores[sec] = sectionScore(theta, unanswered, sp.n);
    per[sec] = { correct: resp.filter((r) => r.correct).length, n: sp.n, answered: resp.length, unanswered, timeUsed: Math.round(s.elapsed), edits: s.edits };
    for (const id of s.served) {
      const q = bank.questions.get(id);
      items.push({ qid: id, section: sec, type: q.type, topic: q.topic, difficulty: q.difficulty, correct: !!s.answers[id]?.correct, answered: !!s.answers[id], secs: Math.round(s.times[id] || 0), bookmarked: s.bookmarks.includes(id), edited: s.editedIds.includes(id) });
    }
  }
  const complete = ['quant', 'verbal', 'di'].every((x) => scores[x] != null);
  const total = complete ? totalScore(scores.quant, scores.verbal, scores.di) : null;
  return { scores, total, pct: total ? totalPercentile(total) : null, per, items };
}

export function finalizeMock(mock, bank) {
  const r = scoreMock(mock, bank);
  return {
    id: mock.id,
    key: mock.key,
    kind: mock.mode === 'diagnostic' ? 'diagnostic' : 'app',
    date: todayStr(),
    order: mock.order,
    ...r,
  };
}
