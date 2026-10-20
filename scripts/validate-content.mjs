#!/usr/bin/env node
// Validates every content file against CONTENT_SPEC.md.
// Usage: node scripts/validate-content.mjs [--write-index] [--quiet]
// Exit code 1 if any errors.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QDIR = join(ROOT, 'content', 'questions');
const LDIR = join(ROOT, 'content', 'lessons');
const args = new Set(process.argv.slice(2));

export const TOPICS = {
  quant: ['q-arith', 'q-fractions', 'q-percents', 'q-ratios', 'q-exponents', 'q-numprops', 'q-divisibility', 'q-remainders', 'q-linear', 'q-quadratics', 'q-inequalities', 'q-functions', 'q-wordprob', 'q-rates', 'q-mixtures', 'q-stats', 'q-sets', 'q-counting', 'q-probability'],
  verbal: ['v-cr-assumption', 'v-cr-strengthen', 'v-cr-weaken', 'v-cr-evaluate', 'v-cr-inference', 'v-cr-paradox', 'v-cr-role', 'v-cr-flaw', 'v-cr-complete', 'v-rc-main', 'v-rc-detail', 'v-rc-inference', 'v-rc-function', 'v-rc-application'],
  di: ['d-ds', 'd-ta', 'd-gi', 'd-tpa', 'd-msr'],
};
const TYPES_BY_SECTION = { quant: ['PS'], verbal: ['CR', 'RC'], di: ['DS', 'TA', 'GI', 'TPA', 'MSR'] };
const FORMATS = ['mc', 'yesno', 'dropdown', 'tpa'];
const NEEDS_STIM = ['RC', 'MSR', 'TA', 'GI'];
const CHART_TYPES = ['bar', 'line', 'stacked', 'scatter', 'pie'];
const CALLOUTS = ['TIP', 'TRAP', 'REMEMBER', 'NOTE', 'SHORTCUT', 'EXAMPLE'];

const errors = [];
const warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);
const isInt = (n) => Number.isInteger(n);
const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

function checkTable(f, where, t) {
  if (!t || !Array.isArray(t.columns) || !Array.isArray(t.rows)) return err(f, `${where}: table needs columns[] and rows[]`);
  t.rows.forEach((r, i) => {
    if (!Array.isArray(r) || r.length !== t.columns.length) err(f, `${where}: row ${i} has ${r?.length} cells, expected ${t.columns.length}`);
  });
}

function checkChart(f, where, c) {
  if (!c || !CHART_TYPES.includes(c.type)) return err(f, `${where}: chart.type must be one of ${CHART_TYPES}`);
  if (['bar', 'line', 'stacked'].includes(c.type)) {
    if (!Array.isArray(c.categories) || !Array.isArray(c.series) || !c.series.length) return err(f, `${where}: ${c.type} chart needs categories[] and series[]`);
    c.series.forEach((s, i) => {
      if (!Array.isArray(s.values) || s.values.length !== c.categories.length) err(f, `${where}: series ${i} values length != categories length`);
      else if (s.values.some((v) => typeof v !== 'number')) err(f, `${where}: series ${i} has non-numeric values`);
    });
  }
  if (c.type === 'scatter' && (!Array.isArray(c.points) || c.points.some((p) => typeof p.x !== 'number' || typeof p.y !== 'number'))) err(f, `${where}: scatter needs points[{x,y}]`);
  if (c.type === 'pie' && (!Array.isArray(c.slices) || c.slices.some((s) => typeof s.value !== 'number'))) err(f, `${where}: pie needs slices[{label,value}]`);
}

function checkStimulus(f, s) {
  const w = `stimulus ${s.id}`;
  if (!nonEmpty(s.id)) return err(f, 'stimulus without id');
  if (s.kind === 'passage') {
    if (!nonEmpty(s.body)) err(f, `${w}: passage needs body`);
    else {
      const words = s.body.split(/\s+/).length;
      if (words < 150 || words > 600) warn(f, `${w}: passage is ${words} words (expected 200-450)`);
    }
  } else if (s.kind === 'table') checkTable(f, w, s.table);
  else if (s.kind === 'chart') checkChart(f, w, s.chart);
  else if (s.kind === 'msr') {
    if (!Array.isArray(s.tabs) || s.tabs.length < 2 || s.tabs.length > 3) err(f, `${w}: msr needs 2-3 tabs`);
    (s.tabs || []).forEach((t, i) => {
      if (!nonEmpty(t.title)) err(f, `${w}: tab ${i} needs title`);
      if (!t.body && !t.table && !t.chart) err(f, `${w}: tab ${i} needs body, table or chart`);
      if (t.table) checkTable(f, `${w} tab ${i}`, t.table);
      if (t.chart) checkChart(f, `${w} tab ${i}`, t.chart);
    });
  } else err(f, `${w}: unknown kind ${s.kind}`);
}

