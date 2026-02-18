import { type ReactElement } from 'react';
import type { GroupStage, Player, StandingsRow, ScoreMode } from '../../types';
import { getGroupPlayers } from '../../utils/groupStageUtils';
import { GroupCard } from './GroupCard';

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
  return (
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
            onTabChange={(tab) => { onGroupTabChange(group.id, tab); }}
            onEditMatch={(match) => { onEditMatch(group.id, match.id); }}
            scoringMode={scoringMode}
            maxSets={maxSets}
          />
        );
      })}
    </div>
  );
};
