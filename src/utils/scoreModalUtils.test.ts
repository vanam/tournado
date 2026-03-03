import { describe, it, expect } from 'vitest';
import type { Match, Player } from '../types';
import { getWinnerName } from './scoreModalUtils';

function makePlayer(id: string, name: string): Player {
  return { id, name };
}

function makeMatch(player1Id: string | null, player2Id: string | null): Match {
  return { id: 'm1', player1Id, player2Id, scores: [], winnerId: null, walkover: false, dummy: false };
}

describe('getWinnerName', () => {
  describe('singles', () => {
    it('returns the winning player name', () => {
      const p1 = makePlayer('p1', 'Alice');
      const p2 = makePlayer('p2', 'Bob');
      const match = makeMatch('p1', 'p2');
      expect(getWinnerName('p1', match, p1, p2)).toBe('Alice');
      expect(getWinnerName('p2', match, p1, p2)).toBe('Bob');
    });

    it('returns empty string when winnerId is null', () => {
      expect(getWinnerName(null, makeMatch('p1', 'p2'))).toBe('');
    });
  });

  describe('doubles', () => {
    it('returns slash-joined names of the winning team members', () => {
      const match = makeMatch('team1', 'team2');
      const p1Members = [makePlayer('p1', 'Alice'), makePlayer('p2', 'Bob')];
      const p2Members = [makePlayer('p3', 'Carol'), makePlayer('p4', 'Dave')];

      expect(getWinnerName('team1', match, undefined, undefined, p1Members, p2Members)).toBe('Alice/Bob');
      expect(getWinnerName('team2', match, undefined, undefined, p1Members, p2Members)).toBe('Carol/Dave');
    });

    it('returns empty string when winnerId is null', () => {
      const p1Members = [makePlayer('p1', 'Alice'), makePlayer('p2', 'Bob')];
      const p2Members = [makePlayer('p3', 'Carol'), makePlayer('p4', 'Dave')];
      expect(getWinnerName(null, makeMatch('team1', 'team2'), undefined, undefined, p1Members, p2Members)).toBe('');
    });

    it('regression: returns empty string when members are not provided (team id not in players)', () => {
      // Before the fix, getWinnerName received p1/p2 from players.find(id === teamId),
      // which returned undefined because team IDs are not in the individual players array.
      // Without members, the name is empty — members must be passed for doubles.
      const match = makeMatch('team1', 'team2');
      expect(getWinnerName('team1', match)).toBe('');
    });
  });
});
