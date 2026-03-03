import type { ReactElement, KeyboardEvent } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { formatSetPointEntries, getSetTotals, hasWalkover } from '../../utils/scoreUtils';
import { getParticipantMembers } from '../../utils/participantUtils';
import { ScoreMode } from '../../types';
import type { Match, Player, Participant } from '../../types';
import { Badge } from '@/components/ui/Badge';

interface MatchCardProps {
  match: Match;
  players: Player[];
  participants?: Participant[] | undefined;
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
  members: Player[];
  player: Player | undefined;
  placement: string | null;
  seed: string | null;
  isWildCard: boolean | undefined;
  t: (key: string, params?: Record<string, string | number>) => string;
}
const PlayerInfo = ({
  members,
  player,
  placement,
  seed,
  isWildCard,
  t,
}: PlayerInfoProps): ReactElement | null => {
  if (members.length > 0) {
    return (
      <span className="flex flex-col">
        {members.map((m, i) => (
          <span key={m.id} className="truncate">
            {i === 0 && placement && (
              <span className="mr-2 text-[10px] font-semibold text-[var(--color-muted)]">{placement}</span>
            )}
            {i === 0 && seed && (
              <span className="mr-2 text-[10px] font-semibold text-[var(--color-muted)]">{seed}</span>
            )}
            {m.name}
            {i === 0 && isWildCard && (
              <Badge variant="accent" className="ml-2 text-[10px] px-1.5 py-0.5">{t('groupStage.wildCardBadge')}</Badge>
            )}
            {m.elo != null && (
              <span className="ml-2 font-normal text-[10px] text-[var(--color-muted)]">
                {t('players.elo', { elo: m.elo })}
              </span>
            )}
          </span>
        ))}
      </span>
    );
  }
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
        <Badge variant="accent" className="ml-2 text-[10px] px-1.5 py-0.5">{t('groupStage.wildCardBadge')}</Badge>
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
export interface SetPointsProps {
  entries: { text: string; isWin: boolean }[];
}
export const SetPoints = ({ entries }: SetPointsProps): ReactElement => (
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
export interface ScoreInfoProps {
  showPoints: boolean;
  setPointEntries: { text: string; isWin: boolean }[];
  isWalkover: boolean;
  sets: number;
}
export const ScoreInfo = ({
  showPoints,
  setPointEntries,
  isWalkover,
  sets,
}: ScoreInfoProps): ReactElement => (
  <span className="ml-2 text-[var(--color-muted)] flex items-center gap-2">
    {showPoints && setPointEntries.length > 0 && <SetPoints entries={setPointEntries} />}
    <span className="text-[var(--color-faintest)]">|</span>
    <span className="font-mono w-2 text-center">{isWalkover ? 'WO' : sets}</span>
  </span>
);

const getPlayerName = (playerId: string | null, t: (key: string) => string): string => {
  return playerId ? '?' : t('bracket.bye');
};

export interface MatchSideNameProps {
  readonly members: Player[];
  readonly player: Player | undefined;
  readonly playerId: string | null;
  readonly placement: string | null;
  readonly seed: string | null;
  readonly isWildCard: boolean | undefined;
  readonly t: (key: string, params?: Record<string, string | number>) => string;
}

export const MatchSideName = ({ members, player, playerId, placement, seed, isWildCard, t }: MatchSideNameProps): ReactElement => {
  const info = PlayerInfo({ members, player, placement, seed, isWildCard, t });
  if (info) return info;
  return <>{getPlayerName(playerId, t)}</>;
};

export const MatchCard = ({
  match,
  players,
  participants,
  canEdit,
  onClick,
  wildCardIds,
  scoringMode = ScoreMode.SETS,
  maxSets,
  roundIndex,
  groupPlacementByPlayerId,
  showSeedNumbers,
}: MatchCardProps): ReactElement => {
  const { t } = useTranslation();
  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);
  const p1Members = match.player1Id && participants
    ? getParticipantMembers(match.player1Id, players, participants)
    : [];
  const p2Members = match.player2Id && participants
    ? getParticipantMembers(match.player2Id, players, participants)
    : [];
  const p1Participant = participants?.find((p) => p.id === match.player1Id);
  const p2Participant = participants?.find((p) => p.id === match.player2Id);
  const isWildCard1 = match.player1Id ? wildCardIds?.has(match.player1Id) : undefined;
  const isWildCard2 = match.player2Id ? wildCardIds?.has(match.player2Id) : undefined;
  const isBye = !match.player1Id || !match.player2Id;
  const isPlayable = match.player1Id && match.player2Id && canEdit;
  const showPoints = scoringMode === ScoreMode.POINTS;

  const { p1Sets, p2Sets } = getSetTotals(match.scores, { scoringMode, maxSets });
  const isWalkover = match.walkover || hasWalkover(match.scores);
  const p1SetPointEntries = showPoints ? formatSetPointEntries(match.scores) : [];
  const p2SetPointEntries = showPoints ? formatSetPointEntries(match.scores, { swapped: true }) : [];
  const showGroupPlacement = roundIndex === 0 && groupPlacementByPlayerId;
  const p1Placement = showGroupPlacement && match.player1Id ? groupPlacementByPlayerId.get(match.player1Id) ?? null : null;
  const p2Placement = showGroupPlacement && match.player2Id ? groupPlacementByPlayerId.get(match.player2Id) ?? null : null;
  const showSeedInRound = showSeedNumbers && roundIndex === 0;
  const p1Seed = showSeedInRound && (p1Participant?.seed ?? p1?.seed) != null ? String(p1Participant?.seed ?? p1?.seed) : null;
  const p2Seed = showSeedInRound && (p2Participant?.seed ?? p2?.seed) != null ? String(p2Participant?.seed ?? p2?.seed) : null;

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick) onClick();
    }
  }

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`border rounded-lg text-xs w-52 overflow-hidden bg-[var(--color-card)] transition-all duration-150 ${
        isPlayable
          ? 'cursor-pointer hover:border-[var(--color-primary)] hover:shadow-md hover:-translate-y-px'
          : ''
      } ${isBye ? 'opacity-40' : 'border-[var(--color-border)]'}`}
      role={isPlayable ? 'button' : undefined}
      tabIndex={isPlayable ? 0 : undefined}
      aria-disabled={!isPlayable}
      aria-label={isPlayable ? t('bracket.editMatch') : undefined}
      onKeyDown={isPlayable ? handleKeyDown : undefined}
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
            placement={p1Placement}
            seed={p1Seed}
            isWildCard={isWildCard1}
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
            placement={p2Placement}
            seed={p2Seed}
            isWildCard={isWildCard2}
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
