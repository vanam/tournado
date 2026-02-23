import { useTranslation } from '../i18n/useTranslation';
import type { LanguageKey } from '../types';
import type { ReactElement } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

export const LanguageSwitcher = (): ReactElement => {
  const { language, setLanguage } = useTranslation();

  function handleChange(value: string): void {
    setLanguage(value as LanguageKey);
  }

  return (
    <div className="relative inline-flex items-center text-sm">
      <img
        src="/assets/lang.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-2 h-4 w-4 z-10"
      />
      <Select value={language} onValueChange={handleChange}>
        <SelectTrigger
          aria-label="Language"
          className="appearance-none rounded-md border border-(--color-primary-dark) bg-(--color-primary) hover:bg-(--color-primary-dark) py-1 pl-8 pr-1 h-8 text-(--color-nav-text) focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:ring-offset-2 transition-colors [&>svg]:ml-1"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-(--color-surface) border-(--color-primary) min-w-16 rounded-md">
          <SelectItem value="en" className="focus:bg-(--color-primary) focus:text-white">EN</SelectItem>
          <SelectItem value="cs" className="focus:bg-(--color-primary) focus:text-white">CS</SelectItem>
          <SelectItem value="de" className="focus:bg-(--color-primary) focus:text-white">DE</SelectItem>
          <SelectItem value="es" className="focus:bg-(--color-primary) focus:text-white">ES</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
