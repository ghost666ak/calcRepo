// Walk the build output and emit precache-manifest.json: a list of every
// file the PWA ships that should be cached at install time. The service
// worker fetches this at install and addAll()s every entry, so a freshly
// installed PWA is fully offline-capable without depending on runtime
// discovery catching every chunk.
//
// Runtime discovery (extractAssetUrls / extractManifestUrls inside sw.js)
// stays as a safety net for the case where the manifest is unreachable
// (e.g. mid-deploy, offline install, custom test harness).
//
// Usage:
//   node scripts/generate-precache-manifest.mjs           # writes to dist/
//   CALCREPO_OUTDIR=docs node scripts/generate-precache-manifest.mjs
//
// Files excluded from the manifest:
//   - *.map        (sourcemaps; not needed at runtime)
//   - precache-manifest.json itself (would loop on next install)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.resolve(root, process.env.CALCREPO_OUTDIR ?? 'dist');
const manifestPath = path.join(outDir, 'precache-manifest.json');

const EXCLUDE_NAMES = new Set(['precache-manifest.json']);
const EXCLUDE_EXT = new Set(['.map']);

function walk(dir, base = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(abs, base));
    } else if (entry.isFile()) {
      if (EXCLUDE_NAMES.has(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (EXCLUDE_EXT.has(ext)) continue;
      const rel = path.relative(base, abs).split(path.sep).join('/');
      files.push(rel);
    }
  }
  return files;
}

function main() {
  if (!fs.existsSync(outDir)) {
    console.error(`output directory not found: ${outDir}`);
    process.exit(1);
  }
  const files = walk(outDir).sort();
  const manifest = {
    // Hash of the manifest body (sorted paths + file sizes) gives the SW a
    // way to detect "this is a new build" without depending on a separately
    // versioned constant.
    generatedAt: new Date().toISOString(),
    files: files.map((rel) => {
      const abs = path.join(outDir, rel);
      const stat = fs.statSync(abs);
      return { path: rel, size: stat.size };
    }),
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`wrote ${path.relative(root, manifestPath)} (${files.length} files)`);
}

main();
