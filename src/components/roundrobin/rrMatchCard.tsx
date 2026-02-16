import type { ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import {
  formatSetResults,
  getSetTotals,
  getWalkoverSetWinner,
  hasWalkover,
  isWalkoverScore,
} from '../../utils/scoreUtils';
import { SCORE_MODES } from '../../types';
import type { Match, Player, ScoreMode, SetScore } from '../../types';

interface SetResultEntry {
  text: string;
  isWinnerSet: boolean;
}

interface RRMatchCardProps {
  match: Match;
  players: Player[];
  onEdit: (match: Match) => void;
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
}

export const RRMatchCard = ({
  match,
  players,
  onEdit,
  scoringMode = SCORE_MODES.SETS,
  maxSets,
}: RRMatchCardProps): ReactElement => {
  const { t } = useTranslation();
  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);
  const showPoints = scoringMode === SCORE_MODES.POINTS;

  const { p1Sets, p2Sets } = getSetTotals(match.scores, { scoringMode, maxSets });
  const isWalkover = match.walkover || hasWalkover(match.scores);
  const setResultsText = showPoints ? formatSetResults(match.scores) : '';
  const setResultEntries: SetResultEntry[] = showPoints
    ? match.scores
        .filter((s): s is SetScore => Array.isArray(s))
        .map((s) => getSetResultEntry(s, match))
        .filter((entry): entry is SetResultEntry => entry != null)
    : [];

  return (
    <div
      onClick={() => { onEdit(match); }}
      className="flex items-center gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg px-3 py-2.5 cursor-pointer hover:border-[var(--color-primary)] hover:shadow-md hover:-translate-y-px transition-all duration-150 text-sm"
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
      <span
        className={`flex-1 text-right min-w-0 truncate text-xs sm:text-sm ${
          match.winnerId === match.player1Id ? 'font-semibold text-[var(--color-primary-dark)]' : ''
        }`}
      >
        {p1 ? (
          <>
            {p1.name}
            {p1.elo != null && (
              <span className="ml-2 text-xs font-normal text-[var(--color-muted)]">
                {t('players.elo', { elo: p1.elo })}
              </span>
            )}
          </>
        ) : null}
      </span>
      {match.winnerId ? (
        <div className="text-center min-w-[3rem]">
          <div className="text-[var(--color-muted)] font-mono text-xs px-2 py-0.5 rounded bg-[var(--color-soft)]">
            {isWalkover ? 'WO' : `${p1Sets} - ${p2Sets}`}
          </div>
          {showPoints && setResultsText && (
            <div className="text-[10px] text-[var(--color-faint)]">
              {setResultEntries.map((entry, index) => (
                <span
                  key={`set-${index}`}
                  className={entry.isWinnerSet ? 'font-semibold text-[var(--color-text)]' : ''}
                >
                  {index > 0 ? ', ' : ''}
                  {entry.text}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <span className="text-[var(--color-faintest)] text-xs min-w-[3rem] text-center">{t('score.vs')}</span>
      )}
      <span
        className={`flex-1 min-w-0 truncate text-xs sm:text-sm ${
          match.winnerId === match.player2Id ? 'font-semibold text-[var(--color-primary-dark)]' : ''
        }`}
      >
        {p2 ? (
          <>
            {p2.name}
            {p2.elo != null && (
              <span className="ml-2 text-xs font-normal text-[var(--color-muted)]">
                {t('players.elo', { elo: p2.elo })}
              </span>
            )}
          </>
        ) : null}
      </span>
    </div>
  );
}

function getSetResultEntry(s: SetScore, match: Match): SetResultEntry | null {
  const [rawA, rawB] = s;
  if (isWalkoverScore(rawA) || isWalkoverScore(rawB)) {
    const walkoverWinner = getWalkoverSetWinner(rawA, rawB);
    if (walkoverWinner === 0) return { text: 'WO', isWinnerSet: false };
    const winnerId = walkoverWinner === 1 ? match.player1Id : match.player2Id;
    return {
      text: 'WO',
      isWinnerSet: match.winnerId != null && match.winnerId === winnerId,
    };
  }
  const a = rawA;
  const b = rawB;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  let setWinner = 0;
  if (a > b) setWinner = 1;
  else if (b > a) setWinner = 2;
  let isWinnerSet = false;
  if (setWinner === 1) isWinnerSet = match.winnerId === match.player1Id;
  else if (setWinner === 2) isWinnerSet = match.winnerId === match.player2Id;
  return {
    text: `${a}-${b}`,
    isWinnerSet,
  };
}
