import { describe, expect, it } from 'vitest';
import { generateNextSwissRound, generateSwissInitialSchedule } from './swissUtils';
import { buildParticipants, getParticipantPlayers } from './participantUtils';
import { generateDoubleElim, advanceDoubleElim } from './doubleElimUtils';
import { buildRoundRobinResults } from './resultsUtils';
import { generateSchedule } from './roundRobinUtils';
import { computeTournamentProgress } from './progressUtils';
import { Format, ScoreMode } from '../types';
import type { Player, SwissTournament, DoubleElimTournament } from '../types';

const players: Player[] = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, name: `Player ${i}` }));

describe('tournament corrections', () => {
  it('keeps Swiss doubles paired as teams in subsequent rounds', () => {
    const participants = buildParticipants(players, 2, []);
    const schedule = generateSwissInitialSchedule(getParticipantPlayers(players, participants));
    for (const match of schedule.rounds[0]!.matches) {
      match.winnerId = match.player1Id;
      match.scores = [[3, 0]];
    }
    const tournament: SwissTournament = { id: 'swiss', version: 1, name: 'Doubles', createdAt: '', format: Format.SWISS, teamSize: 2, players, participants, schedule, totalRounds: 3 };
    const round = generateNextSwissRound(tournament);
    expect(round.matches).toHaveLength(2);
    expect(round.matches.flatMap((match) => [match.player1Id, match.player2Id]).toSorted((a, b) => (a ?? '').localeCompare(b ?? ''))).toEqual(participants.map((p) => p.id).toSorted((a, b) => a.localeCompare(b)));
    expect(computeTournamentProgress(tournament).total).toBe(6);
  });

  it('keeps head-to-head decisions in final round-robin ranks', () => {
    const schedule = generateSchedule(players.slice(0, 4));
    const winningPairs = new Set(['p0/p1', 'p0/p2', 'p1/p2', 'p1/p3', 'p2/p3', 'p3/p0']);
    for (const match of schedule.rounds.flatMap((r) => r.matches)) {
      const p1Wins = winningPairs.has(`${match.player1Id}/${match.player2Id}`);
      match.winnerId = p1Wins ? match.player1Id : match.player2Id;
      match.scores = [p1Wins ? [3, 0] : [0, 3]];
    }
    const results = buildRoundRobinResults(schedule, players.slice(0, 4), { scoringMode: ScoreMode.SETS });
    expect(results.map((row) => [row.playerId, row.rankStart, row.rankEnd])).toEqual([
      ['p0', 1, 1], ['p1', 2, 2], ['p2', 3, 3], ['p3', 4, 4],
    ]);
  });

  it('uses configured set limits in final results', () => {
    const schedule = generateSchedule(players.slice(0, 2));
    const match = schedule.rounds[0]!.matches[0]!;
    match.winnerId = match.player1Id;
    match.scores = [[6, 0]];
    expect(buildRoundRobinResults(schedule, players.slice(0, 2), { scoringMode: ScoreMode.SETS, maxSets: 7 })[0]!.setsWon).toBe(6);
  });

  it('excludes an unused reset from completed double-elimination progress', () => {
    const doubleElim = generateDoubleElim(players.slice(0, 4));
    for (let i = 0; i < 20; i++) {
      const match = [...doubleElim.winners.rounds.flat(), ...doubleElim.losers.rounds.flat(), doubleElim.finals.grandFinal].find((m) => !m.dummy && m.player1Id && m.player2Id && !m.winnerId);
      if (!match?.player1Id) break;
      advanceDoubleElim(doubleElim, match.id, match.player1Id, [[3, 0]]);
    }
    const tournament: DoubleElimTournament = { id: 'double', version: 1, name: 'Double', createdAt: '', format: Format.DOUBLE_ELIM, players: players.slice(0, 4), doubleElim };
    const progress = computeTournamentProgress(tournament);
    expect(doubleElim.finals.grandFinal.winnerId).not.toBeNull();
    expect(progress.completed).toBe(progress.total);
  });
});
