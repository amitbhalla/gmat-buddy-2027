// Question selection for drills, smart practice, redo sets and section tests.
import { seededRandom, shuffle, todayStr } from './util.js';
import { topicMastery } from './scoring.js';

// Rank candidates: unseen first, then due-for-review misses, then least recently seen.
function rank(list, state, rand, today) {
  const st = state.qstats;
  const score = (q) => {
    const s = st[q.id];
    if (!s) return 0 + rand() * 0.5;
    if (!s.lastCorrect && s.due <= today) return 1 + rand() * 0.5;
    if (s.due <= today) return 2 + rand() * 0.5;
    return 3 + (s.seen || 1) + rand() * 0.5;
  };
  return list.map((q) => [score(q), q]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}

function inRange(q, d) {
  return !d || (q.difficulty >= d[0] && q.difficulty <= d[1]);
}

export function selectSet(bank, state, opts) {
  const { topic, topics, section, type, n = 8, d, passages, pool = 'practice', seed = Date.now(), excludeMock = true } = opts;
  const rand = seededRandom(seed);
  const today = todayStr();
  const base = bank.list.filter((q) => {
    if (excludeMock && pool === 'practice' && q.pool !== 'practice') return false;
    if (pool === 'mock' && q.pool !== 'mock') return false;
    if (topic && q.topic !== topic) return false;
    if (topics && !topics.includes(q.topic)) return false;
    if (section && q.section !== section) return false;
    if (type && q.type !== type) return false;
    return true;
  });

  // Passage/set based selection (RC and MSR): choose whole groups.
  if (type === 'RC' || type === 'MSR' || passages) {
    const groups = new Map();
    for (const q of base) if (q.stimulusId) (groups.get(q.stimulusId) || groups.set(q.stimulusId, []).get(q.stimulusId)).push(q);
    let gl = Array.from(groups.values()).map((qs) => ({ qs, avg: qs.reduce((a, q) => a + q.difficulty, 0) / qs.length }));
    const want = passages || Math.max(1, Math.round(n / 3));
    const fit = gl.filter((g) => !d || (g.avg >= d[0] - 0.5 && g.avg <= d[1] + 0.5));
    if (fit.length >= want) gl = fit;
    const rankedGroups = gl
      .map((g) => {
        const seen = g.qs.filter((q) => state.qstats[q.id]).length / g.qs.length;
        return [seen + rand() * 0.3, g];
      })
      .sort((a, b) => a[0] - b[0])
      .map((x) => x[1]);
    return rankedGroups.slice(0, want).flatMap((g) => g.qs.map((q) => q.id));
  }

  let pool1 = base.filter((q) => inRange(q, d));
  if (pool1.length < n && d) pool1 = base.filter((q) => inRange(q, [d[0] - 1, d[1] + 1]));
  if (pool1.length < n) pool1 = base;
  const ranked = rank(pool1, state, rand, today);
  // Spread topics when several are allowed.
  if ((topics && topics.length > 1) || section) {
    const out = [];
    const used = new Map();
    for (const q of ranked) {
      if (out.length >= n) break;
      const c = used.get(q.topic) || 0;
      if (c <= Math.floor(out.length / Math.max(1, new Set(ranked.map((x) => x.topic)).size)) + 1) {
        out.push(q);
        used.set(q.topic, c + 1);
      }
    }
    for (const q of ranked) if (out.length < n && !out.includes(q)) out.push(q);
    return sortEasyFirst(out).map((q) => q.id);
  }
  return sortEasyFirst(ranked.slice(0, n)).map((q) => q.id);
}

function sortEasyFirst(list) {
  // Mild ramp: easier first, but keep some variety.
  return list.slice().sort((a, b) => a.difficulty - b.difficulty);
}

// Per-topic stats from attempt history.
export function topicStats(bank, state) {
  const by = {};
  for (const a of state.attempts) {
    const q = bank.questions.get(a.qid);
    if (!q) continue;
    (by[q.topic] ||= []).push({ difficulty: q.difficulty, correct: a.correct, secs: a.secs, target: q.timeTarget });
  }
  const out = {};
  for (const [t, list] of Object.entries(by)) {
    const correct = list.filter((x) => x.correct).length;
    out[t] = {
      n: list.length,
      correct,
      acc: correct / list.length,
      mastery: topicMastery(list),
      avgSecs: list.reduce((s, x) => s + x.secs, 0) / list.length,
      avgTarget: list.reduce((s, x) => s + x.target, 0) / list.length,
    };
  }
  return out;
}

// Smart practice: weakest learned topics + due reviews.
export function smartSet(bank, state, curriculum, { n = 10, section = null, seed = Date.now() } = {}) {
  const rand = seededRandom(seed);
  const today = todayStr();
  const learned = Object.entries(state.lessons)
    .filter(([id, l]) => l.completedAt && curriculum.lessons[id]?.topic)
    .map(([id]) => curriculum.lessons[id].topic)
    .filter((t) => !section || t.startsWith(section === 'quant' ? 'q-' : section === 'verbal' ? 'v-' : 'd-'));
  const topics = Array.from(new Set(learned));
  if (!topics.length) return [];
  const stats = topicStats(bank, state);
  const weakness = (t) => {
    const s = stats[t];
    if (!s) return 0.4 + rand() * 0.1; // untested topics are moderately urgent
    return (s.mastery ?? 50) / 100 + Math.min(0.3, s.n / 200) + rand() * 0.1;
  };
  const ordered = topics.sort((a, b) => weakness(a) - weakness(b));
  const focus = ordered.slice(0, 3);
  const due = bank.list
    .filter((q) => q.pool === 'practice' && topics.includes(q.topic) && state.qstats[q.id] && !state.qstats[q.id].lastCorrect && state.qstats[q.id].due <= today && q.type !== 'RC' && q.type !== 'MSR')
    .slice(0, Math.floor(n / 3));
  const chosen = new Set(due.map((q) => q.id));
  const perTopic = Math.ceil((n - chosen.size) / focus.length);
  for (const t of focus) {
    const mastery = stats[t]?.mastery ?? 40;
    const lvl = Math.max(1, Math.min(5, Math.round(1 + mastery / 25)));
    const ids = selectSet(bank, state, { topic: t, n: perTopic, d: [Math.max(1, lvl - 1), Math.min(5, lvl + 1)], seed: seed + t });
    for (const id of ids) if (chosen.size < n && !chosen.has(id)) chosen.add(id);
  }
  return shuffle(Array.from(chosen), rand);
}

export function redoSet(bank, state, { n = 10 } = {}) {
  const today = todayStr();
  return Object.entries(state.errors)
    .filter(([qid, e]) => !e.resolved && bank.questions.has(qid))
    .sort((a, b) => {
      const da = state.qstats[a[0]]?.due || today;
      const db = state.qstats[b[0]]?.due || today;
      return da < db ? -1 : 1;
    })
    .slice(0, n)
    .map(([qid]) => qid);
}

// Section test (timed, real proportions) from the practice pool.
export function sectionSet(bank, state, section, { seed = Date.now(), n } = {}) {
  if (section === 'quant') return selectSet(bank, state, { section: 'quant', n: n || 21, d: [2, 5], seed });
  if (section === 'verbal') {
    const rc = selectSet(bank, state, { type: 'RC', passages: 3, d: [2, 5], seed });
    const cr = selectSet(bank, state, { type: 'CR', section: 'verbal', n: Math.max(6, (n || 23) - rc.length), d: [2, 5], seed: seed + 1 });
    return interleaveVerbal(cr, rc, bank);
  }
  const ds = selectSet(bank, state, { type: 'DS', n: 7, d: [2, 5], seed });
  const ta = selectSet(bank, state, { type: 'TA', n: 3, d: [2, 5], seed: seed + 1 });
  const gi = selectSet(bank, state, { type: 'GI', n: 3, d: [2, 5], seed: seed + 2 });
  const tpa = selectSet(bank, state, { type: 'TPA', n: 4, d: [2, 5], seed: seed + 3 });
  const msr = selectSet(bank, state, { type: 'MSR', passages: 1, seed: seed + 4 });
  const rand = seededRandom(seed);
  const singles = shuffle([...ds, ...ta, ...gi, ...tpa], rand);
  const at = Math.floor(singles.length / 2);
  return [...singles.slice(0, at), ...msr, ...singles.slice(at)].slice(0, n || 20);
}

function interleaveVerbal(cr, rc, bank) {
  const groups = [];
  for (const id of rc) {
    const sid = bank.questions.get(id).stimulusId;
    let g = groups.find((x) => x.sid === sid);
    if (!g) groups.push((g = { sid, ids: [] }));
    g.ids.push(id);
  }
  const out = [];
  const step = Math.max(2, Math.floor(cr.length / (groups.length + 1)));
  let ci = 0;
  for (const g of groups) {
    out.push(...cr.slice(ci, ci + step));
    ci += step;
    out.push(...g.ids);
  }
  out.push(...cr.slice(ci));
  return out;
}
