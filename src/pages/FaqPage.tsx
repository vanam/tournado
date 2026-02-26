import { type ReactElement, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import { useLocation, Link } from 'react-router-dom';
import { useAnalytics } from '@/utils/analytics';

export const FaqPage = (): ReactElement => {
  const { t } = useTranslation();
  const location = useLocation();
  const { tracker } = useAnalytics();
  useEffect(() => {
    tracker.trackPageView({});
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
        <Link to="/formats?tab=SINGLE_ELIM" className="inline-block text-sm text-[var(--color-accent)] hover:underline">
          {t('faq.learnMore')}
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('faq.formatDoubleQuestion')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('faq.formatDoubleAnswer')}
        </p>
        <Link to="/formats?tab=DOUBLE_ELIM" className="inline-block text-sm text-[var(--color-accent)] hover:underline">
          {t('faq.learnMore')}
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('faq.formatRoundRobinQuestion')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('faq.formatRoundRobinAnswer')}
        </p>
        <Link to="/formats?tab=ROUND_ROBIN" className="inline-block text-sm text-[var(--color-accent)] hover:underline">
          {t('faq.learnMore')}
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('faq.formatGroupsQuestion')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('faq.formatGroupsAnswer')}
        </p>
        <Link to="/formats?tab=GROUPS_TO_BRACKET" className="inline-block text-sm text-[var(--color-accent)] hover:underline">
          {t('faq.learnMore')}
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          {t('faq.formatSwissQuestion')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('faq.formatSwissAnswer')}
        </p>
        <Link to="/formats?tab=SWISS" className="inline-block text-sm text-[var(--color-accent)] hover:underline">
          {t('faq.learnMore')}
        </Link>
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
};