function checkQuestion(f, q, stimIds, seen) {
  const w = `question ${q.id || '(no id)'}`;
  if (!nonEmpty(q.id) || !/^[a-z0-9-]+$/.test(q.id)) err(f, `${w}: id must be lowercase [a-z0-9-]`);
  if (seen.has(q.id)) err(f, `${w}: duplicate id (also in ${seen.get(q.id)})`);
  seen.set(q.id, f);
  if (!TOPICS[q.section]) return err(f, `${w}: bad section ${q.section}`);
  if (!TYPES_BY_SECTION[q.section].includes(q.type)) err(f, `${w}: type ${q.type} not allowed in ${q.section}`);
  if (!TOPICS[q.section].includes(q.topic)) err(f, `${w}: unknown topic ${q.topic}`);
  if (!['practice', 'mock'].includes(q.pool)) err(f, `${w}: pool must be practice|mock`);
  if (!isInt(q.difficulty) || q.difficulty < 1 || q.difficulty > 5) err(f, `${w}: difficulty must be 1-5`);
  if (!FORMATS.includes(q.format)) err(f, `${w}: bad format ${q.format}`);
  if (!nonEmpty(q.prompt)) err(f, `${w}: missing prompt`);
  if (!nonEmpty(q.explanation)) err(f, `${w}: missing explanation`);
  else if (q.explanation.split(/\s+/).length < 40) warn(f, `${w}: explanation is very short`);
  if (!nonEmpty(q.tip)) err(f, `${w}: missing tip`);
  if (!nonEmpty(q.trap)) err(f, `${w}: missing trap`);
  if (!isInt(q.timeTarget) || q.timeTarget < 30 || q.timeTarget > 400) err(f, `${w}: timeTarget must be int seconds 30-400`);
  if (NEEDS_STIM.includes(q.type) && !stimIds.has(q.stimulusId)) err(f, `${w}: ${q.type} needs stimulusId present in this file (got ${q.stimulusId})`);
  if (q.stimulusId && !stimIds.has(q.stimulusId)) err(f, `${w}: stimulusId ${q.stimulusId} not found`);

  if (q.format === 'mc') {
    if (q.type === 'DS') {
      if (q.choices) err(f, `${w}: DS must not have choices`);
      if (!/\(1\)/.test(q.prompt) || !/\(2\)/.test(q.prompt)) err(f, `${w}: DS prompt needs (1) and (2) statements`);
    } else {
      if (!Array.isArray(q.choices) || q.choices.length !== 5) err(f, `${w}: mc needs exactly 5 choices`);
      else {
        if (new Set(q.choices.map((c) => String(c).trim())).size !== 5) err(f, `${w}: duplicate choices`);
        if (q.choices.some((c) => /^\(?[A-E][).:]\s/.test(String(c)))) err(f, `${w}: remove letter prefixes from choices`);
      }
    }
    if (!isInt(q.answer) || q.answer < 0 || q.answer > 4) err(f, `${w}: mc answer must be int 0-4`);
  } else if (q.format === 'yesno') {
    if (!Array.isArray(q.statements) || q.statements.length !== 3) err(f, `${w}: yesno needs 3 statements`);
    if (!Array.isArray(q.labels) || q.labels.length !== 2) err(f, `${w}: yesno needs 2 labels`);
    if (!Array.isArray(q.answer) || q.answer.length !== 3 || q.answer.some((a) => a !== 0 && a !== 1)) err(f, `${w}: yesno answer must be [0|1 x3]`);
  } else if (q.format === 'dropdown') {
    if (!Array.isArray(q.blanks) || q.blanks.length !== 2) err(f, `${w}: dropdown needs 2 blanks`);
    if (!q.prompt.includes('[[1]]') || !q.prompt.includes('[[2]]')) err(f, `${w}: dropdown prompt needs [[1]] and [[2]]`);
    if (!Array.isArray(q.answer) || q.answer.length !== 2) err(f, `${w}: dropdown answer must be [i,j]`);
    else (q.blanks || []).forEach((b, i) => {
      if (!Array.isArray(b) || b.length < 2 || b.length > 6) err(f, `${w}: blank ${i} needs 2-6 options`);
      else if (!isInt(q.answer[i]) || q.answer[i] < 0 || q.answer[i] >= b.length) err(f, `${w}: answer[${i}] out of range`);
    });
  } else if (q.format === 'tpa') {
    if (!Array.isArray(q.labels) || q.labels.length !== 2) err(f, `${w}: tpa needs 2 labels`);
    if (!Array.isArray(q.choices) || q.choices.length < 4 || q.choices.length > 7) err(f, `${w}: tpa needs 4-7 choices`);
    if (!Array.isArray(q.answer) || q.answer.length !== 2 || q.answer.some((a) => !isInt(a) || a < 0 || a >= (q.choices || []).length)) err(f, `${w}: tpa answer must be [row,row]`);
  }
}

