// SVG chart renderer. Pure functions returning markup strings; colors come from CSS variables.

const FONT = 12;
const TEXT = 'fill="var(--chart-text)" font-family="inherit"';

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const r2 = (v) => Math.round(v * 100) / 100;
const color = (i) => `var(--chart-${(i % 6) + 1})`;
const textWidth = (s, size = FONT) => 0.6 * size * String(s).length;

export function niceTicks(min, max, target = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 0; max = 1; }
  if (min === max) {
    if (min === 0) max = 1;
    else if (min > 0) min = 0;
    else max = 0;
  }
  const range = max - min;
  const rough = range / target;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const frac = rough / pow;
  const step = [1, 2, 2.5, 5, 10].find((f) => f >= frac - 1e-9) * pow;
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks = [];
  for (let v = lo, n = 0; v <= hi + step * 1e-6 && n < 50; v += step, n++) {
    ticks.push(Math.round(v / step) * step);
  }
  return { ticks, min: ticks[0], max: ticks[ticks.length - 1], step };
}

export function formatTick(v, unit = '') {
  const abs = Math.abs(v);
  const trim = (n) => String(Math.round(n * 100) / 100);
  let s;
  if (abs >= 1e9) s = trim(v / 1e9) + 'B';
  else if (abs >= 1e6) s = trim(v / 1e6) + 'M';
  else {
    const t = trim(v);
    const [i, d] = t.split('.');
    s = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : '');
  }
  return s + unit;
}

