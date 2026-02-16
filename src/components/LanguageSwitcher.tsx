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
          className="appearance-none rounded border border-[var(--color-primary)] bg-[var(--color-primary-dark)] py-1 pl-8 pr-7 h-auto text-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">EN</SelectItem>
          <SelectItem value="cs">CS</SelectItem>
          <SelectItem value="de">DE</SelectItem>
          <SelectItem value="es">ES</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
