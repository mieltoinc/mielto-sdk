// Vite configuration for browser example
// Note: This file requires vite to be installed: npm install -D vite

import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: resolve(__dirname),
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      external: [
        // Node.js-only modules that shouldn't be bundled for browser
        'fs/promises',
        'path',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      // Stub out Node.js-only modules for browser builds
      'fs/promises': resolve(__dirname, '../../src/browser-stubs/fs-promises.js'),
      'path': resolve(__dirname, '../../src/browser-stubs/path.js'),
    },
  },
  optimizeDeps: {
    exclude: [
      // Exclude Node.js-only dependencies from pre-bundling
      'fs/promises',
      'path',
    ],
  },
  define: {
    // Define process for browser compatibility check
    'process.env': '{}',
  },
  server: {
    port: 5173,
    open: true,
  },
});

