// Practice session runner: learn mode (instant feedback) or test mode (timed, review at end).
import * as store from '../store.js';
import * as content from '../content.js';
import { selectSet, smartSet, redoSet, sectionSet, topicStats } from '../select.js';
import { renderQuestion, renderExplanation, bindQuestion, isComplete, isCorrect } from '../qview.js';
import { icon } from '../icons.js';
import { esc, fmtClock, fmtMinutes, uid, toast, TYPE_NAMES, SECTION_NAMES } from '../util.js';
import { checkAchievements } from './common.js';

export const REASONS = [
  ['concept', 'Concept gap'],
  ['careless', 'Careless slip'],
  ['misread', 'Misread it'],
  ['time', 'Too slow'],
  ['trap', 'Fell for a trap'],
  ['guess', 'Guessed'],
];

// Build a new session description from the route.
async function buildSession(params, query, bank, cur) {
  const s = store.get();
  const kind = params[0];
  const seed = Date.now();
  const base = { id: uid('s'), idx: 0, answers: {}, times: {}, checked: {}, bookmarks: [], startedAt: Date.now(), itemKey: query.item || null, from: query.from || null };
  if (kind === 'item') {
    const key = params[1];
    const it = cur.sequence.find((x) => x.key === key);
    if (!it) throw new Error('This practice item no longer exists.');
    let qids;
    if (it.k === 'checkpoint') {
      qids = it.section && it.n >= 20 ? sectionSet(bank, s, it.section, { seed }) : selectSet(bank, s, { topics: it.topics || undefined, section: it.section || undefined, n: it.n, d: [1, 4], seed });
    } else {
      qids = selectSet(bank, s, { topic: it.type === 'RC' ? undefined : it.topic, type: it.type, n: it.n, d: it.d, passages: it.passages, seed });
    }
    const title = it.title || cur.lessons[it.topic]?.title || 'Practice';
    const targetSum = qids.reduce((a, id) => a + (bank.questions.get(id)?.timeTarget || 120), 0);
    return { ...base, title, itemKey: key, timed: !!it.timed, qids, limit: it.timed ? (it.k === 'checkpoint' && it.n >= 20 ? 45 * 60 : Math.round(targetSum * 1.05)) : null, routeKey: `item:${key}` };
  }
  if (kind === 'topic') {
    const topic = params[1];
    const m = topicStats(bank, s)[topic]?.mastery ?? 35;
    const lvl = Math.max(1, Math.min(5, Math.round(1 + m / 25)));
    const isGroup = topic.startsWith('v-rc') || topic === 'd-msr';
    const qids = isGroup ? selectSet(bank, s, { type: topic === 'd-msr' ? 'MSR' : 'RC', passages: 2, seed }) : selectSet(bank, s, { topic, n: 8, d: [Math.max(1, lvl - 1), Math.min(5, lvl + 1)], seed });
    return { ...base, title: `Practice: ${cur.lessons[topic]?.title || topic}`, timed: false, qids, routeKey: `topic:${topic}` };
  }
  if (kind === 'smart') {
    const n = query.item?.startsWith('review:week') ? 12 : 10;
    let qids = query.item?.startsWith('review:week') ? [...redoSet(bank, s, { n: 5 }), ...smartSet(bank, s, cur, { n: 7, seed })] : smartSet(bank, s, cur, { n, seed, section: query.section || null });
    qids = Array.from(new Set(qids));
    return { ...base, title: query.item?.startsWith('review:week') ? 'Weekly review' : 'Smart practice', timed: false, qids, routeKey: `smart:${query.item || ''}` };
  }
  if (kind === 'redo') return { ...base, title: 'Redo your mistakes', timed: false, redo: true, qids: redoSet(bank, s, { n: 10 }), routeKey: 'redo' };
  if (kind === 'section') {
    const sec = params[1];
    return { ...base, title: `Section test: ${SECTION_NAMES[sec]}`, timed: true, qids: sectionSet(bank, s, sec, { seed }), limit: 45 * 60, routeKey: `section:${sec}:${query.item || ''}` };
  }
  if (kind === 'custom') {
    const d = query.d ? query.d.split('-').map(Number) : null;
    const qids = selectSet(bank, s, { section: query.section || undefined, topic: query.topic || undefined, type: query.type || undefined, n: Number(query.n) || 10, d, passages: query.type === 'RC' || query.type === 'MSR' ? Math.max(1, Math.round((Number(query.n) || 6) / 3.5)) : undefined, seed });
    const lim = qids.reduce((a, id) => a + (bank.questions.get(id)?.timeTarget || 120), 0);
    return { ...base, title: 'Custom set', timed: query.timed === '1', limit: query.timed === '1' ? lim : null, qids, routeKey: `custom:${location.hash}` };
  }
  if (kind === 'review') {
    const past = s.sessions.find((x) => x.id === params[1]);
    if (!past) throw new Error('Session not found.');
    return { ...base, title: `Review: ${past.title}`, reviewOnly: true, qids: past.qids, answers: past.answers || {}, routeKey: `review:${past.id}` };
  }
  throw new Error('Unknown practice type.');
}

