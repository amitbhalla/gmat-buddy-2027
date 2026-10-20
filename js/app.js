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
let routeSeq = 0;

// Desktop and phone get different structures, not just different widths.
const DESKTOP_MQ = window.matchMedia('(min-width: 1100px)');
export const isDesktop = () => DESKTOP_MQ.matches;

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

// Desktop shows every destination, grouped; phones keep five tabs with "More".
const DESK_NAV = [
  ['Study', [['today', 'Today', 'today'], ['plan', 'Plan & calendar', 'calendar'], ['learn', 'Learn', 'learn'], ['practice', 'Practice', 'practice'], ['mock', 'Mocks', 'mock'], ['cards', 'Flashcards', 'cards'], ['errors', 'Mistake log', 'journal']]],
  ['Track', [['progress', 'Progress', 'progress']]],
  ['Beyond the test', [['admissions', 'Admissions', 'cap'], ['library', 'Library', 'book'], ['checklist', 'Test-day checklist', 'list']]],
  ['App', [['settings', 'Settings', 'settings']]],
];

function renderNav(active) {
  if (isDesktop()) {
    $('#nav').innerHTML = `<a class="nav-brand" href="#/today"><img src="icons/icon.svg" alt=""><span>GMAT Buddy</span></a>` +
      DESK_NAV.map(([group, items]) => `<div class="nav-group">${esc(group)}</div>` + items.map(([r, label, ic]) => `<a href="#/${r}" class="${active === r ? 'active' : ''}"${active === r ? ' aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`).join('')).join('');
    return;
  }
  $('#nav').innerHTML = `<a class="nav-brand" href="#/today"><img src="icons/icon.svg" alt=""><span>GMAT Buddy</span></a>` + NAV.map(([r, label, ic]) => `<a href="#/${r}" class="${active === r ? 'active' : ''}"${active === r ? ' aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`).join('');
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
  const seq = ++routeSeq;
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
  const DESK_OWNER = { lesson: 'learn', session: 'practice', more: 'today' };
  renderNav(isDesktop() ? DESK_OWNER[entry[0]] || entry[0] : NAV_OWNER[entry[0]] || entry[0]);
  setTop();
  try {
    const mod = await entry[1]();
    const result = await mod.render({ view, params, query, setTop, focusMode, desktop: isDesktop() });
    if (typeof result === 'function') {
      // A slow view that finished after the user already moved on must clean up now, not later.
      if (seq === routeSeq) cleanup = result;
      else {
        try {
          result();
        } catch (e) {
          console.warn(e);
        }
      }
    }
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
  // Re-render when crossing the phone/desktop breakpoint (players keep their state in the store, so this is safe).
  DESKTOP_MQ.addEventListener('change', () => route());
  window.addEventListener('scroll', () => $('#topbar').classList.toggle('scrolled', window.scrollY > 4), { passive: true });
  content.warm().catch((e) => console.warn('Preload failed', e));
  route();
  // Offline support everywhere except local development (where it would serve stale code).
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !['localhost', '127.0.0.1'].includes(location.hostname)) {
    // Versioned registration: a new build (new precache version) installs a fresh worker straight away.
    fetch('precache.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((p) => navigator.serviceWorker.register(`sw.js?v=${p.version}`))
      .catch((e) => console.warn('SW registration failed', e));
  }
}

boot();
