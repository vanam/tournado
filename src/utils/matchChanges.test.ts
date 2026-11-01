import { describe, expect, it } from 'vitest';
import { advanceWinner, generateBracket } from './bracketUtils';
import { advanceDoubleElim, generateDoubleElim } from './doubleElimUtils';
import type { MatchChange } from './matchChanges';
import { listTournamentMatches, planMatchChange } from './matchChanges';
import { updateTournamentStatus } from './tournamentStatus';
import { Format } from '../types';
import type { DoubleElimTournament, SingleElimTournament } from '../types';

function single(): SingleElimTournament {
  const players = Array.from({ length: 8 }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));
  const bracket = generateBracket(players);
  for (const round of bracket.rounds) for (const match of round) advanceWinner(bracket, match.id, match.player1Id!, [[3, 0]]);
  advanceWinner(bracket, bracket.thirdPlaceMatch!.id, bracket.thirdPlaceMatch!.player1Id!, [[3, 1]]);
  const tournament: SingleElimTournament = { id: 'single', version: 1, name: 'Single', createdAt: '', format: Format.SINGLE_ELIM, players, bracket };
  updateTournamentStatus(tournament);
  return tournament;
}

function double(count: number): DoubleElimTournament {
  const players = Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));
  const doubleElim = generateDoubleElim(players);
  for (const round of [...doubleElim.winners.rounds, ...doubleElim.losers.rounds]) {
    for (const match of round) if (!match.dummy && !match.winnerId && match.player1Id && match.player2Id) {
      advanceDoubleElim(doubleElim, match.id, match.player1Id, [[3, 0]]);
    }
  }
  const grand = doubleElim.finals.grandFinal;
  advanceDoubleElim(doubleElim, grand.id, grand.player2Id!, [[0, 3]]);
  const reset = doubleElim.finals.resetFinal;
  advanceDoubleElim(doubleElim, reset.id, reset.player1Id!, [[3, 0]]);
  return { id: 'double', version: 1, name: 'Double', createdAt: '', format: Format.DOUBLE_ELIM, players, doubleElim };
}

describe('history change plans', () => {
  it('lists exactly the dependent semifinal, final and bronze results without mutating the original', () => {
    const original = single();
    const before = structuredClone(original);
    const first = original.bracket.rounds[0]![0]!;
    const { tournament, impact } = planMatchChange(original, { type: 'score', matchId: first.id, scores: [[0, 3]], walkover: false });
    expect(original).toEqual(before);
    expect(impact.deletedResults.map((row) => row.stage)).toEqual(['bracket.semifinals', 'bracket.final', 'bracket.thirdPlace']);
    expect(impact.reopens).toBe(true);
    const after = new Map(listTournamentMatches(tournament).map((row) => [row.key, row.match]));
    for (const row of listTournamentMatches(original)) {
      if (row.match.id !== first.id && !impact.deletedResults.some((deleted) => deleted.key === row.key)) expect(after.get(row.key)).toEqual(row.match);
    }
    if (tournament.format !== Format.SINGLE_ELIM) throw new Error('Wrong format');
    expect(tournament.bracket.rounds[1]![0]!.player1Id).toBe(first.player2Id);
    expect(tournament.winnerId).toBeNull();
  });

  it('preserves independent bronze when the final is cleared or changed', () => {
    const original = single();
    const final = original.bracket.rounds.at(-1)![0]!;
    const cleared = planMatchChange(original, { type: 'clear', matchId: final.id });
    const changed = planMatchChange(original, { type: 'score', matchId: final.id, scores: [[0, 3]], walkover: false });
    for (const plan of [cleared, changed]) {
      expect(plan.impact.deletedResults).toEqual([]);
      if (plan.tournament.format !== Format.SINGLE_ELIM) throw new Error('Wrong format');
      expect(plan.tournament.bracket.thirdPlaceMatch).toEqual(original.bracket.thirdPlaceMatch);
    }
  });

  it.each([2, 3, 5, 8])('invalidates DE dependencies with %i players without manufacturing BYE champions', (count) => {
    const original = double(count);
    const first = original.doubleElim.winners.rounds[0]!.find((match) => match.player1Id && match.player2Id)!;
    const plan = planMatchChange(original, { type: 'score', matchId: first.id, scores: [[0, 3]], walkover: false });
    expect(plan.impact.deletedResults.length).toBeGreaterThan(0);
    expect(plan.impact.deletedResults.every(({ match }) => !!match.player1Id && !!match.player2Id)).toBe(true);
    if (plan.tournament.format !== Format.DOUBLE_ELIM) throw new Error('Wrong format');
    const de = plan.tournament.doubleElim;
    expect(de.finals.grandFinal.winnerId).toBeNull();
    expect(de.finals.resetFinal.winnerId).toBeNull();
    if (count >= 3) expect(de.losers.rounds.at(-1)![0]!.winnerId).toBeNull();
    const after = new Map(listTournamentMatches(plan.tournament).map((row) => [row.key, row.match]));
    for (const deleted of plan.impact.deletedResults) expect(after.get(deleted.key)?.scores ?? []).toEqual([]);
  });

  it('uses persisted loser links even when optional entry metadata is missing', () => {
    const original = double(8);
    const legacy = structuredClone(original);
    for (const match of legacy.doubleElim.losers.rounds.flat()) {
      delete match.winnersSources;
      delete match.loserSlotFromWinners;
    }
    const root = original.doubleElim.winners.rounds[0]![0]!;
    const change = { type: 'score', matchId: root.id, scores: [[0, 3]], walkover: false } satisfies MatchChange;
    const normal = planMatchChange(original, change);
    const restored = planMatchChange(legacy, change);
    expect(restored.impact.deletedResults.map((row) => row.key)).toEqual(normal.impact.deletedResults.map((row) => row.key));
  });

  it('preserves the played reset and every downstream result on a score-only correction', () => {
    const original = double(8);
    const grand = original.doubleElim.finals.grandFinal;
    const { impact, tournament } = planMatchChange(original, { type: 'score', matchId: grand.id, scores: [[1, 3]], walkover: false });
    expect(impact.deletedResults).toEqual([]);
    if (tournament.format !== Format.DOUBLE_ELIM) throw new Error('Wrong format');
    expect(tournament.doubleElim.finals.resetFinal).toEqual(original.doubleElim.finals.resetFinal);
  });
});
