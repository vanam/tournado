import { useState } from 'react';
import type { ChangeEvent, ReactElement } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { ConfirmModal } from './ConfirmModal';
import { ModalShell } from './ModalShell';
import { DEFAULT_MAX_SETS } from '../constants';
import { getSetTotals, getWalkoverSetWinner, hasWalkover } from '../utils/scoreUtils';
import { SCORE_MODES } from '../types';
import type { Match, Player, ScoreMode, SetScore } from '../types';

export const MAX_POINTS = 111;

interface ScoreModalProps {
  match: Match;
  players: Player[];
  onSave: (matchId: string, winnerId: string | null, scores: SetScore[], walkover: boolean) => void;
  onClose: () => void;
  scoringMode?: ScoreMode;
  maxSets?: number;
}

// Pomocné funkce přesunuty mimo komponentu kvůli linteru
function getWalkoverWinnerId(walkoverInfo: { winnerIndex: 0 | 1 } | null, match: Match): string | null {
  if (!walkoverInfo) return null;
  if (walkoverInfo.winnerIndex === 0) return match.player1Id;
  return match.player2Id;
}

function getWinnerName(
  winnerId: string | null,
  match: Match,
  p1?: Player,
  p2?: Player,
  t?: (key: string, params?: Record<string, string | number>) => string
): string {
  if (!winnerId) return '';
  if (winnerId === match.player1Id) {
    let name = p1?.name ?? '';
    if (p1?.elo != null && t) {
      name += ` (${t('players.elo', { elo: p1.elo })})`;
    }
    return name;
  }
  let name = p2?.name ?? '';
  if (p2?.elo != null && t) {
    name += ` (${t('players.elo', { elo: p2.elo })})`;
  }
  return name;
}