function svgOpen(w, h, label, body) {
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="${esc(label)}" class="chart" xmlns="http://www.w3.org/2000/svg">` +
    `<title>${esc(label)}</title>${body}</svg>`;
}

function noData(w, h, label) {
  return svgOpen(w, h, label || 'Chart', `<text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-size="14" ${TEXT}>No data</text>`);
}

function text(x, y, s, extra = '') {
  const base = extra.includes('fill=') ? 'font-family="inherit"' : TEXT;
  const size = extra.includes('font-size=') ? '' : `font-size="${FONT}" `;
  return `<text x="${r2(x)}" y="${r2(y)}" ${size}${base} ${extra}>${esc(s)}</text>`;
}

function legend(names, width, startY) {
  let x = 12;
  let y = startY;
  let out = '';
  names.forEach((name, i) => {
    const w = 22 + textWidth(name) + 16;
    if (x + w > width - 8 && x > 12) { x = 12; y += 20; }
    out += `<rect x="${x}" y="${y - 10}" width="12" height="12" rx="2" fill="${color(i)}"/>`;
    out += text(x + 18, y, name);
    x += w;
  });
  return { markup: out, height: y - startY + 20 };
}

function defaultLabel(spec) {
  const parts = [(spec.type || 'Data') + ' chart'];
  if (spec.title) parts.unshift(spec.title);
  if (spec.yLabel && spec.xLabel) parts.push(`${spec.yLabel} by ${spec.xLabel}`);
  return parts.join(': ');
}

// Shared plot frame: margins, y axis with gridlines, returns scale helpers and markup.
function frame({ w, h, spec, opts, names, xLabels, yMin, yMax }) {
  const unit = spec.unit || '';
  const t = niceTicks(Number.isFinite(spec.yMin) ? spec.yMin : yMin, Number.isFinite(spec.yMax) ? spec.yMax : yMax);
  const lo = Number.isFinite(spec.yMin) ? spec.yMin : t.min;
  const hi = Number.isFinite(spec.yMax) ? spec.yMax : t.max;
  const ticks = t.ticks.filter((v) => v >= lo - 1e-9 && v <= hi + 1e-9);
  const tickLabels = ticks.map((v) => formatTick(v, unit));
  const left = 14 + Math.max(...tickLabels.map((s) => textWidth(s)), 10) + (spec.yLabel ? 18 : 0);
  const right = 16;
  const lg = opts.legend !== false && names.length > 1 ? legend(names, w, 20) : { markup: '', height: 0 };
  const top = 12 + lg.height;
  const plotW = w - left - right;
  const band = plotW / Math.max(xLabels.length, 1);
  const widest = Math.max(...xLabels.map((s) => textWidth(s)), 0);
  const rotate = widest + 6 > band;
  const labelH = rotate ? Math.min(widest, 140) * 0.82 + 12 : 22;
  const bottom = labelH + (spec.xLabel ? 22 : 8);
  const plotH = h - top - bottom;
  const y = (v) => top + plotH - ((v - lo) / (hi - lo || 1)) * plotH;
  const clamp = (v) => Math.min(hi, Math.max(lo, v));
  let m = lg.markup;
  ticks.forEach((v, i) => {
    const yy = r2(y(v));
    m += `<line x1="${left}" x2="${w - right}" y1="${yy}" y2="${yy}" stroke="var(--chart-grid)" stroke-width="1"/>`;
    m += text(left - 6, yy + 4, tickLabels[i], 'text-anchor="end"');
  });
  if (lo < 0 && hi > 0) {
    m += `<line x1="${left}" x2="${w - right}" y1="${r2(y(0))}" y2="${r2(y(0))}" stroke="var(--chart-axis)" stroke-width="1.5"/>`;
  }
  m += `<line x1="${left}" x2="${left}" y1="${top}" y2="${top + plotH}" stroke="var(--chart-axis)"/>`;
  m += `<line x1="${left}" x2="${w - right}" y1="${r2(top + plotH)}" y2="${r2(top + plotH)}" stroke="var(--chart-axis)"/>`;
  xLabels.forEach((s, i) => {
    const cx = left + band * (i + 0.5);
    const ly = top + plotH + 16;
    m += rotate
      ? text(cx, ly - 2, s, `text-anchor="end" transform="rotate(-35 ${r2(cx)} ${r2(ly - 2)})"`)
      : text(cx, ly, s, 'text-anchor="middle"');
  });
  if (spec.xLabel) m += text(left + plotW / 2, h - 6, spec.xLabel, 'text-anchor="middle" font-weight="600"');
  if (spec.yLabel) {
    const cy = top + plotH / 2;
    m += text(14, cy, spec.yLabel, `text-anchor="middle" font-weight="600" transform="rotate(-90 14 ${r2(cy)})"`);
  }
  return { m, left, top, plotW, plotH, band, y, clamp, lo, hi, unit };
}

function seriesOf(spec) {
  const cats = (spec.categories || []).map(String);
  const series = (spec.series || []).map((s, i) => ({
    name: String(s.name ?? `Series ${i + 1}`),
    values: cats.map((_, j) => (s.values && s.values[j] != null ? num(s.values[j]) : 0))
  }));
  return { cats, series };
}

function valueLabel(x, y, v, unit, extra = '') {
  return text(x, y, formatTick(v, unit), `text-anchor="middle" font-size="11" ${extra}`);
}

function renderBar(spec, opts, w, h, stacked) {
  const { cats, series } = seriesOf(spec);
  if (!cats.length || !series.length) return null;
  let min = 0;
  let max = 0;
  cats.forEach((_, j) => {
    let pos = 0;
    let neg = 0;
    series.forEach((s) => {
      const v = s.values[j];
      if (stacked) { if (v >= 0) pos += v; else neg += v; }
      else { max = Math.max(max, v); min = Math.min(min, v); }
    });
    if (stacked) { max = Math.max(max, pos); min = Math.min(min, neg); }
  });
  const f = frame({ w, h, spec, opts, names: series.map((s) => s.name), xLabels: cats, yMin: min, yMax: max });
  let m = f.m;
  const groupW = f.band * 0.72;
  const n = stacked ? 1 : series.length;
  const barW = groupW / n;
  cats.forEach((_, j) => {
    const gx = f.left + f.band * j + (f.band - groupW) / 2;
    let pos = 0;
    let neg = 0;
    series.forEach((s, i) => {
      const v = s.values[j];
      let a;
      let b;
      if (stacked) {
        if (v >= 0) { a = pos; pos += v; b = pos; } else { a = neg; neg += v; b = neg; }
      } else { a = 0; b = v; }
      const y1 = f.y(f.clamp(Math.max(a, b)));
      const y2 = f.y(f.clamp(Math.min(a, b)));
      const x = gx + (stacked ? 0 : i * barW);
      m += `<rect x="${r2(x)}" y="${r2(y1)}" width="${r2(Math.max(barW - (stacked ? 0 : 2), 1))}" height="${r2(Math.max(y2 - y1, 0))}" fill="${color(i)}"><title>${esc(s.name)}, ${esc(cats[j])}: ${esc(formatTick(v, f.unit))}</title></rect>`;
      if (opts.showValues && v !== 0) {
        const cx = x + (barW - (stacked ? 0 : 2)) / 2;
        m += stacked
          ? valueLabel(cx, (y1 + y2) / 2 + 4, v, f.unit, 'fill="#fff"')
          : valueLabel(cx, v >= 0 ? y1 - 4 : y2 + 12, v, f.unit);
      }
    });
  });
  return m;
}

function renderLine(spec, opts, w, h) {
  const { cats, series } = seriesOf(spec);
  if (!cats.length || !series.length) return null;
  const all = series.flatMap((s) => s.values);
  const f = frame({
    w, h, spec, opts, names: series.map((s) => s.name), xLabels: cats,
    yMin: Math.min(...all), yMax: Math.max(...all)
  });
  let m = f.m;
  series.forEach((s, i) => {
    const pts = s.values.map((v, j) => [f.left + f.band * (j + 0.5), f.y(f.clamp(v))]);
    m += `<polyline fill="none" stroke="${color(i)}" stroke-width="2.5" stroke-linejoin="round" points="${pts.map((p) => `${r2(p[0])},${r2(p[1])}`).join(' ')}"/>`;
    pts.forEach((p, j) => {
      m += `<circle cx="${r2(p[0])}" cy="${r2(p[1])}" r="4" fill="${color(i)}"><title>${esc(s.name)}, ${esc(cats[j])}: ${esc(formatTick(s.values[j], f.unit))}</title></circle>`;
      if (opts.showValues) m += valueLabel(p[0], p[1] - 9, s.values[j], f.unit);
    });
  });
  return m;
}

function renderScatter(spec, opts, w, h) {
  const pts = (spec.points || []).map((p) => ({ name: p.name, x: num(p.x), y: num(p.y) }));
  if (!pts.length) return null;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const tx = niceTicks(Math.min(...xs), Math.max(...xs));
  const ty = niceTicks(Math.min(...ys), Math.max(...ys));
  const f = frame({ w, h, spec, opts, names: [], xLabels: [], yMin: ty.min, yMax: ty.max });
  const plotBottom = f.top + f.plotH;
  const px = (v) => f.left + ((v - tx.min) / (tx.max - tx.min || 1)) * f.plotW;
  let m = f.m;
  tx.ticks.forEach((v) => {
    const xx = r2(px(v));
    m += `<line x1="${xx}" x2="${xx}" y1="${f.top}" y2="${plotBottom}" stroke="var(--chart-grid)"/>`;
    m += text(xx, plotBottom + 16, formatTick(v), 'text-anchor="middle"');
  });
  pts.forEach((p) => {
    const cx = r2(px(p.x));
    const cy = r2(f.y(f.clamp(p.y)));
    const tip = `${p.name ? p.name + ': ' : ''}(${formatTick(p.x)}, ${formatTick(p.y, f.unit)})`;
    m += `<circle cx="${cx}" cy="${cy}" r="5" fill="${color(0)}" fill-opacity="0.85" stroke="var(--chart-axis)" stroke-width="0.5"><title>${esc(tip)}</title></circle>`;
    if (opts.showValues || p.name) {
      const label = opts.showValues ? `${p.name ? p.name + ' ' : ''}(${formatTick(p.x)}, ${formatTick(p.y)})` : p.name;
      m += text(cx + 8, cy - 6, label, 'font-size="11"');
    }
  });
  return m;
}

function slicePath(cx, cy, r, a0, a1) {
  const pt = (a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x0, y0] = pt(a0);
  const [x1, y1] = pt(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${r2(cx)},${r2(cy)} L${r2(x0)},${r2(y0)} A${r},${r} 0 ${large} 1 ${r2(x1)},${r2(y1)} Z`;
}

