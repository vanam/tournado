import { type ReactElement } from 'react';
import type { Match, Player, Participant, GroupsToBracketTournament, ScoreMode } from '../../types';
import { ScoreModal } from '../ScoreModal';

type EditingType =
  | 'group'
  | 'mainBracket'
  | 'consolationBracket'
  | 'mainDoubleElim'
  | 'consolationDoubleElim';

interface EditingState {
  type: EditingType;
  groupId?: string;
  matchId: string;
}

interface ScoreModalWrapperProps {
  readonly editing: EditingState | null;
  readonly activeMatch: Match | null;
  readonly activePlayers: Player[];
  readonly participants?: Participant[] | undefined;
  readonly scoringMode: ScoreMode;
  readonly groupStageMaxSets: number;
  readonly bracketMaxSets: number;
  readonly tournament: GroupsToBracketTournament;
  readonly onClose: () => void;
}

export const ScoreModalWrapper = ({
  editing,
  activeMatch,
  activePlayers,
  participants,
  scoringMode,
  groupStageMaxSets,
  bracketMaxSets,
  tournament,
  onClose,
}: ScoreModalWrapperProps): ReactElement | null => {
  if (!activeMatch || !editing) return null;

  const maxSets = editing.type === 'group' ? groupStageMaxSets : bracketMaxSets;

  return (
    <ScoreModal
      match={activeMatch}
      players={activePlayers}
      participants={participants}
      scoringMode={scoringMode}
      maxSets={maxSets}
      history={{ tournament, ...(editing.groupId && { groupId: editing.groupId }), ...(editing.type !== 'group' && { section: editing.type }) }}
      onClose={onClose}
    />
  );
};
