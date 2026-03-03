import type { ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { formatSetPointEntries, getSetTotals, hasWalkover } from '../../utils/scoreUtils';
import { getParticipantMembers } from '../../utils/participantUtils';
import { ScoreMode } from '../../types';
import type { Match, Player, Participant } from '../../types';
import { MatchSideName, ScoreInfo } from '../bracket/MatchCard';

interface RRMatchCardProps {
  match: Match;
  players: Player[];
  participants?: Participant[] | undefined;
  onEdit: (match: Match) => void;
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
}

export const RRMatchCard = ({
  match,
  players,
  participants,
  onEdit,
  scoringMode = ScoreMode.SETS,
  maxSets,
}: RRMatchCardProps): ReactElement => {
  const { t } = useTranslation();
  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);
  const p1Members = match.player1Id && participants
    ? getParticipantMembers(match.player1Id, players, participants)
    : [];
  const p2Members = match.player2Id && participants
    ? getParticipantMembers(match.player2Id, players, participants)
    : [];
  const showPoints = scoringMode === ScoreMode.POINTS;

  const { p1Sets, p2Sets } = getSetTotals(match.scores, { scoringMode, maxSets });
  const isWalkover = match.walkover || hasWalkover(match.scores);
  const p1SetPointEntries = showPoints ? formatSetPointEntries(match.scores) : [];
  const p2SetPointEntries = showPoints ? formatSetPointEntries(match.scores, { swapped: true }) : [];

  return (
    <div
      onClick={() => { onEdit(match); }}
      className="border border-[var(--color-border)] rounded-lg text-xs w-full overflow-hidden bg-[var(--color-card)] cursor-pointer hover:border-[var(--color-primary)] hover:shadow-md hover:-translate-y-px transition-all duration-150"
      role="button"
      tabIndex={0}
      aria-label={t('bracket.editMatch')}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(match);
        }
      }}
    >
      <div
        className={`flex items-center justify-between px-2 py-1.5 border-b border-[var(--color-border-soft)] ${
          match.winnerId === match.player1Id ? 'bg-[var(--color-soft)] font-semibold border-l-3 border-l-[var(--color-primary)]' : ''
        }`}
      >
        <span className="truncate flex-1">
          <MatchSideName
            members={p1Members}
            player={p1}
            playerId={match.player1Id}
            placement={null}
            seed={null}
            isWildCard={undefined}
            t={t}
          />
        </span>
        {match.winnerId && (
          <ScoreInfo
            showPoints={showPoints}
            setPointEntries={p1SetPointEntries}
            isWalkover={isWalkover}
            sets={p1Sets}
          />
        )}
      </div>
      <div
        className={`flex items-center justify-between px-2 py-1.5 ${
          match.winnerId === match.player2Id ? 'bg-[var(--color-soft)] font-semibold border-l-3 border-l-[var(--color-primary)]' : ''
        }`}
      >
        <span className="truncate flex-1">
          <MatchSideName
            members={p2Members}
            player={p2}
            playerId={match.player2Id}
            placement={null}
            seed={null}
            isWildCard={undefined}
            t={t}
          />
        </span>
        {match.winnerId && (
          <ScoreInfo
            showPoints={showPoints}
            setPointEntries={p2SetPointEntries}
            isWalkover={isWalkover}
            sets={p2Sets}
          />
        )}
      </div>
    </div>
  );
};
