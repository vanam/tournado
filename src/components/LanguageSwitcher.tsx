import { useTranslation } from '../i18n/useTranslation';
import type { LanguageKey } from '../types';
import type { ChangeEvent, ReactElement } from 'react';

export const LanguageSwitcher = (): ReactElement => {
  const { language, setLanguage } = useTranslation();

  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    setLanguage(event.target.value as LanguageKey);
  }

  return (
    <div className="relative inline-flex items-center text-sm">
      <img
        src="/assets/lang.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-2 h-4 w-4"
      />
      <select
        aria-label="Language"
        value={language}
        onChange={handleChange}
        className="appearance-none rounded border border-[var(--color-primary)] bg-[var(--color-primary-dark)] py-1 pl-8 pr-7 text-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        <option value="en">EN</option>
        <option value="cs">CS</option>
        <option value="de">DE</option>
        <option value="es">ES</option>
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[var(--color-surface)]"
        fill="currentColor"
      >
        <path d="M5.5 7.5 10 12l4.5-4.5h-9z" />
      </svg>
    </div>
  );
}
