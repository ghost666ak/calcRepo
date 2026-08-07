import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path matches the GitHub Pages project URL: https://<user>.github.io/calcRepo/
// The relative `./` form also works but absolute paths are more robust for SW scoping.
// Override at build time with `vite build --outDir docs` to publish via GitHub Pages
// "Deploy from a branch" /docs source (no Actions required).
export default defineConfig({
  plugins: [react()],
  base: process.env['CALCREPO_BASE'] ?? '/calcRepo/',
  build: {
    target: 'es2022',
    sourcemap: true,
    outDir: process.env['CALCREPO_OUTDIR'] ?? 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});