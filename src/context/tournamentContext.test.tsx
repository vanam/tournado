import { describe, it, expect, vi } from 'vitest';
import { Format } from '../types';
import type { SingleElimTournament, GroupsToBracketTournament } from '../types';

vi.mock('../db', () => ({
  getDatabase: vi.fn(),
}));

function makeSingleElimTournament(id: string, name: string): SingleElimTournament {
  return {
    id,
    name,
    version: 1,
    players: [{ id: 'p1', name: 'Player 1' }],
    createdAt: '2024-01-01',
    format: Format.SINGLE_ELIM,
    bracket: { rounds: [], thirdPlaceMatch: null },
  };
}

function makeGroupsToBracketTournament(id: string, name: string): GroupsToBracketTournament {
  return {
    id,
    name,
    version: 1,
    players: [{ id: 'p1', name: 'Player 1' }],
    createdAt: '2024-01-01',
    format: Format.GROUPS_TO_BRACKET,
    groupStage: {
      groups: [],
      settings: { groupCount: 2, qualifiers: [1, 1], consolation: false },
    },
  };
}

describe('Tournament type guards', () => {
  it('correctly identifies SingleElimTournament format', () => {
    const tournament = makeSingleElimTournament('t1', 'Test');
    expect(tournament.format).toBe(Format.SINGLE_ELIM);
    expect(tournament.bracket).toBeDefined();
  });

  it('correctly identifies GroupsToBracketTournament format', () => {
    const tournament = makeGroupsToBracketTournament('t1', 'Test');
    expect(tournament.format).toBe(Format.GROUPS_TO_BRACKET);
    expect(tournament.groupStage).toBeDefined();
  });

  it('format types are distinct', () => {
    const singleElim = makeSingleElimTournament('t1', 'Test');
    const groupsToBracket = makeGroupsToBracketTournament('t2', 'Test');

    expect(singleElim.format).not.toBe(groupsToBracket.format);
  });
});

describe('TournamentContext hooks', () => {
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
    const { TournamentProvider } = await import('./tournamentProvider');
    expect(typeof TournamentProvider).toBe('function');
  });
});
