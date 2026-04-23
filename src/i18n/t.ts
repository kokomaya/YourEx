import * as fs from 'fs';
import * as path from 'path';
import type { Locale } from './types';
import { DEFAULT_LOCALE } from './types';

type UIStrings = Record<string, string>;

let currentStrings: UIStrings = {};
let fallbackStrings: UIStrings = {};
let uiDataDir: string | null = null;

export function setUIDataDir(dir: string): void {
  uiDataDir = dir;
}

function getUIDataDir(): string {
  if (uiDataDir) return uiDataDir;
  // Try compiled output location first, then fall back to src/
  const candidates = [
    path.join(__dirname, '..', 'data', 'ui'),
    path.join(__dirname, '..', '..', 'src', 'data', 'ui'),
  ];
  return candidates.find(d => fs.existsSync(d)) ?? candidates[0];
}

function loadStrings(locale: Locale): UIStrings {
  const filePath = path.join(getUIDataDir(), `${locale}.json`);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

export function initTranslations(locale: Locale): void {
  fallbackStrings = loadStrings(DEFAULT_LOCALE);
  currentStrings = locale === DEFAULT_LOCALE ? fallbackStrings : loadStrings(locale);
}

/**
 * Translate a UI string key with optional parameter interpolation.
 * Parameters use `{paramName}` syntax.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let text = currentStrings[key] ?? fallbackStrings[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}
