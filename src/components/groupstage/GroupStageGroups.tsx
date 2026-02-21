import { type ReactElement, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { GroupStage, Player, StandingsRow, ScoreMode } from '../../types';
import { getGroupPlayers, indexToGroupLabel } from '../../utils/groupStageUtils';
import { useTranslation } from '../../i18n/useTranslation';
import { GroupCard } from './GroupCard';
import { GroupPrintView } from './GroupPrintView';
import type { GroupPrintData } from './GroupPrintView';

type GroupTab = 'standings' | 'results' | 'schedule';

interface GroupStandingsEntry {
  groupId: string;
  standings: StandingsRow[];
}

interface GroupStageGroupsProps {
  readonly groupStage: GroupStage;
  readonly players: Player[];
  readonly standingsByGroup: GroupStandingsEntry[];
  readonly wildCardIds: Set<string> | null;
  readonly groupTabs: Record<string, GroupTab>;
  readonly onGroupTabChange: (groupId: string, tab: GroupTab) => void;
  readonly onEditMatch: (groupId: string, matchId: string) => void;
  readonly scoringMode: ScoreMode;
  readonly maxSets: number;
}

export const GroupStageGroups = ({
  groupStage,
  players,
  standingsByGroup,
  wildCardIds,
  groupTabs,
  onGroupTabChange,
  onEditMatch,
  scoringMode,
  maxSets,
}: GroupStageGroupsProps): ReactElement => {
  const { t } = useTranslation();
  const [printData, setPrintData] = useState<GroupPrintData | null>(null);

  useEffect(() => {
    if (printData === null) return;
    const reset = (): void => { setPrintData(null); };
    window.addEventListener('afterprint', reset, { once: true });
    window.print();
    return (): void => { window.removeEventListener('afterprint', reset); };
  }, [printData]);

  const handlePrint = useCallback(
    (groupId: string, groupIndex: number): void => {
      const group = groupStage.groups.find((g) => g.id === groupId);
      if (!group) return;
      const groupPlayers = getGroupPlayers(group, players);
      const groupLabel = t('groupStage.groupTitle', { label: indexToGroupLabel(groupIndex) });
      setPrintData({
        groupLabel,
        players: groupPlayers,
        schedule: group.schedule,
        scoringMode,
        maxSets,
      });
    },
    [groupStage.groups, players, scoringMode, maxSets, t],
  );

  const printRoot = document.querySelector('#print-root');

  return (
    <>
      <div className="space-y-6">
        {groupStage.groups.map((group, index) => {
          const groupPlayers = getGroupPlayers(group, players);
          const standings = standingsByGroup.find((g) => g.groupId === group.id)?.standings;
          const qualifierCount = groupStage.settings.qualifiers[index] ?? 0;
          const activeTab = groupTabs[group.id] ?? 'standings';

          return (
            <GroupCard
              key={group.id}
              group={group}
              groupIndex={index}
              groupPlayers={groupPlayers}
              standings={standings ?? []}
              qualifierCount={qualifierCount}
              wildCardIds={wildCardIds}
              activeTab={activeTab}
              onTabChange={(tab): void => { onGroupTabChange(group.id, tab); }}
              onEditMatch={(match): void => { onEditMatch(group.id, match.id); }}
              onPrint={(): void => { handlePrint(group.id, index); }}
              scoringMode={scoringMode}
              maxSets={maxSets}
            />
          );
        })}
      </div>
      {printData !== null && printRoot !== null
        ? createPortal(<GroupPrintView {...printData} />, printRoot)
        : null}
    </>
  );
};
