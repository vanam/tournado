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
    <div className="border border-[var(--color-border)] rounded-xl p-4">
      <div className="text-sm font-semibold text-[var(--color-muted)] mb-4">
        {t('groupStage.groupTitle', { label: indexToGroupLabel(groupIndex) })}
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
