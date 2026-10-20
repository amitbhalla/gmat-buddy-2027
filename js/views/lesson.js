// Lesson reader: bite-sized steps (one section per screen) with an optional full-page mode.
import * as store from '../store.js';
import * as content from '../content.js';
import { renderLesson, renderDiagrams } from '../md.js';
import { icon } from '../icons.js';
import { esc, fmtMinutes, todayStr, toast } from '../util.js';
import { checkAchievements, sectionLabel } from './common.js';

// Split markdown into steps: intro (H1 + text before first H2), then one step per H2.
// "Key takeaways" and "Go deeper" are merged into a single closing step.
export function splitSteps(md) {
  const lines = md.split('\n');
  const steps = [];
  let curStep = { title: 'Introduction', lines: [] };
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) inFence = !inFence;
    if (!inFence && /^## /.test(line)) {
      steps.push(curStep);
      curStep = { title: line.replace(/^## /, '').trim(), lines: [line] };
    } else curStep.lines.push(line);
  }
  steps.push(curStep);
  const out = steps.filter((st) => st.lines.join('').trim());
  const closing = out.filter((st) => /^(key takeaways|go deeper)/i.test(st.title));
  const main = out.filter((st) => !/^(key takeaways|go deeper)/i.test(st.title));
  if (closing.length) main.push({ title: 'Wrap-up', lines: closing.flatMap((c) => c.lines) });
  return main.map((st) => ({ title: st.title, md: st.lines.join('\n') }));
}

