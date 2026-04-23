export type Locale = 'zh-CN' | 'en';
export const DEFAULT_LOCALE: Locale = 'en';
export const SUPPORTED_LOCALES: readonly Locale[] = ['zh-CN', 'en'] as const;

export const LOCALE_LABELS: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'en': 'English',
};
