import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Per-entry build target. Two separate builds (one for each VS Code webview
// HTML entry) so each output bundle is fully self-contained — no shared
// chunks that would require 'strict-dynamic' in the webview CSP.
//
// Pass the entry name via the ENTRY env var:
//   ENTRY=index npx vite build           → dist/assets/index.{js,css}
//   ENTRY=certificate npx vite build     → dist/assets/certificate.{js,css}
//
// build.emptyOutDir is true only for the first run so the second run
// preserves the first's output. Controlled via ENTRY_FIRST=1.
export default defineConfig(() => {
  const entry = process.env.ENTRY || 'index';
  const isFirst = process.env.ENTRY_FIRST === '1';
  const htmlFile = entry === 'certificate' ? 'certificate.html' : 'index.html';

  return {
    plugins: [react()],
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: isFirst,
      rollupOptions: {
        input: resolve(__dirname, htmlFile),
        output: {
          entryFileNames: `assets/${entry}.js`,
          chunkFileNames: `assets/${entry}-[name].js`,
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return `assets/${entry}.css`;
            }
            return 'assets/[name].[ext]';
          },
          inlineDynamicImports: true,
        },
      },
    },
  };
});
