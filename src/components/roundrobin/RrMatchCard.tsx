import type { ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { formatSetPointEntries, getSetTotals, hasWalkover } from '../../utils/scoreUtils';
import { ScoreMode } from '../../types';
import type { Match, Player } from '../../types';

interface RRMatchCardProps {
  match: Match;
  players: Player[];
  onEdit: (match: Match) => void;
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
}

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

export const RRMatchCard = ({
  match,
  players,
  onEdit,
  scoringMode = ScoreMode.SETS,
  maxSets,
}: RRMatchCardProps): ReactElement => {
  const { t } = useTranslation();
  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);
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
          {p1 ? (
            <>
              {p1.name}
              {p1.elo != null && (
                <span className="ml-2 font-normal text-[10px] text-[var(--color-muted)]">
                  {t('players.elo', { elo: p1.elo })}
                </span>
              )}
            </>
          ) : null}
        </span>
        {match.winnerId && (
          <span className="ml-2 text-[var(--color-muted)] flex items-center gap-2 shrink-0">
            {showPoints && p1SetPointEntries.length > 0 && <SetPoints entries={p1SetPointEntries} />}
            <span className="text-[var(--color-faintest)]">|</span>
            <span className="font-mono w-4 text-center">{isWalkover ? 'WO' : p1Sets}</span>
          </span>
        )}
      </div>
      <div
        className={`flex items-center justify-between px-2 py-1.5 ${
          match.winnerId === match.player2Id ? 'bg-[var(--color-soft)] font-semibold border-l-3 border-l-[var(--color-primary)]' : ''
        }`}
      >
        <span className="truncate flex-1">
          {p2 ? (
            <>
              {p2.name}
              {p2.elo != null && (
                <span className="ml-2 font-normal text-[10px] text-[var(--color-muted)]">
                  {t('players.elo', { elo: p2.elo })}
                </span>
              )}
            </>
          ) : null}
        </span>
        {match.winnerId && (
          <span className="ml-2 text-[var(--color-muted)] flex items-center gap-2 shrink-0">
            {showPoints && p2SetPointEntries.length > 0 && <SetPoints entries={p2SetPointEntries} />}
            <span className="text-[var(--color-faintest)]">|</span>
            <span className="font-mono w-4 text-center">{isWalkover ? 'WO' : p2Sets}</span>
          </span>
        )}
      </div>
    </div>
  );
};
