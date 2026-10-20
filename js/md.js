// Markdown rendering for lessons, explanations and prompts. Content is our own (trusted).
import { marked } from '../vendor/marked.esm.js';

marked.setOptions({ gfm: true, breaks: false });

const CALLOUTS = {
  TIP: { title: 'Tip', icon: 'bulb' },
  TRAP: { title: 'Trap', icon: 'alert' },
  REMEMBER: { title: 'Remember', icon: 'pin' },
  NOTE: { title: 'Note', icon: 'info' },
  SHORTCUT: { title: 'Shortcut', icon: 'bolt' },
  EXAMPLE: { title: 'Example', icon: 'pen' },
};

export function md(text) {
  return marked.parse(String(text ?? ''));
}

export function mdInline(text) {
  return marked.parseInline(String(text ?? ''));
}

// Full lesson rendering with callouts, scrollable tables and safe external links.
export function renderLesson(text) {
  const tpl = document.createElement('template');
  tpl.innerHTML = md(text);
  const root = tpl.content;
  for (const bq of root.querySelectorAll('blockquote')) {
    const first = bq.querySelector('p');
    const m = first && first.innerHTML.match(/^\s*\[!([A-Z]+)\]\s*(<br>)?/);
    if (!m || !CALLOUTS[m[1]]) continue;
    const kind = m[1].toLowerCase();
    first.innerHTML = first.innerHTML.slice(m[0].length);
    if (!first.innerHTML.trim()) first.remove();
    const box = document.createElement('aside');
    box.className = `callout callout-${kind}`;
    box.innerHTML = `<div class="callout-title">${CALLOUTS[m[1]].title}</div>`;
    while (bq.firstChild) box.appendChild(bq.firstChild);
    bq.replaceWith(box);
  }
  for (const t of root.querySelectorAll('table')) {
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    t.replaceWith(wrap);
    wrap.appendChild(t);
  }
  for (const a of root.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (/^https?:/i.test(href)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.classList.add('ext');
    }
  }
  for (const d of root.querySelectorAll('details')) d.classList.add('reveal');
  const div = document.createElement('div');
  div.appendChild(root);
  return div.innerHTML;
}

// Extract headings for a lesson's table of contents.
export function lessonOutline(text) {
  return String(text)
    .split('\n')
    .filter((l) => /^## /.test(l))
    .map((l) => l.replace(/^## /, '').trim());
}

export function readingMinutes(text) {
  return Math.max(3, Math.round(String(text).split(/\s+/).length / 180));
}

// ---------- Mermaid diagrams (lazy-loaded; ~3.5 MB, only on pages that need it)
let mermaidPromise = null;
function loadMermaid() {
  if (mermaidPromise) return mermaidPromise;
  mermaidPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'vendor/mermaid.min.js';
    s.onload = () => resolve(window.mermaid);
    s.onerror = () => {
      mermaidPromise = null;
      reject(new Error('Diagram library failed to load'));
    };
    document.head.appendChild(s);
  });
  return mermaidPromise;
}

function isDark() {
  const t = document.documentElement.dataset.theme;
  return t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

// Turn ```mermaid code blocks (or .mermaid-src elements) inside root into rendered diagrams.
export async function renderDiagrams(root) {
  const blocks = Array.from(root.querySelectorAll('pre > code.language-mermaid, .mermaid-src'));
  if (!blocks.length) return;
  for (const code of blocks) {
    const fig = document.createElement('figure');
    fig.className = 'diagram';
    fig.innerHTML = '<div class="diagram-loading">Drawing diagram…</div>';
    fig.dataset.src = code.textContent;
    (code.closest('pre') || code).replaceWith(fig);
  }
  let mermaid;
  try {
    mermaid = await loadMermaid();
  } catch {
    for (const fig of root.querySelectorAll('figure.diagram')) fig.innerHTML = `<pre class="diagram-fallback">${fig.dataset.src.replace(/</g, '&lt;')}</pre>`;
    return;
  }
  const dark = isDark();
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: 'Inter, -apple-system, Segoe UI, sans-serif',
    flowchart: { htmlLabels: true, curve: 'basis', useMaxWidth: true, padding: 12 },
    themeVariables: dark
      ? { primaryColor: '#232b55', primaryTextColor: '#e8ebf7', primaryBorderColor: '#818cf8', lineColor: '#858ca9', secondaryColor: '#3a2a0f', tertiaryColor: '#1c2440', background: '#151b30', mainBkg: '#232b55', nodeBorder: '#818cf8', clusterBkg: '#1c2440', edgeLabelBackground: '#151b30', fontSize: '15px' }
      : { primaryColor: '#eef0fe', primaryTextColor: '#151a2d', primaryBorderColor: '#4338ca', lineColor: '#7a819c', secondaryColor: '#fff7e6', tertiaryColor: '#f1f3f9', background: '#ffffff', mainBkg: '#eef0fe', nodeBorder: '#4338ca', clusterBkg: '#f6f7fb', edgeLabelBackground: '#ffffff', fontSize: '15px' },
  });
  let i = 0;
  for (const fig of root.querySelectorAll('figure.diagram')) {
    try {
      const { svg } = await mermaid.render(`dg-${Date.now()}-${i++}`, fig.dataset.src);
      fig.innerHTML = svg;
    } catch (e) {
      console.warn('Diagram failed', e);
      fig.innerHTML = `<pre class="diagram-fallback">${fig.dataset.src.replace(/</g, '&lt;')}</pre>`;
    }
  }
}
