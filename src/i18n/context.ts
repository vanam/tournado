import { createContext } from 'react';
import type { I18nContext } from '../types';

export const LanguageContext = createContext<I18nContext | null>(null);
