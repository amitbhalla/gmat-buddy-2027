// Flashcards: spaced-repetition review. One calm start screen, one card at a time.
import * as store from '../store.js';
import * as content from '../content.js';
import { dueCards, schedule, previewIntervals, cardStats, GRADES } from '../srs.js';
import { md } from '../md.js';
import { icon } from '../icons.js';
import { esc, todayStr, fmtMinutes } from '../util.js';

const DECKS = [
  ['quant-facts', 'Number facts'],
  ['quant-formulas', 'Formulas'],
  ['quant-traps', 'Traps'],
  ['cr', 'Critical Reasoning'],
  ['rc', 'Reading'],
  ['di', 'Data Insights'],
  ['test', 'Exam facts'],
  ['vocab', 'Vocabulary'],
];
const GRADE_LIST = [['again', 'Again'], ['hard', 'Hard'], ['good', 'Good'], ['easy', 'Easy']];
const deckName = (d) => (DECKS.find(([k]) => k === d) || [, d])[1];
const ival = (n) => (n >= 30 ? `${Math.round(n / 30)}mo` : `${n}d`);

export async function render({ view, setTop, query, focusMode }) {
  setTop({ title: 'Flashcards', back: '#/practice' });
  const [all, cur] = await Promise.all([content.flashcards(), content.curriculum()]);
  const today = todayStr();
  const item = query.item || null;

  // Which cards has she reached? Question topics unlock as lessons are completed.
  const gated = new Set(Object.values(cur.lessons).map((l) => l.topic).filter(Boolean));
  const unlocked = new Set(
    Object.entries(store.get().lessons)
      .filter(([, l]) => l.completedAt)
      .map(([id]) => cur.lessons[id]?.topic)
      .filter(Boolean),
  );
  const available = all.filter((c) => c.deck === 'test' || !c.topic || !gated.has(c.topic) || unlocked.has(c.topic));
  let activeDecks = new Set(DECKS.map(([k]) => k));
  let cleanupFns = [];
  let finished = false;

  function build() {
    const s = store.get();
    const pool = available.filter((c) => activeDecks.has(c.deck));
    const introduced = Object.values(s.cards).filter((c) => c.created === today).length;
    const newLimit = Math.max(0, (s.settings.dailyCards ?? 20) - introduced);
    const q = dueCards(pool, s.cards, today, { newLimit });
    return { due: q.due, fresh: q.fresh, stats: cardStats(available, s.cards, today), more: Math.max(0, q.totalNew - q.fresh.length) };
  }

  function start() {
    const q = build();
    if (!q.due.length && !q.fresh.length) return paintDone({ reviewed: 0, secs: 0 });
    review([...q.due, ...q.fresh].map((c) => c.id));
  }

  function paintStart() {
    focusMode(false);
    const q = build();
    const n = q.due.length + q.fresh.length;
    const decksWithCards = DECKS.filter(([k]) => available.some((c) => c.deck === k));
    view.innerHTML = `
      <div class="card tint" style="text-align:center;padding:32px 20px;margin-top:10px">
        <div class="eyebrow">Flashcards</div>
        <h1 style="margin:0 0 6px">${n ? `${n} card${n === 1 ? '' : 's'} ready` : 'All caught up'}</h1>
        <p class="muted" style="margin:0 0 20px">${n ? `${q.due.length} to review, ${q.fresh.length} new. About ${fmtMinutes(Math.max(2, Math.round(n * 0.4)))}.` : 'Nothing is due right now. Come back tomorrow.'}</p>
        ${n ? `<button class="btn primary block" id="start" style="max-width:320px;margin:0 auto">${icon('play')} Start</button>` : item ? '<button class="btn primary" id="mark">Mark done</button>' : '<a class="btn primary" href="#/today">Back to Today</a>'}
      </div>
      <p class="faint" style="text-align:center;margin:14px 0">${q.stats.learned} learned, ${q.stats.mature} well known, out of ${q.stats.total} unlocked.${q.more ? ` ${q.more} more new cards are waiting for tomorrow.` : ''}</p>
      <details class="card flat reveal"><summary style="cursor:pointer;font-weight:650">Choose decks</summary>
        <div class="chips" style="margin-top:12px">${decksWithCards.map(([k, l]) => `<button class="chip${activeDecks.has(k) ? ' indigo' : ''}" data-deck="${k}" style="border:0;cursor:pointer;min-height:38px">${l}</button>`).join('')}</div>
      </details>`;
    view.querySelector('#start')?.addEventListener('click', start);
    view.querySelector('#mark')?.addEventListener('click', () => finish(0, 0));
    view.querySelectorAll('[data-deck]').forEach((b) =>
      b.addEventListener('click', () => {
        const k = b.dataset.deck;
        if (activeDecks.has(k) && activeDecks.size > 1) activeDecks.delete(k);
        else activeDecks.add(k);
        const open = view.querySelector('details').open;
        paintStart();
        view.querySelector('details').open = open;
      }),
    );
  }

  function finish(reviewed, secs) {
    if (finished) return;
    finished = true;
    const minutes = reviewed ? Math.max(1, Math.round(secs / 60)) : 0;
    if (minutes) store.logMinutes(minutes);
    if (item) store.markDone(item, minutes);
    paintDone({ reviewed, secs, marked: !!item });
  }

  function paintDone({ reviewed, secs, marked }) {
    focusMode(false);
    cleanupFns.forEach((f) => f());
    cleanupFns = [];
    setTop({ title: 'Flashcards', back: '#/practice' });
    view.innerHTML = `
      <div class="card good" style="text-align:center;padding:32px 20px;margin-top:10px">
        <div class="eyebrow">Nicely done</div>
        <h1 style="margin:0 0 6px">All caught up</h1>
        <p class="muted" style="margin:0 0 20px">${reviewed ? `You reviewed ${reviewed} card${reviewed === 1 ? '' : 's'} in ${fmtMinutes(Math.max(1, Math.round(secs / 60)))}.` : 'There was nothing to review right now.'}${marked ? ' Today\'s task is ticked off.' : ''}</p>
        <a class="btn primary" href="#/today">Back to Today</a>
      </div>`;
  }

  function review(ids) {
    const queue = ids.slice();
    const total = ids.length;
    const requeued = new Set();
    const byId = new Map(all.map((c) => [c.id, c]));
    const t0 = Date.now();
    let reviewed = 0;
    let flipped = false;
    focusMode(true);

    const exit = () => {
      if (reviewed) finish(reviewed, (Date.now() - t0) / 1000);
      else {
        cleanupFns.forEach((f) => f());
        cleanupFns = [];
        paintStart();
      }
    };

    const paint = () => {
      if (!queue.length) return finish(reviewed, (Date.now() - t0) / 1000);
      const card = byId.get(queue[0]);
      const st = store.get().cards[card.id] || {};
      const pv = previewIntervals(st, today);
      flipped = false;
      view.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0">
          <button class="icon-btn" id="quit" aria-label="Stop for now">${icon('close')}</button>
          <div class="bar" style="flex:1"><span style="width:${Math.round((reviewed / total) * 100)}%"></span></div>
          <span class="faint" style="white-space:nowrap">${queue.length} left</span>
        </div>
        <div class="flash" id="flash" role="button" tabindex="0" aria-label="Flip card">
          <div class="flash-inner">
            <div class="flash-face"><span class="deck">${esc(deckName(card.deck))}</span><div style="font-weight:650">${esc(card.front)}</div><div class="faint" style="position:absolute;bottom:14px;left:0;right:0">Tap to show the answer</div></div>
            <div class="flash-face back" style="overflow:auto"><span class="deck">Answer</span><div class="prose" style="font-size:inherit">${md(card.back)}</div></div>
          </div>
        </div>
        <div id="grades" hidden>
          <div class="grade-row">${GRADE_LIST.map(([k, l], i) => `<button class="btn" data-g="${k}" aria-label="${l}, next in ${ival(pv[k])} (key ${i + 1})">${l}<small>${ival(pv[k])}</small></button>`).join('')}</div>
        </div>
        <div class="faint" style="text-align:center;margin-top:14px">Space to flip, 1 to 4 to answer</div>`;
      view.querySelector('#flash').addEventListener('click', flip);
      view.querySelector('#quit').addEventListener('click', exit);
      view.querySelector('#grades').addEventListener('click', (e) => {
        const b = e.target.closest('[data-g]');
        if (b) grade(b.dataset.g);
      });
    };

    function flip() {
      if (flipped) return;
      flipped = true;
      view.querySelector('#flash').classList.add('flipped');
      view.querySelector('#grades').hidden = false;
    }

    function grade(k) {
      const id = queue.shift();
      const s = store.get();
      const existing = s.cards[id] || {};
      const next = { ...schedule(existing, GRADES[k], today), created: existing.created || today };
      store.update((st) => (st.cards[id] = next));
      if (k === 'again' && !requeued.has(id)) {
        requeued.add(id);
        queue.push(id);
      } else reviewed++;
      paint();
    }

    const onKey = (e) => {
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      if (e.key === ' ' || e.key === 'Enter') {
        if (!flipped && view.querySelector('#flash')) {
          e.preventDefault();
          flip();
        }
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) grade(GRADE_LIST[Number(e.key) - 1][0]);
    };
    document.addEventListener('keydown', onKey);
    cleanupFns.push(() => document.removeEventListener('keydown', onKey));
    paint();
  }

  paintStart();
  return () => {
    cleanupFns.forEach((f) => f());
    focusMode(false);
  };
}