function renderPie(spec, opts, w, h) {
  const slices = (spec.slices || []).map((s) => ({ label: String(s.label ?? ''), value: Math.max(0, num(s.value)) }));
  const total = slices.reduce((a, s) => a + s.value, 0);
  if (!slices.length || total <= 0) return null;
  const lg = opts.legend !== false ? legend(slices.map((s) => s.label), w, 20) : { markup: '', height: 0 };
  const top = 12 + lg.height;
  const r = Math.max(Math.min((h - top - 56) / 2, w / 2 - 70), 20);
  const cx = w / 2;
  const cy = top + 15 + r;
  let m = lg.markup;
  let a = 0;
  slices.forEach((s, i) => {
    if (s.value <= 0) return;
    const sweep = (s.value / total) * Math.PI * 2;
    const pct = formatTick((s.value / total) * 100) + '%';
    const tip = `<title>${esc(s.label)}: ${esc(formatTick(s.value))} (${pct})</title>`;
    if (slices.filter((q) => q.value > 0).length === 1) {
      m += `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${color(i)}" stroke="var(--chart-bg, #fff)" stroke-width="1.5">${tip}</circle>`;
    } else {
      m += `<path d="${slicePath(cx, cy, r, a, a + sweep)}" fill="${color(i)}" stroke="var(--chart-bg, #fff)" stroke-width="1.5">${tip}</path>`;
    }
    const mid = a + sweep / 2;
    const lx = cx + (r + 14) * Math.sin(mid);
    const ly = cy - (r + 14) * Math.cos(mid);
    const anchor = Math.sin(mid) > 0.2 ? 'start' : Math.sin(mid) < -0.2 ? 'end' : 'middle';
    const label = opts.showValues ? `${formatTick(s.value)} (${pct})` : pct;
    m += text(lx, ly + 4, label, `text-anchor="${anchor}"`);
    a += sweep;
  });
  return m;
}

