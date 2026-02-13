import type { ReactElement, KeyboardEvent } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { formatSetPointEntries, getSetTotals, hasWalkover } from '../../utils/scoreUtils';
import { SCORE_MODES } from '../../constants';
import type { Match, Player, ScoreMode } from '../../types';

interface MatchCardProps {
  match: Match;
  players: Player[];
  canEdit: boolean;
  onClick?: () => void;
  wildCardIds?: Set<string> | null | undefined;
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
  roundIndex: number;
  groupPlacementByPlayerId?: Map<string, string> | null | undefined;
  showSeedNumbers?: boolean | undefined;
}

// Pomocná komponenta pro zobrazení informací o hráči
interface PlayerInfoProps {
  player: Player | undefined;
  placement: string | null;
  seed: string | null;
  isWildCard: boolean | undefined;
  t: (key: string, params?: Record<string, string | number>) => string;
}
const PlayerInfo = ({
  player,
  placement,
  seed,
  isWildCard,
  t,
}: PlayerInfoProps): ReactElement | null => {
  if (!player) return null;
  return (
    <>
      {placement && (
        <span className="mr-2 text-[10px] font-semibold text-[var(--color-muted)]">{placement}</span>
      )}
      {seed && (
        <span className="mr-2 text-[10px] font-semibold text-[var(--color-muted)]">{seed}</span>
      )}
      {player.name}
      {isWildCard && (
        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          {t('groupStage.wildCardBadge')}
        </span>
      )}
      {player.elo != null && (
        <span className="ml-2 font-normal text-[10px] text-[var(--color-muted)]">
          {t('players.elo', { elo: player.elo })}
        </span>
      )}
    </>
  );
};

// Pomocná komponenta pro zobrazení bodů v setech
interface SetPointsProps {
  entries: { text: string; isWin: boolean }[];
}
const SetPoints = ({ entries }: SetPointsProps): ReactElement => (
  <span className="text-[10px] text-[var(--color-faint)] font-mono whitespace-pre text-right">
    {entries.map((entry, index) => (
      <span
        key={index}
        className={entry.isWin ? 'font-semibold text-[var(--color-text)]' : ''}
      >
        {index > 0 ? ' ' : ''}
        {entry.text}
      </span>
    ))}
  </span>
);

// Pomocná komponenta pro zobrazení výsledku hráče
interface ScoreInfoProps {
  showPoints: boolean;
  setPointEntries: { text: string; isWin: boolean }[];
  isWalkover: boolean;
  sets: number;
}
const ScoreInfo = ({
  showPoints,
  setPointEntries,
  isWalkover,
  sets,
}: ScoreInfoProps): ReactElement => (
  <span className="ml-2 text-[var(--color-muted)] flex items-center gap-2">
    {showPoints && setPointEntries.length > 0 && <SetPoints entries={setPointEntries} />}
    <span className="text-[var(--color-faintest)]">|</span>
    <span>{isWalkover ? 'WO' : sets}</span>
  </span>
);

const getPlayerName = (playerId: string | null, t: (key: string) => string): string => {
  return playerId ? '?' : t('bracket.bye');
};

export const MatchCard = ({
  match,
  players,
  canEdit,
  onClick,
  wildCardIds,
  scoringMode = SCORE_MODES.SETS,
  maxSets,
  roundIndex,
  groupPlacementByPlayerId,
  showSeedNumbers,
}: MatchCardProps): ReactElement => {
  const { t } = useTranslation();
  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);
  const isWildCard1 = p1 && wildCardIds?.has(p1.id);
  const isWildCard2 = p2 && wildCardIds?.has(p2.id);
  const isBye = !match.player1Id || !match.player2Id;
  const isPlayable = match.player1Id && match.player2Id && canEdit;
  const showPoints = scoringMode === SCORE_MODES.POINTS;

  const { p1Sets, p2Sets } = getSetTotals(match.scores, { scoringMode, maxSets });
  const isWalkover = match.walkover || hasWalkover(match.scores);
  const p1SetPointEntries = showPoints ? formatSetPointEntries(match.scores) : [];
  const p2SetPointEntries = showPoints ? formatSetPointEntries(match.scores, { swapped: true }) : [];
  const showGroupPlacement = roundIndex === 0 && groupPlacementByPlayerId;
  const p1Placement = showGroupPlacement && p1 ? groupPlacementByPlayerId.get(p1.id) ?? null : null;
  const p2Placement = showGroupPlacement && p2 ? groupPlacementByPlayerId.get(p2.id) ?? null : null;
  const showSeedInRound = showSeedNumbers && roundIndex === 0;
  const p1Seed = showSeedInRound && p1?.seed != null ? String(p1.seed) : null;
  const p2Seed = showSeedInRound && p2?.seed != null ? String(p2.seed) : null;

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`border rounded-lg text-xs w-48 overflow-hidden bg-[var(--color-surface)] transition-all duration-150 ${
        isPlayable
          ? 'cursor-pointer hover:border-[var(--color-primary)] hover:shadow-md hover:-translate-y-px'
          : ''
      } ${isBye ? 'opacity-40' : 'border-[var(--color-border)]'}`}
      role={isPlayable ? 'button' : undefined}
      tabIndex={isPlayable ? 0 : undefined}
      aria-disabled={!isPlayable}
      aria-label={isPlayable ? t('bracket.editMatch') : undefined}
      onKeyDown={isPlayable ? (e: KeyboardEvent<HTMLDivElement>): void => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onClick) onClick();
        }
      } : undefined}
    >
      <div
        className={`flex items-center justify-between px-2 py-1.5 border-b border-[var(--color-border-soft)] ${
          match.winnerId === match.player1Id ? 'bg-[var(--color-soft)] font-semibold border-l-2 border-l-[var(--color-primary)]' : ''
        }`}
      >
        <span className="truncate flex-1">
          {p1 ? (
            <PlayerInfo
              player={p1}
              placement={p1Placement}
              seed={p1Seed}
              isWildCard={isWildCard1}
              t={t}
            />
          ) : getPlayerName(match.player1Id, t)}
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
          match.winnerId === match.player2Id ? 'bg-[var(--color-soft)] font-semibold border-l-2 border-l-[var(--color-primary)]' : ''
        }`}
      >
        <span className="truncate flex-1">
          {p2 ? (
            <PlayerInfo
              player={p2}
              placement={p2Placement}
              seed={p2Seed}
              isWildCard={isWildCard2}
              t={t}
            />
          ) : getPlayerName(match.player2Id, t)}
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
