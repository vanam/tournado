import { useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';

export function usePageTitle(pageTitle?: string  ): void {
  const { t } = useTranslation();

  useEffect(() => {
    const brand = t('nav.title');
    document.title = pageTitle ? `${pageTitle} | ${brand}` : brand;
  }, [pageTitle, t]);
}
