import { useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';

export function usePageTitle(pageTitle?: string  ): void {
  const { t } = useTranslation();

  useEffect(() => {
    const brand = t('nav.title');
    document.title = pageTitle ? `${pageTitle} | ${brand}` : brand;

    const description = t('meta.description');
    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.append(metaDesc);
    }
    metaDesc.content = description;
  }, [pageTitle, t]);
}
