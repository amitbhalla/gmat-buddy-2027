// Progress: projected score and trend up top; detail folded away underneath.
import * as store from '../store.js';
import * as content from '../content.js';
import { topicStats } from '../select.js';
import { projectFromPractice, totalPercentile } from '../scoring.js';
import { renderSparkBars } from '../charts.js';
import { icon } from '../icons.js';
import { esc, fmtMinutes, todayStr, addDays, weekday, fmtDate, SECTION_NAMES } from '../util.js';
import { BADGES } from './common.js';
import { trendChart } from './mock.js';

export async function render({ view }) {
  const [cur, bank] = await Promise.all([content.curriculum(), content.bank()]);
  const s = store.get();
  const today = todayStr();
  const enriched = s.attempts.map((a) => {
    const q = bank.questions.get(a.qid);
    return q ? { ...a, difficulty: q.difficulty, section: q.section, timed: a.mode !== 'learn' && a.mode !== 'redo' } : null;
  }).filter(Boolean);
  const proj = projectFromPractice(enriched);
  const lastMock = [...s.mocks].reverse().find((m) => m.total);
  const stats = topicStats(bank, s);
  const lessonsDone = Object.values(s.lessons).filter((l) => l.completedAt).length;
  const lessonsTotal = Object.keys(cur.lessons).length;
  const totalMin = store.totalMinutes(s);
  const acc = enriched.length ? Math.round((enriched.filter((a) => a.correct).length / enriched.length) * 100) : 0;
  const target = 685;

  const headline = lastMock
    ? { n: lastMock.total, l: `Latest ${lastMock.kind === 'official' ? 'official practice exam' : lastMock.kind === 'real' ? 'GMAT' : 'mock'} · ${fmtDate(lastMock.date)}` }
    : proj.total
      ? { n: proj.total, l: 'Projected from your practice so far' }
      : null;

  const sec = (k) => {
    const list = enriched.filter((a) => a.section === k);
    const c = list.filter((a) => a.correct).length;
    const score = lastMock?.scores?.[k] ?? proj[k];
    return `<div style="margin:10px 0"><div style="display:flex;justify-content:space-between"><strong>${SECTION_NAMES[k]}</strong><span class="faint">${score ? `~${score}` : list.length ? `${list.length} answered` : 'Not started'}</span></div>
      <div class="bar ${score >= 82 ? 'green' : score && score < 76 ? 'amber' : ''}" style="margin-top:6px"><span style="width:${score ? ((score - 60) / 30) * 100 : list.length ? (c / list.length) * 60 : 0}%"></span></div></div>`;
  };

  // Study time: last 8 weeks
  const weeks = [];
  for (let w = 7; w >= 0; w--) {
    let sum = 0;
    for (let d = 0; d < 7; d++) sum += s.studyLog[addDays(today, -(w * 7 + d))] || 0;
    weeks.push(Math.round(sum / 6) / 10);
  }
  // Heat map: last 16 weeks
  const start = addDays(today, -(15 * 7 + weekday(today)));
  const cells = [];
  for (let i = 0; i < 16 * 7; i++) {
    const d = addDays(start, i);
    if (d > today) {
      cells.push('<i style="visibility:hidden"></i>');
      continue;
    }
    const m = s.studyLog[d] || 0;
    const l = m >= 90 ? 4 : m >= 50 ? 3 : m >= 25 ? 2 : m >= 5 ? 1 : 0;
    cells.push(`<i class="l${l}${d === today ? ' today' : ''}" title="${fmtDate(d)}: ${Math.round(m)} min"></i>`);
  }
  const topicRows = Object.values(cur.lessons)
    .filter((l) => l.topic && (l.id === l.topic || l.topic === 'd-ds') && !(l.topic === 'd-ds' && l.id !== 'd-ds-method'))
    .map((l) => ({ l, st: stats[l.topic] }))
    .sort((a, b) => (a.st?.mastery ?? 101) - (b.st?.mastery ?? 101));
  const errorsByReason = {};
  for (const e of Object.values(s.errors)) if (!e.resolved) errorsByReason[e.reason || 'untagged'] = (errorsByReason[e.reason || 'untagged'] || 0) + 1;

  view.innerHTML = `
    <h1 style="margin-top:8px">Progress</h1>
    <div class="hero">
      ${headline ? `<div class="faint">${esc(headline.l)}</div><div style="font-size:46px;font-weight:800;letter-spacing:-.03em;line-height:1.1">${headline.n}</div><div class="muted small">About the ${totalPercentile(headline.n)}th percentile · aiming for ${target}+</div>` : `<div class="faint">Projected score</div><h2 style="color:#fff">Not enough data yet</h2><p class="muted small" style="margin:0">Answer about 15 questions in each section, or take the diagnostic, and your projection appears here.</p>`}
      <div class="hero-stats"><div class="hero-stat"><div class="n">${lessonsDone}/${lessonsTotal}</div><div class="l">lessons</div></div><div class="hero-stat"><div class="n">${enriched.length}</div><div class="l">questions</div></div><div class="hero-stat"><div class="n">${Math.round(totalMin / 60)}</div><div class="l">hours studied</div></div></div>
    </div>
    ${trendChart(s.mocks)}
    <div class="card"><h3>Section strength</h3>${sec('quant')}${sec('verbal')}${sec('di')}<p class="faint" style="margin:8px 0 0">${enriched.length ? `Overall accuracy ${acc}%. ` : ''}Bars show estimated section scores on the 60-90 scale.</p></div>

    <details class="card flat"><summary style="cursor:pointer;font-weight:650">Topics, weakest first</summary>
      <div style="margin-top:10px">${topicRows.map(({ l, st }) => `<a href="#/session/topic/${l.topic}" style="display:block;text-decoration:none;color:inherit;margin:10px 0">
        <div style="display:flex;justify-content:space-between;font-size:14.5px"><span>${esc(l.topic === 'd-ds' ? 'Data Sufficiency' : l.title)}</span><span class="faint">${st ? `${st.correct}/${st.n} · mastery ${st.mastery}` : 'Not practised'}</span></div>
        <div class="bar ${st && st.mastery >= 65 ? 'green' : st && st.mastery < 40 ? 'amber' : ''}"><span style="width:${st ? st.mastery : 0}%"></span></div></a>`).join('')}</div>
    </details>
    <details class="card flat"><summary style="cursor:pointer;font-weight:650">Study calendar</summary>
      <div class="heat" style="margin-top:12px">${cells.join('')}</div>
      <p class="faint" style="margin:8px 0 0">Last 16 weeks. Current streak: ${store.streak(s)} days.</p>
      <div style="margin-top:12px">${renderSparkBars(weeks, { width: 320, height: 70 })}</div>
      <p class="faint" style="margin:4px 0 0">Hours per week, last 8 weeks (this week on the right): ${weeks.join(' · ')}</p>
    </details>
    <details class="card flat"><summary style="cursor:pointer;font-weight:650">Mistake patterns</summary>
      <div style="margin-top:10px">${Object.keys(errorsByReason).length ? Object.entries(errorsByReason).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>${esc({ concept: 'Concept gap', careless: 'Careless slip', misread: 'Misread', time: 'Too slow', trap: 'Fell for a trap', guess: 'Guessed', untagged: 'Not tagged yet' }[k] || k)}</span><strong>${n}</strong></div>`).join('') : '<p class="muted">No open mistakes. Keep going.</p>'}</div>
      <a class="btn sm" href="#/errors" style="margin-top:10px">Open the mistake log</a>
    </details>
    <details class="card flat"><summary style="cursor:pointer;font-weight:650">Milestones (${BADGES.filter(([k]) => s.achievements[k]).length}/${BADGES.length})</summary>
      <div class="badge-grid" style="margin-top:12px">${BADGES.map(([k, l, ic]) => `<div class="badge${s.achievements[k] ? '' : ' locked'}"><div class="medal">${icon(ic)}</div>${esc(l)}</div>`).join('')}</div>
    </details>
    ${s.sessions.length ? `<details class="card flat"><summary style="cursor:pointer;font-weight:650">Recent practice sessions</summary><div class="list" style="margin-top:10px">${s.sessions.slice(-12).reverse().map((x) => `<a class="item" href="#/session/review/${x.id}"><div class="body"><div class="t">${esc(x.title)}</div><div class="s">${fmtDate(x.date)} · ${x.correct}/${x.total} · ${fmtMinutes(Math.max(1, x.secs / 60))}</div></div>${icon('chevron')}</a>`).join('')}</div></details>` : ''}`;
}
