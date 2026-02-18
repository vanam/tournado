import type { ReactElement } from 'react';
import { MatchCard } from '../bracket/MatchCard';
import { canEditMatch } from '../../utils/bracketUtils';
import { useTranslation } from '../../i18n/useTranslation';
import type { Bracket, Match, Player, ScoreMode } from '../../types';

const BASE_MATCH_HEIGHT = 64;
const BASE_ROUND_GAP = 8;

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

interface RoundMatchProps {
  match: Match;
  roundIndex: number;
  matchHeight: number;
  players: Player[];
  bracket: Bracket;
  onEditMatch?: ((match: Match) => void) | undefined;
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
  wildCardIds?: Set<string> | null | undefined;
  canEditMatchFn?: ((bracket: Bracket, matchId: string) => boolean) | undefined;
  groupPlacementByPlayerId?: Map<string, string> | null | undefined;
  showSeedNumbers?: boolean | undefined;
}

const RoundMatch = ({
  match,
  roundIndex,
  matchHeight,
  players,
  bracket,
  onEditMatch,
  scoringMode,
  maxSets,
  wildCardIds,
  canEditMatchFn,
  groupPlacementByPlayerId,
  showSeedNumbers,
}: RoundMatchProps): ReactElement => {
  if (match.dummy) {
    return (
      <div
        key={`dummy-${roundIndex}-${match.position}`}
        className="flex items-center invisible dummy"
        style={{ height: `${matchHeight}px` }}
      />
    );
  }
  const editable = canEditMatchFn
    ? canEditMatchFn(bracket, match.id)
    : canEditMatch(bracket, match.id);
  return (
    <div
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
};

interface BracketRoundProps {
  round: Match[];
  roundIndex: number;
  roundLabel: string | undefined;
  players: Player[];
  bracket: Bracket;
  onEditMatch?: ((match: Match) => void) | undefined;
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
  wildCardIds?: Set<string> | null | undefined;
  canEditMatchFn?: ((bracket: Bracket, matchId: string) => boolean) | undefined;
  groupPlacementByPlayerId?: Map<string, string> | null | undefined;
  showSeedNumbers?: boolean | undefined;
}

const BracketRound = ({
  round,
  roundIndex,
  roundLabel,
  players,
  bracket,
  onEditMatch,
  scoringMode,
  maxSets,
  wildCardIds,
  canEditMatchFn,
  groupPlacementByPlayerId,
  showSeedNumbers,
}: BracketRoundProps): ReactElement => {
  const matchHeight = BASE_MATCH_HEIGHT * Math.pow(2, roundIndex);
  const roundGap = BASE_ROUND_GAP * Math.pow(2, roundIndex);
  const roundOffset = (BASE_ROUND_GAP / 2) * (Math.pow(2, roundIndex) - 1);

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-semibold text-[var(--color-muted)] mb-3 whitespace-nowrap uppercase tracking-wider">
        {roundLabel}
      </div>
      <div
        className="flex flex-col"
        style={{ gap: `${roundGap}px`, paddingTop: `${roundOffset}px` }}
      >
        {round.map((match) => (
          <RoundMatch
            key={match.dummy ? `dummy-${roundIndex}-${match.position}` : match.id}
            match={match}
            roundIndex={roundIndex}
            matchHeight={matchHeight}
            players={players}
            bracket={bracket}
            onEditMatch={onEditMatch}
            scoringMode={scoringMode}
            maxSets={maxSets}
            wildCardIds={wildCardIds}
            canEditMatchFn={canEditMatchFn}
            groupPlacementByPlayerId={groupPlacementByPlayerId}
            showSeedNumbers={showSeedNumbers}
          />
        ))}
      </div>
    </div>
  );
};

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

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-1 items-start min-w-fit">
        {bracket.rounds.map((round, roundIndex) => (
          <BracketRound
            key={roundIndex}
            round={round}
            roundIndex={roundIndex}
            roundLabel={roundLabels[roundIndex]}
            players={players}
            bracket={bracket}
            onEditMatch={onEditMatch}
            scoringMode={scoringMode}
            maxSets={maxSets}
            wildCardIds={wildCardIds}
            canEditMatchFn={canEditMatchFn}
            groupPlacementByPlayerId={groupPlacementByPlayerId}
            showSeedNumbers={showSeedNumbers}
          />
        ))}
      </div>
    </div>
  );
}
