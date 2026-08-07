import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE = path.join(ROOT, 'public', 'pwa', 'icon.svg');
const MASKABLE = path.join(ROOT, 'public', 'pwa', 'icon-maskable.svg');

const TARGETS: { source: string; out: string; size: number }[] = [
  { source: SOURCE, out: path.join(ROOT, 'public', 'pwa', 'icon-192.png'), size: 192 },
  { source: SOURCE, out: path.join(ROOT, 'public', 'pwa', 'icon-512.png'), size: 512 },
  { source: MASKABLE, out: path.join(ROOT, 'public', 'pwa', 'icon-maskable-512.png'), size: 512 },
];

async function ensureDir(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function renderPng(source: string, out: string, size: number): Promise<void> {
  const svg = await readFile(source);
  const png = await sharp(svg).resize(size, size, { fit: 'cover' }).png().toBuffer();
  await ensureDir(out);
  await writeFile(out, png);
  console.log(`wrote ${path.relative(ROOT, out)} (${size}x${size})`);
}

async function main(): Promise<void> {
  for (const target of TARGETS) {
    await renderPng(target.source, target.out, target.size);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});