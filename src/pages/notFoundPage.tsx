import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';

export const NotFoundPage = (): ReactElement => {
  const { t } = useTranslation();

  usePageTitle(t('notFound.title'));

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-[var(--color-text)]">404</h1>
      <p className="mt-4 text-xl text-[var(--color-muted)]">
        {t('notFound.message')}
      </p>
      <Link
        to="/"
        className="mt-6 px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-90 transition-opacity"
      >
        {t('notFound.backHome')}
      </Link>
    </div>
  );
};
