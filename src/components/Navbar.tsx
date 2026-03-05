import { useState } from 'react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

export const Navbar = (): ReactElement => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = (): void => { setMenuOpen(false); };

  return (
    <nav className="bg-[var(--color-primary)] text-[var(--color-nav-text)] shadow-lg border-b border-[var(--color-primary)]/20">
      <div className="max-w-6xl mx-auto px-4 py-2 sm:py-3 flex items-center gap-2">
        {/* Logo + title */}
        <Link
          to="/"
          className="text-xl font-bold transition-colors flex-1 flex items-center gap-3 min-w-0 truncate"
          onClick={closeMenu}
        >
          <img src="/assets/icon.svg" alt="" className="h-10 w-10 shrink-0" aria-hidden="true" />
          <span className="truncate">{t('nav.title')}</span>
        </Link>

        {/* Desktop nav links */}
        <Link
          to="/features"
          className="hidden sm:block text-sm font-medium text-[var(--color-nav-text)] opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap"
        >
          {t('nav.features')}
        </Link>

        {/* Controls — always visible */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className="sm:hidden flex items-center justify-center p-2 rounded-md opacity-80 hover:opacity-100 transition-opacity"
          aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={menuOpen}
          onClick={() => { setMenuOpen((v) => !v); }}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-[var(--color-primary)]/20">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col">
            <Link
              to="/features"
              className="text-sm font-medium text-[var(--color-nav-text)] opacity-80 hover:opacity-100 transition-opacity py-2"
              onClick={closeMenu}
            >
              {t('nav.features')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
