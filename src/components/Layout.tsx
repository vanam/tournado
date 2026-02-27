import type { ReactElement } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { usePwaUpdate } from '../hooks/usePwaUpdate';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { ToastContainer } from './Toast';

export const Layout = (): ReactElement => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  usePwaUpdate();

  return (
    <div className="min-h-screen bg-[var(--color-surface)] app-background flex flex-col">
      <nav className="bg-[var(--color-primary)] text-[var(--color-nav-text)] shadow-lg border-b border-[var(--color-primary)]/20">
        <div className="max-w-6xl mx-auto px-4 py-2 sm:py-3 flex items-center gap-4">
          <Link to="/" className="text-xl font-bold transition-colors flex-1 flex items-center gap-3 min-w-0 truncate">
            <img
              src="/assets/icon.svg"
              alt=""
              className="h-10 w-10"
              aria-hidden="true"
            />
            {t('nav.title')}
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--color-border-soft)] text-[var(--color-muted)]">
        <div className="max-w-6xl mx-auto px-4 py-5 text-sm flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-8 w-8 shrink-0 bg-current"
              aria-hidden="true"
              style={{
                maskImage: 'url(/assets/icon.svg)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
              }}
            />
            <span>{t('footer.text', { year })}</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2 sm:flex-row sm:items-center sm:gap-4 sm:text-left">
            <Link
              to="/formats"
              className="text-[var(--color-primary-dark)] hover:text-[var(--color-primary)] transition-colors"
            >
              {t('footer.formats')}
            </Link>
            <Link
              to="/faq"
              className="text-[var(--color-primary-dark)] hover:text-[var(--color-primary)] transition-colors"
            >
              {t('footer.faq')}
            </Link>
            <Link
              to="/credits"
              className="text-[var(--color-primary-dark)] hover:text-[var(--color-primary)] transition-colors"
            >
              {t('footer.credits')}
            </Link>
            <a
              href="https://github.com/vanam/tournado"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-primary-dark)] hover:text-[var(--color-primary)] transition-colors"
              aria-label="GitHub"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.465-2.381 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
      <ToastContainer />
    </div>
  );
}
