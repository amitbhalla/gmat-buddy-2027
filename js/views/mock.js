// Full-length adaptive mocks, the diagnostic, official-score logging, and mock results.
import * as store from '../store.js';
import * as content from '../content.js';
import { createMock, advance, answer, editAnswer, toggleBookmark, finalizeMock, spec } from '../mockengine.js';
import { renderQuestion, bindQuestion, isComplete, isCorrect, renderExplanation } from '../qview.js';
import { totalScore, totalPercentile } from '../scoring.js';
import { renderLineChart } from '../charts.js';
import { icon } from '../icons.js';
import { esc, fmtClock, fmtDate, todayStr, toast, SECTION_LONG, SECTION_NAMES, TYPE_NAMES } from '../util.js';
import { checkAchievements, confirmSheet } from './common.js';
import { reasonPicker } from './session.js';

const ORDERS = [
  ['quant', 'verbal', 'di'], ['quant', 'di', 'verbal'], ['verbal', 'quant', 'di'],
  ['verbal', 'di', 'quant'], ['di', 'quant', 'verbal'], ['di', 'verbal', 'quant'],
];
const short = (o) => o.map((x) => ({ quant: 'Q', verbal: 'V', di: 'DI' }[x])).join(' → ');

export async function render(ctx) {
  const sub = ctx.params[0];
  if (sub === 'start') return startScreen(ctx, ctx.params[1]);
  if (sub === 'run') return runMock(ctx);
  if (sub === 'official') return officialForm(ctx, ctx.params[1]);
  if (sub === 'results') return resultsScreen(ctx, ctx.params[1]);
  if (sub === 'review') return reviewItem(ctx, ctx.params[1]);
  return hub(ctx);
}

function hub({ view, setTop }) {
  setTop({ title: 'Mocks', back: '#/practice' });
  const s = store.get();
  const mocks = s.mocks.slice().reverse();
  const active = s.activeMock;
  view.innerHTML = `
    <img class="cover slim" src="img/gen/mock-season.jpg" alt="" onerror="this.remove()">
    <h1>Full-length mocks</h1>
    <p class="muted">Three 45-minute sections, adaptive like the real exam, with Review &amp; Edit and an optional break. Mock questions come from a separate pool you never see in practice.</p>
    ${active ? `<div class="card tint"><h3>Mock in progress</h3><p class="muted">Section ${active.idx + 1} of 3.</p><div class="btn-row"><a class="btn primary" href="#/mock/run">Resume</a><button class="btn danger" data-abandon>Abandon</button></div></div>` : ''}
    <div class="list">
      <a class="item" href="#/mock/start/free"><div class="ic amber">${icon('mock')}</div><div class="body"><div class="t">Start a full mock</div><div class="s">2 h 15 min · find a quiet slot</div></div>${icon('chevron')}</a>
      <a class="item" href="#/mock/start/mock:diagnostic"><div class="ic">${icon('compass')}</div><div class="body"><div class="t">Short diagnostic</div><div class="s">About 65 minutes · a rough baseline</div></div>${icon('chevron')}</a>
      <a class="item" href="#/mock/official/official:free"><div class="ic blue">${icon('star')}</div><div class="body"><div class="t">Log an official practice exam</div><div class="s">From mba.com, so your trend stays complete</div></div>${icon('chevron')}</a>
    </div>
    ${mocks.length ? `<div class="section-title"><h2>Your results</h2></div>${trendChart(s.mocks)}<div class="list">${mocks.map(mockRow).join('')}</div>` : ''}`;
  view.querySelector('[data-abandon]')?.addEventListener('click', async () => {
    if (await confirmSheet('Abandon this mock?', 'Your answers so far will not be scored.', 'Abandon')) {
      store.update((x) => (x.activeMock = null), true);
      hub({ view, setTop });
    }
  });
}

export function trendChart(mocks) {
  const pts = mocks.filter((m) => m.total).map((m) => ({ label: fmtDate(m.date), value: m.total }));
  if (pts.length < 2) return '';
  return `<div class="card flat">${renderLineChart(pts, { yMin: 405, yMax: 805, showValues: true, name: 'Total score', height: 260 })}</div>`;
}

