import { describe, it, expect } from 'vitest';
import { buildStandingsResults, buildBracketResults, buildDoubleElimResults, sortResults, offsetResults } from './resultsUtils';
import { generateBracket, advanceWinner } from './bracketUtils';
import { generateDoubleElim, advanceDoubleElim } from './doubleElimUtils';
import type { Player, StandingsRow, RankedResult, SetScore } from '../types';

function makePlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    seed: i + 1,
  }));
}

describe('buildStandingsResults', () => {
  it('assigns shared ranks for tied rows', () => {
    const standings: StandingsRow[] = [
      {
        playerId: 'p1',
        name: 'Player 1',
        played: 3,
        wins: 2,
        losses: 1,
        points: 2,
        setsWon: 6,
        setsLost: 2,
        pointsWon: 0,
        pointsLost: 0,
      },
      {
        playerId: 'p2',
        name: 'Player 2',
        played: 3,
        wins: 2,
        losses: 1,
        points: 2,
        setsWon: 6,
        setsLost: 2,
        pointsWon: 0,
        pointsLost: 0,
      },
      {
        playerId: 'p3',
        name: 'Player 3',
        played: 3,
        wins: 1,
        losses: 2,
        points: 1,
        setsWon: 3,
        setsLost: 6,
        pointsWon: 0,
        pointsLost: 0,
      },
    ];

    const results = buildStandingsResults(standings);
    expect(results[0]!.rankStart).toBe(1);
    expect(results[0]!.rankEnd).toBe(2);
    expect(results[1]!.rankStart).toBe(1);
    expect(results[1]!.rankEnd).toBe(2);
    expect(results[2]!.rankStart).toBe(3);
    expect(results[2]!.rankEnd).toBe(3);
  });
});

describe('buildBracketResults', () => {
  it('ranks players based on eliminations and winner', () => {
    const players = makePlayers(4);
    let bracket = generateBracket(players);

    const semiA = bracket.rounds[0]![0]!;
    const semiB = bracket.rounds[0]![1]!;

    bracket = advanceWinner(bracket, semiA.id, semiA.player1Id!, [[11, 5]] as SetScore[]);
    bracket = advanceWinner(bracket, semiB.id, semiB.player1Id!, [[11, 7]] as SetScore[]);

    const final = bracket.rounds[1]![0]!;
    bracket = advanceWinner(bracket, final.id, final.player1Id!, [[11, 9]] as SetScore[]);

    const results = buildBracketResults(bracket, players);
    const byId = new Map(results.map((row) => [row.playerId, row]));

    expect(byId.get('p1')!.rankStart).toBe(1);
    expect(byId.get('p2')!.rankStart).toBe(2);
    expect(byId.get('p3')!.rankStart).toBe(3);
    expect(byId.get('p3')!.rankEnd).toBe(4);
    expect(byId.get('p4')!.rankStart).toBe(3);
    expect(byId.get('p4')!.rankEnd).toBe(4);
  });
});

describe('buildDoubleElimResults', () => {
  it('ranks players with a clear champion', () => {
    const players = makePlayers(4);
    let doubleElim = generateDoubleElim(players);

    const winnersRound1 = doubleElim.winners.rounds[0]!;
    const matchA = winnersRound1[0]!;
    const matchB = winnersRound1[1]!;

    doubleElim = advanceDoubleElim(doubleElim, matchA.id, matchA.player1Id!, [[11, 7]]);
    doubleElim = advanceDoubleElim(doubleElim, matchB.id, matchB.player1Id!, [[11, 9]]);

    const winnersFinal = doubleElim.winners.rounds[1]![0]!;
    const winnersChampion = winnersFinal.player1Id!;
    doubleElim = advanceDoubleElim(doubleElim, winnersFinal.id, winnersChampion, [[11, 8]]);

    const losersRound1 = doubleElim.losers.rounds[0]![0]!;
    doubleElim = advanceDoubleElim(doubleElim, losersRound1.id, losersRound1.player1Id!, [[11, 6]]);

    const losersFinal = doubleElim.losers.rounds[1]![0]!;
    const losersChampion = losersFinal.player2Id!;
    doubleElim = advanceDoubleElim(doubleElim, losersFinal.id, losersChampion, [[11, 7]]);

    const grandFinal = doubleElim.finals.grandFinal;
    doubleElim = advanceDoubleElim(doubleElim, grandFinal.id, winnersChampion, [[11, 5]]);

    const results = buildDoubleElimResults(doubleElim, players);
    const byId = new Map(results.map((row) => [row.playerId, row]));

    expect(byId.get(winnersChampion)!.rankStart).toBe(1);
    expect(byId.get(grandFinal.player2Id!)!.rankStart).toBe(2);
    for (const player of players) {
      expect(byId.get(player.id)!.rankStart).toBeTypeOf('number');
    }
  });
});

describe('sortResults', () => {
  it('sorts by rank, then rankEnd, then name', () => {
    const rows: RankedResult[] = [
      { playerId: 'p2', name: 'Bee', rankStart: 2, rankEnd: 2 },
      { playerId: 'p1', name: 'Ace', rankStart: 1, rankEnd: 1 },
      { playerId: 'p3', name: 'Cee', rankStart: 2, rankEnd: 3 },
      { playerId: 'p4', name: 'Zed' },
    ];

    const sorted = sortResults(rows);
    expect(sorted.map((row) => row.playerId)).toEqual(['p1', 'p2', 'p3', 'p4']);
  });
});

describe('offsetResults', () => {
  it('offsets ranks when provided', () => {
    const rows: RankedResult[] = [
      { playerId: 'p1', name: 'Ace', rankStart: 1, rankEnd: 1 },
      { playerId: 'p2', name: 'Bee' },
    ];

    const shifted = offsetResults(rows, 2);
    expect(shifted[0]!.rankStart).toBe(3);
    expect(shifted[0]!.rankEnd).toBe(3);
    expect(shifted[1]!.rankStart).toBeUndefined();
  });
});