export async function render({ view, params, query, setTop, focusMode }) {
  const [bank, cur, coach] = await Promise.all([content.bank(), content.curriculum(), content.coach()]);
  const s = store.get();
  let sess = s.activeSession;
  const want = params[0] === 'resume' ? sess?.routeKey : null;
  if (!(sess && !sess.finished && (want || sess.routeKey === routeKeyGuess(params, query)))) {
    sess = await buildSession(params, query, bank, cur);
  }
  if (!sess.qids.length) {
    setTop({ title: 'Practice', back: '#/practice' });
    view.innerHTML = `<div class="empty">${icon('practice')}<h2>Nothing to practise here yet</h2><p class="muted">${params[0] === 'redo' ? 'Your mistake log is clear. That is a great sign.' : params[0] === 'smart' ? 'Finish your first topic lesson and smart practice unlocks, aimed at your weakest spots.' : 'No questions match this set yet.'}</p><a class="btn primary" href="${query.item ? '#/today' : '#/practice'}">Back</a></div>`;
    if (query.item && params[0] !== 'custom') {
      view.insertAdjacentHTML('beforeend', `<div style="text-align:center"><button class="btn ghost" data-skipdone>Mark today's item done</button></div>`);
      view.querySelector('[data-skipdone]').addEventListener('click', () => {
        store.markDone(query.item, 0);
        location.hash = '#/today';
      });
    }
    return;
  }
  if (sess.reviewOnly) return renderSummary({ view, sess, bank, setTop, focusMode, cur, coach, readOnly: true });
  store.update((x) => (x.activeSession = sess));
  focusMode(true);

  let qStart = Date.now();
  let tick = null;
  const save = () => store.update((x) => (x.activeSession = sess));
  const elapsedTotal = () => Object.values(sess.times).reduce((a, b) => a + b, 0) + (Date.now() - qStart) / 1000;

  const finish = () => {
    clearInterval(tick);
    sess.finished = true;
    sess.endedAt = Date.now();
    const correct = sess.qids.filter((id) => sess.checked[id] && isCorrect(bank.questions.get(id), sess.answers[id])).length;
    const secs = Object.values(sess.times).reduce((a, b) => a + b, 0);
    store.update((x) => {
      x.sessions.push({ id: sess.id, title: sess.title, date: new Date().toISOString().slice(0, 10), qids: sess.qids, answers: sess.answers, correct, total: sess.qids.length, secs: Math.round(secs), timed: sess.timed, itemKey: sess.itemKey });
      if (x.sessions.length > 400) x.sessions = x.sessions.slice(-400);
      x.activeSession = null;
    }, true);
    store.logMinutes(Math.max(1, secs / 60));
    if (sess.itemKey) store.markDone(sess.itemKey, Math.round(secs / 60));
    if (query.item && query.item !== sess.itemKey) store.markDone(query.item, 0);
    checkAchievements(coach, cur);
    renderSummary({ view, sess, bank, setTop, focusMode, cur, coach });
  };

  const commit = (id) => {
    // Record the attempt once per question.
    if (sess.checked[id]) return;
    const q = bank.questions.get(id);
    const secs = (Date.now() - qStart) / 1000;
    sess.times[id] = (sess.times[id] || 0) + secs;
    qStart = Date.now();
    sess.checked[id] = true;
    store.recordAttempt({ qid: id, correct: isCorrect(q, sess.answers[id]), secs: sess.times[id], mode: sess.redo ? 'redo' : sess.timed ? 'timed' : 'learn', sid: sess.id, answer: sess.answers[id] });
    save();
  };

  const paint = () => {
    const id = sess.qids[sess.idx];
    const q = bank.questions.get(id);
    const stim = q.stimulusId ? bank.stimuli.get(q.stimulusId) : null;
    const checked = !!sess.checked[id] && !sess.timed;
    const ans = sess.answers[id] ?? null;
    const bm = sess.bookmarks.includes(id);
    const last = sess.idx === sess.qids.length - 1;
    view.className = 'wide immersive';
    view.innerHTML = `
      <div class="player-top" style="margin:0 -16px">
        <button class="icon-btn" data-exit aria-label="Exit">${icon('close')}</button>
        <div class="ptitle">${esc(sess.title)}</div>
        <span class="count">${sess.idx + 1}/${sess.qids.length}</span>
        <button class="timer" data-timer aria-label="Timer"></button>
      </div>
      <div class="player-progress" style="margin:0 -16px"><span style="width:${(sess.idx / sess.qids.length) * 100}%"></span></div>
      <div id="qhost">${renderQuestion(q, stim, { answer: ans, reveal: checked, showMeta: !sess.timed, header: `<div class="faint" style="margin-bottom:8px">${esc(TYPE_NAMES[q.type])}</div>` })}</div>
      <div id="exhost">${checked ? renderExplanation(q, ans) + reasonPicker(id, q, ans) : ''}</div>
      <div class="action-bar">
        <button class="btn icon-only${bm ? ' bookmarked' : ''}" data-bm aria-label="${bm ? 'Remove bookmark' : 'Bookmark'}">${icon('bookmark')}</button>
        ${sess.timed || checked ? `<button class="btn primary" data-next ${!sess.timed || isComplete(q, ans) ? '' : 'disabled'}>${last ? 'Finish' : 'Next'}</button>` : `<button class="btn primary" data-check ${isComplete(q, ans) ? '' : 'disabled'}>Check answer</button>`}
      </div>`;
    const host = view.querySelector('#qhost');
    bindQuestion(host, q, () => sess.answers[id], (a) => {
      sess.answers[id] = a;
      save();
      const btn = view.querySelector('[data-check], [data-next]');
      if (btn) btn.disabled = !isComplete(q, a);
    });
    updateTimer();
  };

  const updateTimer = () => {
    const t = view.querySelector('[data-timer]');
    if (!t) return;
    const id = sess.qids[sess.idx];
    const q = bank.questions.get(id);
    if (sess.limit) {
      const left = sess.limit - elapsedTotal();
      t.textContent = fmtClock(left);
      t.className = `timer${left < 300 ? ' warn' : ''}${left <= 0 ? ' over' : ''}`;
      if (left <= 0 && !sess.finished) {
        toast('Time is up.');
        for (const qid of sess.qids) if (!sess.checked[qid]) sess.checked[qid] = true;
        finish();
      }
    } else {
      const spent = sess.checked[id] && !sess.timed ? sess.times[id] || 0 : (sess.times[id] || 0) + (Date.now() - qStart) / 1000;
      t.textContent = fmtClock(spent);
      t.className = `timer${spent > q.timeTarget ? ' warn' : ''}${spent > q.timeTarget * 1.6 ? ' over' : ''}`;
      t.title = `Target about ${fmtClock(q.timeTarget)}`;
    }
  };

  const onClick = (e) => {
    if (e.target.closest('[data-check]')) {
      commit(sess.qids[sess.idx]);
      paint();
      const ex = view.querySelector('#exhost');
      ex && ex.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (e.target.closest('[data-next]')) {
      const id = sess.qids[sess.idx];
      if (sess.timed) commit(id);
      if (sess.idx >= sess.qids.length - 1) return finish();
      sess.idx++;
      qStart = Date.now();
      save();
      paint();
      window.scrollTo(0, 0);
      return;
    }
    if (e.target.closest('[data-bm]')) {
      const id = sess.qids[sess.idx];
      const i = sess.bookmarks.indexOf(id);
      if (i >= 0) sess.bookmarks.splice(i, 1);
      else sess.bookmarks.push(id);
      store.update((x) => {
        const j = x.bookmarks.indexOf(id);
        if (i >= 0 && j >= 0) x.bookmarks.splice(j, 1);
        else if (i < 0 && j < 0) x.bookmarks.push(id);
      });
      save();
      paint();
      return;
    }
    const r = e.target.closest('[data-reason]');
    if (r) {
      const id = r.dataset.qid;
      store.update((x) => x.errors[id] && (x.errors[id].reason = r.dataset.reason));
      for (const b of view.querySelectorAll(`[data-reason][data-qid="${id}"]`)) b.classList.toggle('on', b === r);
      return;
    }
    if (e.target.closest('[data-exit]')) {
      clearInterval(tick);
      toast('Saved. You can pick this up from Practice.');
      location.hash = sess.from || (query.item ? '#/today' : '#/practice');
    }
  };
  view.addEventListener('click', onClick);
  tick = setInterval(updateTimer, 1000);
  paint();
  return () => {
    clearInterval(tick);
    view.removeEventListener('click', onClick);
    focusMode(false);
  };
}

function routeKeyGuess(params, query) {
  const k = params[0];
  if (k === 'item') return `item:${params[1]}`;
  if (k === 'topic') return `topic:${params[1]}`;
  if (k === 'smart') return `smart:${query.item || ''}`;
  if (k === 'redo') return 'redo';
  if (k === 'section') return `section:${params[1]}:${query.item || ''}`;
  return null;
}

export function reasonPicker(id, q, ans) {
  if (isCorrect(q, ans)) return '';
  const cur = store.get().errors[id]?.reason;
  return `<div class="reason-pick card flat"><strong>Why did this one get away?</strong> <span class="faint">One tap. It goes into your mistake log.</span>
    <div class="chips">${REASONS.map(([k, l]) => `<button class="chip${cur === k ? ' on' : ''}" data-reason="${k}" data-qid="${esc(id)}">${l}</button>`).join('')}</div></div>`;
}

function renderSummary({ view, sess, bank, setTop, focusMode, cur, coach, readOnly = false }) {
  focusMode(false);
  view.className = '';
  const qs = sess.qids.map((id) => bank.questions.get(id)).filter(Boolean);
  const correct = qs.filter((q) => isCorrect(q, sess.answers[q.id])).length;
  const secs = Object.values(sess.times || {}).reduce((a, b) => a + b, 0);
  const pctC = Math.round((correct / qs.length) * 100);
  const backTo = sess.from || (sess.itemKey || sess.reviewOnly ? (sess.reviewOnly ? '#/progress' : '#/today') : '#/practice');
  setTop({ title: readOnly ? 'Session review' : 'Results', back: backTo });
  const msg = readOnly ? '' : pctC >= 80 ? 'Excellent. This topic is getting solid.' : pctC >= 60 ? 'Good work. Review the misses below and they will stick.' : (coach.afterBadSession?.[0] || 'Tough set. That is exactly where learning happens. Review each miss slowly.');
  view.innerHTML = `
    ${readOnly ? '' : `<div class="card ${pctC >= 60 ? 'good' : 'tint'}" style="text-align:center;margin-top:12px">
      <div class="ring" style="--p:${pctC};--size:96px;margin:4px auto 10px"><span style="font-size:22px">${correct}/${qs.length}</span></div>
      <h2>${esc(sess.title)}</h2>
      <p class="muted" style="margin-bottom:4px">${esc(msg)}</p>
      <p class="faint" style="margin:0">${fmtMinutes(Math.max(1, secs / 60))} · average ${fmtClock(secs / qs.length)} per question</p>
    </div>`}
    <div class="section-title"><h2>Question by question</h2></div>
    <div class="list">${qs
      .map((q, i) => {
        const ok = isCorrect(q, sess.answers[q.id]);
        const t = sess.times?.[q.id];
        return `<details class="card flat" style="margin:0"><summary style="cursor:pointer;display:flex;gap:10px;align-items:center;list-style:none">
          <span class="chip ${ok ? 'green' : 'red'}">${ok ? icon('check') : '✕'} ${i + 1}</span>
          <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(TYPE_NAMES[q.type])} · Level ${q.difficulty}</span>
          ${t ? `<span class="faint">${fmtClock(t)}</span>` : ''}</summary>
          <div class="rev" data-qid="${esc(q.id)}"></div></details>`;
      })
      .join('')}</div>
    <div class="btn-row" style="margin-top:18px">
      <a class="btn primary" href="${backTo}">${sess.itemKey ? 'Back to today' : 'Done'}</a>
      ${correct < qs.length && !readOnly ? '<a class="btn" href="#/session/redo">Redo my mistakes</a>' : ''}
    </div>`;
  view.addEventListener('toggle', (e) => {
    const d = e.target;
    if (!(d instanceof HTMLDetailsElement) || !d.open) return;
    const host = d.querySelector('.rev');
    if (!host || host.dataset.done) return;
    const q = bank.questions.get(host.dataset.qid);
    const stim = q.stimulusId ? bank.stimuli.get(q.stimulusId) : null;
    host.innerHTML = renderQuestion(q, stim, { answer: sess.answers[q.id] ?? null, reveal: true }) + renderExplanation(q, sess.answers[q.id] ?? null) + reasonPicker(q.id, q, sess.answers[q.id] ?? null);
    host.dataset.done = '1';
    bindQuestion(host, q, () => null, () => {});
  }, true);
  view.addEventListener('click', (e) => {
    const r = e.target.closest('[data-reason]');
    if (!r) return;
    store.update((x) => x.errors[r.dataset.qid] && (x.errors[r.dataset.qid].reason = r.dataset.reason));
    for (const b of view.querySelectorAll(`[data-reason][data-qid="${r.dataset.qid}"]`)) b.classList.toggle('on', b === r);
  });
}
