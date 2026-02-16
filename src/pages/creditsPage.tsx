import type { ReactElement } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';

const backgroundImageUrl = 'https://www.dimensions.com/collection/table-tennis-ping-pong';

export const CreditsPage = (): ReactElement => {
  const { t } = useTranslation();

  usePageTitle(t('credits.title'));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        {t('credits.title')}
      </h1>
      <div className="mt-6 space-y-3">
        <p className="text-sm text-[var(--color-muted)]">
          {t('credits.backgroundImageLabel')}{' '}
          <a
            href={backgroundImageUrl}
            className="text-[var(--color-primary-dark)] hover:text-[var(--color-primary)]"
            target="_blank"
            rel="noopener noreferrer external"
            referrerPolicy="no-referrer"
          >
            {backgroundImageUrl}
          </a>
        </p>
      </div>
    </div>
  );
}
