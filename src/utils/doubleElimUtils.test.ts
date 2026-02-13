import { describe, it, expect } from 'vitest';
import { generateDoubleElim, advanceDoubleElim, getDoubleElimWinner, canEditDoubleElimMatch } from './doubleElimUtils';
import type { Player, DoubleElim } from '../types';

function makePlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
  }));
}

function clone(obj: DoubleElim): DoubleElim {
  return structuredClone(obj);
}

describe('generateDoubleElim', () => {
  it('creates winners, losers, and finals sections for 4 players', () => {
    const doubleElim = generateDoubleElim(makePlayers(4));

    expect(doubleElim.winners.rounds).toHaveLength(2);
    expect(doubleElim.losers.rounds).toHaveLength(2);
    expect(doubleElim.finals.grandFinal).toBeTruthy();
    expect(doubleElim.finals.resetFinal).toBeTruthy();
  });
});

describe('advanceDoubleElim', () => {
  it('routes losers into the losers bracket', () => {
    let doubleElim = generateDoubleElim(makePlayers(4));
    const winnersRound1 = doubleElim.winners.rounds[0]!;

    const matchA = winnersRound1[0]!;
    const matchB = winnersRound1[1]!;

    doubleElim = advanceDoubleElim(clone(doubleElim), matchA.id, matchA.player1Id!, [ [11, 7] ]);
    doubleElim = advanceDoubleElim(clone(doubleElim), matchB.id, matchB.player2Id!, [ [9, 11] ]);

    const losersRound1 = doubleElim.losers.rounds[0]![0]!;
    expect(losersRound1.player1Id).toBeTruthy();
    expect(losersRound1.player2Id).toBeTruthy();
  });

  it('sets grand final once both bracket champions are known', () => {
    let doubleElim = generateDoubleElim(makePlayers(4));
    const winnersRound1 = doubleElim.winners.rounds[0]!;

    const matchA = winnersRound1[0]!;
    const matchB = winnersRound1[1]!;

    doubleElim = advanceDoubleElim(clone(doubleElim), matchA.id, matchA.player1Id!, [ [11, 7] ]);
    doubleElim = advanceDoubleElim(clone(doubleElim), matchB.id, matchB.player2Id!, [ [9, 11] ]);

    const winnersFinal = doubleElim.winners.rounds[1]![0]!;
    doubleElim = advanceDoubleElim(clone(doubleElim), winnersFinal.id, winnersFinal.player1Id!, [ [11, 9] ]);

    const losersRound1 = doubleElim.losers.rounds[0]![0]!;
    doubleElim = advanceDoubleElim(clone(doubleElim), losersRound1.id, losersRound1.player1Id!, [ [11, 5] ]);

    const losersFinal = doubleElim.losers.rounds[1]![0]!;
    doubleElim = advanceDoubleElim(clone(doubleElim), losersFinal.id, losersFinal.player2Id!, [ [7, 11] ]);

    const grandFinal = doubleElim.finals.grandFinal;
    expect(grandFinal.player1Id).toBeTruthy();
    expect(grandFinal.player2Id).toBeTruthy();
  });

  it('declares winner when grand final winner is winners champion', () => {
    let doubleElim = generateDoubleElim(makePlayers(4));
    const winnersRound1 = doubleElim.winners.rounds[0]!;

    const matchA = winnersRound1[0]!;
    const matchB = winnersRound1[1]!;

    doubleElim = advanceDoubleElim(clone(doubleElim), matchA.id, matchA.player1Id!, [ [11, 7] ]);
    doubleElim = advanceDoubleElim(clone(doubleElim), matchB.id, matchB.player2Id!, [ [9, 11] ]);

    const winnersFinal = doubleElim.winners.rounds[1]![0]!;
    doubleElim = advanceDoubleElim(clone(doubleElim), winnersFinal.id, winnersFinal.player1Id!, [ [11, 9] ]);

    const losersRound1 = doubleElim.losers.rounds[0]![0]!;
    doubleElim = advanceDoubleElim(clone(doubleElim), losersRound1.id, losersRound1.player1Id!, [ [11, 5] ]);

    const losersFinal = doubleElim.losers.rounds[1]![0]!;
    doubleElim = advanceDoubleElim(clone(doubleElim), losersFinal.id, losersFinal.player2Id!, [ [7, 11] ]);

    const grandFinal = doubleElim.finals.grandFinal;
    doubleElim = advanceDoubleElim(clone(doubleElim), grandFinal.id, grandFinal.player1Id!, [ [11, 6] ]);

    expect(getDoubleElimWinner(doubleElim)).toBe(grandFinal.player1Id);
  });

  it('creates a reset final when the losers champion wins the grand final', () => {
    let doubleElim = generateDoubleElim(makePlayers(4));
    const winnersRound1 = doubleElim.winners.rounds[0]!;

    const matchA = winnersRound1[0]!;
    const matchB = winnersRound1[1]!;

    doubleElim = advanceDoubleElim(clone(doubleElim), matchA.id, matchA.player1Id!, [[11, 7]]);
    doubleElim = advanceDoubleElim(clone(doubleElim), matchB.id, matchB.player2Id!, [[9, 11]]);

    const winnersFinal = doubleElim.winners.rounds[1]![0]!;
    doubleElim = advanceDoubleElim(
      clone(doubleElim),
      winnersFinal.id,
      winnersFinal.player1Id!,
      [[11, 9]]
    );

    const losersRound1 = doubleElim.losers.rounds[0]![0]!;
    doubleElim = advanceDoubleElim(
      clone(doubleElim),
      losersRound1.id,
      losersRound1.player1Id!,
      [[11, 5]]
    );

    const losersFinal = doubleElim.losers.rounds[1]![0]!;
    const losersChampion = losersFinal.player2Id!;
    doubleElim = advanceDoubleElim(
      clone(doubleElim),
      losersFinal.id,
      losersChampion,
      [[7, 11]]
    );

    const grandFinal = doubleElim.finals.grandFinal;
    doubleElim = advanceDoubleElim(
      clone(doubleElim),
      grandFinal.id,
      grandFinal.player2Id!,
      [[9, 11]]
    );

    expect(doubleElim.finals.resetFinal.player1Id).toBeTruthy();
    expect(doubleElim.finals.resetFinal.player2Id).toBeTruthy();
    expect(getDoubleElimWinner(doubleElim)).toBeNull();

    const resetFinal = doubleElim.finals.resetFinal;
    doubleElim = advanceDoubleElim(
      clone(doubleElim),
      resetFinal.id,
      losersChampion,
      [[11, 6]]
    );

    expect(getDoubleElimWinner(doubleElim)).toBe(losersChampion);
  });
});