export async function render({ view, params, query, setTop, desktop }) {
  const id = params[0];
  const cur = await content.curriculum();
  const meta = cur.lessons[id];
  if (!meta) throw new Error('Lesson not found.');
  const md = await content.lessonMarkdown(id);
  const coach = await content.coach();
  const steps = splitSteps(md);
  const s = store.get();
  const st = (s.lessons[id] ||= {});
  if (!st.openedAt) store.update((x) => (x.lessons[id] = { ...st, openedAt: new Date().toISOString() }));
  let step = Math.min(st.step || 0, steps.length - 1);
  let all = !!s.settings.lessonAllMode;
  const opened = Date.now();
  const back = query.from || (query.item ? '#/today' : `#/learn?unit=${unitOf(cur, id)}`);
  setTop({ title: meta.title, back, actions: `<button class="icon-btn" data-mode aria-label="${all ? 'Show in steps' : 'Show full lesson'}" title="${all ? 'Steps' : 'Full page'}">${icon(all ? 'cards' : 'list')}</button>` });

  const topicDrill = meta.topic ? `#/session/topic/${meta.topic}?from=${encodeURIComponent(`#/lesson/${id}`)}` : null;
  const doneAlready = !!st.completedAt;

  const finishHtml = () => `
    <div class="lesson-end">
      <h2>Nice work.</h2>
      <p class="muted">${doneAlready ? 'You finished this lesson before. Reviewing is how it sticks.' : 'Mark it complete and the plan moves on. The best next step is a few questions while it is fresh.'}</p>
      <div class="btn-row">
        <button class="btn primary" data-complete>${icon('check')} ${doneAlready ? 'Done' : 'Mark complete'}</button>
        ${topicDrill ? `<a class="btn" href="${topicDrill}">${icon('practice')} Practise this topic</a>` : ''}
      </div>
      <details class="card flat" style="margin-top:16px"><summary style="cursor:pointer;font-weight:650">My notes on this lesson</summary>
        <textarea id="notes" placeholder="Write the one thing you want to remember, in your own words." style="margin-top:10px">${esc(s.notes[id] || '')}</textarea>
      </details>
    </div>`;

  const paint = () => {
    const pct = all ? 100 : Math.round(((step + 1) / steps.length) * 100);
    const head = `<div class="lesson-head"><div class="chips"><span class="chip indigo">${esc(sectionLabel(meta.section))}</span><span class="chip">${fmtMinutes(meta.minutes)}</span>${doneAlready ? '<span class="chip green">Completed</span>' : ''}</div></div>`;
    if (all) {
      view.innerHTML = `${head}<article class="prose read">${renderLesson(md)}</article>${finishHtml()}`;
    } else {
      const last = step === steps.length - 1;
      view.innerHTML = `${head}
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <div class="bar" style="flex:1"><span style="width:${pct}%"></span></div>
          <span class="faint">Step ${step + 1} of ${steps.length}</span>
        </div>
        <article class="prose read step-body">${renderLesson(steps[step].md)}</article>
        ${last ? finishHtml() : `<p class="faint up-next">Up next: ${esc(steps[step + 1].title)}</p>`}
        <div style="height:24px"></div>
        <div class="action-bar">
          <button class="btn" data-prev ${step === 0 ? 'disabled' : ''}>Back</button>
          ${last ? `<button class="btn primary" style="flex:2" data-complete>${doneAlready ? 'Back to plan' : 'Finish lesson'}</button>` : `<button class="btn primary" style="flex:2" data-next>Next ${icon('chevron')}</button>`}
        </div>`;
    }
    if (desktop) wrapDesktop();
    renderDiagrams(view);
    const notes = view.querySelector('#notes');
    if (notes) notes.addEventListener('input', () => store.update((x) => (x.notes[id] = notes.value)));
  };

  // Desktop: reading column + a sidebar with every step (the whole lesson at a glance) and notes always open.
  const wrapDesktop = () => {
    const toc = `<aside class="lesson-toc"><div class="panel" style="padding:16px 14px">
        <div class="eyebrow" style="padding:0 12px">${all ? 'Sections' : `Step ${step + 1} of ${steps.length}`}</div>
        <ol>${steps.map((st, i) => `<li class="${!all && i === step ? 'on' : ''}${!all && i < step ? ' done' : ''}"><button data-goto="${i}">${i + 1}. ${esc(st.title)}</button></li>`).join('')}</ol>
      </div>
      <div class="panel" style="padding:16px">
        <div class="eyebrow">My notes</div>
        <textarea id="notes" placeholder="The one thing to remember, in your own words." style="min-height:140px">${esc(store.get().notes[id] || '')}</textarea>
        <p class="faint" style="margin:6px 0 0">Saved automatically.</p>
      </div></aside>`;
    // Notes live in the sidebar on desktop; drop the duplicate at the end of the lesson.
    view.querySelector('.lesson-end details')?.remove();
    const nodes = Array.from(view.childNodes).filter((n) => !(n.classList && n.classList.contains('action-bar')));
    const col = document.createElement('div');
    col.className = 'lesson-main';
    nodes.forEach((n) => col.appendChild(n));
    const grid = document.createElement('div');
    grid.className = 'lesson-layout';
    grid.appendChild(col);
    grid.insertAdjacentHTML('beforeend', toc);
    view.prepend(grid);
    const bar = view.querySelector('.action-bar');
    if (bar) {
      bar.classList.add('inline-bar');
      col.appendChild(bar);
    }
  };

  const go = (n) => {
    step = Math.max(0, Math.min(steps.length - 1, n));
    store.update((x) => ((x.lessons[id] ||= {}).step = step));
    paint();
    window.scrollTo(0, 0);
  };

  const complete = () => {
    const mins = Math.max(3, Math.min(meta.minutes * 1.5, (Date.now() - opened) / 60000));
    if (!store.get().lessons[id]?.completedAt) {
      store.update((x) => {
        x.lessons[id] = { ...(x.lessons[id] || {}), completedAt: new Date().toISOString(), step: 0 };
      }, true);
      store.markDone(`lesson:${id}`, Math.round(mins));
      if (query.item && query.item !== `lesson:${id}`) store.markDone(query.item, 0);
      store.logMinutes(mins);
      toast('Lesson complete. Well done.', { kind: 'good' });
      checkAchievements(coach, cur);
    }
    location.hash = query.item ? '#/today' : topicDrill ? `#/learn?unit=${unitOf(cur, id)}` : '#/today';
  };

  const onClick = (e) => {
    const g = e.target.closest('[data-goto]');
    if (g) {
      if (all) {
        const h = Array.from(view.querySelectorAll('.prose h2'))[Number(g.dataset.goto) - 1];
        if (h) h.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      return go(Number(g.dataset.goto));
    }
    if (e.target.closest('[data-next]')) return go(step + 1);
    if (e.target.closest('[data-prev]')) return go(step - 1);
    if (e.target.closest('[data-complete]')) return complete();
  };
  const onTop = (e) => {
    if (e.target.closest('[data-mode]')) {
      all = !all;
      store.update((x) => (x.settings.lessonAllMode = all));
      setTop({ title: meta.title, back, actions: `<button class="icon-btn" data-mode aria-label="${all ? 'Show in steps' : 'Show full lesson'}">${icon(all ? 'cards' : 'list')}</button>` });
      paint();
    }
  };
  const onKey = (e) => {
    if (all || e.target.closest('textarea, input')) return;
    if (e.key === 'ArrowRight') go(step + 1);
    if (e.key === 'ArrowLeft') go(step - 1);
  };
  view.addEventListener('click', onClick);
  document.getElementById('topbar').addEventListener('click', onTop);
  document.addEventListener('keydown', onKey);
  view.className = 'immersive';
  paint();
  return () => {
    view.removeEventListener('click', onClick);
    document.getElementById('topbar').removeEventListener('click', onTop);
    document.removeEventListener('keydown', onKey);
    const extra = (Date.now() - opened) / 60000;
    // Time spent reviewing without completing still counts (capped).
    if (store.get().lessons[id]?.completedAt && !doneAlready) return;
    if (extra > 1) store.logMinutes(Math.min(extra, meta.minutes * 1.5));
  };
}

function trimTitle(t) {
  return t.length > 28 ? t.slice(0, 26) + '…' : t;
}

function unitOf(cur, id) {
  return cur.units.find((u) => u.lessons.includes(id))?.id || 'start';
}
