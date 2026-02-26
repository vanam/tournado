import { describe, it, expect } from 'vitest';
import {
  nextPowerOf2,
  seedPositions,
  generateBracket,
  advanceWinner,
  canEditMatch,
  getBracketWinner,
} from './bracketUtils';
import type { Bracket, Match, Player, SetScore } from '../types';

function makePlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    seed: i + 1,
  }));
}

function findMatch(bracket: Bracket, matchId: string): Match | null {
  for (const round of bracket.rounds) {
    const m = round.find((m) => m.id === matchId);
    if (m) return m;
  }
  return null;
}

function findPlayableMatches(bracket: Bracket): Match[] {
  const result: Match[] = [];
  for (const round of bracket.rounds) {
    for (const match of round) {
      if (match.player1Id && match.player2Id && !match.winnerId) {
        result.push(match);
      }
    }
  }
  return result;
}

function clone(obj: Bracket): Bracket {
  return structuredClone(obj);
}

describe('nextPowerOf2', () => {
  it('returns correct values', () => {
    expect(nextPowerOf2(1)).toBe(1);
    expect(nextPowerOf2(2)).toBe(2);
    expect(nextPowerOf2(3)).toBe(4);
    expect(nextPowerOf2(4)).toBe(4);
    expect(nextPowerOf2(5)).toBe(8);
    expect(nextPowerOf2(12)).toBe(16);
  });
});

