#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = process.cwd();
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const DIST_DIR = path.join(ROOT, 'dist');

function run(command) {
  cp.execSync(command, { cwd: ROOT, stdio: 'inherit' });
}

function usage() {
  console.log('Usage: node scripts/package-vsix.cjs <dev|prod> [--dry-run]');
}

function patchConfig(pkg, mode) {
  const patched = structuredClone(pkg);
  const properties = patched?.contributes?.configuration?.properties;
  if (!properties) {
    throw new Error('Invalid package.json: contributes.configuration.properties not found');
  }

  const defaultMode = properties['yourex.mode.default'];
  const allowDeveloper = properties['yourex.mode.allowDeveloper'];
  if (!defaultMode || !allowDeveloper) {
    throw new Error('Missing yourex.mode.default or yourex.mode.allowDeveloper in package.json');
  }

  if (mode === 'dev') {
    defaultMode.default = 'developer';
    allowDeveloper.default = true;
  } else {
    defaultMode.default = 'user';
    allowDeveloper.default = false;
  }

  return patched;
}

function main() {
  const [, , modeArg, ...rest] = process.argv;
  const dryRun = rest.includes('--dry-run');

  if (!modeArg || !['dev', 'prod'].includes(modeArg)) {
    usage();
    process.exit(1);
  }

  if (!fs.existsSync(PACKAGE_JSON)) {
    throw new Error('package.json not found in current working directory');
  }

  const raw = fs.readFileSync(PACKAGE_JSON, 'utf-8');
  const pkg = JSON.parse(raw);
  const patched = patchConfig(pkg, modeArg);

  const baseName = `${pkg.name}-${pkg.version}-${modeArg}.vsix`;
  const outputPath = path.join('dist', baseName);

  if (dryRun) {
    console.log('[dry-run] Mode:', modeArg);
    console.log('[dry-run] VSIX:', outputPath);
    console.log('[dry-run] default mode:', patched.contributes.configuration.properties['yourex.mode.default'].default);
    console.log('[dry-run] allowDeveloper:', patched.contributes.configuration.properties['yourex.mode.allowDeveloper'].default);
    return;
  }

  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Keep source clean: patch only for packaging and always restore afterwards.
  fs.writeFileSync(PACKAGE_JSON, `${JSON.stringify(patched, null, 2)}\n`, 'utf-8');

  try {
    run('npm run build');
    run(`npx @vscode/vsce package --no-dependencies -o "${outputPath}"`);
    console.log(`[ok] VSIX generated: ${outputPath}`);
  } finally {
    fs.writeFileSync(PACKAGE_JSON, raw, 'utf-8');
  }
}

main();
