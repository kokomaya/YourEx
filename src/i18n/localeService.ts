import * as vscode from 'vscode';
import { type Locale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from './types';

export class LocaleService {
  private _locale: Locale;
  private _onLocaleChanged = new vscode.EventEmitter<Locale>();
  readonly onLocaleChanged = this._onLocaleChanged.event;

  constructor(initialLocale?: Locale) {
    this._locale = initialLocale ?? DEFAULT_LOCALE;
  }

  get locale(): Locale {
    return this._locale;
  }

  setLocale(locale: Locale): void {
    if (this._locale !== locale && SUPPORTED_LOCALES.includes(locale)) {
      this._locale = locale;
      this._onLocaleChanged.fire(locale);
    }
  }

  dispose(): void {
    this._onLocaleChanged.dispose();
  }
}

/**
 * Detect the best default locale from VS Code environment.
 */
export function detectDefaultLocale(): Locale {
  const vscodeLocale = vscode.env.language; // e.g. 'zh-cn', 'en'
  if (vscodeLocale.startsWith('zh')) return 'zh-CN';
  return 'en';
}

/**
 * Read the persisted locale from VS Code configuration.
 */
export function readLocaleFromConfig(): Locale | undefined {
  const raw = vscode.workspace.getConfiguration('yourex').get<string>('language');
  if (raw && SUPPORTED_LOCALES.includes(raw as Locale)) {
    return raw as Locale;
  }
  return undefined;
}
