import { type ReactElement } from 'react';
import type { GroupsToBracketTournament } from '../../types';
import { getMatchEditingContext } from '../../utils/matchEditing';
import type { GroupMatchTarget } from '../../utils/matchEditing';
import { ScoreModal } from '../ScoreModal';

interface ScoreModalWrapperProps {
  readonly editing: GroupMatchTarget | null;
  readonly tournament: GroupsToBracketTournament;
  readonly onClose: () => void;
}

export const ScoreModalWrapper = ({
  editing,
  tournament,
  onClose,
}: ScoreModalWrapperProps): ReactElement | null => {
  const context = editing ? getMatchEditingContext(tournament, editing) : null;
  return context ? <ScoreModal {...context} onClose={onClose} /> : null;
};
