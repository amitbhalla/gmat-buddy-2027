// Loads and indexes all content files. Everything is fetched once and cached in memory.
const cache = new Map();

async function fetchJSON(path) {
  if (cache.has(path)) return cache.get(path);
  const p = fetch(path).then((r) => {
    if (!r.ok) throw new Error(`Failed to load ${path} (${r.status})`);
    return r.json();
  });
  cache.set(path, p);
  try {
    return await p;
  } catch (e) {
    cache.delete(path);
    throw e;
  }
}

async function fetchText(path) {
  if (cache.has(path)) return cache.get(path);
  const p = fetch(path).then((r) => {
    if (!r.ok) throw new Error(`Failed to load ${path} (${r.status})`);
    return r.text();
  });
  cache.set(path, p);
  try {
    return await p;
  } catch (e) {
    cache.delete(path);
    throw e;
  }
}

async function optionalJSON(path, fallback) {
  try {
    return await fetchJSON(path);
  } catch {
    return fallback;
  }
}

export const curriculum = () => fetchJSON('content/curriculum.json');
export const flashcards = () => optionalJSON('content/flashcards.json', []);
export const glossary = () => optionalJSON('content/glossary.json', []);
export const coach = () => optionalJSON('content/coach.json', {});
export const resources = () => optionalJSON('content/resources.json', []);
export const schools = () => optionalJSON('content/admissions/schools.json', []);
export const admissionsTimeline = () => optionalJSON('content/admissions/timeline.json', []);
export const lessonIndex = () => optionalJSON('content/lessons/index.json', { lessons: [] });

export async function lessonMarkdown(id) {
  return fetchText(`content/lessons/${id}.md`);
}

let bankPromise = null;

// Returns { questions: Map(id->q), stimuli: Map(id->s), list: q[] }
export function bank() {
  if (bankPromise) return bankPromise;
  bankPromise = (async () => {
    const index = await optionalJSON('content/questions/index.json', { files: [] });
    const files = await Promise.all(index.files.map((f) => optionalJSON(`content/questions/${f}`, { stimuli: [], questions: [] })));
    const questions = new Map();
    const stimuli = new Map();
    for (const data of files) {
      for (const s of data.stimuli || []) stimuli.set(s.id, s);
      for (const q of data.questions || []) questions.set(q.id, q);
    }
    const list = Array.from(questions.values());
    // Group questions that share a stimulus (RC passages, MSR sets) in stem order.
    const groups = new Map();
    for (const q of list) {
      if (q.stimulusId && (q.type === 'RC' || q.type === 'MSR')) {
        if (!groups.has(q.stimulusId)) groups.set(q.stimulusId, []);
        groups.get(q.stimulusId).push(q);
      }
    }
    return { questions, stimuli, list, groups };
  })();
  return bankPromise;
}

// Preload the essentials so the first screen is fast.
export function warm() {
  return Promise.all([curriculum(), bank(), coach()]);
}
