import { describe, expect, it } from 'vitest';
import { BracketType, Format } from '../types';
import type { GroupsToBracketTournament, SingleElimTournament } from '../types';
import { advanceWinner, generateBracket } from './bracketUtils';
import { createGroupStage } from './groupStageUtils';
import { planMatchChange } from './matchChanges';
import { evaluateTournament, getTournamentSummary, readTournament, updateTournamentStatus } from './tournamentStatus';

const players = Array.from({ length: 4 }, (_, i) => ({ id: `p${i}`, name: `Player ${i}` }));

function single(): SingleElimTournament {
  return { id: 'single', name: 'Single', version: 1, createdAt: '2026-01-01',
    format: Format.SINGLE_ELIM, players: players.slice(0, 2), bracket: generateBracket(players.slice(0, 2)) };
}

describe('tournament evaluation', () => {
  it('agrees across reads without inventing or mutating completion history', () => {
    const tournament = single();
    const final = tournament.bracket.rounds[0]![0]!;
    advanceWinner(tournament.bracket, final.id, final.player1Id!, [[3, 0]]);
    const before = structuredClone(tournament);
    const evaluation = evaluateTournament(tournament);
    expect(evaluation).toMatchObject({ winnerId: final.player1Id, completedAt: null, progress: { total: 1, completed: 1 } });
    expect(evaluation.results[0]).toMatchObject({ playerId: evaluation.winnerId, rankStart: 1 });
    expect(getTournamentSummary(tournament).winnerId).toBe(evaluation.winnerId);
    expect(readTournament(tournament)).toMatchObject({ winnerId: evaluation.winnerId, completedAt: null });
    expect(tournament).toEqual(before);
  });

  it('records completion on writes, preserves its time and clears it after history correction', () => {
    const tournament = single();
    const final = tournament.bracket.rounds[0]![0]!;
    advanceWinner(tournament.bracket, final.id, final.player1Id!, [[3, 0]]);
    updateTournamentStatus(tournament);
    expect(tournament.completedAt).toEqual(expect.any(String));
    tournament.completedAt = '2026-02-01T10:00:00.000Z';
    updateTournamentStatus(tournament);
    expect(readTournament(tournament).completedAt).toBe('2026-02-01T10:00:00.000Z');
    const cleared = planMatchChange(tournament, { type: 'clear', matchId: final.id }).tournament;
    expect(evaluateTournament(cleared)).toMatchObject({ winnerId: null, completedAt: null, progress: { total: 1, completed: 0 } });
    expect(getTournamentSummary(cleared).winnerId).toBeNull();
  });

  it('keeps the main Playoff winner visible while consolation is unfinished', () => {
    const mainBracket = generateBracket(players.slice(0, 2));
    const final = mainBracket.rounds[0]![0]!;
    advanceWinner(mainBracket, final.id, final.player1Id!, [[3, 0]]);
    const tournament: GroupsToBracketTournament = {
      id: 'groups', name: 'Groups', version: 1, createdAt: '', format: Format.GROUPS_TO_BRACKET, players,
      groupStage: createGroupStage(players, { groupCount: 2, qualifiers: [1, 1], consolation: true }),
      groupStagePlayoffs: { bracketType: BracketType.SINGLE_ELIM, mainBracket,
        consolationBracket: generateBracket(players.slice(2)), mainDoubleElim: null, consolationDoubleElim: null },
    };
    for (const group of tournament.groupStage.groups) {
      for (const match of group.schedule.rounds.flatMap((round) => round.matches)) match.winnerId = match.player1Id;
    }
    const evaluation = evaluateTournament(tournament);
    expect(evaluation.winnerId).toBeNull();
    expect(evaluation.playoffWinnerId).toBe(final.player1Id);
    expect(evaluation.results).toHaveLength(4);
    expect(evaluation.results.find((row) => row.playerId === final.player1Id)).toMatchObject({ rankStart: 1 });
  });
});