function mockRow(m) {
  const label = m.kind === 'official' ? 'Official practice exam' : m.kind === 'real' ? 'Real GMAT' : m.kind === 'diagnostic' ? 'Diagnostic' : 'GMAT Buddy mock';
  const href = m.items ? `#/mock/results/${m.id}` : null;
  return `<${href ? 'a' : 'div'} class="item" ${href ? `href="${href}"` : ''}><div class="ic amber">${icon(m.kind === 'official' || m.kind === 'real' ? 'star' : 'mock')}</div>
    <div class="body"><div class="t">${m.total ?? '—'} <span class="faint">· Q${m.scores.quant ?? '–'} V${m.scores.verbal ?? '–'} DI${m.scores.di ?? '–'}</span></div><div class="s">${label} · ${fmtDate(m.date, { year: true })}</div></div>${href ? icon('chevron') : ''}</${href ? 'a' : 'div'}>`;
}

// ---------- start
function startScreen({ view, setTop, query }, key) {
  const mode = key === 'mock:diagnostic' ? 'diagnostic' : 'full';
  setTop({ title: mode === 'diagnostic' ? 'Diagnostic' : 'Full mock', back: query.item || key?.startsWith('mock:') ? '#/today' : '#/mock' });
  let order = ['quant', 'verbal', 'di'];
  const sp = (x) => spec({ mode }, x);
  const paint = () => {
    view.innerHTML = `
      <h1 style="margin-top:8px">${mode === 'diagnostic' ? 'Short diagnostic' : 'Full-length mock'}</h1>
      <p class="muted">${mode === 'diagnostic' ? "A shorter version of the real exam to see where you're starting from. Don't worry about the score: it's a map, not a verdict. Guess freely on anything you haven't learned yet." : 'Treat this like test day: phone on silent, water nearby, no pausing. Questions adapt to how you are doing.'}</p>
      <div class="grid3" style="margin:14px 0">${['quant', 'verbal', 'di'].map((x) => `<div class="stat"><div class="n">${sp(x).n}</div><div class="l">${SECTION_NAMES[x]} · ${sp(x).secs / 60} min</div></div>`).join('')}</div>
      <h3>Choose your section order</h3>
      <p class="faint">On the real GMAT you pick the order at the start. Many people start with their strongest section.</p>
      <div class="chips" style="margin-bottom:16px">${ORDERS.map((o) => `<button class="chip${o.join() === order.join() ? ' on' : ''}" data-order="${o.join(',')}">${short(o)}</button>`).join('')}</div>
      <div class="card flat small"><strong>How it works:</strong> you must answer each question to move on. At the end of a section, if time remains, you can review bookmarked questions and change up to 3 answers. You get one optional 10-minute break after section 1 or 2.</div>
      <div class="action-bar"><button class="btn primary" data-go>${icon('play')} Begin section 1: ${SECTION_NAMES[order[0]]}</button></div>`;
  };
  view.addEventListener('click', async (e) => {
    const o = e.target.closest('[data-order]');
    if (o) {
      order = o.dataset.order.split(',');
      paint();
      return;
    }
    if (e.target.closest('[data-go]')) {
      const s = store.get();
      if (s.activeMock && !(await confirmSheet('Replace the mock in progress?', 'You already have a mock under way. Starting a new one discards its answers.', 'Start new'))) return;
      const k = key && key !== 'free' ? key : null;
      const m = createMock({ key: k, mode, order, seed: Date.now() });
      m.phase = 'section';
      m.itemKey = query.item || k;
      store.update((x) => (x.activeMock = m), true);
      location.hash = '#/mock/run';
    }
  });
  view.className = 'immersive';
  paint();
}

