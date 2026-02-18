import { type ReactElement } from 'react';
import type { GroupStagePlayoffs, Player, Match, ScoreMode } from '../../types';
import { BracketPanel, DoubleElimPanel } from './PlayoffPanels';
import { useTranslation } from '../../i18n/useTranslation';

interface PlayoffSectionProps {
  readonly playoffs: GroupStagePlayoffs | null;
  readonly isDoubleElim: boolean;
  readonly players: Player[];
  readonly wildCardIds: Set<string> | null;
  readonly groupPlacementByPlayerId: Map<string, string> | null;
  readonly scoringMode: ScoreMode;
  readonly maxSets: number;
  readonly onEditMainBracketMatch: (match: Match) => void;
  readonly onEditConsolationBracketMatch: (match: Match) => void;
  readonly onEditMainDoubleElimMatch: (matchId: string) => void;
  readonly onEditConsolationDoubleElimMatch: (matchId: string) => void;
}

export const PlayoffSection = ({
  playoffs,
  isDoubleElim,
  players,
  wildCardIds,
  groupPlacementByPlayerId,
  scoringMode,
  maxSets,
  onEditMainBracketMatch,
  onEditConsolationBracketMatch,
  onEditMainDoubleElimMatch,
  onEditConsolationDoubleElimMatch,
}: PlayoffSectionProps): ReactElement | null => {
  const { t } = useTranslation();

  if (!playoffs) return null;

  const hasMainBracket = !isDoubleElim && playoffs.mainBracket;
  const hasMainDoubleElim = isDoubleElim && playoffs.mainDoubleElim;
  const hasConsolationBracket = !isDoubleElim && playoffs.consolationBracket;
  const hasConsolationDoubleElim = isDoubleElim && playoffs.consolationDoubleElim;

  if (!hasMainBracket && !hasMainDoubleElim) return null;

  return (
    <>
      {hasMainBracket && (
        <BracketPanel
          title={t('groupStage.mainBracket')}
          bracket={playoffs.mainBracket}
          players={players}
          wildCardIds={wildCardIds}
          scoringMode={scoringMode}
          maxSets={maxSets}
          groupPlacementByPlayerId={groupPlacementByPlayerId}
          onEditMatch={onEditMainBracketMatch}
        />
      )}

      {hasMainDoubleElim && (
        <DoubleElimPanel
          title={t('groupStage.mainBracket')}
          doubleElim={playoffs.mainDoubleElim}
          players={players}
          wildCardIds={wildCardIds}
          scoringMode={scoringMode}
          maxSets={maxSets}
          groupPlacementByPlayerId={groupPlacementByPlayerId}
          onEditMatch={onEditMainDoubleElimMatch}
        />
      )}

      {hasConsolationBracket && (
        <BracketPanel
          title={t('groupStage.consolationBracket')}
          bracket={playoffs.consolationBracket}
          players={players}
          wildCardIds={wildCardIds}
          scoringMode={scoringMode}
          maxSets={maxSets}
          groupPlacementByPlayerId={groupPlacementByPlayerId}
          onEditMatch={onEditConsolationBracketMatch}
        />
      )}

      {hasConsolationDoubleElim && (
        <DoubleElimPanel
          title={t('groupStage.consolationBracket')}
          doubleElim={playoffs.consolationDoubleElim}
          players={players}
          wildCardIds={wildCardIds}
          scoringMode={scoringMode}
          maxSets={maxSets}
          groupPlacementByPlayerId={groupPlacementByPlayerId}
          onEditMatch={onEditConsolationDoubleElimMatch}
        />
      )}
    </>
  );
};
