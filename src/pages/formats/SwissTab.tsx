import type { ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { SwissStandingsTable } from '../../components/swiss/SwissStandingsTable';
import { RoundSchedule } from '../../components/roundrobin/RoundSchedule';
import { computeSwissStandings } from '../../utils/swissUtils';
import { ScoreMode } from '../../types';
import { SWISS_PLAYERS, SWISS_SCHEDULE } from './exampleData';

const SWISS_STANDINGS = computeSwissStandings(SWISS_SCHEDULE, SWISS_PLAYERS);

export const SwissTab = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.howItWorks')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.swiss.description')}
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.swiss.pairing')}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.tiebreaking')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.swiss.tiebreaking')}
        </p>
        <ol className="text-sm text-[var(--color-muted)] list-decimal list-inside space-y-1 pl-1">
          <li>{t('formats.swiss.tiebreaking.item1')}</li>
          <li>{t('formats.swiss.tiebreaking.item2')}</li>
          <li>{t('formats.swiss.tiebreaking.item3')}</li>
          <li>{t('formats.swiss.tiebreaking.item4')}</li>
          <li>{t('formats.swiss.tiebreaking.item5')}</li>
          <li>{t('formats.swiss.tiebreaking.item6')}</li>
        </ol>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.swiss.tiebreaking.equal')}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.example')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.swiss.example.intro')}
        </p>
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            {t('swiss.schedule')}
          </h3>
          <RoundSchedule
            schedule={SWISS_SCHEDULE}
            players={SWISS_PLAYERS}
            onEditMatch={() => {}}
            scoringMode={ScoreMode.SETS}
            roundLabelKey="swiss.round"
            byeLabelKey="swiss.bye"
          />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            {t('swiss.standings')}
          </h3>
          <div className="overflow-x-auto">
            <SwissStandingsTable standings={SWISS_STANDINGS} />
          </div>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.swiss.example.explanation')}
        </p>
      </section>
    </div>
  );
};
