import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static site base is '/' so the built site works on GitHub Pages or any static host.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});