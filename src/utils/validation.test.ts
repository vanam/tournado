import { describe, it, expect } from 'vitest';
import { isValidTournament, validateTournaments } from './validation';
import { FORMATS, SCORE_MODES } from '../constants';
import type { Tournament, Player, Match, Bracket, RoundRobinSchedule, DoubleElim, GroupStage } from '../types';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Player 1',
    ...overrides,
  };
}

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'm1',
    player1Id: 'p1',
    player2Id: 'p2',
    scores: [[11, 9], [11, 7]],
    winnerId: 'p1',
    walkover: false,
    dummy: false,
    ...overrides,
  };
}

function makeBracket(overrides: Partial<Bracket> = {}): Bracket {
  return {
    rounds: [[makeMatch()]],
    thirdPlaceMatch: null,
    ...overrides,
  };
}

function makeRoundRobinSchedule(): RoundRobinSchedule {
  return {
    rounds: [
      {
        roundNumber: 1,
        byePlayerId: null,
        matches: [makeMatch()],
      },
    ],
  };
}

function makeDoubleElim(): DoubleElim {
  return {
    winners: makeBracket(),
    losers: { rounds: [] },
    finals: {
      grandFinal: makeMatch({ id: 'gf' }),
      resetFinal: makeMatch({ id: 'rf' }),
    },
    loserLinks: {},
  };
}

function makeGroupStage(): GroupStage {
  return {
    groups: [
      {
        id: 'g1',
        name: 'Group A',
        playerIds: ['p1', 'p2'],
        schedule: makeRoundRobinSchedule(),
        order: 1,
      },
    ],
    settings: {
      groupCount: 1,
      qualifiers: [1],
      consolation: false,
    },
  };
}

function makeSingleElimTournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: 't1',
    name: 'Test Tournament',
    players: [makePlayer()],
    createdAt: '2024-01-01T00:00:00Z',
    format: FORMATS.SINGLE_ELIM,
    bracket: makeBracket(),
    ...overrides,
  } as Tournament;
}

function makeDoubleElimTournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: 't1',
    name: 'Test Tournament',
    players: [makePlayer()],
    createdAt: '2024-01-01T00:00:00Z',
    format: FORMATS.DOUBLE_ELIM,
    doubleElim: makeDoubleElim(),
    ...overrides,
  } as Tournament;
}

function makeRoundRobinTournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: 't1',
    name: 'Test Tournament',
    players: [makePlayer()],
    createdAt: '2024-01-01T00:00:00Z',
    format: FORMATS.ROUND_ROBIN,
    schedule: makeRoundRobinSchedule(),
    ...overrides,
  } as Tournament;
}

function makeGroupsToBracketTournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: 't1',
    name: 'Test Tournament',
    players: [makePlayer()],
    createdAt: '2024-01-01T00:00:00Z',
    format: FORMATS.GROUPS_TO_BRACKET,
    groupStage: makeGroupStage(),
    ...overrides,
  } as Tournament;
}

