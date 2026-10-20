// Learn: one unit at a time, with the big-picture concept map and the lesson list.
import * as store from '../store.js';
import * as content from '../content.js';
import { icon } from '../icons.js';
import { esc, fmtMinutes } from '../util.js';
import { renderDiagrams } from '../md.js';

const UNIT_BLURB = {
  start: 'How the GMAT works, how scoring works, and how to study. Start here.',
  quant: 'Arithmetic and algebra, rebuilt from the ground up. No geometry on this exam.',
  verbal: 'Critical Reasoning and Reading Comprehension. Logic you can learn.',
  di: 'Data Sufficiency, tables, graphs, two-part and multi-source questions.',
  strategy: 'Pacing, mocks, mindset and test day in India.',
  admissions: 'From score to admit: schools, essays, interviews and funding.',
};

async function mapSource(unit) {
  try {
    const r = await fetch(`content/maps/${unit}.mmd`);
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
}

export async function render({ view, setTop, query }) {
  const cur = await content.curriculum();
  const s = store.get();
  const units = cur.units;
  let unitId = query.unit && units.some((u) => u.id === query.unit) ? query.unit : s.lastUnit || 'start';

  const paint = async () => {
    const unit = units.find((u) => u.id === unitId);
    const lessons = unit.lessons.map((id) => cur.lessons[id]).filter(Boolean);
    const doneN = lessons.filter((l) => s.lessons[l.id]?.completedAt).length;
    const nextL = lessons.find((l) => !s.lessons[l.id]?.completedAt);
    const map = await mapSource(unit.id);
    view.innerHTML = `
      <h1 style="margin-top:8px">Learn</h1>
      <div class="chips" role="tablist" style="margin:10px 0 16px;overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px">
        ${units.map((u) => `<button class="chip${u.id === unitId ? ' on' : ''}" role="tab" aria-selected="${u.id === unitId}" data-unit="${u.id}" style="white-space:nowrap">${esc(u.title)}</button>`).join('')}
      </div>
      <img class="cover slim" src="img/gen/unit-${unit.id}.jpg" alt="" onerror="this.remove()">
      <h2>${esc(unit.title)}</h2>
      <p class="muted">${esc(UNIT_BLURB[unit.id] || '')}</p>
      <div style="display:flex;align-items:center;gap:12px;margin:4px 0 16px">
        <div class="bar green" style="flex:1"><span style="width:${(doneN / lessons.length) * 100}%"></span></div>
        <span class="faint">${doneN} of ${lessons.length} done</span>
      </div>
      ${map ? `<details class="card flat" ${doneN === 0 ? 'open' : ''}><summary style="cursor:pointer;font-weight:650">The big picture: how this unit fits together</summary><div class="map-host" style="margin-top:10px"><pre><code class="language-mermaid">${esc(map)}</code></pre></div></details>` : ''}
      <div class="list" style="margin-top:12px">
        ${lessons
          .map((l, i) => {
            const st = s.lessons[l.id] || {};
            const done = !!st.completedAt;
            const started = !done && st.step != null;
            const isNext = nextL && l.id === nextL.id;
            return `<a class="item${done ? '' : ''}" href="#/lesson/${l.id}">
              <div class="ic ${done ? 'green' : isNext ? '' : 'blue'}">${done ? icon('check') : `<strong>${i + 1}</strong>`}</div>
              <div class="body"><div class="t">${esc(l.title)}</div><div class="s">${esc(l.summary || '')}</div></div>
              <div class="end">${isNext ? '<span class="chip indigo">Next</span>' : started ? '<span class="chip amber">In progress</span>' : fmtMinutes(l.minutes)}</div>
            </a>`;
          })
          .join('')}
      </div>`;
    const host = view.querySelector('.map-host');
    if (host) {
      const det = host.closest('details');
      if (det.open) renderDiagrams(host);
      else det.addEventListener('toggle', () => det.open && renderDiagrams(host), { once: true });
    }
  };

  const onClick = (e) => {
    const u = e.target.closest('[data-unit]');
    if (u) {
      unitId = u.dataset.unit;
      store.update((st) => (st.lastUnit = unitId));
      paint();
    }
  };
  view.addEventListener('click', onClick);
  await paint();
  return () => view.removeEventListener('click', onClick);
}
