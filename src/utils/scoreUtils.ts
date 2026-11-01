import type { SetScore } from '../types';
import { DEFAULT_MAX_SETS, MAX_POINTS } from '../constants';
import { ScoreMode } from '../types';

type ScoreWinner = 0 | 1 | 2;

export function isWalkoverScore(value: number | string): boolean {
  const numeric = Number(value);
  return Number.isFinite(numeric) && Math.abs(numeric) === MAX_POINTS;
}

export function getWalkoverSetWinner(a: number, b: number): ScoreWinner {
  if (!isWalkoverScore(a) && !isWalkoverScore(b)) return 0;
  if ((a === MAX_POINTS && b === MAX_POINTS) || (a === -MAX_POINTS && b === -MAX_POINTS)) return 0;
  if (a === MAX_POINTS || b === -MAX_POINTS) return 1;
  if (b === MAX_POINTS || a === -MAX_POINTS) return 2;
  return 0;
}

export function hasWalkover(scores: SetScore[]): boolean {
  if (!Array.isArray(scores)) return false;
  return scores.some((s) => Array.isArray(s) && (isWalkoverScore(s[0]) || isWalkoverScore(s[1])));
}

interface SetTotalsOptions {
  maxSets?: number | undefined;
  scoringMode?: ScoreMode | undefined;
}

export function getSetTotals(scores: SetScore[], options: SetTotalsOptions = {}): { p1Sets: number; p2Sets: number } {
  const { maxSets = 5, scoringMode = ScoreMode.POINTS } = options;
  if (!Array.isArray(scores) || scores.length === 0) {
    return { p1Sets: 0, p2Sets: 0 };
  }

  const validScores = scores.filter((s) => Array.isArray(s));
  if (validScores.length === 0) {
    return { p1Sets: 0, p2Sets: 0 };
  }

  if (scoringMode === ScoreMode.SETS) {
    const first = validScores[0];
    if (!first) return { p1Sets: 0, p2Sets: 0 };
    const a = first[0];
    const b = first[1];
    if (
      Number.isFinite(a) &&
      Number.isFinite(b) &&
      a >= 0 &&
      b >= 0 &&
      a <= maxSets &&
      b <= maxSets
    ) {
      return { p1Sets: a, p2Sets: b };
    }
    return { p1Sets: 0, p2Sets: 0 };
  }

  let p1Sets = 0;
  let p2Sets = 0;
  for (const s of validScores) {
    const a = s[0];
    const b = s[1];
    const walkoverWinner = getWalkoverSetWinner(a, b);
    if (walkoverWinner === 1) {
      p1Sets++;
      continue;
    }
    if (walkoverWinner === 2) {
      p2Sets++;
      continue;
    }
    if (a > b) p1Sets++;
    else if (b > a) p2Sets++;
  }

  return { p1Sets, p2Sets };
}

/** Shared score validation and winner selection for the editor and all tournament formats. */
export function getScoreWinner(scores: SetScore[], options: SetTotalsOptions = {}): ScoreWinner {
  const { scoringMode = ScoreMode.SETS, maxSets = DEFAULT_MAX_SETS } = options;
  if (!Number.isInteger(maxSets) || maxSets < 1 || !Array.isArray(scores) || scores.length === 0) return 0;
  if (scoringMode === ScoreMode.SETS ? scores.length !== 1 : scores.length > maxSets) return 0;
  let retirementWinner: ScoreWinner = 0;
  for (const score of scores) {
    if (!Array.isArray(score)) return 0;
    const [a, b] = score;
    const limit = scoringMode === ScoreMode.SETS ? maxSets : MAX_POINTS;
    if (!score.every((value) => Number.isInteger(value) && value <= limit &&
      (value >= 0 || (scoringMode === ScoreMode.POINTS && value === -MAX_POINTS)))) return 0;
    if (scoringMode === ScoreMode.POINTS && (isWalkoverScore(a) || isWalkoverScore(b))) {
      const side = getWalkoverSetWinner(a, b);
      if (!side || (retirementWinner && retirementWinner !== side)) return 0;
      retirementWinner = side;
    }
  }
  if (retirementWinner) return retirementWinner;
  const { p1Sets, p2Sets } = getSetTotals(scores, { scoringMode, maxSets });
  if (p1Sets === p2Sets) return 0;
  return p1Sets > p2Sets ? 1 : 2;
}

interface FormatOptions {
  swapped?: boolean | undefined;
}

export function formatSetResults(scores: SetScore[], options: FormatOptions = {}): string {
  const { swapped = false } = options;
  if (!Array.isArray(scores) || scores.length === 0) return '';
  const validScores = scores.filter((s) => Array.isArray(s));
  if (validScores.length === 0) return '';

  const formatted = validScores.map((s) => {
    const a = swapped ? s[1] : s[0];
    const b = swapped ? s[0] : s[1];
    if (isWalkoverScore(a) || isWalkoverScore(b)) return 'WO';
    return `${a}-${b}`;
  });

  return formatted.join(', ');
}

export interface SetPointEntry {
  text: string;
  isWin: boolean;
}

export function formatSetPointEntries(scores: SetScore[], options: FormatOptions = {}): SetPointEntry[] {
  const { swapped = false } = options;
  if (!Array.isArray(scores) || scores.length === 0) return [];
  const validScores = scores.filter((s) => Array.isArray(s));
  if (validScores.length === 0) return [];

  return validScores
    .map((s): SetPointEntry | null => {
      const originalA = s[0];
      const originalB = s[1];
      if (isWalkoverScore(originalA) || isWalkoverScore(originalB)) {
        const winner = getWalkoverSetWinner(originalA, originalB);
        if (winner === 0) return null;
        const isWin = swapped ? winner === 2 : winner === 1;
        return { text: 'WO', isWin };
      }
      const aNum = swapped ? originalB : originalA;
      const bNum = swapped ? originalA : originalB;
      if (!Number.isFinite(aNum) || !Number.isFinite(bNum)) return null;
      return { text: String(aNum).padStart(2, ' '), isWin: aNum > bNum };
    })
    .filter((entry): entry is SetPointEntry => entry !== null);
}
