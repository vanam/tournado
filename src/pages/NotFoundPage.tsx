import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';

export const NotFoundPage = (): ReactElement => {
  const { t } = useTranslation();

  usePageTitle(t('notFound.title'));

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-8xl font-bold text-[var(--color-faintest)] select-none">404</h1>
      <p className="mt-4 text-xl text-[var(--color-muted)]">
        {t('notFound.message')}
      </p>
      <Link
        to="/"
        className="mt-6 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-lg font-medium shadow-sm hover:shadow-md hover:bg-[var(--color-primary-dark)] transition-all"
      >
        {t('notFound.backHome')}
      </Link>
    </div>
  );
};
