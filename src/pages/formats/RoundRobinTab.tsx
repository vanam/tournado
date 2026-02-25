import type { ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { ResultsMatrix } from '../../components/roundrobin/ResultsMatrix';
import { ScoreMode } from '../../types';
import { RR_PLAYERS, RR_SCHEDULE } from './exampleData';

export const RoundRobinTab = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.howItWorks')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.roundRobin.description')}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.tiebreaking')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.roundRobin.tiebreaking.intro')}
        </p>
        <ol className="text-sm text-[var(--color-muted)] list-decimal list-inside space-y-1 pl-1">
          <li>{t('formats.roundRobin.tiebreaking.item1')}</li>
          <li>{t('formats.roundRobin.tiebreaking.item2')}</li>
          <li>{t('formats.roundRobin.tiebreaking.item3')}</li>
          <li>{t('formats.roundRobin.tiebreaking.item4')}</li>
          <li>{t('formats.roundRobin.tiebreaking.item5')}</li>
          <li>{t('formats.roundRobin.tiebreaking.item6')}</li>
        </ol>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.roundRobin.tiebreaking.equal')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.example')}
        </h2>
        <div className="overflow-x-auto">
          <ResultsMatrix players={RR_PLAYERS} schedule={RR_SCHEDULE} scoringMode={ScoreMode.POINTS} />
        </div>
      </section>
    </div>
  );
};
