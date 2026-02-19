import {type ReactElement, useEffect} from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import {useLocation} from "react-router-dom";
import {useAnalytics} from "@/utils/analytics";

export const FaqPage = (): ReactElement => {
  const { t } = useTranslation();
  const location = useLocation();
  const { tracker } = useAnalytics();
  useEffect(() => {
      tracker.trackPageView({})
  }, [location, tracker]);
  usePageTitle(t('faq.title'));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        {t('faq.title')}
      </h1>

      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('faq.formatSingleQuestion')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('faq.formatSingleAnswer')}
        </p>
      </div>
      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('faq.formatDoubleQuestion')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('faq.formatDoubleAnswer')}
        </p>
      </div>
      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('faq.formatRoundRobinQuestion')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('faq.formatRoundRobinAnswer')}
        </p>
      </div>
      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('faq.formatGroupsQuestion')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('faq.formatGroupsAnswer')}
        </p>
      </div>
      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('faq.luckyCardsQuestion')}
        </h2>
        <ol className="text-sm text-[var(--color-muted)] list-decimal list-inside space-y-2">
          <li>{t('faq.luckyCardsAnswer1')}</li>
          <li>{t('faq.luckyCardsAnswer2')}</li>
          <li>{t('faq.luckyCardsAnswer3')}</li>
          <li>{t('faq.luckyCardsAnswer4')}</li>
          <li>{t('faq.luckyCardsAnswer5')}</li>
          <li>{t('faq.luckyCardsAnswer6')}</li>
          <li>{t('faq.luckyCardsAnswer7')}</li>
        </ol>
      </div>

      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('faq.dataQuestion')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('faq.dataAnswer')}
        </p>
      </div>
    </div>
  );
}
