import { type ReactElement } from 'react';
import type { Bracket, DoubleElim, Match, Player, ScoreMode } from '../../types';
import { BracketRounds } from '../common/BracketRounds';
import { MatchCard } from '../bracket/MatchCard';
import { useTranslation } from '../../i18n/useTranslation';
import { canEditMatch } from '../../utils/bracketUtils';
import { canEditDoubleElimMatch } from '../../utils/doubleElimUtils';

interface BracketPanelProps {
  readonly title: string;
  readonly bracket: Bracket | null;
  readonly players: Player[];
  readonly onEditMatch: (match: Match) => void;
  readonly wildCardIds?: Set<string> | null;
  readonly scoringMode?: ScoreMode;
  readonly maxSets?: number;
  readonly groupPlacementByPlayerId?: Map<string, string> | null;
}

interface DoubleElimPanelProps {
  readonly title: string;
  readonly doubleElim: DoubleElim | null;
  readonly players: Player[];
  readonly onEditMatch: (matchId: string) => void;
  readonly wildCardIds?: Set<string> | null;
  readonly scoringMode?: ScoreMode;
  readonly maxSets?: number;
  readonly groupPlacementByPlayerId?: Map<string, string> | null;
}

export const BracketPanel = ({
  title,
  bracket,
  players,
  onEditMatch,
  wildCardIds,
  scoringMode,
  maxSets,
  groupPlacementByPlayerId,
}: BracketPanelProps): ReactElement | null => {
  const { t } = useTranslation();
  if (!bracket) return null;

  const tpm = bracket.thirdPlaceMatch ?? null;
  const thirdPlaceRoundIndex = bracket.rounds.length;

  return (
    <div className="border border-[var(--color-border)] rounded-xl p-4 space-y-4">
      <div className="text-sm font-semibold text-[var(--color-muted)]">{title}</div>
      <BracketRounds
        bracket={bracket}
        players={players}
        wildCardIds={wildCardIds}
        scoringMode={scoringMode}
        maxSets={maxSets}
        groupPlacementByPlayerId={groupPlacementByPlayerId}
        onEditMatch={onEditMatch}
      />
      {tpm && (tpm.player1Id ?? tpm.player2Id) && (
        <div className="mt-2">
          <div className="text-xs font-semibold text-[var(--color-muted)] mb-2">
            {t('bracket.thirdPlace')}
          </div>
          <MatchCard
            match={tpm}
            players={players}
            wildCardIds={wildCardIds}
            canEdit={canEditMatch(bracket, tpm.id)}
            onClick={() => { onEditMatch(tpm); }}
            scoringMode={scoringMode}
            maxSets={maxSets}
            roundIndex={thirdPlaceRoundIndex}
          />
        </div>
      )}
    </div>
  );
};

export const DoubleElimPanel = ({
  title,
  doubleElim,
  players,
  onEditMatch,
  wildCardIds,
  scoringMode,
  maxSets,
  groupPlacementByPlayerId,
}: DoubleElimPanelProps): ReactElement | null => {
  const { t } = useTranslation();
  if (!doubleElim) return null;

  return (
    <div className="border border-[var(--color-border)] rounded-xl p-4 space-y-4">
      <div className="text-sm font-semibold text-[var(--color-muted)]">{title}</div>
      
      <div className="space-y-2">
        <div className="text-xs font-semibold text-[var(--color-muted)]">{t('doubleElim.winnersBracket')}</div>
        <BracketRounds
          bracket={doubleElim.winners}
          players={players}
          wildCardIds={wildCardIds}
          scoringMode={scoringMode}
          maxSets={maxSets}
          groupPlacementByPlayerId={groupPlacementByPlayerId}
          onEditMatch={(match) => { onEditMatch(match.id); }}
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-[var(--color-muted)]">{t('doubleElim.losersBracket')}</div>
        <BracketRounds
          bracket={doubleElim.losers}
          players={players}
          wildCardIds={wildCardIds}
          scoringMode={scoringMode}
          maxSets={maxSets}
          groupPlacementByPlayerId={groupPlacementByPlayerId}
          onEditMatch={(match) => { onEditMatch(match.id); }}
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-[var(--color-muted)]">{t('doubleElim.finals')}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <MatchCard
            match={doubleElim.finals.grandFinal}
            players={players}
            wildCardIds={wildCardIds}
            canEdit={canEditDoubleElimMatch(doubleElim, doubleElim.finals.grandFinal.id)}
            onClick={() => { onEditMatch(doubleElim.finals.grandFinal.id); }}
            scoringMode={scoringMode}
            maxSets={maxSets}
            roundIndex={doubleElim.winners.rounds.length}
          />
          {doubleElim.finals.resetFinal.player1Id && doubleElim.finals.resetFinal.player2Id && (
            <MatchCard
              match={doubleElim.finals.resetFinal}
              players={players}
              wildCardIds={wildCardIds}
              canEdit={canEditDoubleElimMatch(doubleElim, doubleElim.finals.resetFinal.id)}
              onClick={() => { onEditMatch(doubleElim.finals.resetFinal.id); }}
              scoringMode={scoringMode}
              maxSets={maxSets}
              roundIndex={doubleElim.winners.rounds.length + 1}
            />
          )}
        </div>
      </div>
    </div>
  );
};
