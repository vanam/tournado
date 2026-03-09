import { describe, it, expect } from 'vitest';
import { generateDoubleElim, advanceDoubleElim, clearDoubleElimMatch, getDoubleElimWinner, canEditDoubleElimMatch, hasPlayedDownstreamDoubleElimMatch } from './doubleElimUtils';
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

describe('double elimination with 8 players - losers semifinal editability', () => {
  it('allows editing H vs D in losers semifinals when winners final is played before losers bracket', () => {
    const players: Player[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(id => ({ id, name: id }));
    let de = generateDoubleElim(players);

    // Winners quarterfinals
    const matchAH = findMatchInRounds(de.winners.rounds, 'A', 'H')!;
    const matchCF = findMatchInRounds(de.winners.rounds, 'C', 'F')!;
    const matchBG = findMatchInRounds(de.winners.rounds, 'B', 'G')!;
    const matchDE = findMatchInRounds(de.winners.rounds, 'D', 'E')!;
    de = advanceDoubleElim(clone(de), matchAH.id, 'A', [[2, 0]]);
    de = advanceDoubleElim(clone(de), matchCF.id, 'C', [[2, 0]]);
    de = advanceDoubleElim(clone(de), matchBG.id, 'B', [[2, 0]]);
    de = advanceDoubleElim(clone(de), matchDE.id, 'D', [[2, 0]]);

    // Winners semifinals
    const matchAC = findMatchInRounds(de.winners.rounds, 'A', 'C')!;
    const matchBD = findMatchInRounds(de.winners.rounds, 'B', 'D')!;
    de = advanceDoubleElim(clone(de), matchAC.id, 'A', [[2, 0]]);
    de = advanceDoubleElim(clone(de), matchBD.id, 'B', [[2, 0]]);

    // Winners final played BEFORE losers bracket (B drops to losers)
    const matchAB = findMatchInRounds(de.winners.rounds, 'A', 'B')!;
    de = advanceDoubleElim(clone(de), matchAB.id, 'A', [[2, 0]]);

    // Losers bracket round 1
    const matchHF = findMatchInRounds(de.losers.rounds, 'H', 'F')!;
    const matchGE = findMatchInRounds(de.losers.rounds, 'G', 'E')!;
    de = advanceDoubleElim(clone(de), matchHF.id, 'H', [[2, 0]]);
    de = advanceDoubleElim(clone(de), matchGE.id, 'G', [[2, 0]]);

    // Losers quarterfinals (entry round)
    const matchHC = findMatchInRounds(de.losers.rounds, 'H', 'C')!;
    const matchDG = findMatchInRounds(de.losers.rounds, 'D', 'G')!;
    de = advanceDoubleElim(clone(de), matchHC.id, 'H', [[2, 0]]);
    de = advanceDoubleElim(clone(de), matchDG.id, 'D', [[2, 0]]);

    // Losers semifinal H vs D must be editable
    const matchHD = findMatchInRounds(de.losers.rounds, 'H', 'D')!;
    expect(matchHD).toBeTruthy();
    expect(canEditDoubleElimMatch(de, matchHD.id)).toBe(true);
  });
});

describe('hasPlayedDownstreamDoubleElimMatch', () => {
  it('returns false for fresh double elim', () => {
    const de = generateDoubleElim(makePlayers(4));
    const match = de.winners.rounds[0]![0]!;
    expect(hasPlayedDownstreamDoubleElimMatch(de, match.id)).toBe(false);
  });

  it('returns true for winners match when next winners match has result', () => {
    let de = generateDoubleElim(makePlayers(4));
    const matchA = de.winners.rounds[0]![0]!;
    const matchB = de.winners.rounds[0]![1]!;

    de = advanceDoubleElim(clone(de), matchA.id, matchA.player1Id!, [[11, 7]]);
    de = advanceDoubleElim(clone(de), matchB.id, matchB.player2Id!, [[9, 11]]);

    const winnersFinal = de.winners.rounds[1]![0]!;
    de = advanceDoubleElim(clone(de), winnersFinal.id, winnersFinal.player1Id!, [[11, 9]]);

    // matchA and matchB feed into winnersFinal which now has a result
    expect(hasPlayedDownstreamDoubleElimMatch(de, matchA.id)).toBe(true);
    expect(hasPlayedDownstreamDoubleElimMatch(de, matchB.id)).toBe(true);
  });

  it('returns true for winners match when corresponding losers entry has result (bug fix)', () => {
    let de = generateDoubleElim(makePlayers(4));
    const matchA = de.winners.rounds[0]![0]!;
    const matchB = de.winners.rounds[0]![1]!;

    de = advanceDoubleElim(clone(de), matchA.id, matchA.player1Id!, [[11, 7]]);
    de = advanceDoubleElim(clone(de), matchB.id, matchB.player2Id!, [[9, 11]]);

    // Both losers entered losers bracket R0. Play the losers R0 match.
    const losersR0 = de.losers.rounds[0]![0]!;
    de = advanceDoubleElim(clone(de), losersR0.id, losersR0.player1Id!, [[11, 5]]);

    // matchA's loser entry match has been played → downstream is played
    expect(hasPlayedDownstreamDoubleElimMatch(de, matchA.id)).toBe(true);
    expect(hasPlayedDownstreamDoubleElimMatch(de, matchB.id)).toBe(true);
  });

  it('returns true when tournament has a final winner', () => {
    let de = generateDoubleElim(makePlayers(4));
    const matchA = de.winners.rounds[0]![0]!;
    const matchB = de.winners.rounds[0]![1]!;

    de = advanceDoubleElim(clone(de), matchA.id, matchA.player1Id!, [[11, 7]]);
    de = advanceDoubleElim(clone(de), matchB.id, matchB.player2Id!, [[9, 11]]);

    const winnersFinal = de.winners.rounds[1]![0]!;
    de = advanceDoubleElim(clone(de), winnersFinal.id, winnersFinal.player1Id!, [[11, 9]]);

    const losersR0 = de.losers.rounds[0]![0]!;
    de = advanceDoubleElim(clone(de), losersR0.id, losersR0.player1Id!, [[11, 5]]);

    const losersFinal = de.losers.rounds[1]![0]!;
    de = advanceDoubleElim(clone(de), losersFinal.id, losersFinal.player2Id!, [[7, 11]]);

    const grandFinal = de.finals.grandFinal;
    de = advanceDoubleElim(clone(de), grandFinal.id, grandFinal.player1Id!, [[11, 6]]);

    // All non-final matches should report downstream played
    expect(hasPlayedDownstreamDoubleElimMatch(de, matchA.id)).toBe(true);
    expect(hasPlayedDownstreamDoubleElimMatch(de, losersR0.id)).toBe(true);
  });

  it('returns false for reset final (terminal)', () => {
    let de = generateDoubleElim(makePlayers(4));
    const matchA = de.winners.rounds[0]![0]!;
    const matchB = de.winners.rounds[0]![1]!;

    de = advanceDoubleElim(clone(de), matchA.id, matchA.player1Id!, [[11, 7]]);
    de = advanceDoubleElim(clone(de), matchB.id, matchB.player2Id!, [[9, 11]]);

    const winnersFinal = de.winners.rounds[1]![0]!;
    de = advanceDoubleElim(clone(de), winnersFinal.id, winnersFinal.player1Id!, [[11, 9]]);

    const losersR0 = de.losers.rounds[0]![0]!;
    de = advanceDoubleElim(clone(de), losersR0.id, losersR0.player1Id!, [[11, 5]]);

    const losersFinal = de.losers.rounds[1]![0]!;
    de = advanceDoubleElim(clone(de), losersFinal.id, losersFinal.player2Id!, [[7, 11]]);

    // Losers champion wins grand final → reset final
    const grandFinal = de.finals.grandFinal;
    de = advanceDoubleElim(clone(de), grandFinal.id, grandFinal.player2Id!, [[9, 11]]);

    const resetFinal = de.finals.resetFinal;
    de = advanceDoubleElim(clone(de), resetFinal.id, resetFinal.player1Id!, [[11, 6]]);

    // Reset final is terminal
    expect(hasPlayedDownstreamDoubleElimMatch(de, resetFinal.id)).toBe(false);
  });

  it('returns true for grand final when reset final has result', () => {
    let de = generateDoubleElim(makePlayers(4));
    const matchA = de.winners.rounds[0]![0]!;
    const matchB = de.winners.rounds[0]![1]!;

    de = advanceDoubleElim(clone(de), matchA.id, matchA.player1Id!, [[11, 7]]);
    de = advanceDoubleElim(clone(de), matchB.id, matchB.player2Id!, [[9, 11]]);

    const winnersFinal = de.winners.rounds[1]![0]!;
    de = advanceDoubleElim(clone(de), winnersFinal.id, winnersFinal.player1Id!, [[11, 9]]);

    const losersR0 = de.losers.rounds[0]![0]!;
    de = advanceDoubleElim(clone(de), losersR0.id, losersR0.player1Id!, [[11, 5]]);

    const losersFinal = de.losers.rounds[1]![0]!;
    de = advanceDoubleElim(clone(de), losersFinal.id, losersFinal.player2Id!, [[7, 11]]);

    // Losers champion wins grand final → reset final
    const grandFinal = de.finals.grandFinal;
    de = advanceDoubleElim(clone(de), grandFinal.id, grandFinal.player2Id!, [[9, 11]]);

    const resetFinal = de.finals.resetFinal;
    de = advanceDoubleElim(clone(de), resetFinal.id, resetFinal.player1Id!, [[11, 6]]);

    // Grand final has downstream (reset final has winner)
    expect(hasPlayedDownstreamDoubleElimMatch(de, grandFinal.id)).toBe(true);
  });

  it('allows editing winners semifinal after clearing winners final when losers entry was only auto-advanced (BYE)', () => {
    // 3 players: A has a BYE in W-R0, B vs C is the contested W-SF match.
    // After playing B vs C, the losers entry (L-R0) is auto-advanced for C (only one real player due to BYE).
    // After playing and then clearing the winners final, W-SF (matchBC) should be editable.
    const players = [
      { id: 'A', name: 'A' },
      { id: 'B', name: 'B' },
      { id: 'C', name: 'C' },
    ];
    let de = generateDoubleElim(players);

    // Find the contested W-R0 match (B vs C)
    const matchBC = de.winners.rounds[0]!.find(m => m.player1Id && m.player2Id)!;
    expect(matchBC).toBeTruthy();

    de = advanceDoubleElim(clone(de), matchBC.id, 'B', [[11, 5]]);

    // Play and then clear the winners final
    const winnersFinal = de.winners.rounds[1]![0]!;
    de = advanceDoubleElim(clone(de), winnersFinal.id, winnersFinal.player1Id!, [[11, 7]]);
    de = clearDoubleElimMatch(clone(de), winnersFinal.id);

    // W-SF (matchBC) must be editable — L-R0 was only auto-advanced (BYE slot), not explicitly played
    expect(hasPlayedDownstreamDoubleElimMatch(de, matchBC.id)).toBe(false);
  });

  it('still blocks editing winners QF when losers bracket entry was explicitly played (both players)', () => {
    // 4 players: both W-QF matches produce real losers → L-R0 can be explicitly played.
    // After L-R0 is played, clearing W-F should not unlock W-QF.
    let de = generateDoubleElim(makePlayers(4));
    const matchA = de.winners.rounds[0]![0]!;
    const matchB = de.winners.rounds[0]![1]!;

    de = advanceDoubleElim(clone(de), matchA.id, matchA.player1Id!, [[11, 7]]);
    de = advanceDoubleElim(clone(de), matchB.id, matchB.player2Id!, [[9, 11]]);

    // Explicitly play L-R0 (both real losers present)
    const losersR0 = de.losers.rounds[0]![0]!;
    expect(losersR0.player1Id).toBeTruthy();
    expect(losersR0.player2Id).toBeTruthy();
    de = advanceDoubleElim(clone(de), losersR0.id, losersR0.player1Id!, [[11, 5]]);

    // Play and clear the winners final
    const winnersFinal = de.winners.rounds[1]![0]!;
    de = advanceDoubleElim(clone(de), winnersFinal.id, winnersFinal.player1Id!, [[11, 9]]);
    de = clearDoubleElimMatch(clone(de), winnersFinal.id);

    // W-QF (matchA) must remain locked: L-R0 was explicitly played with both players
    expect(hasPlayedDownstreamDoubleElimMatch(de, matchA.id)).toBe(true);
  });
});
