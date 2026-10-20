// App bootstrap: router, chrome (top bar + nav), theme, service worker.
import * as store from './store.js';
import * as content from './content.js';
import { icon } from './icons.js';
import { $, esc } from './util.js';

const ROUTES = [
  ['welcome', () => import('./views/onboarding.js')],
  ['today', () => import('./views/today.js')],
  ['plan', () => import('./views/plan.js')],
  ['learn', () => import('./views/learn.js')],
  ['lesson', () => import('./views/lesson.js')],
  ['practice', () => import('./views/practice.js')],
  ['session', () => import('./views/session.js')],
  ['mock', () => import('./views/mock.js')],
  ['progress', () => import('./views/progress.js')],
  ['more', () => import('./views/more.js')],
  ['errors', () => import('./views/errors.js')],
  ['cards', () => import('./views/cards.js')],
  ['admissions', () => import('./views/admissions.js')],
  ['library', () => import('./views/library.js')],
  ['settings', () => import('./views/settings.js')],
  ['checklist', () => import('./views/checklist.js')],
];

const NAV = [
  ['today', 'Today', 'today'],
  ['learn', 'Learn', 'learn'],
  ['practice', 'Practice', 'practice'],
  ['progress', 'Progress', 'progress'],
  ['more', 'More', 'more'],
];
const NAV_OWNER = { plan: 'today', lesson: 'learn', session: 'practice', mock: 'practice', errors: 'practice', cards: 'practice', admissions: 'more', library: 'more', settings: 'more', checklist: 'more' };

let cleanup = null;

export function setTop({ title = '', back = null, actions = '' } = {}) {
  const top = $('#topbar');
  const left = back
    ? `<a class="icon-btn" href="${esc(back)}" aria-label="Back">${icon('back')}</a><div class="title">${esc(title)}</div>`
    : `<a class="brand" href="#/today"><img src="icons/icon.svg" alt=""><span>GMAT Buddy</span></a>`;
  top.innerHTML = `${left}<div class="spacer"></div>${actions}`;
}

export function focusMode(on) {
  document.body.classList.toggle('focus-mode', !!on);
  $('#topbar').hidden = !!on;
}

function renderNav(active) {
  $('#nav').innerHTML = NAV.map(([r, label, ic]) => `<a href="#/${r}" class="${active === r ? 'active' : ''}"${active === r ? ' aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`).join('');
}

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = h.split('?');
  const parts = path.split('/').filter(Boolean);
  return { route: parts[0] || 'today', params: parts.slice(1).map(decodeURIComponent), query: Object.fromEntries(new URLSearchParams(query)) };
}

async function route() {
  const s = store.get();
  let { route: name, params, query } = parseHash();
  if (!s.onboarded && name !== 'welcome') {
    location.replace('#/welcome');
    return;
  }
  const entry = ROUTES.find((r) => r[0] === name) || ROUTES[1];
  if (cleanup) {
    try {
      cleanup();
    } catch (e) {
      console.warn(e);
    }
    cleanup = null;
  }
  // A fresh element per route drops every listener the previous view attached.
  const old = $('#view');
  const view = old.cloneNode(false);
  old.replaceWith(view);
  view.className = '';
  focusMode(false);
  renderNav(NAV_OWNER[entry[0]] || entry[0]);
  setTop();
  try {
    const mod = await entry[1]();
    const result = await mod.render({ view, params, query, setTop, focusMode });
    if (typeof result === 'function') cleanup = result;
  } catch (e) {
    console.error(e);
    view.innerHTML = `<div class="empty">${icon('alert')}<h2>Something went wrong</h2><p class="muted">${esc(e.message)}</p><a class="btn" href="#/today">Back to Today</a></div>`;
  }
  if (!query.keep) window.scrollTo(0, 0);
}

function applyTheme() {
  const t = store.get().settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

function boot() {
  store.load();
  applyTheme();
  store.subscribe(applyTheme);
  window.addEventListener('hashchange', route);
  window.addEventListener('scroll', () => $('#topbar').classList.toggle('scrolled', window.scrollY > 4), { passive: true });
  content.warm().catch((e) => console.warn('Preload failed', e));
  route();
  // Offline support everywhere except local development (where it would serve stale code).
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !['localhost', '127.0.0.1'].includes(location.hostname)) {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW registration failed', e));
  }
}

boot();
