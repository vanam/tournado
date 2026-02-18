import { type ReactElement } from 'react';
import type { Match, Player, SetScore, ScoreMode } from '../../types';
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
  readonly scoringMode: ScoreMode;
  readonly groupStageMaxSets: number;
  readonly bracketMaxSets: number;
  readonly onSave: (
    matchId: string,
    winnerId: string | null,
    scores: SetScore[],
    walkover: boolean
  ) => void;
  readonly onClose: () => void;
}

export const ScoreModalWrapper = ({
  editing,
  activeMatch,
  activePlayers,
  scoringMode,
  groupStageMaxSets,
  bracketMaxSets,
  onSave,
  onClose,
}: ScoreModalWrapperProps): ReactElement | null => {
  if (!activeMatch || !editing) return null;

  const maxSets = editing.type === 'group' ? groupStageMaxSets : bracketMaxSets;

  return (
    <ScoreModal
      match={activeMatch}
      players={activePlayers}
      scoringMode={scoringMode}
      maxSets={maxSets}
      onSave={onSave}
      onClose={onClose}
    />
  );
};