// ---------- runner
async function runMock({ view, setTop, focusMode }) {
  const bank = await content.bank();
  const cur = await content.curriculum();
  const coach = await content.coach();
  let m = store.get().activeMock;
  if (!m) {
    location.replace('#/mock');
    return;
  }
  focusMode(true);
  view.className = 'wide immersive exam';
  document.body.classList.add('exam-mode');
  let qStart = Date.now();
  let lastTick = Date.now();
  let tick = null;
  const save = () => store.update((x) => (x.activeMock = m));
  const sec = () => m.order[m.idx];
  const S = () => m.sections[sec()];
  const left = () => spec(m, sec()).secs - S().elapsed;

  const ensureQuestion = () => {
    if (!m.current || S().served[S().served.length - 1] !== m.current || S().answers[m.current]) {
      const id = advance(m, bank, store.get());
      if (!id) return false;
    }
    return true;
  };

  const endSection = () => {
    S().finished = true;
    m.reviewing = null;
    m.draft = null; // an unconfirmed pick must not carry into the next section
    if (m.idx < m.order.length - 1) {
      m.phase = m.breakTaken || m.idx > 1 ? 'between' : 'break-offer';
    } else {
      return complete();
    }
    save();
    paint();
  };

  const complete = () => {
    clearInterval(tick);
    if (!store.get().activeMock) return; // already finalised (double tap)
    const result = finalizeMock(m, bank);
    result.itemKey = m.itemKey;
    store.update((x) => {
      x.mocks.push(result);
      x.activeMock = null;
    }, true);
    for (const it of result.items) {
      if (!it.answered) continue;
      const q = bank.questions.get(it.qid);
      const a = m.sections[it.section].answers[it.qid];
      store.recordAttempt({ qid: it.qid, correct: it.correct, secs: it.secs, mode: 'mock', sid: m.id, answer: a?.value });
    }
    const mins = Object.values(m.sections).reduce((a, s) => a + s.elapsed, 0) / 60;
    store.logMinutes(mins);
    if (m.itemKey) store.markDone(m.itemKey, Math.round(mins));
    const prevBest = Math.max(0, ...store.get().mocks.filter((x) => x.id !== result.id && x.total).map((x) => x.total));
    if (result.total && prevBest && result.total > prevBest) store.update((x) => (x.achievements.mockPersonalBest = todayStr()));
    checkAchievements(coach, cur);
    focusMode(false);
    location.hash = `#/mock/results/${result.id}`;
  };

  const paintQuestion = () => {
    const s = S();
    const id = m.reviewing || m.current;
    const q = bank.questions.get(id);
    const stim = q.stimulusId ? bank.stimuli.get(q.stimulusId) : null;
    const num = s.served.indexOf(id) + 1;
    const a = s.answers[id]?.value ?? (m.reviewing ? null : m.draft ?? null);
    const bm = s.bookmarks.includes(id);
    view.innerHTML = `
      <div class="player-top" style="margin:0 -16px">
        <div class="ptitle">${SECTION_LONG[sec()]}</div>
        <span class="count">Question ${num} of ${spec(m, sec()).n}</span>
        <button class="timer" data-timer title="Tap to hide or show"></button>
      </div>
      <div class="player-progress" style="margin:0 -16px"><span style="width:${(s.served.length / spec(m, sec()).n) * 100}%"></span></div>
      ${m.reviewing ? `<div class="card warn" style="margin-top:12px">Review &amp; Edit · ${3 - s.edits} answer change${3 - s.edits === 1 ? '' : 's'} left</div>` : ''}
      <div id="qhost">${renderQuestion(q, stim, { answer: a })}</div>
      <div class="action-bar">
        <button class="btn icon-only${bm ? ' bookmarked' : ''}" data-bm aria-label="Bookmark">${icon('bookmark')}</button>
        ${m.reviewing ? '<button class="btn primary" data-back-review>Back to review</button>' : `<button class="btn primary" data-next ${isComplete(q, a) ? '' : 'disabled'}>Next</button>`}
      </div>`;
    bindQuestion(view.querySelector('#qhost'), q, () => (m.reviewing ? s.answers[id]?.value : m.draft), (val) => {
      if (m.reviewing) {
        if (!isComplete(q, val)) return;
        const ok = editAnswer(m, id, val, isCorrect(q, val));
        if (!ok) {
          toast('You have used all 3 answer changes for this section.', { kind: 'warn' });
          paintQuestion();
          return;
        }
        save();
        const banner = view.querySelector('.card.warn');
        if (banner) banner.innerHTML = `Review &amp; Edit · ${3 - s.edits} answer change${3 - s.edits === 1 ? '' : 's'} left`;
      } else {
        m.draft = val;
        view.querySelector('[data-next]').disabled = !isComplete(q, val);
      }
    });
    updateTimer();
  };

  const paintReview = () => {
    const s = S();
    view.innerHTML = `
      <div class="player-top" style="margin:0 -16px"><div class="ptitle">Review &amp; Edit · ${SECTION_NAMES[sec()]}</div><button class="timer" data-timer></button></div>
      <h2 style="margin-top:16px">Review your answers</h2>
      <p class="muted">Tap any question to look again. You can change up to 3 answers in this section (${3 - s.edits} left). Bookmarked ones are marked in amber.</p>
      <div class="review-grid">${s.served.map((id, i) => `<button data-open="${esc(id)}" class="${s.bookmarks.includes(id) ? 'bm' : ''}${s.editedIds.includes(id) ? ' edited' : ''}">${i + 1}</button>`).join('')}</div>
      <div class="action-bar"><button class="btn primary" data-endsec>End section</button></div>`;
    updateTimer();
  };

  const paintBreak = () => {
    const offer = m.phase === 'break-offer';
    const onBreak = m.phase === 'break';
    const leftB = onBreak ? Math.max(0, Math.round((m.breakEndsAt - Date.now()) / 1000)) : 0;
    view.innerHTML = `<div style="max-width:520px;margin:40px auto;text-align:center">
      ${onBreak ? `<h1>Break</h1><p class="muted">Stand up, stretch, drink water. Don't look at notes: on test day you can't.</p><div style="font-size:48px;font-weight:800;margin:20px 0" data-breakclock>${fmtClock(leftB)}</div><button class="btn primary" data-resume>I'm ready, continue</button>`
        : `<h1>Section ${m.idx + 1} done</h1><p class="muted">Next up: <strong>${SECTION_LONG[m.order[m.idx + 1]]}</strong>, ${spec(m, m.order[m.idx + 1]).n} questions in ${spec(m, m.order[m.idx + 1]).secs / 60} minutes.</p>
          ${offer ? `<p class="faint">You can take your one optional 10-minute break now${m.idx === 0 ? ' or after the next section' : ''}.</p><div class="btn-row" style="justify-content:center"><button class="btn" data-takebreak>Take a 10-minute break</button><button class="btn primary" data-resume>Continue without a break</button></div>` : `<button class="btn primary" data-resume>Start the next section</button>`}`}
    </div>`;
  };

  const paint = () => {
    if (m.phase === 'section') {
      if (m.reviewing) return paintQuestion();
      if (!ensureQuestion()) {
        m.phase = left() > 0 ? 'review' : 'section';
        if (m.phase !== 'review') return endSection();
        save();
        return paintReview();
      }
      save();
      return paintQuestion();
    }
    if (m.phase === 'review') return m.reviewing ? paintQuestion() : paintReview();
    return paintBreak();
  };

  const updateTimer = () => {
    const t = view.querySelector('[data-timer]');
    if (!t) return;
    const l = left();
    t.textContent = m.hideTimer && l > 300 ? 'Show time' : fmtClock(l);
    t.className = `timer${l < 300 ? ' warn' : ''}${l < 60 ? ' over' : ''}`;
  };

  tick = setInterval(() => {
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    if (document.hidden) return;
    if (m.phase === 'section' || m.phase === 'review') {
      S().elapsed += dt;
      if (left() <= 0) {
        S().timeUp = true;
        if (m.current && !S().answers[m.current]) S().times[m.current] = (S().times[m.current] || 0) + (now - qStart) / 1000;
        toast('Time is up for this section.');
        endSection();
        return;
      }
      updateTimer();
      if (Math.round(S().elapsed) % 10 === 0) save();
    } else if (m.phase === 'break') {
      const c = view.querySelector('[data-breakclock]');
      const l = Math.max(0, Math.round((m.breakEndsAt - now) / 1000));
      if (c) c.textContent = fmtClock(l);
      if (l <= 0) {
        m.phase = 'section';
        m.idx++;
        m.current = null;
        qStart = Date.now();
        save();
        paint();
      }
    }
  }, 1000);

  const onClick = (e) => {
    if (e.target.closest('[data-timer]')) {
      m.hideTimer = !m.hideTimer;
      return updateTimer();
    }
    if (e.target.closest('[data-next]')) {
      const id = m.current;
      const q = bank.questions.get(id);
      answer(m, id, m.draft, isCorrect(q, m.draft), (Date.now() - qStart) / 1000);
      m.draft = null;
      qStart = Date.now();
      save();
      paint();
      window.scrollTo(0, 0);
      return;
    }
    if (e.target.closest('[data-bm]')) {
      toggleBookmark(m, m.reviewing || m.current);
      save();
      e.target.closest('[data-bm]').classList.toggle('bookmarked');
      return;
    }
    const open = e.target.closest('[data-open]');
    if (open) {
      m.reviewing = open.dataset.open;
      save();
      paintQuestion();
      return;
    }
    if (e.target.closest('[data-back-review]')) {
      m.reviewing = null;
      save();
      paintReview();
      return;
    }
    if (e.target.closest('[data-endsec]')) return endSection();
    if (e.target.closest('[data-takebreak]')) {
      m.breakTaken = true;
      m.phase = 'break';
      m.breakEndsAt = Date.now() + 10 * 60 * 1000;
      save();
      return paintBreak();
    }
    if (e.target.closest('[data-resume]')) {
      m.phase = 'section';
      m.idx++;
      m.current = null;
      qStart = Date.now();
      save();
      paint();
    }
  };
  view.addEventListener('click', onClick);
  paint();
  return () => {
    clearInterval(tick);
    view.removeEventListener('click', onClick);
    if (store.get().activeMock) save();
    document.body.classList.remove('exam-mode');
    focusMode(false);
  };
}

// ---------- official practice exam / real exam score logging
function officialForm({ view, setTop, query }, key) {
  const real = key === 'official:real-1' || key === 'official:real-2';
  setTop({ title: real ? 'Log your GMAT score' : 'Log an official exam', back: query.item ? '#/today' : '#/mock' });
  const titles = { 'official:pe1': 'Official Practice Exam 1', 'official:pe2': 'Official Practice Exam 2', 'official:pe3': 'Official Practice Exam 3', 'official:pe4': 'Official Practice Exam 4', 'official:pe5': 'Official Practice Exam 5', 'official:pe6': 'Official Practice Exam 6' };
  const label = real ? 'Your official GMAT' : titles[key] || 'Official practice exam';
  view.innerHTML = `
    <h1 style="margin-top:8px">${esc(label)}</h1>
    ${real ? '<p class="muted">Whatever the number, you did something hard. Log it and we will plan the next step together.</p>' : `<p class="muted">Take it on <a href="https://www.mba.com/exams/gmat-exam/prepare" target="_blank" rel="noopener">mba.com</a> in one sitting, under real conditions. Then enter your section scores here so your progress chart stays complete.</p>`}
    <div class="grid3">
      <label class="field"><span>Quant</span><input type="number" id="q" min="60" max="90" inputmode="numeric" placeholder="60-90"></label>
      <label class="field"><span>Verbal</span><input type="number" id="v" min="60" max="90" inputmode="numeric" placeholder="60-90"></label>
      <label class="field"><span>Data Insights</span><input type="number" id="d" min="60" max="90" inputmode="numeric" placeholder="60-90"></label>
    </div>
    <label class="field"><span>Total (from your report, if shown)</span><input type="number" id="t" min="205" max="805" step="10" placeholder="Calculated for you"></label>
    <label class="field"><span>Date taken</span><input type="date" id="dt" value="${todayStr()}"></label>
    <div class="card flat small muted" id="calc">Enter three section scores to see your total.</div>
    <div class="action-bar"><button class="btn primary" data-save>Save score</button></div>`;
  const val = (id) => Number(view.querySelector(`#${id}`).value);
  const calc = () => {
    const [q, v, d] = [val('q'), val('v'), val('d')];
    const ok = [q, v, d].every((x) => x >= 60 && x <= 90);
    view.querySelector('#calc').textContent = ok ? `Estimated total: ${totalScore(q, v, d)} (about the ${totalPercentile(totalScore(q, v, d))}th percentile).` : 'Enter three section scores (60-90) to see your total.';
  };
  view.addEventListener('input', calc);
  view.querySelector('[data-save]').addEventListener('click', () => {
    const [q, v, d] = [val('q'), val('v'), val('d')];
    if (![q, v, d].every((x) => x >= 60 && x <= 90)) return toast('Each section score is between 60 and 90.', { kind: 'warn' });
    const total = val('t') >= 205 ? Math.min(805, Math.round(val('t'))) : totalScore(q, v, d);
    store.update((x) => x.mocks.push({ id: `off-${Date.now()}`, key, kind: real ? 'real' : 'official', title: label, date: view.querySelector('#dt').value || todayStr(), scores: { quant: q, verbal: v, di: d }, total, pct: totalPercentile(total) }), true);
    if (key && key !== 'official:free') store.markDone(key, real ? 0 : 150);
    if (query.item) store.markDone(query.item, 0);
    if (!real) store.logMinutes(150);
    toast('Saved.', { kind: 'good' });
    location.hash = query.item ? '#/today' : '#/mock';
  });
}