describe('isValidTournament', () => {
  describe('base validation', () => {
    it('returns false for null', () => {
      expect(isValidTournament(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      const undef: unknown = undefined;
      expect(isValidTournament(undef)).toBe(false);
    });

    it('returns false for non-object', () => {
      expect(isValidTournament('string')).toBe(false);
      expect(isValidTournament(123)).toBe(false);
      expect(isValidTournament(true)).toBe(false);
    });

    it('returns false for array', () => {
      expect(isValidTournament([])).toBe(false);
    });

    it('returns false for missing id', () => {
      const t = { name: 'Test', players: [], createdAt: '2024-01-01', format: FORMATS.SINGLE_ELIM, bracket: makeBracket() };
      expect(isValidTournament(t)).toBe(false);
    });

    it('returns false for missing name', () => {
      const t = { id: 't1', players: [], createdAt: '2024-01-01', format: FORMATS.SINGLE_ELIM, bracket: makeBracket() };
      expect(isValidTournament(t)).toBe(false);
    });

    it('returns false for missing players', () => {
      const t = { id: 't1', name: 'Test', createdAt: '2024-01-01', format: FORMATS.SINGLE_ELIM, bracket: makeBracket() };
      expect(isValidTournament(t)).toBe(false);
    });

    it('returns false for invalid players', () => {
      const t = { id: 't1', name: 'Test', players: [{ id: 123 }], createdAt: '2024-01-01', format: FORMATS.SINGLE_ELIM, bracket: makeBracket() };
      expect(isValidTournament(t)).toBe(false);
    });

    it('returns false for missing createdAt', () => {
      const t = { id: 't1', name: 'Test', players: [], format: FORMATS.SINGLE_ELIM, bracket: makeBracket() };
      expect(isValidTournament(t)).toBe(false);
    });

    it('returns false for missing format', () => {
      const t = { id: 't1', name: 'Test', players: [], createdAt: '2024-01-01', bracket: makeBracket() };
      expect(isValidTournament(t)).toBe(false);
    });

    it('returns false for invalid format', () => {
      const t = { id: 't1', name: 'Test', players: [], createdAt: '2024-01-01', format: 'INVALID', bracket: makeBracket() };
      expect(isValidTournament(t)).toBe(false);
    });
  });

  describe('Single Elimination', () => {
    it('returns true for valid single elimination tournament', () => {
      expect(isValidTournament(makeSingleElimTournament())).toBe(true);
    });

    it('returns false for missing bracket', () => {
      const t = { id: 't1', name: 'Test', players: [], createdAt: '2024-01-01', format: FORMATS.SINGLE_ELIM };
      expect(isValidTournament(t)).toBe(false);
    });

    it('returns false for invalid bracket', () => {
      const t = makeSingleElimTournament({ bracket: { rounds: 'invalid' } as unknown as Bracket });
      expect(isValidTournament(t)).toBe(false);
    });

    it('accepts third place match', () => {
      const t = makeSingleElimTournament({
        bracket: { rounds: [], thirdPlaceMatch: makeMatch({ id: 'tpm' }) },
      });
      expect(isValidTournament(t)).toBe(true);
    });
  });

  describe('Double Elimination', () => {
    it('returns true for valid double elimination tournament', () => {
      expect(isValidTournament(makeDoubleElimTournament())).toBe(true);
    });

    it('returns false for missing doubleElim', () => {
      const t = { id: 't1', name: 'Test', players: [], createdAt: '2024-01-01', format: FORMATS.DOUBLE_ELIM };
      expect(isValidTournament(t)).toBe(false);
    });

    it('returns false for invalid doubleElim', () => {
      const t = makeDoubleElimTournament({ doubleElim: { winners: 'invalid' } as unknown as DoubleElim });
      expect(isValidTournament(t)).toBe(false);
    });
  });

  describe('Round Robin', () => {
    it('returns true for valid round robin tournament', () => {
      expect(isValidTournament(makeRoundRobinTournament())).toBe(true);
    });

    it('returns false for missing schedule', () => {
      const t = { id: 't1', name: 'Test', players: [], createdAt: '2024-01-01', format: FORMATS.ROUND_ROBIN };
      expect(isValidTournament(t)).toBe(false);
    });

    it('returns false for invalid schedule', () => {
      const t = makeRoundRobinTournament({ schedule: { rounds: 'invalid' } as unknown as RoundRobinSchedule });
      expect(isValidTournament(t)).toBe(false);
    });
  });

  describe('Groups to Bracket', () => {
    it('returns true for valid groups to bracket tournament', () => {
      expect(isValidTournament(makeGroupsToBracketTournament())).toBe(true);
    });

    it('returns false for missing groupStage', () => {
      const t = { id: 't1', name: 'Test', players: [], createdAt: '2024-01-01', format: FORMATS.GROUPS_TO_BRACKET };
      expect(isValidTournament(t)).toBe(false);
    });

    it('returns false for invalid groupStage', () => {
      const t = makeGroupsToBracketTournament({ groupStage: { groups: 'invalid' } as unknown as GroupStage });
      expect(isValidTournament(t)).toBe(false);
    });
  });

  describe('optional fields', () => {
    it('accepts optional completedAt', () => {
      const t = makeSingleElimTournament({ completedAt: '2024-02-01T00:00:00Z' });
      expect(isValidTournament(t)).toBe(true);
    });

    it('rejects invalid completedAt', () => {
      const t = makeSingleElimTournament({ completedAt: 123 as unknown as string });
      expect(isValidTournament(t)).toBe(false);
    });

    it('accepts optional winnerId', () => {
      const t = makeSingleElimTournament({ winnerId: 'p1' });
      expect(isValidTournament(t)).toBe(true);
    });

    it('rejects invalid winnerId', () => {
      const t = makeSingleElimTournament({ winnerId: 123 as unknown as string });
      expect(isValidTournament(t)).toBe(false);
    });

    it('accepts optional scoringMode', () => {
      const t = makeSingleElimTournament({ scoringMode: SCORE_MODES.SETS });
      expect(isValidTournament(t)).toBe(true);
    });

    it('rejects invalid scoringMode', () => {
      const t = makeSingleElimTournament({ scoringMode: 'INVALID' as unknown as typeof SCORE_MODES.SETS });
      expect(isValidTournament(t)).toBe(false);
    });

    it('accepts optional maxSets', () => {
      const t = makeSingleElimTournament({ maxSets: 5 });
      expect(isValidTournament(t)).toBe(true);
    });

    it('rejects invalid maxSets', () => {
      const t = makeSingleElimTournament({ maxSets: 'five' as unknown as number });
      expect(isValidTournament(t)).toBe(false);
    });
  });

  describe('player validation', () => {
    it('accepts player with optional seed', () => {
      const t = makeSingleElimTournament({ players: [makePlayer({ seed: 1 })] });
      expect(isValidTournament(t)).toBe(true);
    });

    it('accepts player with optional elo', () => {
      const t = makeSingleElimTournament({ players: [makePlayer({ elo: 1500 })] });
      expect(isValidTournament(t)).toBe(true);
    });

    it('rejects player with invalid seed', () => {
      const t = makeSingleElimTournament({ players: [makePlayer({ seed: 'one' as unknown as number })] });
      expect(isValidTournament(t)).toBe(false);
    });

    it('rejects player with invalid elo', () => {
      const t = makeSingleElimTournament({ players: [makePlayer({ elo: 'high' as unknown as number })] });
      expect(isValidTournament(t)).toBe(false);
    });
  });

  describe('match validation', () => {
    it('accepts match with null player ids', () => {
      const t = makeSingleElimTournament({
        bracket: { rounds: [[makeMatch({ player1Id: null, player2Id: null })]], thirdPlaceMatch: null },
      });
      expect(isValidTournament(t)).toBe(true);
    });

    it('accepts match with walkover', () => {
      const t = makeSingleElimTournament({
        bracket: { rounds: [[makeMatch({ walkover: true })]], thirdPlaceMatch: null },
      });
      expect(isValidTournament(t)).toBe(true);
    });

    it('accepts match with nextMatchId', () => {
      const t = makeSingleElimTournament({
        bracket: { rounds: [[makeMatch({ nextMatchId: 'm2' })]], thirdPlaceMatch: null },
      });
      expect(isValidTournament(t)).toBe(true);
    });

    it('accepts match with position', () => {
      const t = makeSingleElimTournament({
        bracket: { rounds: [[makeMatch({ position: 1 })]], thirdPlaceMatch: null },
      });
      expect(isValidTournament(t)).toBe(true);
    });

    it('rejects match with invalid scores', () => {
      const t = makeSingleElimTournament({
        bracket: { rounds: [[makeMatch({ scores: [[11, 'nine'] as unknown as [number, number]] })]], thirdPlaceMatch: null },
      });
      expect(isValidTournament(t)).toBe(false);
    });
  });
});

describe('validateTournaments', () => {
  it('returns empty array for null', () => {
    expect(validateTournaments(null)).toEqual([]);
  });

  it('returns empty array for non-array', () => {
    expect(validateTournaments({})).toEqual([]);
    expect(validateTournaments('string')).toEqual([]);
  });

  it('returns empty array for empty array', () => {
    expect(validateTournaments([])).toEqual([]);
  });

  it('filters out invalid tournaments', () => {
    const validTournament = makeSingleElimTournament();
    const invalidTournament = { id: 't2', name: 'Invalid', players: [] };
    const result = validateTournaments([validTournament, invalidTournament]);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('t1');
  });

  it('keeps all valid tournaments', () => {
    const t1 = makeSingleElimTournament({ id: 't1' });
    const t2 = makeRoundRobinTournament({ id: 't2' });
    const result = validateTournaments([t1, t2]);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when all tournaments are invalid', () => {
    expect(validateTournaments([null, undefined, { id: 123 }])).toEqual([]);
  });

  it('handles malicious data gracefully', () => {
    const maliciousData: unknown[] = [
      { __proto__: { malicious: true } },
      { constructor: 'malicious' },
      { id: 't1', name: 'Test', players: [null], createdAt: '2024-01-01', format: 'INVALID' },
    ];
    expect(validateTournaments(maliciousData)).toEqual([]);
  });
});
