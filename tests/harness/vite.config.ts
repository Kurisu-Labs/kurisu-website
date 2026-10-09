import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../..', import.meta.url)),
      'next/link': fileURLToPath(new URL('./link.tsx', import.meta.url)),
    },
  },
  server: { host: '127.0.0.1', port: 4173, strictPort: true },
  // This renderer is intentionally not a Next route or a deployable build mode.
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  css: { postcss: fileURLToPath(new URL('../..', import.meta.url)) },
});