describe('seedPositions', () => {
  it('returns [0] for size 1', () => {
    expect(seedPositions(1)).toEqual([0]);
  });

  it('returns [0,1] for size 2', () => {
    expect(seedPositions(2)).toEqual([0, 1]);
  });

  it('returns correct positions for size 4', () => {
    const pos = seedPositions(4);
    expect(pos).toHaveLength(4);
    // Each position 0-3 should appear exactly once
    expect([...pos].toSorted((a, b) => a - b)).toEqual([0, 1, 2, 3]);
  });

  it('returns correct positions for size 8', () => {
    const pos = seedPositions(8);
    expect(pos).toHaveLength(8);
    expect([...pos].toSorted((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('generateBracket', () => {
  it('generates a bracket for 2 players', () => {
    const players = makePlayers(2);
    const bracket = generateBracket(players);
    expect(bracket.rounds).toHaveLength(1);
    expect(bracket.rounds[0]!).toHaveLength(1);
    const match = bracket.rounds[0]![0]!;
    expect(match.player1Id).toBeTruthy();
    expect(match.player2Id).toBeTruthy();
    expect(match.winnerId).toBeNull();
  });

  it('generates a bracket for 4 players with no byes', () => {
    const players = makePlayers(4);
    const bracket = generateBracket(players);
    expect(bracket.rounds).toHaveLength(2);
    expect(bracket.rounds[0]!).toHaveLength(2); // 2 matches in round 1
    expect(bracket.rounds[1]!).toHaveLength(1); // 1 final

    // No byes: all round 1 matches have both players
    for (const match of bracket.rounds[0]!) {
      expect(match.player1Id).toBeTruthy();
      expect(match.player2Id).toBeTruthy();
      expect(match.winnerId).toBeNull();
    }

    // Final should have no players yet
    const final = bracket.rounds[1]![0]!;
    expect(final.player1Id).toBeNull();
    expect(final.player2Id).toBeNull();
  });

  it('generates a bracket for 3 players with 1 bye', () => {
    const players = makePlayers(3);
    const bracket = generateBracket(players);
    // bracketSize=4, 2 rounds
    expect(bracket.rounds).toHaveLength(2);
    expect(bracket.rounds[0]!).toHaveLength(2);

    // One match should be a bye (one player auto-advanced)
    const byeMatches = bracket.rounds[0]!.filter((m) => m.winnerId !== null);
    expect(byeMatches).toHaveLength(1);

    // The bye winner should already be in the final
    const final = bracket.rounds[1]![0]!;
    const hasPlayer = final.player1Id ?? final.player2Id;
    expect(hasPlayer).toBeTruthy();
  });

  it('generates a bracket for 5 players with 3 byes', () => {
    const players = makePlayers(5);
    const bracket = generateBracket(players);
    // bracketSize=8, 3 rounds
    expect(bracket.rounds).toHaveLength(3);
    expect(bracket.rounds[0]!).toHaveLength(4);

    const byeMatches = bracket.rounds[0]!.filter((m) => m.winnerId !== null);
    expect(byeMatches).toHaveLength(3);

    // The non-bye match should have 2 actual players
    const realMatches = bracket.rounds[0]!.filter(
      (m) => m.player1Id && m.player2Id && !m.winnerId
    );
    expect(realMatches).toHaveLength(1);
  });

  it('generates a bracket for 12 players with 4 byes', () => {
    const players = makePlayers(12);
    const bracket = generateBracket(players);
    // bracketSize=16, 4 rounds
    expect(bracket.rounds).toHaveLength(4);
    expect(bracket.rounds[0]!).toHaveLength(8);

    const byeMatches = bracket.rounds[0]!.filter((m) => m.winnerId !== null);
    expect(byeMatches).toHaveLength(4);

    const realMatches = bracket.rounds[0]!.filter(
      (m) => m.player1Id && m.player2Id && !m.winnerId
    );
    expect(realMatches).toHaveLength(4);
  });

  it('all round 1 matches have nextMatchId set', () => {
    const players = makePlayers(8);
    const bracket = generateBracket(players);
    for (const match of bracket.rounds[0]!) {
      expect(match.nextMatchId).toBeTruthy();
    }
  });

  it('pairs of round 1 matches share the same nextMatchId', () => {
    const players = makePlayers(8);
    const bracket = generateBracket(players);
    const r1 = bracket.rounds[0]!;
    for (let i = 0; i < r1.length; i += 2) {
      expect(r1[i]!.nextMatchId).toBe(r1[i + 1]!.nextMatchId);
    }
  });

  it('every player appears exactly once in round 1', () => {
    const players = makePlayers(8);
    const bracket = generateBracket(players);
    const playerIds = new Set();
    for (const match of bracket.rounds[0]!) {
      if (match.player1Id) playerIds.add(match.player1Id);
      if (match.player2Id) playerIds.add(match.player2Id);
    }
    expect(playerIds.size).toBe(8);
    for (const p of players) {
      expect(playerIds.has(p.id)).toBe(true);
    }
  });

  it('pairs seeds 1..N as 1vN, 3vN-2, 2vN-1, 4vN-3 in round 1', () => {
    const players = makePlayers(8);
    const bracket = generateBracket(players);
    const round1 = bracket.rounds[0]!;

    const pairs = round1.map((m) => [m.player1Id, m.player2Id]);
    expect(pairs).toEqual([
      ['p1', 'p8'],
      ['p3', 'p6'],
      ['p2', 'p7'],
      ['p4', 'p5'],
    ]);
  });

  it('pairs seeds 1..N in alternating branches for size 16', () => {
    const players = makePlayers(16);
    const bracket = generateBracket(players);
    const round1 = bracket.rounds[0]!;

    const pairs = round1.map((m) => [m.player1Id, m.player2Id]);
    expect(pairs).toEqual([
      ['p1', 'p16'],
      ['p3', 'p14'],
      ['p5', 'p12'],
      ['p7', 'p10'],
      ['p2', 'p15'],
      ['p4', 'p13'],
      ['p6', 'p11'],
      ['p8', 'p9'],
    ]);
  });
});

describe('advanceWinner — 4 players, full tournament', () => {
  it('plays through entire bracket correctly', () => {
    const players = makePlayers(4);
    let bracket = generateBracket(players);

    // Round 1: both matches should be playable
    let playable = findPlayableMatches(bracket);
    expect(playable).toHaveLength(2);

    // Play first match: p1 wins
    const m1 = bracket.rounds[0]![0]!;
    bracket = advanceWinner(clone(bracket), m1.id, m1.player1Id!, [[11, 5], [11, 7], [11, 3]] as SetScore[]);

    // First match should have winner
    const m1After = findMatch(bracket, m1.id)!;
    expect(m1After.winnerId).toBe(m1.player1Id);

    // Final should now have one player
    const finalAfterM1 = bracket.rounds[1]![0]!;
    expect(
      finalAfterM1.player1Id === m1.player1Id || finalAfterM1.player2Id === m1.player1Id
    ).toBe(true);

    // Play second match: player2Id wins
    const m2 = bracket.rounds[0]![1]!;
    bracket = advanceWinner(clone(bracket), m2.id, m2.player2Id!, [[5, 11], [11, 9], [9, 11], [11, 8]] as SetScore[]);

    const m2After = findMatch(bracket, m2.id)!;
    expect(m2After.winnerId).toBe(m2.player2Id);

    // Final should now have both players
    const finalAfterM2 = bracket.rounds[1]![0]!;
    expect(finalAfterM2.player1Id).toBeTruthy();
    expect(finalAfterM2.player2Id).toBeTruthy();
    expect(finalAfterM2.player1Id).not.toBe(finalAfterM2.player2Id);

    // Final should be playable
    playable = findPlayableMatches(bracket);
    expect(playable).toHaveLength(1);
    expect(playable[0]!.id).toBe(finalAfterM2.id);

    // Play the final
    bracket = advanceWinner(
      clone(bracket),
      finalAfterM2.id,
      finalAfterM2.player1Id!,
      [[11, 9], [11, 7], [11, 5]]
    );

    // Tournament should have a winner
    const winner = getBracketWinner(bracket);
    expect(winner).toBeTruthy();
  });
});

describe('advanceWinner — 8 players, full tournament', () => {
  it('advances winners through all rounds correctly', () => {
    const players = makePlayers(8);
    let bracket = generateBracket(players);
    const scores: SetScore[] = [[11, 5], [11, 7], [11, 3]];

    // Round 1: 4 playable matches
    let playable = findPlayableMatches(bracket);
    expect(playable).toHaveLength(4);

    // Play all round 1 matches — player1 always wins
    for (const match of bracket.rounds[0]!) {
      bracket = advanceWinner(clone(bracket), match.id, match.player1Id!, scores);
    }

    // Round 2 (semifinals): should have 2 playable matches
    playable = findPlayableMatches(bracket);
    expect(playable).toHaveLength(2);

    // Both semis should have both players filled
    for (const match of bracket.rounds[1]!) {
      expect(match.player1Id).toBeTruthy();
      expect(match.player2Id).toBeTruthy();
    }

    // Play both semis — player1 always wins
    for (const match of bracket.rounds[1]!) {
      bracket = advanceWinner(clone(bracket), match.id, match.player1Id!, scores);
    }

    // Final should be playable
    playable = findPlayableMatches(bracket);
    expect(playable).toHaveLength(1);

    const final = bracket.rounds[2]![0]!;
    expect(final.player1Id).toBeTruthy();
    expect(final.player2Id).toBeTruthy();

    // Play final
    bracket = advanceWinner(clone(bracket), final.id, final.player1Id!, scores);

    expect(getBracketWinner(bracket)).toBeTruthy();
  });
});

describe('advanceWinner — 3 players with bye', () => {
  it('bye player is pre-advanced and tournament completes', () => {
    const players = makePlayers(3);
    let bracket = generateBracket(players);
    const scores: SetScore[] = [[11, 5], [11, 7], [11, 3]];

    // One round 1 match should already have a winner (bye)
    const byeMatch = bracket.rounds[0]!.find((m) => m.winnerId);
    expect(byeMatch).toBeTruthy();

    // One round 1 match should be playable
    let playable = findPlayableMatches(bracket);
    expect(playable).toHaveLength(1);

    // Play the real match
    const realMatch = playable[0]!;
    bracket = advanceWinner(clone(bracket), realMatch.id, realMatch.player1Id!, scores);

    // Final should now be playable
    playable = findPlayableMatches(bracket);
    expect(playable).toHaveLength(1);

    const final = bracket.rounds[1]![0]!;
    expect(final.player1Id).toBeTruthy();
    expect(final.player2Id).toBeTruthy();

    // Play final
    bracket = advanceWinner(clone(bracket), final.id, final.player1Id!, scores);
    expect(getBracketWinner(bracket)).toBeTruthy();
  });
});

describe('advanceWinner — 5 players with byes', () => {
  it('completes full tournament', () => {
    const players = makePlayers(5);
    let bracket = generateBracket(players);
    const scores: SetScore[] = [[11, 5], [11, 7], [11, 3]];

    // Round 1: 3 byes, 1 real match.
    // However, two bye-winners may already be paired in round 2,
    // so there can be more than 1 playable match initially.
    let playable = findPlayableMatches(bracket);
    expect(playable.length).toBeGreaterThanOrEqual(1);

    // Play all available matches round by round until complete
    let safety = 0;
    while (!getBracketWinner(bracket) && safety++ < 20) {
      playable = findPlayableMatches(bracket);
      if (playable.length === 0) break;
      for (const match of playable) {
        bracket = advanceWinner(clone(bracket), match.id, match.player1Id!, scores);
      }
    }

    expect(getBracketWinner(bracket)).toBeTruthy();
  });
});

describe('advanceWinner — 12 players', () => {
  it('completes full tournament', () => {
    const players = makePlayers(12);
    let bracket = generateBracket(players);
    const scores: SetScore[] = [[11, 5], [11, 7], [11, 3]];

    // Round 1: 4 byes, 4 real matches.
    // Some byes can auto-advance and create extra playable matches immediately.
    let playable = findPlayableMatches(bracket);
    expect(playable.length).toBeGreaterThanOrEqual(4);

    let safety = 0;
    while (!getBracketWinner(bracket) && safety++ < 50) {
      playable = findPlayableMatches(bracket);
      if (playable.length === 0) break;
      for (const match of playable) {
        bracket = advanceWinner(clone(bracket), match.id, match.player1Id!, scores);
      }
    }

    expect(getBracketWinner(bracket)).toBeTruthy();
  });
});

describe('advanceWinner — player2 wins', () => {
  it('correctly advances player2 through bracket', () => {
    const players = makePlayers(4);
    let bracket = generateBracket(players);
    const scores: SetScore[] = [[5, 11], [7, 11], [3, 11]];

    // Play all round 1 matches — player2 always wins
    for (const match of bracket.rounds[0]!) {
      bracket = advanceWinner(clone(bracket), match.id, match.player2Id!, scores);
    }

    // Final should have both players
    const final = bracket.rounds[1]![0]!;
    expect(final.player1Id).toBeTruthy();
    expect(final.player2Id).toBeTruthy();
    expect(final.player1Id).not.toBe(final.player2Id);

    // Play final
    bracket = advanceWinner(clone(bracket), final.id, final.player2Id!, scores);
    expect(getBracketWinner(bracket)).toBeTruthy();
  });
});

describe('advanceWinner — mixed winners', () => {
  it('correctly handles p1 winning first match and p2 winning second match', () => {
    const players = makePlayers(4);
    let bracket = generateBracket(players);

    const m1 = bracket.rounds[0]![0]!;
    const m2 = bracket.rounds[0]![1]!;

    // m1: player1 wins, m2: player2 wins
    bracket = advanceWinner(clone(bracket), m1.id, m1.player1Id!, [[11, 5]] as SetScore[]);
    bracket = advanceWinner(clone(bracket), m2.id, m2.player2Id!, [[5, 11]] as SetScore[]);

    const final = bracket.rounds[1]![0]!;
    expect(final.player1Id).toBe(m1.player1Id);
    expect(final.player2Id).toBe(m2.player2Id);
  });
});

describe('canEditMatch', () => {
  it('allows editing unplayed matches with both players', () => {
    const players = makePlayers(4);
    const bracket = generateBracket(players);
    for (const match of bracket.rounds[0]!) {
      expect(canEditMatch(bracket, match.id)).toBe(true);
    }
  });

  it('allows editing a played match if next match has no winner', () => {
    const players = makePlayers(4);
    let bracket = generateBracket(players);
    const m1 = bracket.rounds[0]![0]!;
    bracket = advanceWinner(clone(bracket), m1.id, m1.player1Id!, [[11, 5]] as SetScore[]);
    // m1 is played but final not yet played
    expect(canEditMatch(bracket, m1.id)).toBe(true);
  });

  it('prevents editing a match if next match already has a winner', () => {
    const players = makePlayers(4);
    let bracket = generateBracket(players);
    const scores: SetScore[] = [[11, 5], [11, 7], [11, 3]];

    // Play both round 1 matches
    for (const match of bracket.rounds[0]!) {
      bracket = advanceWinner(clone(bracket), match.id, match.player1Id!, scores);
    }
    // Play the final
    const final = bracket.rounds[1]![0]!;
    bracket = advanceWinner(clone(bracket), final.id, final.player1Id!, scores);

    // Round 1 matches should not be editable
    for (const match of bracket.rounds[0]!) {
      expect(canEditMatch(bracket, match.id)).toBe(false);
    }
  });
});

describe('getBracketWinner', () => {
  it('returns null when tournament is incomplete', () => {
    const players = makePlayers(4);
    const bracket = generateBracket(players);
    expect(getBracketWinner(bracket)).toBeNull();
  });

  it('returns winnerId when final is decided', () => {
    const players = makePlayers(2);
    let bracket = generateBracket(players);
    const match = bracket.rounds[0]![0]!;
    bracket = advanceWinner(clone(bracket), match.id, match.player1Id!, [[11, 5]] as SetScore[]);
    expect(getBracketWinner(bracket)).toBe(match.player1Id);
  });

  it('returns winner for 1-player bracket via auto-advanced winnerId', () => {
    const players = makePlayers(1);
    const bracket = generateBracket(players);
    expect(getBracketWinner(bracket)).toBe(players[0]!.id);
  });

  it('returns null for 3-player bracket before semifinal is played (regression)', () => {
    const players = makePlayers(3);
    const bracket = generateBracket(players);
    // Bye auto-advances one player to the final, but the other semifinal is unplayed.
    // getBracketWinner must NOT declare a winner prematurely.
    expect(getBracketWinner(bracket)).toBeNull();
  });
});
