// --- Toast ---

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  message: string;
  action?: ToastAction;
  dismissLabel?: string;
  duration?: number;
}

// --- i18n ---

export type LanguageKey = 'en' | 'cs' | 'de' | 'es';

export type TranslationValue = string | Record<string, string>;

export type TranslationMap = Record<string, TranslationValue>;

export interface I18nContext {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: LanguageKey;
  setLanguage: (lang: LanguageKey) => void;
}
