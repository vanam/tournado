import { type ReactElement } from 'react';
import type { Match, Player, Participant, SetScore, ScoreMode } from '../../types';
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
  readonly lockedWinnerId?: string | undefined;
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
  participants,
  scoringMode,
  groupStageMaxSets,
  bracketMaxSets,
  lockedWinnerId,
  onSave,
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
      lockedWinnerId={lockedWinnerId}
      onSave={onSave}
      onClose={onClose}
    />
  );
};
