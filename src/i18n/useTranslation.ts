import { useContext } from 'react';
import type { I18nContext } from '../types';
import { LanguageContext } from './context';

export function useTranslation(): I18nContext {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return context;
}
