// On-screen calculator for Data Insights (the real exam offers a basic one in DI only).
// Basic four-function with %, √, ± and memory, like the exam's. Floating panel; drag on desktop.
let panel = null;

const KEYS = [
  ['MC', 'MR', 'M+', '√'],
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

function fmt(n) {
  if (!Number.isFinite(n)) return 'Error';
  const r = Math.round(n * 1e10) / 1e10;
  const s = String(r);
  return s.length > 14 ? r.toPrecision(10).replace(/\.?0+$/, '') : s;
}

// Pure calculator engine (no DOM), so the arithmetic can be tested.
export function createCalc() {
  let display = '0';
  let acc = null;
  let op = null;
  let fresh = true;
  let mem = 0;
  const apply = (a, b, o) => (o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : o === '÷' ? a / b : b);
  function press(k) {
    const cur = parseFloat(display);
    if (/^\d$/.test(k)) {
      display = fresh || display === '0' ? k : display.length < 14 ? display + k : display;
      fresh = false;
    } else if (k === '.') {
      if (fresh) display = '0.';
      else if (!display.includes('.')) display += '.';
      fresh = false;
    } else if (k === '⌫') {
      display = fresh || display.length <= 1 ? '0' : display.slice(0, -1);
    } else if (k === 'C') {
      display = '0';
      acc = null;
      op = null;
      fresh = true;
    } else if (k === '±') display = fmt(-cur);
    else if (k === '√') {
      display = fmt(Math.sqrt(cur));
      fresh = true;
    } else if (k === '%') {
      display = fmt(acc != null && (op === '+' || op === '−') ? (acc * cur) / 100 : cur / 100);
      fresh = true;
    } else if (k === 'MC') mem = 0;
    else if (k === 'MR') {
      display = fmt(mem);
      fresh = true;
    } else if (k === 'M+') {
      mem += cur;
      fresh = true;
    } else if (/[÷×−+]/.test(k)) {
      if (acc != null && op && !fresh) display = fmt(apply(acc, cur, op));
      acc = parseFloat(display);
      op = k;
      fresh = true;
    } else if (k === '=') {
      if (acc != null && op) display = fmt(apply(acc, cur, op));
      acc = null;
      op = null;
      fresh = true;
    }
    return display;
  }
  return { press, get display() { return display; }, get memory() { return mem; } };
}

export function toggleCalculator() {
  if (panel) return closeCalculator();
  const calc = createCalc();
  panel = document.createElement('div');
  panel.className = 'calc';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Calculator');
  panel.innerHTML = `<div class="calc-bar"><span>Calculator</span><button class="calc-x" aria-label="Close calculator">✕</button></div>
    <div class="calc-mem" aria-live="polite"></div><output class="calc-out" aria-live="polite">0</output>
    <div class="calc-keys">${KEYS.flat().map((k) => `<button data-k="${k}" class="${/[÷×−+=]/.test(k) ? 'op' : /^(MC|MR|M\+|C|±|%|√|⌫)$/.test(k) ? 'fn' : ''}">${k}</button>`).join('')}</div>`;
  document.body.appendChild(panel);
  const out = panel.querySelector('.calc-out');
  const memEl = panel.querySelector('.calc-mem');
  const show = () => {
    out.textContent = calc.display;
    memEl.textContent = calc.memory ? 'M' : '';
  };
  const press = (k) => {
    calc.press(k);
    show();
  };
  panel.addEventListener('click', (e) => {
    if (e.target.closest('.calc-x')) return closeCalculator();
    const b = e.target.closest('[data-k]');
    if (b) press(b.dataset.k);
  });
  const keyMap = { '/': '÷', '*': '×', '-': '−', '+': '+', Enter: '=', '=': '=', Backspace: '⌫', Escape: 'C', '.': '.' };
  panel._onKey = (e) => {
    if (e.target.closest('input, textarea, select')) return;
    const k = /^\d$/.test(e.key) ? e.key : keyMap[e.key];
    if (k && panel.matches(':hover, :focus-within')) {
      e.preventDefault();
      e.stopPropagation();
      press(k);
    }
  };
  document.addEventListener('keydown', panel._onKey, true);
  // Drag by the title bar (desktop).
  const bar = panel.querySelector('.calc-bar');
  bar.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    const r = panel.getBoundingClientRect();
    const dx = e.clientX - r.left;
    const dy = e.clientY - r.top;
    const move = (ev) => {
      panel.style.left = `${Math.max(0, Math.min(innerWidth - r.width, ev.clientX - dx))}px`;
      panel.style.top = `${Math.max(0, Math.min(innerHeight - r.height, ev.clientY - dy))}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    };
    const up = () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
  });
  show();
  panel.querySelector('[data-k="C"]').focus();
}

export function closeCalculator() {
  if (!panel) return;
  document.removeEventListener('keydown', panel._onKey, true);
  panel.remove();
  panel = null;
}
