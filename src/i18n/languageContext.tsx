import { useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { I18nContext, LanguageKey, TranslationMap, TranslationValue } from '../types';
import { en, cs, de, es } from './translations';
import { LanguageContext } from './context';

const translations: Record<LanguageKey, TranslationMap> = { en, cs, de, es };
const STORAGE_KEY = 'tt-lang';

function detectLanguage(): LanguageKey {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in translations) return stored as LanguageKey;
  const nav = navigator.language || '';
  if (nav.startsWith('cs')) return 'cs';
  if (nav.startsWith('de')) return 'de';
  if (nav.startsWith('es')) return 'es';
  return 'en';
}

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps): ReactElement => {
  const [language, setLanguageState] = useState<LanguageKey>(detectLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const pluralRules = useMemo(() => new Intl.PluralRules(language), [language]);

  const setLanguage = useCallback<I18nContext['setLanguage']>((lang) => {
    const nextLanguage = lang in translations ? lang : 'en';
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
  }, []);

  const t = useCallback<I18nContext['t']>(
    (key, params) => {
      const entry: TranslationValue | undefined = translations[language][key];
      let str: TranslationValue | string = entry ?? key;

      if (entry && typeof entry === 'object') {
        const countValue = params && 'count' in params ? Number(params['count']) : null;
        if (countValue !== null && !Number.isNaN(countValue)) {
          const category = pluralRules.select(countValue);
          str = entry[category] ?? entry['other'] ?? entry['many'] ?? entry['few'] ?? entry['one'] ?? key;
        } else {
          str = entry['other'] ?? entry['many'] ?? entry['few'] ?? entry['one'] ?? key;
        }
      }

      if (typeof str !== 'string') {
        str = JSON.stringify(str);
      }

      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replaceAll(new RegExp(`{{${k}}}`, 'g'), String(v));
        }
      }
      return str;
    },
    [language, pluralRules],
  );

  const value = useMemo<I18nContext>(() => ({ t, language, setLanguage }), [t, language, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
