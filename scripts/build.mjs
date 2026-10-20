import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['css', 'js', 'vendor', 'icons', 'img', 'content'];
const SINGLES = ['index.html', 'manifest.webmanifest'];
const SKIP = new Set(['research', 'scripts', 'tests', 'node_modules', '.git']);

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(path.relative(ROOT, full).split(path.sep).join('/'));
  }
}

function collect() {
  const files = SINGLES.filter((f) => fs.existsSync(path.join(ROOT, f)));
  for (const d of DIRS) {
    const dir = path.join(ROOT, d);
    if (fs.existsSync(dir)) walk(dir, files);
  }
  return [...new Set(files)].sort();
}

const validate = spawnSync(process.execPath, [path.join(ROOT, 'scripts/validate-content.mjs'), '--write-index'], {
  cwd: ROOT,
  stdio: 'inherit'
});
if (validate.status !== 0) {
  console.error('Content validation failed; aborting build.');
  process.exit(1);
}

const files = collect();
const hash = createHash('sha256');
for (const f of files) hash.update(fs.readFileSync(path.join(ROOT, f)));
const version = hash.digest('hex').slice(0, 12);

fs.writeFileSync(
  path.join(ROOT, 'precache.json'),
  JSON.stringify({ version, files: files.map((f) => './' + f) }, null, 2) + '\n'
);
console.log(`precache.json written: ${files.length} files, version ${version}`);
