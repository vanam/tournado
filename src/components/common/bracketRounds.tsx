import type { ReactElement } from 'react';
import { MatchCard } from '../bracket/matchCard';
import { canEditMatch } from '../../utils/bracketUtils';
import { useTranslation } from '../../i18n/useTranslation';
import type { Bracket, Match, Player, ScoreMode } from '../../types';

interface BracketRoundsProps {
  bracket?: Bracket | null;
  players: Player[];
  onEditMatch?: (match: Match) => void;
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
  wildCardIds?: Set<string> | null | undefined;
  canEditMatchFn?: (bracket: Bracket, matchId: string) => boolean;
  groupPlacementByPlayerId?: Map<string, string> | null | undefined;
  showSeedNumbers?: boolean | undefined;
}

export const BracketRounds = ({
  bracket,
  players,
  onEditMatch,
  scoringMode,
  maxSets,
  wildCardIds,
  canEditMatchFn,
  groupPlacementByPlayerId,
  showSeedNumbers,
}: BracketRoundsProps): ReactElement | null => {
  const { t } = useTranslation();
  if (!bracket) return null;

  const roundLabels = bracket.rounds.map((_, i) => {
    const total = bracket.rounds.length;
    if (i === total - 1) return t('bracket.final');
    if (i === total - 2) return t('bracket.semifinals');
    if (i === total - 3) return t('bracket.quarterfinals');
    return t('bracket.round', { n: i + 1 });
  });

  const baseHeight = 64;
  const baseGap = 8;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-1 items-start min-w-fit">
        {bracket.rounds.map((round, roundIndex) => {
          const matchHeight = baseHeight * Math.pow(2, roundIndex);
          const roundGap = baseGap * Math.pow(2, roundIndex);
          const roundOffset = (baseGap / 2) * (Math.pow(2, roundIndex) - 1);

          return (
            <div key={roundIndex} className="flex flex-col items-center">
              <div className="text-xs font-semibold text-[var(--color-muted)] mb-3 whitespace-nowrap uppercase tracking-wider">
                {roundLabels[roundIndex]}
              </div>
              <div
                className="flex flex-col"
                style={{ gap: `${roundGap}px`, paddingTop: `${roundOffset}px` }}
              >
                {round.map((match) => {
                  // Empty space in place of dummy matches to keep spacing consistent, but keep it invisible and non-interactive
                  if (match.dummy) {
                    return (
                      <div
                        key={`dummy-${roundIndex}-${match.position}`}
                        className="flex items-center invisible dummy"
                        style={{ height: `${matchHeight}px` }}
                      >
                        {/* empty */}
                      </div>
                    );
                  }
                  const editable = canEditMatchFn
                    ? canEditMatchFn(bracket, match.id)
                    : canEditMatch(bracket, match.id);
                  return (
                    <div
                      key={match.id}
                      className="flex items-center"
                      style={{ height: `${matchHeight}px` }}
                    >
                      <MatchCard
                        match={match}
                        players={players}
                        canEdit={editable}
                        wildCardIds={wildCardIds}
                        scoringMode={scoringMode}
                        maxSets={maxSets}
                        roundIndex={roundIndex}
                        groupPlacementByPlayerId={groupPlacementByPlayerId}
                        showSeedNumbers={showSeedNumbers}
                        onClick={() => onEditMatch?.(match)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