describe('double elimination with 3 players and BYE', () => {
  it('allows editing A vs B after B vs C is played', () => {
    // Hráči: A, B, C
    const players = [
      { id: 'A', name: 'A' },
      { id: 'B', name: 'B' },
      { id: 'C', name: 'C' },
    ];
    let doubleElim = generateDoubleElim(players);
    // Najdi zápasy v 1. kole winners (měly by být 2: jeden BYE, jeden normální)
    const winnersRound1 = doubleElim.winners.rounds[0]!;
    // Najdi zápas, kde hraje B a C (není BYE)
    const matchBC = winnersRound1.find(
      m => m.player1Id && m.player2Id && [m.player1Id, m.player2Id].includes('B') && [m.player1Id, m.player2Id].includes('C')
    )!;
    // Odehraj zápas B vs C (vyhraje B)
    doubleElim = advanceDoubleElim(doubleElim, matchBC.id, 'B', [[11, 5], [11, 7], [11, 3]]);
    // Najdi zápas A vs B ve druhém kole winners
    const winnersRound2 = doubleElim.winners.rounds[1]!;
    const matchAB = winnersRound2.find(
      m => [m.player1Id, m.player2Id].includes('A') && [m.player1Id, m.player2Id].includes('B')
    )!;
    // Ověř, že zápas A vs B je možné editovat
    expect(canEditDoubleElimMatch(doubleElim, matchAB.id)).toBe(true);
  });

  it('allows editing B vs C before and after result is entered', () => {
    const players = [
      { id: 'A', name: 'A' },
      { id: 'B', name: 'B' },
      { id: 'C', name: 'C' },
    ];
    let doubleElim = generateDoubleElim(players);
    const winnersRound1 = doubleElim.winners.rounds[0]!;
    const matchBC = winnersRound1.find(
      m => m.player1Id && m.player2Id && [m.player1Id, m.player2Id].includes('B') && [m.player1Id, m.player2Id].includes('C')
    )!;
    // Před zadáním výsledku
    expect(canEditDoubleElimMatch(doubleElim, matchBC.id)).toBe(true);
    // Po zadání výsledku
    doubleElim = advanceDoubleElim(doubleElim, matchBC.id, 'B', [[11, 5], [11, 7], [11, 3]]);
    expect(canEditDoubleElimMatch(doubleElim, matchBC.id)).toBe(true);
  });
});

function findMatchInRounds(
  rounds: { player1Id: string | null; player2Id: string | null; id: string }[][],
  p1: string,
  p2: string
): { player1Id: string | null; player2Id: string | null; id: string } | null {
  for (const round of rounds) {
    const m = round.find(
      m => (m.player1Id === p1 && m.player2Id === p2) ||
           (m.player1Id === p2 && m.player2Id === p1)
    );
    if (m) return m;
  }
  return null;
}

