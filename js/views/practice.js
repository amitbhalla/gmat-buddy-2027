// Practice hub: one primary action, a few quick options, a custom builder folded away.
import * as store from '../store.js';
import * as content from '../content.js';
import { dueCards } from '../srs.js';
import { icon } from '../icons.js';
import { esc, todayStr, SECTION_NAMES } from '../util.js';
import { sheet } from './common.js';

const TOPIC_NAMES_FROM = (cur, id) => cur.lessons[id]?.title || id;

export async function render({ view }) {
  const [cur, bank, cards] = await Promise.all([content.curriculum(), content.bank(), content.flashcards()]);
  const s = store.get();
  const today = todayStr();
  const errorsOpen = Object.entries(s.errors).filter(([id, e]) => !e.resolved && bank.questions.has(id)).length;
  const due = dueCards(cards, s.cards, today, { newLimit: s.settings.dailyCards ?? 20 });
  const active = s.activeSession && !s.activeSession.finished ? s.activeSession : null;
  const learnedTopics = Object.keys(s.lessons).filter((id) => s.lessons[id]?.completedAt && cur.lessons[id]?.topic).length;
  const practiceCount = bank.list.filter((q) => q.pool === 'practice').length;

  const primary = active
    ? `<div class="card tint"><div class="eyebrow">In progress</div><h2>${esc(active.title)}</h2><p class="muted">Question ${active.idx + 1} of ${active.qids.length}. Pick up right where you left off.</p><a class="btn primary block" href="#/session/resume">${icon('play')} Resume</a></div>`
    : learnedTopics
      ? `<div class="card tint"><div class="eyebrow">Recommended</div><h2>Smart practice</h2><p class="muted">Ten questions picked from your weakest topics, plus any mistakes that are due for another look.</p><a class="btn primary block" href="#/session/smart">${icon('bolt')} Start</a></div>`
      : `<div class="card tint"><div class="eyebrow">Getting started</div><h2>Your first practice</h2><p class="muted">Finish your first topic lesson and smart practice unlocks. Until then, try a few warm-up questions on number sense.</p><a class="btn primary block" href="#/session/topic/q-arith">${icon('play')} Warm up</a></div>`;

  view.innerHTML = `
    <h1 style="margin-top:8px">Practice</h1>
    <p class="muted">${practiceCount} practice questions, plus a separate pool kept fresh for your mocks.</p>
    ${primary}
    <div class="grid2 tiles">
      <a class="item" href="#/session/redo" style="flex-direction:column;align-items:flex-start"><div class="ic red">${icon('refresh')}</div><div class="t">Redo mistakes</div><div class="s">${errorsOpen ? `${errorsOpen} waiting` : 'All clear'}</div></a>
      <a class="item" href="#/cards" style="flex-direction:column;align-items:flex-start"><div class="ic green">${icon('cards')}</div><div class="t">Flashcards</div><div class="s">${due.due.length + due.fresh.length} ready</div></a>
      <button class="item" data-section style="flex-direction:column;align-items:flex-start;text-align:left"><div class="ic amber">${icon('clock')}</div><div class="t">Section test</div><div class="s">45 minutes, timed</div></button>
      <a class="item" href="#/mock" style="flex-direction:column;align-items:flex-start"><div class="ic amber">${icon('mock')}</div><div class="t">Full mock</div><div class="s">Adaptive, 2 h 15 min</div></a>
    </div>
    <details class="card flat" style="margin-top:16px">
      <summary style="cursor:pointer;font-weight:650">Build your own set</summary>
      <div style="margin-top:14px">
        <label class="field"><span>Section</span><div class="seg" data-f="section">${['quant', 'verbal', 'di'].map((x, i) => `<button data-v="${x}" class="${i === 0 ? 'on' : ''}">${SECTION_NAMES[x]}</button>`).join('')}</div></label>
        <label class="field"><span>Topic</span><select id="f-topic"></select></label>
        <label class="field"><span>Difficulty</span><div class="seg" data-f="d"><button data-v="1-2">Easy</button><button data-v="2-4" class="on">Medium</button><button data-v="4-5">Hard</button><button data-v="1-5">Mixed</button></div></label>
        <label class="field"><span>Questions</span><div class="seg" data-f="n"><button data-v="5">5</button><button data-v="10" class="on">10</button><button data-v="15">15</button><button data-v="20">20</button></div></label>
        <div class="switch"><span>Timed (feedback at the end)</span><input type="checkbox" id="f-timed"></div>
        <button class="btn primary block" data-custom style="margin-top:14px">Start custom set</button>
      </div>
    </details>
    <a class="item" href="#/errors" style="margin-top:12px"><div class="ic">${icon('journal')}</div><div class="body"><div class="t">Mistake log</div><div class="s">Every miss, why it happened, and what to fix</div></div>${icon('chevron')}</a>`;

  const f = { section: 'quant', d: '2-4', n: '10' };
  const fillTopics = () => {
    const sel = view.querySelector('#f-topic');
    const prefix = f.section === 'quant' ? 'q-' : f.section === 'verbal' ? 'v-' : 'd-';
    const topics = Array.from(new Set(bank.list.filter((q) => q.section === f.section).map((q) => q.topic))).filter((t) => t.startsWith(prefix));
    const name = (t) => (t === 'd-ds' ? 'Data Sufficiency' : TOPIC_NAMES_FROM(cur, t));
    sel.innerHTML = `<option value="">All ${SECTION_NAMES[f.section]} topics</option>` + topics.map((t) => `<option value="${t}">${esc(name(t))}</option>`).join('');
  };
  fillTopics();

  view.addEventListener('click', (e) => {
    const b = e.target.closest('[data-f] button');
    if (b) {
      e.preventDefault();
      const key = b.parentElement.dataset.f;
      f[key] = b.dataset.v;
      for (const x of b.parentElement.children) x.classList.toggle('on', x === b);
      if (key === 'section') fillTopics();
      return;
    }
    if (e.target.closest('[data-custom]')) {
      const topic = view.querySelector('#f-topic').value;
      const typeFor = { 'd-ta': 'TA', 'd-gi': 'GI', 'd-tpa': 'TPA', 'd-msr': 'MSR' };
      const isRC = topic.startsWith('v-rc');
      const q = new URLSearchParams({ section: f.section, d: f.d, n: f.n, timed: view.querySelector('#f-timed').checked ? '1' : '0' });
      if (topic && !isRC) q.set('topic', topic);
      if (isRC) q.set('type', 'RC');
      if (typeFor[topic]) q.set('type', typeFor[topic]);
      location.hash = `#/session/custom?${q}`;
      return;
    }
    if (e.target.closest('[data-section]')) {
      const sh = sheet(`<h2>Which section?</h2><p class="muted">A full 45-minute section from the practice pool, timed like the real thing.</p>
        <div class="list">${['quant', 'verbal', 'di'].map((x) => `<a class="item" href="#/session/section/${x}" data-close><div class="ic amber">${icon('clock')}</div><div class="body"><div class="t">${SECTION_NAMES[x]}</div><div class="s">${{ quant: '21 questions', verbal: '23 questions', di: '20 questions' }[x]} · 45 minutes</div></div></a>`).join('')}</div>`);
    }
  });
}
