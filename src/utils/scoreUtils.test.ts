import { describe, it, expect } from 'vitest';
import {
  formatSetPointEntries,
  formatSetResults,
  getSetTotals,
  getWalkoverSetWinner,
  hasWalkover,
  isWalkoverScore,
} from './scoreUtils';
import { SCORE_MODES } from '../types';
import type { SetScore } from '../types';

describe('walkover helpers', () => {
  it('detects walkover score values', () => {
    expect(isWalkoverScore(111)).toBe(true);
    expect(isWalkoverScore(-111)).toBe(true);
    expect(isWalkoverScore('111')).toBe(true);
    expect(isWalkoverScore(11)).toBe(false);
  });

  it('detects walkover within score arrays', () => {
    expect(hasWalkover([[11, 3], [111, 0]])).toBe(true);
    expect(hasWalkover([[11, 3], [0, -111]])).toBe(true);
    expect(hasWalkover([[11, 3]])).toBe(false);
  });

  it('resolves walkover set winner based on sentinel', () => {
    expect(getWalkoverSetWinner(111, 0)).toBe(1);
    expect(getWalkoverSetWinner(0, 111)).toBe(2);
    expect(getWalkoverSetWinner(-111, 0)).toBe(2);
    expect(getWalkoverSetWinner(0, -111)).toBe(1);
    expect(getWalkoverSetWinner(11, 9)).toBe(0);
  });
});

describe('getSetTotals with walkover sentinel', () => {
  it('counts walkover sets for player 1', () => {
    const scores: SetScore[] = [[11, 3], [111, 0], [111, 0]];
    const result = getSetTotals(scores, { scoringMode: SCORE_MODES.POINTS });
    expect(result).toEqual({ p1Sets: 3, p2Sets: 0 });
  });

  it('counts walkover sets for player 2 via -111', () => {
    const scores: SetScore[] = [[11, 9], [-111, 0], [-111, 0]];
    const result = getSetTotals(scores, { scoringMode: SCORE_MODES.POINTS });
    expect(result).toEqual({ p1Sets: 1, p2Sets: 2 });
  });
});

describe('formatSetResults', () => {
  it('formats set scores in order', () => {
    const scores: SetScore[] = [[11, 7], [9, 11], [11, 8]];
    expect(formatSetResults(scores)).toBe('11-7, 9-11, 11-8');
  });

  it('swaps set scores when requested', () => {
    const scores: SetScore[] = [[11, 7], [9, 11]];
    expect(formatSetResults(scores, { swapped: true })).toBe('7-11, 11-9');
  });

  it('renders walkover sets as WO', () => {
    const scores: SetScore[] = [[11, 7], [111, 0], [0, -111]];
    expect(formatSetResults(scores)).toBe('11-7, WO, WO');
  });
});

describe('formatSetPointEntries', () => {
  it('returns entries with win flags in order', () => {
    const scores: SetScore[] = [[11, 7], [9, 11], [11, 8]];
    const entries = formatSetPointEntries(scores);
    expect(entries.map((entry) => entry.text)).toEqual(['11', ' 9', '11']);
    expect(entries.map((entry) => entry.isWin)).toEqual([true, false, true]);
  });

  it('returns swapped entries for the second player', () => {
    const scores: SetScore[] = [[11, 7], [9, 11]];
    const entries = formatSetPointEntries(scores, { swapped: true });
    expect(entries.map((entry) => entry.text)).toEqual([' 7', '11']);
    expect(entries.map((entry) => entry.isWin)).toEqual([false, true]);
  });

  it('marks walkover winners only', () => {
    const scores: SetScore[] = [[111, 0]];
    const winnerEntries = formatSetPointEntries(scores);
    const loserEntries = formatSetPointEntries(scores, { swapped: true });
    expect(winnerEntries).toEqual([{ text: 'WO', isWin: true }]);
    expect(loserEntries).toEqual([{ text: 'WO', isWin: false }]);
  });
});
