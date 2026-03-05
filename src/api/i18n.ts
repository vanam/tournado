import type { LanguageKey, TranslationValue } from '../types';
import { en, cs, de, es } from '../i18n/translations';

const translations: Record<LanguageKey, Record<string, TranslationValue>> = { en, cs, de, es };

function parseLocale(acceptLanguage: string | null): LanguageKey {
  if (acceptLanguage === null) return 'en';
  for (const part of acceptLanguage.split(',')) {
    const tag = (part.split(';')[0] ?? '').trim().toLowerCase();
    if (tag.startsWith('cs')) return 'cs';
    if (tag.startsWith('de')) return 'de';
    if (tag.startsWith('es')) return 'es';
    if (tag.startsWith('en')) return 'en';
  }
  return 'en';
}

export function getTranslator(request: Request): (key: string, params?: Record<string, string | number>) => string {
  const locale = parseLocale(request.headers.get('Accept-Language'));
  const map = translations[locale];
  const pluralRules = new Intl.PluralRules(locale);

  return function t(key: string, params?: Record<string, string | number>): string {
    const entry: TranslationValue | undefined = map[key];
    let str: string;

    if (entry === undefined) {
      str = key;
    } else if (typeof entry === 'string') {
      str = entry;
    } else {
      const countValue = params !== undefined && 'count' in params ? Number(params['count']) : null;
      if (countValue !== null && !Number.isNaN(countValue)) {
        const category = pluralRules.select(countValue);
        str = entry[category] ?? entry['other'] ?? entry['many'] ?? entry['few'] ?? entry['one'] ?? key;
      } else {
        str = entry['other'] ?? entry['many'] ?? entry['few'] ?? entry['one'] ?? key;
      }
    }

    if (params !== undefined) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(new RegExp(`{{${k}}}`, 'g'), String(v));
      }
    }
    return str;
  };
}
