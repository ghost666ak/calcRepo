// Generate PWA install screenshots by composing SVG frames that mirror the
// actual app's dark-theme visual identity, then rasterizing via @resvg/resvg-js.
// This avoids needing a headless browser in environments without Chromium libs.
//
// Usage: node scripts/generate-pwa-screenshots.mjs
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const targets = (process.env.CALCREPO_OUTDIR ? path.join(root, process.env.CALCREPO_OUTDIR) : path.join(root, 'dist'));
const outDir = path.join(targets, 'pwa');

const BG = '#020617';
const SURFACE = '#0f172a';
const SURFACE_2 = '#1e293b';
const FG = '#e2e8f0';
const MUTED = '#94a3b8';
const ACCENT = '#38bdf8';
const KEY_NUM = '#1e293b';
const KEY_FUNC = '#172033';

function key(x, y, w, h, label, opts = {}) {
  const fill = opts.fill ?? KEY_NUM;
  const stroke = opts.stroke ?? '#1f2a44';
  const color = opts.color ?? FG;
  const size = opts.size ?? 22;
  const weight = opts.weight ?? 600;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" ry="14" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
      <text x="${x + w / 2}" y="${y + h / 2 + size * 0.34}" text-anchor="middle"
            font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
            font-size="${size}" font-weight="${weight}" fill="${color}">${label}</text>
    </g>`;
}

function tab(x, y, w, h, label, active) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" ry="14" fill="${active ? ACCENT : SURFACE_2}" opacity="${active ? 1 : 0.85}"/>
      <text x="${x + w / 2}" y="${y + h / 2 + 8}" text-anchor="middle"
            font-family="system-ui, sans-serif" font-size="16" font-weight="600"
            fill="${active ? '#0f172a' : FG}">${label}</text>
    </g>`;
}

function header(mode) {
  const tabs = ['basic', 'scientific', 'base', 'programmer', 'tools'];
  const labels = ['Basic', 'Scientific', 'Base', 'Programmer', 'Tools'];
  const startX = 32;
  const tabW = 116;
  const tabH = 36;
  const gap = 8;
  const y = 24;
  const tabSvgs = tabs
    .map((m, i) => tab(startX + i * (tabW + gap), y, tabW, tabH, labels[i], m === mode))
    .join('\n');
  return `
    <rect x="0" y="0" width="${this.width}" height="84" fill="${SURFACE}"/>
    <g font-family="system-ui, sans-serif">
      <text x="32" y="62" font-size="22" font-weight="700" fill="${FG}">calcRepo</text>
      <text x="32" y="78" font-size="11" font-weight="500" fill="${MUTED}">developer calculator</text>
    </g>
    ${tabSvgs}
    <circle cx="${this.width - 40}" cy="42" r="14" fill="${SURFACE_2}"/>
    <text x="${this.width - 40}" y="48" text-anchor="middle" font-family="system-ui, sans-serif"
          font-size="16" font-weight="700" fill="${FG}">⚙</text>`;
}

function display(expr, result, opts = {}) {
  const x = 32;
  const y = opts.y ?? 104;
  const w = this.width - 64;
  const h = opts.h ?? 120;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${SURFACE}" stroke="${SURFACE_2}" stroke-width="1"/>
      <text x="${x + 24}" y="${y + 44}" font-family="ui-monospace, monospace"
            font-size="22" fill="${MUTED}">${expr}</text>
      <text x="${x + w - 24}" y="${y + h - 28}" text-anchor="end"
            font-family="ui-monospace, monospace" font-size="42" font-weight="600"
            fill="${FG}">${result}</text>
    </g>`;
}

function basicKeypad(startX, startY, keyW, keyH, gap) {
  const rows = [
    ['AC', '±', '%', '÷', { l: '7' }, { l: '8' }, { l: '9' }, '×'],
    [{ l: '4' }, { l: '5' }, { l: '6' }, '−', 'C', '⟵', '⏎', { l: '0' }],
    [{ l: '1' }, { l: '2' }, { l: '3' }, '+', '.', '(', ')', { l: '=' }],
  ];
  let out = '';
  rows.forEach((row, ri) => {
    const cols = row.length;
    const totalW = cols * keyW + (cols - 1) * gap;
    const rowX = startX + (this.width - 64 - totalW) / 2;
    row.forEach((cell, ci) => {
      const x = rowX + ci * (keyW + gap);
      const y = startY + ri * (keyH + gap);
      if (typeof cell === 'string') {
        const isOp = ['÷', '×', '−', '+', '='].includes(cell);
        const isFunc = ['AC', '±', '%', 'C', '⟵', '⏎', '.', '(', ')'].includes(cell);
        const fill = isOp ? ACCENT : isFunc ? KEY_FUNC : KEY_NUM;
        const color = isOp ? '#0f172a' : FG;
        out += key.call(this, x, y, keyW, keyH, cell, { fill, color, weight: isOp ? 700 : 500 });
      } else {
        out += key.call(this, x, y, keyW, keyH, cell.l, { fill: KEY_NUM, color: FG });
      }
    });
  });
  return out;
}

function scientificExtra(startX, startY, keyW, keyH, gap) {
  const cells = ['sin', 'cos', 'tan', 'π', 'e', '^', 'log', 'ln'];
  let out = '';
  const totalW = cells.length * keyW + (cells.length - 1) * gap;
  const rowX = startX + (this.width - 64 - totalW) / 2;
  cells.forEach((label, i) => {
    const x = rowX + i * (keyW + gap);
    out += key.call(this, x, startY, keyW, keyH, label, { fill: KEY_FUNC, size: 16, color: ACCENT });
  });
  return out;
}

function frame({ width, height, mode }) {
  this.width = width;
  const headerSvg = header.call(this, mode);
  let body = '';
  const padY = 104;
  if (mode === 'basic') {
    body += display.call(this, '128 × (6 + 5) + 12', '1288', { y: padY, h: 120 });
    const kY = padY + 120 + 24;
    const kH = (height - kY - 32 - 64) / 3;
    const kW = 100;
    body += basicKeypad.call(this, 0, kY, kW, kH, 12);
  } else if (mode === 'scientific') {
    body += display.call(this, 'sin(30°) + log(1000)', '9.5', { y: padY, h: 120 });
    const kY = padY + 120 + 16;
    const kH = (height - kY - 32 - 56) / 4;
    const kW = 92;
    body += scientificExtra.call(this, 0, kY, kW, kH, 10);
    body += basicKeypad.call(this, 0, kY + kH + 10, kW, kH, 10);
  }
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${BG}"/>
      ${headerSvg}
      ${body}
    </svg>`;
}

function rasterize(svg, outPath, width) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: BG,
    font: { loadSystemFonts: true },
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(outPath, png);
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function main() {
  ensureDir(outDir);
  const targets = [
    { name: 'screenshot-basic.png', width: 1280, height: 720, mode: 'basic' },
    { name: 'screenshot-scientific.png', width: 1280, height: 720, mode: 'scientific' },
    { name: 'screenshot-basic-narrow.png', width: 720, height: 1280, mode: 'basic' },
  ];
  for (const t of targets) {
    const svg = frame.call(t, t);
    const outPath = path.join(outDir, t.name);
    rasterize(svg, outPath, t.width);
    const size = fs.statSync(outPath).size;
    console.log(`wrote ${path.relative(root, outPath)} (${(size / 1024).toFixed(1)} KB)`);
  }
}

main();