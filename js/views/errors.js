// Mistake log: every miss, why it happened, a one-line fix, and a redo button.
import * as store from '../store.js';
import * as content from '../content.js';
import { renderQuestion, renderExplanation, bindQuestion } from '../qview.js';
import { icon } from '../icons.js';
import { esc, fmtDate, todayStr, TYPE_NAMES, SECTION_NAMES } from '../util.js';
import { REASONS } from './session.js';

export async function render({ view, setTop }) {
  setTop({ title: 'Mistake log', back: '#/practice' });
  const bank = await content.bank();
  const cur = await content.curriculum();
  let filter = 'open';
  let reason = 'all';

  const paint = () => {
    const s = store.get();
    const all = Object.entries(s.errors).filter(([id]) => bank.questions.has(id)).map(([id, e]) => ({ id, e, q: bank.questions.get(id) }));
    const open = all.filter((x) => !x.e.resolved);
    let list = filter === 'open' ? open : all.filter((x) => x.e.resolved);
    if (reason !== 'all') list = list.filter((x) => (x.e.reason || 'untagged') === reason);
    list.sort((a, b) => (b.e.lastWrong || b.e.at).localeCompare(a.e.lastWrong || a.e.at));
    const counts = {};
    for (const x of open) counts[x.e.reason || 'untagged'] = (counts[x.e.reason || 'untagged'] || 0) + 1;
    view.innerHTML = `
      <h1 style="margin-top:8px">Mistake log</h1>
      <p class="muted">Mistakes are the most valuable thing you own right now. Each one here comes back on a spaced schedule until you get it right.</p>
      ${open.length ? `<a class="btn primary block" href="#/session/redo">${icon('refresh')} Redo ${Math.min(10, open.length)} mistakes now</a>` : ''}
      <div class="seg" style="margin:16px 0 10px"><button data-filter="open" class="${filter === 'open' ? 'on' : ''}">To fix (${open.length})</button><button data-filter="fixed" class="${filter === 'fixed' ? 'on' : ''}">Fixed (${all.length - open.length})</button></div>
      ${filter === 'open' && open.length ? `<div class="chips" style="margin-bottom:12px"><button class="chip${reason === 'all' ? ' on' : ''}" data-reason-f="all">All</button>${[...REASONS, ['untagged', 'Not tagged']].filter(([k]) => counts[k]).map(([k, l]) => `<button class="chip${reason === k ? ' on' : ''}" data-reason-f="${k}">${l} · ${counts[k]}</button>`).join('')}</div>` : ''}
      ${list.length ? `<div class="list">${list.map(({ id, e, q }) => `
        <details class="card flat" style="margin:0" data-id="${esc(id)}">
          <summary style="cursor:pointer;list-style:none;display:flex;gap:12px;align-items:center">
            <div class="ic ${e.resolved ? 'green' : 'red'}" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:var(--${e.resolved ? 'green' : 'red'}-soft);color:var(--${e.resolved ? 'green' : 'red'})">${icon(e.resolved ? 'check' : 'refresh')}</div>
            <div style="flex:1;min-width:0"><div style="font-weight:650">${esc(topicName(cur, q.topic))}</div><div class="faint">${esc(TYPE_NAMES[q.type])} · Level ${q.difficulty} · ${fmtDate(e.lastWrong || e.at)}${e.reason ? ` · ${esc(REASONS.find((r) => r[0] === e.reason)?.[1] || '')}` : ''}</div></div>
          </summary>
          <div class="err-body"></div>
        </details>`).join('')}</div>` : `<div class="empty"><img src="img/gen/empty-errors.jpg" alt="" style="max-width:240px;border-radius:16px;margin:0 auto 12px;display:block" onerror="this.remove()"><h2>${filter === 'open' ? 'Nothing to fix' : 'Nothing fixed yet'}</h2><p class="muted">${filter === 'open' ? 'Every question you miss lands here so you can turn it into a point next time.' : 'Redo a mistake correctly and it moves here.'}</p></div>`}`;
  };

  const onToggle = (e) => {
    const d = e.target;
    if (!(d instanceof HTMLDetailsElement) || !d.open || !d.dataset.id) return;
    const host = d.querySelector('.err-body');
    if (host.dataset.done) return;
    const id = d.dataset.id;
    const q = bank.questions.get(id);
    const st = store.get();
    const last = [...st.attempts].reverse().find((a) => a.qid === id && !a.correct);
    const stim = q.stimulusId ? bank.stimuli.get(q.stimulusId) : null;
    const er = st.errors[id];
    host.innerHTML = `<div style="margin-top:12px">${renderQuestion(q, stim, { answer: last?.answer ?? null, reveal: true })}${renderExplanation(q, last?.answer ?? null)}
      <div class="chips" style="margin:10px 0">${REASONS.map(([k, l]) => `<button class="chip${er.reason === k ? ' on' : ''}" data-reason="${k}" data-qid="${esc(id)}">${l}</button>`).join('')}</div>
      <label class="field"><span>My one-line fix</span><input type="text" data-note="${esc(id)}" value="${esc(er.note || '')}" placeholder="e.g. Always test negative numbers in yes/no DS"></label>
      <div class="btn-row"><button class="btn sm" data-resolve="${esc(id)}">${er.resolved ? 'Move back to "to fix"' : 'I have got this now'}</button></div></div>`;
    host.dataset.done = '1';
    bindQuestion(host, q, () => null, () => {});
  };
  const onClick = (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) {
      filter = f.dataset.filter;
      reason = 'all';
      return paint();
    }
    const rf = e.target.closest('[data-reason-f]');
    if (rf) {
      reason = rf.dataset.reasonF;
      return paint();
    }
    const r = e.target.closest('[data-reason]');
    if (r) {
      store.update((x) => (x.errors[r.dataset.qid].reason = r.dataset.reason));
      for (const b of view.querySelectorAll(`[data-reason][data-qid="${r.dataset.qid}"]`)) b.classList.toggle('on', b === r);
      return;
    }
    const res = e.target.closest('[data-resolve]');
    if (res) {
      store.update((x) => {
        const er = x.errors[res.dataset.resolve];
        er.resolved = !er.resolved;
        er.resolvedAt = er.resolved ? todayStr() : null;
      }, true);
      paint();
    }
  };
  const onInput = (e) => {
    const n = e.target.closest('[data-note]');
    if (n) store.update((x) => (x.errors[n.dataset.note].note = n.value));
  };
  view.addEventListener('toggle', onToggle, true);
  view.addEventListener('click', onClick);
  view.addEventListener('input', onInput);
  paint();
  return () => {
    view.removeEventListener('toggle', onToggle, true);
    view.removeEventListener('click', onClick);
    view.removeEventListener('input', onInput);
  };
}

function topicName(cur, t) {
  if (t === 'd-ds') return 'Data Sufficiency';
  return cur.lessons[t]?.title || t;
}