export const ScoreModal = ({
  match,
  players,
  onSave,
  onClose,
  scoringMode = SCORE_MODES.SETS,
  maxSets: maxSetsProp = DEFAULT_MAX_SETS,
}: ScoreModalProps): ReactElement => {
  const { t } = useTranslation();
  const maxSets = Number.isFinite(maxSetsProp) && maxSetsProp > 0 ? maxSetsProp : DEFAULT_MAX_SETS;
  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);
  const isSetOnly = scoringMode === SCORE_MODES.SETS;
  const canUseWalkover = isSetOnly;

  const initialScores: SetScore[] = ((): SetScore[] => {
    if (match.scores.length > 0) {
      if (isSetOnly) {
        const { p1Sets, p2Sets } = getSetTotals(match.scores, {
          scoringMode: SCORE_MODES.SETS,
          maxSets,
        });
        return [[p1Sets, p2Sets]];
      }
      return match.scores.map((s) => [...s] as SetScore);
    }
    return [[0, 0]];
  })();

  const [scores, setScores] = useState<SetScore[]>(initialScores);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [walkover, setWalkover] = useState(canUseWalkover ? match.walkover : false);

  function getFirstWalkoverInfo(sourceScores: SetScore[]): { index: number; winnerIndex: 0 | 1 } | null {
    if (isSetOnly || !Array.isArray(sourceScores)) return null;
    for (const [i, s] of sourceScores.entries()) {
      if (!Array.isArray(s)) continue;
      const winner = getWalkoverSetWinner(s[0], s[1]);
      if (winner === 1 || winner === 2) {
        return { index: i, winnerIndex: (winner - 1) as 0 | 1 };
      }
    }
    return null;
  }

  function normalizeScoresForWalkover(sourceScores: SetScore[]): SetScore[] {
    if (isSetOnly || !Array.isArray(sourceScores)) return sourceScores;
    const info = getFirstWalkoverInfo(sourceScores);
    if (!info) return sourceScores;
    const walkoverScore: SetScore = info.winnerIndex === 0 ? [MAX_POINTS, 0] : [0, MAX_POINTS];
    return sourceScores.map((s, idx) => {
      const safe: SetScore = Array.isArray(s) ? s : [0, 0];
      if (idx < info.index) return [...safe] as SetScore;
      return [...walkoverScore] as SetScore;
    });
  }

  const walkoverInfo = getFirstWalkoverInfo(scores);
  const setTotals = getSetTotals(scores, { scoringMode, maxSets });
  const walkoverWinnerId = getWalkoverWinnerId(walkoverInfo, match);
  const walkoverSetsProvided = isSetOnly ? setTotals.p1Sets + setTotals.p2Sets > 0 : true;
  const walkoverWinnerHasMostSets = walkover
    ? setTotals.p1Sets !== setTotals.p2Sets && walkoverSetsProvided
    : true;
  const walkoverValid = !walkover || (walkoverSetsProvided && walkoverWinnerHasMostSets);

  function updateScore(setIndex: number, playerIndex: 0 | 1, value: string): void {
    if (walkover && !isSetOnly) return;
    if (!isSetOnly && walkoverInfo && setIndex >= walkoverInfo.index) return;
    const parsed = Number.parseInt(value, 10);
    const normalized = Number.isFinite(parsed) ? parsed : 0;
    const limit = isSetOnly ? maxSets : MAX_POINTS;
    const bounded = Math.min(Math.max(0, normalized), limit);
    const updated: SetScore[] = scores.map((s) => [...s] as SetScore);
    const setEntry = updated[setIndex];
    if (setEntry) setEntry[playerIndex] = bounded;
    setScores(normalizeScoresForWalkover(updated));
  }

  function applySetWalkover(setIndex: number, winnerIndex: 0 | 1, checked: boolean): void {
    if (walkoverInfo && setIndex > walkoverInfo.index) return;
    const updated: SetScore[] = scores.map((s) => [...s] as SetScore);
    if (checked) {
      updated[setIndex] = winnerIndex === 0 ? [MAX_POINTS, 0] : [0, MAX_POINTS];
    } else {
      updated[setIndex] = [0, 0];
      for (let i = setIndex + 1; i < updated.length; i++) {
        const entry = updated[i];
        if (!entry) continue;
        const winner = getWalkoverSetWinner(entry[0], entry[1]);
        if (winner !== 0) updated[i] = [0, 0];
      }
    }
    setScores(normalizeScoresForWalkover(updated));
  }

  function toggleWalkover(nextValue: boolean): void {
    if (!canUseWalkover) return;
    setWalkover(nextValue);
  }

  function addSet(): void {
    if (scores.length >= maxSets) return;
    if (walkoverInfo) {
      const walkoverScore: SetScore = walkoverInfo.winnerIndex === 0 ? [MAX_POINTS, 0] : [0, MAX_POINTS];
      setScores([...scores, [...walkoverScore]]);
      return;
    }
    setScores([...scores, [0, 0]]);
  }

  function removeSet(index: number): void {
    if (scores.length > 1 && !walkoverInfo) {
      setScores(scores.filter((_, i) => i !== index));
    }
  }

  function getWinner(): string | null {
    if (!isSetOnly && walkoverInfo) return walkoverWinnerId;
    if (canUseWalkover && walkover) {
      if (!walkoverValid) return null;
      if (setTotals.p1Sets > setTotals.p2Sets) return match.player1Id;
      if (setTotals.p2Sets > setTotals.p1Sets) return match.player2Id;
      return null;
    }
    const { p1Sets, p2Sets } = setTotals;
    if (p1Sets > p2Sets) return match.player1Id;
    if (p2Sets > p1Sets) return match.player2Id;
    return null;
  }

  function handleSave(): void {
    const winner = getWinner();
    if (!winner) return;
    const useWalkover = canUseWalkover && walkover;
    const firstScore: SetScore = scores[0] ?? [0, 0];
    const payloadScores: SetScore[] = isSetOnly
      ? [[firstScore[0], firstScore[1]]]
      : normalizeScoresForWalkover(scores).map((s) => [s[0], s[1]]);
    onSave(match.id, winner, payloadScores, useWalkover);
  }

  function handleClear(): void {
    setShowClearConfirm(true);
  }

  function confirmClear(): void {
    setShowClearConfirm(false);
    onSave(match.id, null, [], false);
  }

  function cancelClear(): void {
    setShowClearConfirm(false);
  }

  const winner = getWinner();
  const hasResult =
    !!match.winnerId || match.scores.length > 0 || match.walkover || hasWalkover(match.scores);

  return (
    <>
      {showClearConfirm && (
        <ConfirmModal
          title={t('score.clearTitle')}
          message={t('score.clearMessage')}
          confirmLabel={t('score.clear')}
          cancelLabel={t('score.cancel')}
          onConfirm={confirmClear}
          onCancel={cancelClear}
        />
      )}
      <ModalShell onClose={onClose} onPrimaryAction={handleSave} primaryActionDisabled={!winner}>
        <div className="bg-[var(--color-surface)] rounded-2xl shadow-2xl p-6 w-full max-w-md">
          <h3 className="text-lg font-bold mb-5 pb-3 border-b border-[var(--color-border-soft)]">{t('score.title')}</h3>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-4">
            <div className="text-right font-medium text-xs sm:text-sm min-w-0 truncate">
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
            </div>
            <div className="text-[var(--color-faint)] text-sm">{t('score.vs')}</div>
            <div className="font-medium text-xs sm:text-sm min-w-0 truncate">
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
            </div>
          </div>

          {canUseWalkover && (
            <div className="flex items-center gap-2 mb-4">
              <input
                id="walkover"
                type="checkbox"
                checked={walkover}
                onChange={(e: ChangeEvent<HTMLInputElement>) => { toggleWalkover(e.target.checked); }}
                className="h-4 w-4"
              />
              <label htmlFor="walkover" className="text-sm text-[var(--color-text)]">
                WO
              </label>
            </div>
          )}

          <div className="space-y-2 mb-4">
            {scores.map((score, i) => {
              const isWalkoverLockedSet = !!(!isSetOnly && walkoverInfo && i >= walkoverInfo.index);
              const isAutoWalkoverSet = !!(!isSetOnly && walkoverInfo && i > walkoverInfo.index);
              return (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={isSetOnly ? 0 : undefined}
                      max={isSetOnly ? maxSets : MAX_POINTS}
                      value={score[0]}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => { updateScore(i, 0, e.target.value); }}
                      disabled={isWalkoverLockedSet || (walkover && !isSetOnly)}
                      className="border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-center text-sm w-full disabled:bg-[var(--color-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                    {!isSetOnly && (
                      <button
                        type="button"
                        onClick={() =>
                          { applySetWalkover(i, 0, !(score[0] === MAX_POINTS && score[1] === 0)); }
                        }
                        disabled={isAutoWalkoverSet}
                        className={
                          score[0] === MAX_POINTS && score[1] === 0
                            ? 'px-2 py-1 text-xs font-semibold rounded border border-[var(--color-primary-dark)] bg-[var(--color-primary)] text-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed'
                            : 'px-2 py-1 text-xs font-semibold rounded border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-border-strong)] disabled:opacity-50 disabled:cursor-not-allowed'
                        }
                        aria-pressed={score[0] === MAX_POINTS && score[1] === 0}
                      >
                        WO
                      </button>
                    )}
                  </div>
                  <span className="text-[var(--color-faint)] text-sm">
                    {isSetOnly ? t('score.setsResult') : t('score.set', { n: i + 1 })}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={isSetOnly ? 0 : undefined}
                      max={isSetOnly ? maxSets : MAX_POINTS}
                      value={score[1]}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => { updateScore(i, 1, e.target.value); }}
                      disabled={isWalkoverLockedSet || (walkover && !isSetOnly)}
                      className="border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-center text-sm w-full disabled:bg-[var(--color-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                    {!isSetOnly && (
                      <button
                        type="button"
                        onClick={() =>
                          { applySetWalkover(i, 1, !(score[1] === MAX_POINTS && score[0] === 0)); }
                        }
                        disabled={isAutoWalkoverSet}
                        className={
                          score[1] === MAX_POINTS && score[0] === 0
                            ? 'px-2 py-1 text-xs font-semibold rounded border border-[var(--color-primary-dark)] bg-[var(--color-primary)] text-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed'
                            : 'px-2 py-1 text-xs font-semibold rounded border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-border-strong)] disabled:opacity-50 disabled:cursor-not-allowed'
                        }
                        aria-pressed={score[1] === MAX_POINTS && score[0] === 0}
                      >
                        WO
                      </button>
                    )}
                  </div>
                  {!isSetOnly && scores.length > 1 && !walkover && !walkoverInfo && (
                    <button
                      onClick={() => { removeSet(i); }}
                      className="text-[var(--color-accent)] hover:text-[var(--color-primary-dark)] text-sm"
                    >
                      &times;
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {!isSetOnly && scores.length < maxSets && (
            <button
              onClick={addSet}
              className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] mb-4 block"
            >
              {t('score.addSet')}
            </button>
          )}

          {winner && (
            <p className="text-sm text-[var(--color-primary-dark)] font-medium bg-[var(--color-soft)] rounded-lg px-3 py-2 mb-4">
              {t('score.winner', {
                name: getWinnerName(winner, match, p1, p2, t),
              })}
            </p>
          )}

          <div className="flex flex-wrap gap-2 justify-end pt-4 mt-2 border-t border-[var(--color-border-soft)]">
            {hasResult && (
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-primary-dark)]"
              >
                {t('score.clear')}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              {t('score.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={!winner}
              className="bg-[var(--color-primary)] text-[var(--color-surface)] px-5 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('score.save')}
            </button>
          </div>
        </div>
      </ModalShell>
    </>
  );
}