function validateQuestionFiles() {
  const seen = new Map();
  const files = existsSync(QDIR) ? readdirSync(QDIR).filter((n) => n.endsWith('.json') && n !== 'index.json').sort() : [];
  const index = [];
  const counts = {};
  for (const name of files) {
    const f = `questions/${name}`;
    let data;
    try { data = JSON.parse(readFileSync(join(QDIR, name), 'utf8')); } catch (e) { err(f, `invalid JSON: ${e.message}`); continue; }
    if (!data || !Array.isArray(data.questions) || !Array.isArray(data.stimuli)) { err(f, 'top level must be {stimuli:[], questions:[]}'); continue; }
    const stimIds = new Set();
    for (const s of data.stimuli) {
      if (stimIds.has(s.id) || seen.has('stim:' + s.id)) err(f, `duplicate stimulus id ${s.id}`);
      stimIds.add(s.id); seen.set('stim:' + s.id, f);
      checkStimulus(f, s);
    }
    for (const q of data.questions) {
      checkQuestion(f, q, stimIds, seen);
      const k = `${q.section}/${q.type}/${q.pool}`;
      counts[k] = (counts[k] || 0) + 1;
    }
    const used = new Set(data.questions.map((q) => q.stimulusId).filter(Boolean));
    for (const id of stimIds) if (!used.has(id)) warn(f, `stimulus ${id} is not used by any question`);
    index.push({ file: name, count: data.questions.length });
  }
  return { index, counts };
}

function validateLessons() {
  if (!existsSync(LDIR)) return [];
  const names = readdirSync(LDIR).filter((n) => n.endsWith('.md')).sort();
  for (const name of names) {
    const f = `lessons/${name}`;
    const md = readFileSync(join(LDIR, name), 'utf8');
    const h1 = md.match(/^# .+/gm) || [];
    if (h1.length !== 1) err(f, `needs exactly one H1, found ${h1.length}`);
    const opens = (md.match(/<details>/g) || []).length;
    const closes = (md.match(/<\/details>/g) || []).length;
    if (opens !== closes) err(f, `<details> open/close mismatch (${opens}/${closes})`);
    for (const m of md.matchAll(/^> \[!([A-Z]+)\]/gm)) if (!CALLOUTS.includes(m[1])) err(f, `unknown callout [!${m[1]}]`);
    if (/\$[^$\n]+\$/.test(md) && /\\(frac|sqrt|times)/.test(md)) err(f, 'LaTeX detected; use Unicode math');
    const words = md.split(/\s+/).length;
    if (words < 600) warn(f, `only ${words} words`);
  }
  return names.map((n) => basename(n, '.md'));
}

const { index, counts } = validateQuestionFiles();
const lessons = validateLessons();
if (args.has('--write-index')) {
  writeFileSync(join(QDIR, 'index.json'), JSON.stringify({ files: index.map((i) => i.file) }, null, 0) + '\n');
  writeFileSync(join(LDIR, 'index.json'), JSON.stringify({ lessons }, null, 0) + '\n');
}
if (!args.has('--quiet')) {
  console.log(`Question files: ${index.length}, questions: ${index.reduce((a, b) => a + b.count, 0)}, lessons: ${lessons.length}`);
  for (const k of Object.keys(counts).sort()) console.log(`  ${k}: ${counts[k]}`);
}
for (const w of warnings) console.log('WARN  ' + w);
for (const e of errors) console.log('ERROR ' + e);
console.log(errors.length ? `\n${errors.length} error(s), ${warnings.length} warning(s)` : `\nOK (${warnings.length} warning(s))`);
process.exit(errors.length ? 1 : 0);
