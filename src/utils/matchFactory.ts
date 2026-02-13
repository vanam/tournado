import type { Match } from '../types';

export function createMatch(id: string, overrides: Partial<Match> = {}): Match {
  return {
    id,
    player1Id: null,
    player2Id: null,
    scores: [],
    winnerId: null,
    walkover: false,
    nextMatchId: null,
    dummy: false,
    ...overrides,
  };
}
