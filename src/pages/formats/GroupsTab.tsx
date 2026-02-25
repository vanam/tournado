import type { ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { StandingsTable } from '../../components/roundrobin/StandingsTable';
import { RoundSchedule } from '../../components/roundrobin/RoundSchedule';
import { computeStandings } from '../../utils/roundRobinUtils';
import { ScoreMode } from '../../types';
import { GROUPS_PLAYERS, GROUPS_SCHEDULE } from './exampleData';

const GROUPS_STANDINGS = computeStandings(GROUPS_SCHEDULE, GROUPS_PLAYERS, { scoringMode: ScoreMode.SETS });

export const GroupsTab = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.howItWorks')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.groups.description')}
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.groups.groupPhase')}
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.groups.playoff')}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.tiebreaking')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.groups.tiebreaking')}
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

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.example')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.groups.example.intro')}
        </p>
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            {t('roundRobin.schedule')}
          </h3>
          <RoundSchedule
            schedule={GROUPS_SCHEDULE}
            players={GROUPS_PLAYERS}
            onEditMatch={() => {}}
            scoringMode={ScoreMode.SETS}
          />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            {t('roundRobin.standings')}
          </h3>
          <div className="overflow-x-auto">
            <StandingsTable standings={GROUPS_STANDINGS} highlightCount={2} scoringMode={ScoreMode.SETS} />
          </div>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.groups.example.explanation')}
        </p>
      </section>
    </div>
  );
};
