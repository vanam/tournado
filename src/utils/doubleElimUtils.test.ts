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
  it('waits for the winners final loser before resolving the losers final', () => {
    const de = generateDoubleElim(makePlayers(4));
    for (const match of de.winners.rounds[0]!) {
      advanceDoubleElim(de, match.id, match.player1Id!, [[3, 0]]);
    }
    const firstLosers = de.losers.rounds[0]![0]!;
    advanceDoubleElim(de, firstLosers.id, firstLosers.player1Id!, [[3, 0]]);
    const losersFinal = de.losers.rounds[1]![0]!;
    expect(losersFinal.winnerId).toBeNull();
    expect(de.finals.grandFinal.player2Id).toBeNull();

    const winnersFinal = de.winners.rounds[1]![0]!;
    advanceDoubleElim(de, winnersFinal.id, winnersFinal.player1Id!, [[3, 0]]);
    expect(losersFinal.player1Id).toBeTruthy();
    expect(losersFinal.player2Id).toBeTruthy();
    expect(losersFinal.winnerId).toBeNull();
  });

  it('preserves a played reset on score corrections and removes it when no longer needed', () => {
    const de = generateDoubleElim(makePlayers(2));
    const first = de.winners.rounds[0]![0]!;
    advanceDoubleElim(de, first.id, first.player1Id!, [[3, 0]]);
    const grand = de.finals.grandFinal;
    advanceDoubleElim(de, grand.id, grand.player2Id!, [[0, 3]]);
    const reset = de.finals.resetFinal;
    advanceDoubleElim(de, reset.id, reset.player1Id!, [[3, 1]]);
    const playedReset = structuredClone(reset);

    advanceDoubleElim(de, grand.id, grand.player2Id!, [[1, 3]]);
    expect(reset).toEqual(playedReset);
    expect(getDoubleElimWinner(de)).toBe(reset.player1Id);

    advanceDoubleElim(de, grand.id, grand.player1Id!, [[3, 1]]);
    expect(reset).toMatchObject({ player1Id: null, player2Id: null, winnerId: null, scores: [] });
    expect(getDoubleElimWinner(de)).toBe(grand.player1Id);
  });

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

function playBetween(de: DoubleElim, section: 'winners' | 'losers', p1: string, p2: string, winner: string): DoubleElim {
  const match = findMatchInRounds(de[section].rounds, p1, p2);
  if (!match) throw new Error(`Missing ${section} match ${p1} vs ${p2}`);
  const scores: [number, number][] = match.player1Id === winner ? [[3, 0]] : [[0, 3]];
  return advanceDoubleElim(clone(de), match.id, winner, scores);
}

describe('double elimination with 5 players A B C D E - full simulation', () => {
  const players: Player[] = [
    { id: 'A', name: 'A' },
    { id: 'B', name: 'B' },
    { id: 'C', name: 'C' },
    { id: 'D', name: 'D' },
    { id: 'E', name: 'E' },
  ];

  it('auto-advances C after B-C and completes the seeded tournament', () => {
    let de = generateDoubleElim(players);
    de = playBetween(de, 'winners', 'D', 'E', 'D');
    const byeE = de.losers.rounds[0]!.find((match) => [match.player1Id, match.player2Id].includes('E'))!;
    expect(byeE.winnerId).toBe('E');

    // B-C is the semifinal on the BYE-only branch. Its loser can advance past a genuine BYE.
    de = playBetween(de, 'winners', 'B', 'C', 'B');
    const entryC = de.losers.rounds[1]!.find((match) => [match.player1Id, match.player2Id].includes('C'))!;
    expect(entryC.winnerId).toBe('C');
    expect([de.losers.rounds[2]![0]!.player1Id, de.losers.rounds[2]![0]!.player2Id]).toContain('C');

    de = playBetween(de, 'winners', 'A', 'D', 'A');
    de = playBetween(de, 'winners', 'A', 'B', 'B');
    de = playBetween(de, 'losers', 'D', 'E', 'D');
    de = playBetween(de, 'losers', 'C', 'D', 'C');
    de = playBetween(de, 'losers', 'A', 'C', 'A');
    const grand = de.finals.grandFinal;
    expect(grand).toMatchObject({ player1Id: 'B', player2Id: 'A' });
    advanceDoubleElim(de, grand.id, 'B', [[3, 0]]);
    expect(getDoubleElimWinner(de)).toBe('B');
  });
});

describe('double elimination with 8 players - losers semifinal editability', () => {
  it('allows editing the losers semifinal when the winners final was played first', () => {
    const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((id) => ({ id, name: id }));
    let de = generateDoubleElim(players);
    de = playBetween(de, 'winners', 'A', 'H', 'A');
    de = playBetween(de, 'winners', 'C', 'F', 'C');
    de = playBetween(de, 'winners', 'B', 'G', 'B');
    de = playBetween(de, 'winners', 'D', 'E', 'D');
    de = playBetween(de, 'winners', 'A', 'D', 'A');
    de = playBetween(de, 'winners', 'B', 'C', 'B');
    de = playBetween(de, 'winners', 'A', 'B', 'A');
    de = playBetween(de, 'losers', 'H', 'E', 'H');
    de = playBetween(de, 'losers', 'G', 'F', 'G');
    de = playBetween(de, 'losers', 'H', 'D', 'H');
    de = playBetween(de, 'losers', 'G', 'C', 'C');
    const semifinal = findMatchInRounds(de.losers.rounds, 'H', 'C')!;
    expect(semifinal).toBeTruthy();
    expect(canEditDoubleElimMatch(de, semifinal.id)).toBe(true);
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
