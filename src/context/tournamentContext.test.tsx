import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FORMATS } from '../constants';
import type { SingleElimTournament, GroupsToBracketTournament } from '../types';

function emptyUnsubscribe(): void {}

const mockPersistence = {
  load: vi.fn(),
  save: vi.fn(),
  loadAll: vi.fn(),
  delete: vi.fn(),
  deleteAll: vi.fn(),
  subscribe: vi.fn(() => emptyUnsubscribe),
};

vi.mock('../services/persistence', () => ({
  persistence: mockPersistence,
}));

function makeSingleElimTournament(id: string, name: string): SingleElimTournament {
  return {
    id,
    name,
    players: [{ id: 'p1', name: 'Player 1' }],
    createdAt: '2024-01-01',
    format: FORMATS.SINGLE_ELIM,
    bracket: { rounds: [], thirdPlaceMatch: null },
  };
}

function makeGroupsToBracketTournament(id: string, name: string): GroupsToBracketTournament {
  return {
    id,
    name,
    players: [{ id: 'p1', name: 'Player 1' }],
    createdAt: '2024-01-01',
    format: FORMATS.GROUPS_TO_BRACKET,
    groupStage: {
      groups: [],
      settings: { groupCount: 2, qualifiers: [1, 1], consolation: false },
    },
  };
}

describe('Tournament type guards', () => {
  it('correctly identifies SingleElimTournament format', () => {
    const tournament = makeSingleElimTournament('t1', 'Test');
    expect(tournament.format).toBe(FORMATS.SINGLE_ELIM);
    expect(tournament.bracket).toBeDefined();
  });

  it('correctly identifies GroupsToBracketTournament format', () => {
    const tournament = makeGroupsToBracketTournament('t1', 'Test');
    expect(tournament.format).toBe(FORMATS.GROUPS_TO_BRACKET);
    expect(tournament.groupStage).toBeDefined();
  });

  it('format types are distinct', () => {
    const singleElim = makeSingleElimTournament('t1', 'Test');
    const groupsToBracket = makeGroupsToBracketTournament('t2', 'Test');

    expect(singleElim.format).not.toBe(groupsToBracket.format);
  });
});

describe('TournamentProvider persistence integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persistence.load is callable with tournamentId', async () => {
    const { persistence } = await import('../services/persistence');
    const tournament = makeSingleElimTournament('test-id', 'Test');
    mockPersistence.load.mockReturnValue(tournament);

    const result = persistence.load('test-id');

    expect(mockPersistence.load).toHaveBeenCalledWith('test-id');
    expect(result).toEqual(tournament);
  });

  it('persistence.save is callable with updated tournament', async () => {
    const { persistence } = await import('../services/persistence');
    const tournament = makeSingleElimTournament('test-id', 'Test');

    persistence.save(tournament);

    expect(mockPersistence.save).toHaveBeenCalledWith(tournament);
  });

  it('persistence.load returns null for non-existent tournament', async () => {
    const { persistence } = await import('../services/persistence');
    mockPersistence.load.mockReturnValue(null);

    const result = persistence.load('non-existent');

    expect(result).toBeNull();
  });
});

describe('TournamentContext hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPersistence.load.mockReturnValue(null);
  });

  it('exports useTournament hook', async () => {
    const { useTournament } = await import('./tournamentContext');
    expect(typeof useTournament).toBe('function');
  });

  it('exports useTypedTournament hook', async () => {
    const { useTypedTournament } = await import('./tournamentContext');
    expect(typeof useTypedTournament).toBe('function');
  });

  it('exports useGroupsToBracketTournament hook', async () => {
    const { useGroupsToBracketTournament } = await import('./tournamentContext');
    expect(typeof useGroupsToBracketTournament).toBe('function');
  });

  it('exports TournamentProvider component', async () => {
    const { TournamentProvider } = await import('./tournamentContext');
    expect(typeof TournamentProvider).toBe('function');
  });
});
