#!/usr/bin/env node
// Build the two VS Code webview entries (index = main game UI,
// certificate = journey certificate) as fully self-contained bundles.
// Run sequentially so the second build does not wipe the first's output.

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const vite = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');

function run(env) {
  const res = spawnSync(vite, ['build'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

run({ ENTRY: 'index', ENTRY_FIRST: '1' });
run({ ENTRY: 'certificate', ENTRY_FIRST: '0' });