describe('double elimination with 5 players A B C D E - full simulation', () => {
  const players: Player[] = [
    { id: 'A', name: 'A' },
    { id: 'B', name: 'B' },
    { id: 'C', name: 'C' },
    { id: 'D', name: 'D' },
    { id: 'E', name: 'E' },
  ];

  it('auto-advances C in losers entry match after A-C is played in winners', () => {
    let de = generateDoubleElim(players);

    // --- Winners čtvrtfinále: D-E (D vyhraje 5-0) ---
    const matchDE = findMatchInRounds(de.winners.rounds, 'D', 'E')!;
    expect(matchDE).toBeTruthy();
    de = advanceDoubleElim(clone(de), matchDE.id, 'D', [[5, 0]]);

    // E padá do losers R0 (BYE-E), auto-advance E
    const losersR0 = de.losers.rounds[0]!;
    const byeE = losersR0.find(m => m.player1Id === 'E' || m.player2Id === 'E')!;
    expect(byeE.winnerId).toBe('E');

    // --- Winners semifinále: A-C (A vyhraje 3-0) ---
    const matchAC = findMatchInRounds(de.winners.rounds, 'A', 'C')!;
    expect(matchAC).toBeTruthy();
    de = advanceDoubleElim(clone(de), matchAC.id, 'A', [[3, 0]]);

    // C padá do losers R1 entry (BYE-C), musí auto-advance C
    const losersR1 = de.losers.rounds[1]!;
    const entryC = losersR1.find(m => m.player1Id === 'C' || m.player2Id === 'C')!;
    expect(entryC).toBeTruthy();
    expect(entryC.winnerId).toBe('C');

    // C postoupil do losers R2 (consolation)
    const losersR2 = de.losers.rounds[2]!;
    const consolMatch = losersR2[0]!;
    expect([consolMatch.player1Id, consolMatch.player2Id]).toContain('C');

    // --- Winners semifinále: B-D (B vyhraje 1-0) ---
    const matchBD = findMatchInRounds(de.winners.rounds, 'B', 'D')!;
    expect(matchBD).toBeTruthy();
    de = advanceDoubleElim(clone(de), matchBD.id, 'B', [[1, 0]]);

    // D padá do losers R1 entry, kde čeká E
    const losersR1After = de.losers.rounds[1]!;
    const entryDEAfter = losersR1After.find(m =>
      [m.player1Id, m.player2Id].includes('D') &&
      [m.player1Id, m.player2Id].includes('E')
    )!;
    expect(entryDEAfter).toBeTruthy();

    // --- Winners finále: A-B (B vyhraje 0-3) ---
    const matchAB = findMatchInRounds(de.winners.rounds, 'A', 'B')!;
    expect(matchAB).toBeTruthy();
    de = advanceDoubleElim(clone(de), matchAB.id, 'B', [[0, 3]]);

    // B je winners champion
    expect(de.winners.rounds.at(-1)![0]!.winnerId).toBe('B');

    // --- Losers: D-E (D vyhraje) ---
    const losersR1Now = de.losers.rounds[1]!;
    const losersDE = losersR1Now.find(m =>
      [m.player1Id, m.player2Id].includes('D') &&
      [m.player1Id, m.player2Id].includes('E')
    )!;
    expect(losersDE).toBeTruthy();
    de = advanceDoubleElim(clone(de), losersDE.id, 'D', [[11, 5]]);

    // --- Losers consolation: C vs D ---
    const losersR2Now = de.losers.rounds[2]!;
    const consolCD = losersR2Now[0]!;
    expect([consolCD.player1Id, consolCD.player2Id]).toContain('C');
    expect([consolCD.player1Id, consolCD.player2Id]).toContain('D');
    de = advanceDoubleElim(clone(de), consolCD.id, 'C', [[11, 8]]);

    // A padl z winners finále do losers R3 entry
    const losersR3 = de.losers.rounds[3]!;
    const losersEntryA = losersR3[0]!;
    expect([losersEntryA.player1Id, losersEntryA.player2Id]).toContain('A');
    expect([losersEntryA.player1Id, losersEntryA.player2Id]).toContain('C');
    de = advanceDoubleElim(clone(de), losersEntryA.id, 'A', [[11, 6]]);

    // --- Grand finále: B (winners) vs A (losers champion) ---
    const grandFinal = de.finals.grandFinal;
    expect(grandFinal.player1Id).toBe('B');
    expect(grandFinal.player2Id).toBe('A');
    de = advanceDoubleElim(clone(de), grandFinal.id, 'B', [[11, 9]]);

    // B vyhrál grand finále jako winners champion → turnaj končí, B je vítěz
    expect(getDoubleElimWinner(de)).toBe('B');
  });
});
