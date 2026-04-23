import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

export type Locale = 'zh-CN' | 'en';

const LOCALE_MAP: Record<Locale, Record<string, string>> = {
  'zh-CN': zhCN,
  'en': en,
};

const DEFAULT_LOCALE: Locale = 'en';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);

  const setLocale = useCallback((newLocale: Locale) => {
    if (LOCALE_MAP[newLocale]) {
      setLocaleState(newLocale);
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = LOCALE_MAP[locale]?.[key] ?? LOCALE_MAP[DEFAULT_LOCALE]?.[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return ctx;
}
