// Score estimation. A one-parameter IRT (Rasch) model on our 1-5 difficulty scale.
// This is an ESTIMATE: GMAC's real algorithm and item parameters are not public.

const GRID = Array.from({ length: 161 }, (_, i) => -4 + i * 0.05);

// Item difficulty on the ability scale: d3 = 0, each level = 1 logit.
export const itemB = (difficulty) => (difficulty - 3) * 1.0;

const p = (theta, b) => 1 / (1 + Math.exp(-1.7 * (theta - b)));

// Expected-a-posteriori ability with a N(0, 1.2²) prior. responses: [{difficulty, correct}]
export function estimateTheta(responses, priorMean = 0, priorSd = 1.2) {
  let num = 0;
  let den = 0;
  for (const t of GRID) {
    let logL = -((t - priorMean) ** 2) / (2 * priorSd * priorSd);
    for (const r of responses) {
      const pr = p(t, itemB(r.difficulty));
      logL += Math.log(r.correct ? pr : 1 - pr);
    }
    const w = Math.exp(logL);
    num += t * w;
    den += w;
  }
  return den ? num / den : priorMean;
}

// Section score 60-90. Calibrated so theta 0 (consistent success at medium, ~605-655 level) ≈ 81.
export function sectionScore(theta, unanswered = 0, total = 1) {
  let s = 81 + 4.5 * theta;
  // Unanswered questions are penalised on the real exam; GMAC does not publish the size, so this is a modest estimate.
  s -= unanswered * 1.0 + (unanswered / Math.max(1, total)) * 6;
  return Math.round(Math.min(90, Math.max(60, s)));
}

// Total 205-805 from three section scores (GMAC weights sections equally; this linear map matches the published range).
export function totalScore(q, v, di) {
  const raw = ((q + v + di - 180) * 20) / 3 + 205;
  return Math.min(805, Math.max(205, Math.round((raw - 5) / 10) * 10 + 5));
}

// Approximate total-score percentiles (GMAC 2021-2026 data as reported by prep sites; label as approximate).
const TOTAL_PCT = [
  [805, 100], [755, 99.9], [735, 99.7], [715, 99], [705, 98], [695, 97], [685, 96], [675, 94], [665, 92],
  [655, 90], [645, 86], [635, 82], [625, 77], [615, 73], [605, 69], [595, 64], [585, 59], [575, 55],
  [565, 51], [555, 47], [545, 43], [535, 39], [525, 35], [515, 31], [505, 28], [455, 15], [405, 6], [305, 1], [205, 0],
];

export function totalPercentile(score) {
  for (let i = 0; i < TOTAL_PCT.length - 1; i++) {
    const [hi, ph] = TOTAL_PCT[i];
    const [lo, pl] = TOTAL_PCT[i + 1];
    if (score <= hi && score >= lo) return Math.round(pl + ((score - lo) / (hi - lo)) * (ph - pl));
  }
  return 0;
}

// Target difficulty for the next adaptive question (1-5) given the current ability estimate.
export function nextDifficulty(theta) {
  return Math.min(5, Math.max(1, Math.round(theta + 3)));
}

// Rough projected score from practice history (no mock yet): uses timed and untimed attempts,
// discounts untimed accuracy slightly. attempts: [{difficulty, correct, section, timed}]
export function projectFromPractice(attempts) {
  const bySec = { quant: [], verbal: [], di: [] };
  for (const a of attempts) if (bySec[a.section]) bySec[a.section].push(a);
  const out = {};
  for (const [sec, list] of Object.entries(bySec)) {
    if (list.length < 15) {
      out[sec] = null;
      continue;
    }
    const recent = list.slice(-80);
    const theta = estimateTheta(recent.map((r) => ({ difficulty: r.difficulty, correct: r.correct })));
    const untimedShare = recent.filter((r) => !r.timed).length / recent.length;
    out[sec] = sectionScore(theta - 0.35 * untimedShare);
  }
  const ready = out.quant && out.verbal && out.di;
  out.total = ready ? totalScore(out.quant, out.verbal, out.di) : null;
  return out;
}

// Mastery 0-100 for a topic from its attempts (recency-weighted, difficulty-aware).
export function topicMastery(list) {
  if (!list.length) return null;
  const recent = list.slice(-25);
  const theta = estimateTheta(recent.map((r) => ({ difficulty: r.difficulty, correct: r.correct })), 0, 1.0);
  // Map theta -2..2 to 0..100
  return Math.round(Math.min(100, Math.max(0, ((theta + 2) / 4) * 100)));
}
