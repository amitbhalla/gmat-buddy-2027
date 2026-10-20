// Learn: one unit at a time, with the big-picture concept map and the lesson list.
import * as store from '../store.js';
import * as content from '../content.js';
import { icon } from '../icons.js';
import { esc, fmtMinutes } from '../util.js';
import { renderDiagrams, lessonOutline } from '../md.js';

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

export async function render({ view, setTop, query, desktop }) {
  const cur = await content.curriculum();
  const s = store.get();
  const units = cur.units;
  let unitId = query.unit && units.some((u) => u.id === query.unit) ? query.unit : s.lastUnit || 'start';

  let selected = query.lesson || null;
  const paint = async () => (desktop ? paintDesktop() : paintMobile());

  // Desktop: master (units + lessons) on the left, the chosen lesson's overview on the right.
  const paintDesktop = async () => {
    const unit = units.find((u) => u.id === unitId);
    const lessons = unit.lessons.map((id) => cur.lessons[id]).filter(Boolean);
    const doneN = lessons.filter((l) => s.lessons[l.id]?.completedAt).length;
    const nextL = lessons.find((l) => !s.lessons[l.id]?.completedAt) || lessons[0];
    if (!selected || !lessons.some((l) => l.id === selected)) selected = nextL.id;
    const meta = cur.lessons[selected];
    const md = await content.lessonMarkdown(selected).catch(() => '');
    const outline = lessonOutline(md).filter((h) => !/^(key takeaways|go deeper)/i.test(h));
    const firstImg = (md.match(/!\[[^\]]*\]\((img\/gen\/[^)]+)\)/) || [])[1];
    const st = s.lessons[selected] || {};
    const map = await mapSource(unit.id);
    view.innerHTML = `
      <div class="learn-desk">
        <nav class="unit-nav" aria-label="Units">
          <h1 style="font-size:24px;margin:0 0 14px">Learn</h1>
          ${units.map((u) => {
            const ls = u.lessons.filter((id) => cur.lessons[id]);
            const d = ls.filter((id) => s.lessons[id]?.completedAt).length;
            return `<button class="unit-btn${u.id === unitId ? ' on' : ''}" data-unit="${u.id}"><span>${esc(u.title)}</span><span class="faint">${d}/${ls.length}</span></button>`;
          }).join('')}
        </nav>
        <section class="lesson-col">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"><h2 style="margin:0">${esc(unit.title)}</h2><span class="faint">${doneN} of ${lessons.length} done</span></div>
          <p class="muted small" style="margin:4px 0 12px">${esc(UNIT_BLURB[unit.id] || '')}</p>
          <div class="list compact-list">${lessons.map((l, i) => {
            const done = !!s.lessons[l.id]?.completedAt;
            return `<button class="item${l.id === selected ? ' picked' : ''}" data-pick="${l.id}" style="width:100%;text-align:left">
              <div class="ic ${done ? 'green' : 'blue'}" style="width:34px;height:34px">${done ? icon('check') : `<strong>${i + 1}</strong>`}</div>
              <div class="body"><div class="t">${esc(l.title)}</div></div>
              ${l.id === nextL.id && !done ? '<span class="chip indigo">Next</span>' : `<span class="faint">${fmtMinutes(l.minutes)}</span>`}</button>`;
          }).join('')}</div>
        </section>
        <section class="detail-col">
          <div class="panel">
            ${firstImg ? `<img class="cover slim" src="${firstImg}" alt="" onerror="this.remove()">` : `<img class="cover slim" src="img/gen/unit-${unit.id}.jpg" alt="" onerror="this.remove()">`}
            <div class="chips" style="margin-bottom:8px"><span class="chip indigo">${esc(unit.title)}</span><span class="chip">${fmtMinutes(meta.minutes)}</span>${st.completedAt ? '<span class="chip green">Completed</span>' : st.step ? `<span class="chip amber">In progress · step ${st.step + 1}</span>` : ''}</div>
            <h2 style="font-size:26px;margin:0 0 6px">${esc(meta.title)}</h2>
            <p class="muted">${esc(meta.summary || '')}</p>
            ${outline.length ? `<div class="faint" style="margin:14px 0 6px">${outline.length} short steps</div><ol class="outline">${outline.map((h) => `<li>${esc(h)}</li>`).join('')}</ol>` : ''}
            <div class="btn-row">
              <a class="btn primary" href="#/lesson/${meta.id}">${icon('play')} ${st.completedAt ? 'Read again' : st.step ? 'Continue' : 'Start lesson'}</a>
              ${meta.topic ? `<a class="btn" href="#/session/topic/${meta.topic}">${icon('practice')} Practise this topic</a>` : ''}
            </div>
          </div>
          ${map ? `<div class="panel"><h3 style="margin-top:0">The big picture</h3><p class="faint" style="margin-top:-2px">How the ${esc(unit.title)} lessons connect.</p><div class="map-host"><pre><code class="language-mermaid">${esc(map)}</code></pre></div></div>` : ''}
        </section>
      </div>`;
    const host = view.querySelector('.map-host');
    if (host) renderDiagrams(host);
  };

  const paintMobile = async () => {
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
      ${map ? `<details class="card flat" ${doneN === 0 || matchMedia('(min-width: 1100px)').matches ? 'open' : ''}><summary style="cursor:pointer;font-weight:650">The big picture: how this unit fits together</summary><div class="map-host" style="margin-top:10px"><pre><code class="language-mermaid">${esc(map)}</code></pre></div></details>` : ''}
      <div class="list lesson-grid" style="margin-top:12px">
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
    const pk = e.target.closest('[data-pick]');
    if (pk) {
      selected = pk.dataset.pick;
      return paint();
    }
    const u = e.target.closest('[data-unit]');
    if (u) {
      unitId = u.dataset.unit;
      selected = null;
      store.update((st) => (st.lastUnit = unitId));
      paint();
    }
  };
  view.addEventListener('click', onClick);
  await paint();
  return () => view.removeEventListener('click', onClick);
}
