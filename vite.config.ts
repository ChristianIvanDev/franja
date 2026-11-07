/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Publicado en GitHub Pages bajo /franja/
  base: process.env.GITHUB_PAGES ? '/franja/' : '/',
  plugins: [react()],
  test: { environment: 'node' },
});
