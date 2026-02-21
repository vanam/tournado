import { type ReactElement } from 'react';
import type { Group, Player, StandingsRow, ScoreMode } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';
import { indexToGroupLabel } from '../../utils/groupStageUtils';
import { TabBar } from '../common/TabBar';
import { RoundSchedule } from '../roundrobin/RoundSchedule';
import { StandingsTable } from '../roundrobin/StandingsTable';
import { ResultsMatrix } from '../roundrobin/ResultsMatrix';

type GroupTab = 'standings' | 'results' | 'schedule';

interface GroupCardProps {
  readonly group: Group;
  readonly groupIndex: number;
  readonly groupPlayers: Player[];
  readonly standings: StandingsRow[];
  readonly qualifierCount: number;
  readonly wildCardIds: Set<string> | null;
  readonly activeTab: GroupTab;
  readonly onTabChange: (tab: GroupTab) => void;
  readonly onEditMatch: (match: { id: string }) => void;
  readonly onPrint: () => void;
  readonly scoringMode: ScoreMode;
  readonly maxSets: number;
}

export const GroupCard = ({
  group,
  groupIndex,
  groupPlayers,
  standings,
  qualifierCount,
  wildCardIds,
  activeTab,
  onTabChange,
  onEditMatch,
  onPrint,
  scoringMode,
  maxSets,
}: GroupCardProps): ReactElement => {
  const { t } = useTranslation();

  const tabs: { id: GroupTab; label: string }[] = [
    { id: 'standings', label: t('roundRobin.standings') },
    { id: 'results', label: t('roundRobin.matrix') },
    { id: 'schedule', label: t('roundRobin.schedule') },
  ];

  return (
    <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-card)]">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-[var(--color-muted)]">
          {t('groupStage.groupTitle', { label: indexToGroupLabel(groupIndex) })}
        </div>
        <button
          onClick={onPrint}
          title={t('groupStage.printGroup')}
          className="p-1 rounded text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-soft)] transition-colors"
          aria-label={t('groupStage.printGroup')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
        </button>
      </div>
      <TabBar tabs={tabs} activeId={activeTab} onChange={onTabChange} />

      {activeTab === 'schedule' && (
        <RoundSchedule
          schedule={group.schedule}
          players={groupPlayers}
          onEditMatch={onEditMatch}
          scoringMode={scoringMode}
          maxSets={maxSets}
        />
      )}
      {activeTab === 'standings' && (
        <StandingsTable
          standings={standings}
          highlightCount={qualifierCount}
          wildCardIds={wildCardIds}
          scoringMode={scoringMode}
        />
      )}
      {activeTab === 'results' && (
        <ResultsMatrix
          schedule={group.schedule}
          players={groupPlayers}
          scoringMode={scoringMode}
          maxSets={maxSets}
        />
      )}
    </div>
  );
};
