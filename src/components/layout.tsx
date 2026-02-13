import { type ReactElement, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { LanguageSwitcher } from './languageSwitcher';
import { showToast } from './toastUtils';
import { ToastContainer } from './toast';

export const Layout = (): ReactElement => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  useEffect(() => {
    const handler = (e: Event): void => {
      const updateSW = (e as CustomEvent<{ updateSW: (reloadPage?: boolean) => Promise<void> }>).detail.updateSW;
      showToast({
        message: t('toast.newVersion'),
        action: { label: t('toast.reload'), onClick: (): void => { void updateSW(true); } },
        dismissLabel: t('toast.dismiss'),
        duration: Infinity,
      });
    };
    window.addEventListener('pwa-update-available', handler);
    return (): void => {
      window.removeEventListener('pwa-update-available', handler);
    };
  }, [t]);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] app-background flex flex-col">
      <nav className="bg-[var(--color-primary-dark)] text-[var(--color-surface)] shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-2 sm:py-3 flex items-center gap-4">
          <Link to="/" className="text-xl font-bold hover:text-[var(--color-primary)] transition-colors flex-1 flex items-center gap-3 min-w-0 truncate">
            <img
              src="/assets/icon.svg"
              alt=""
              className="h-10 w-10"
              aria-hidden="true"
            />
            {t('nav.title')}
          </Link>
          <LanguageSwitcher />
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
          </div>
        </div>
      </footer>
      <ToastContainer />
    </div>
  );
}