export function renderChart(spec, opts = {}) {
  const w = opts.width || 640;
  const h = opts.height || 360;
  const s = spec && typeof spec === 'object' ? spec : {};
  const label = opts.ariaLabel || defaultLabel(s);
  let body = null;
  try {
    if (s.type === 'bar') body = renderBar(s, opts, w, h, false);
    else if (s.type === 'stacked') body = renderBar(s, opts, w, h, true);
    else if (s.type === 'line') body = renderLine(s, opts, w, h);
    else if (s.type === 'scatter') body = renderScatter(s, opts, w, h);
    else if (s.type === 'pie') body = renderPie(s, opts, w, h);
  } catch (e) {
    body = null;
  }
  return body ? svgOpen(w, h, label, body) : noData(w, h, label);
}

export function renderSparkBars(values, { width = 300, height = 60, max } = {}) {
  const vals = (values || []).map((v) => Math.max(0, num(v)));
  if (!vals.length) return noData(width, height, 'No data');
  const top = max > 0 ? max : Math.max(...vals, 1);
  const slot = width / vals.length;
  const bw = Math.max(slot * 0.7, 1);
  const bars = vals.map((v, i) => {
    const bh = Math.min(v / top, 1) * (height - 4);
    return `<rect x="${r2(i * slot + (slot - bw) / 2)}" y="${r2(height - bh)}" width="${r2(bw)}" height="${r2(bh)}" rx="2" fill="var(--chart-1)"><title>${esc(formatTick(v))}</title></rect>`;
  }).join('');
  return svgOpen(width, height, 'Bar chart of ' + vals.length + ' values', bars);
}

export function renderLineChart(points, opts = {}) {
  const pts = points || [];
  const spec = {
    type: 'line',
    categories: pts.map((p) => String(p.label)),
    series: [{ name: opts.name || 'Score', values: pts.map((p) => p.value) }],
    yMin: opts.yMin,
    yMax: opts.yMax,
    unit: opts.unit,
    xLabel: opts.xLabel,
    yLabel: opts.yLabel
  };
  return renderChart(spec, opts);
}