// ---------- results
async function resultsScreen({ view, setTop }, id) {
  const bank = await content.bank();
  const s = store.get();
  const r = s.mocks.find((x) => x.id === id);
  if (!r) throw new Error('Mock not found.');
  setTop({ title: 'Mock results', back: '#/mock' });
  const diag = r.kind === 'diagnostic';
  const bySec = (sec) => r.items.filter((i) => i.section === sec);
  const byType = {};
  for (const it of r.items) {
    const t = (byType[it.type] ||= { n: 0, c: 0, secs: 0 });
    t.n++;
    t.c += it.correct ? 1 : 0;
    t.secs += it.secs;
  }
  const weakest = Object.entries(byType).filter(([, v]) => v.n >= 2).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n)[0];
  view.innerHTML = `
    <div class="hero" style="text-align:center">
      <div class="faint">${diag ? 'Diagnostic estimate' : 'Estimated score'} · ${fmtDate(r.date, { year: true })}</div>
      <div style="font-size:52px;font-weight:800;letter-spacing:-.03em;line-height:1.1;margin:6px 0">${r.total ?? '—'}</div>
      <div class="muted">${r.pct != null ? `About the ${r.pct}th percentile` : ''}</div>
      <div class="hero-stats" style="justify-content:center">${['quant', 'verbal', 'di'].map((x) => `<div class="hero-stat"><div class="n">${r.scores[x]}</div><div class="l">${SECTION_NAMES[x]}</div></div>`).join('')}</div>
    </div>
    <p class="faint">${diag ? "Diagnostics are short, so treat this as a rough starting point. It will move a lot as you learn." : 'GMAT Buddy estimates scores from question difficulty and accuracy. Official practice exams are the best predictor; use both.'}</p>
    <div class="grid3">${['quant', 'verbal', 'di'].map((x) => {
      const p = r.per[x];
      return `<div class="stat"><div class="n">${p.correct}/${p.n}</div><div class="l">${SECTION_NAMES[x]} correct${p.unanswered ? ` · ${p.unanswered} unanswered` : ''}</div><div class="faint">${fmtClock(p.timeUsed)} used</div></div>`;
    }).join('')}</div>
    ${weakest ? `<div class="card warn" style="margin-top:14px"><strong>Biggest opportunity: ${esc(TYPE_NAMES[weakest[0]])}.</strong> <span class="muted">${weakest[1].c} of ${weakest[1].n} right. Smart practice will lean on this for the next week.</span></div>` : ''}
    <div class="section-title"><h2>By question type</h2></div>
    <div class="card flat">${Object.entries(byType).map(([t, v]) => `<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:14.5px"><span>${esc(TYPE_NAMES[t])}</span><span class="faint">${v.c}/${v.n} · avg ${fmtClock(v.secs / v.n)}</span></div><div class="bar ${v.c / v.n >= 0.7 ? 'green' : v.c / v.n >= 0.5 ? '' : 'amber'}"><span style="width:${(v.c / v.n) * 100}%"></span></div></div>`).join('')}</div>
    <div class="section-title"><h2>Review every question</h2></div>
    <p class="faint">Start with the ones you got wrong, then the ones you got right but slowly or by guessing.</p>
    ${['quant', 'verbal', 'di'].filter((x) => r.order.includes(x)).map((x) => `<details class="card flat"><summary style="cursor:pointer;font-weight:650">${SECTION_LONG[x]}</summary>
      <div class="review-grid" style="margin-top:12px">${bySec(x).map((it, i) => `<button class="${it.correct ? 'right' : 'wrongq'}${it.bookmarked ? ' bm' : ''}" data-q="${esc(it.qid)}" data-sec="${x}">${i + 1}</button>`).join('')}</div></details>`).join('')}
    <div id="qdetail"></div>
    <div class="btn-row" style="margin-top:16px"><a class="btn primary" href="#/session/redo">Redo the mistakes</a><a class="btn" href="#/today">Back to today</a></div>`;
  const detailHost = view.querySelector('#qdetail');
  bindQuestion(detailHost, null, () => null, () => {}); // one set of handlers (tabs, sort, hide) for every question shown
  view.addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    const q = bank.questions.get(b.dataset.q);
    const stim = q.stimulusId ? bank.stimuli.get(q.stimulusId) : null;
    const it = r.items.find((x) => x.qid === q.id);
    const attempt = [...s.attempts].reverse().find((a) => a.qid === q.id && a.sid === r.id);
    const ans = attempt?.answer ?? null;
    const host = view.querySelector('#qdetail');
    host.innerHTML = `<div class="card"><div class="faint">${SECTION_NAMES[b.dataset.sec]} · Q${r.items.filter((x) => x.section === b.dataset.sec).indexOf(it) + 1} · Level ${q.difficulty} · ${fmtClock(it.secs)} (target ${fmtClock(q.timeTarget)})</div>
      ${renderQuestion(q, stim, { answer: ans, reveal: true })}${renderExplanation(q, it.answered ? ans : null)}${reasonPicker(q.id, q, ans)}</div>`;
    host.scrollIntoView({ behavior: 'smooth' });
  });
  view.addEventListener('click', (e) => {
    const rr = e.target.closest('[data-reason]');
    if (!rr) return;
    store.update((x) => x.errors[rr.dataset.qid] && (x.errors[rr.dataset.qid].reason = rr.dataset.reason));
    for (const btn of view.querySelectorAll(`[data-reason][data-qid="${rr.dataset.qid}"]`)) btn.classList.toggle('on', btn === rr);
  });
}

// ---------- deep review plan item
function reviewItem({ view, setTop, query }, mockKey) {
  setTop({ title: 'Mock review', back: '#/today' });
  const s = store.get();
  const r = [...s.mocks].reverse().find((m) => m.key === mockKey || m.itemKey === mockKey);
  const official = mockKey.startsWith('official:');
  view.innerHTML = `
    <h1 style="margin-top:8px">Deep review</h1>
    <p class="muted">The review is where the points come from. Give it about 90 minutes, with breaks.</p>
    <div class="card flat"><ol style="margin:0;padding-left:20px;line-height:1.8">
      <li>Look at every wrong answer. Tag why you missed it.</li>
      <li>Look at every right answer that took more than 3 minutes, or that you guessed.</li>
      <li>For each, write the one-line fix in your mistake log.</li>
      <li>Find your top 2 patterns (a topic, a question type, or a timing habit).</li>
      <li>Your next week of targeted practice should hit those two.</li>
    </ol></div>
    ${r && r.items ? `<a class="btn primary block" href="#/mock/results/${r.id}">Open the mock results</a>` : official ? `<div class="card tint">Official exams on mba.com come with a score report. ${s.settings.hasOfficialExams36 ? 'Use the Enhanced Score Report if you bought one.' : ''} Review the questions there, then log your mistakes here by topic.</div>` : '<div class="card warn">This mock has not been taken yet. Take it first, then review.</div>'}
    <button class="btn block" data-done style="margin-top:12px">${icon('check')} I've finished my review</button>`;
  view.querySelector('[data-done]').addEventListener('click', () => {
    if (query.item) store.markDone(query.item, 90);
    store.logMinutes(60);
    toast('Review logged. That is how scores go up.', { kind: 'good' });
    location.hash = '#/today';
  });
}
