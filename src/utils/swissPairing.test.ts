import { it, expect } from 'vitest';
import { generateNextSwissRound, getPreviousOpponents, assignByeForRound, computeSwissStandings, generateSwissInitialSchedule } from './swissUtils';
import { Format, ScoreMode } from '../types';
import type { SwissTournament } from '../types';

// Each triple is [player1, player2, winner]. All previous pairs and BYEs are unique.
const history = [
  { bye: 9, pairs: [[1, 5, 1], [2, 6, 2], [3, 7, 3], [4, 8, 4]] },
  { bye: 8, pairs: [[1, 2, 2], [3, 4, 3], [9, 5, 5], [6, 7, 6]] },
  { bye: 7, pairs: [[2, 3, 3], [1, 4, 1], [5, 6, 5], [8, 9, 8]] },
  { bye: 6, pairs: [[3, 1, 1], [2, 5, 2], [8, 7, 8], [4, 9, 4]] },
  { bye: 5, pairs: [[2, 8, 8], [1, 6, 6], [3, 9, 9], [4, 7, 4]] },
  { bye: 3, pairs: [[8, 1, 8], [2, 4, 4], [5, 7, 7], [6, 9, 6]] },
] satisfies { bye: number; pairs: [number, number, number][] }[];

const tournament: SwissTournament = {
  id: 'audit', name: 'Swiss pairing', version: 1, createdAt: '',
  format: Format.SWISS, totalRounds: 9, maxSets: 5, scoringMode: ScoreMode.SETS,
  players: Array.from({ length: 9 }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}`, elo: 1500 - i * 100 })),
  schedule: {
    rounds: history.map((round, i) => ({
      roundNumber: i + 1,
      byePlayerId: `p${round.bye}`,
      matches: round.pairs.map(([a, b, winner], j) => ({
        id: `sw${i * 4 + j + 1}`, player1Id: `p${a}`, player2Id: `p${b}`, winnerId: `p${winner}`,
        scores: winner === a ? [[3, 0]] : [[0, 3]], dummy: false, walkover: false,
      })),
    })),
  },
};

it('tries another unused BYE before repeating Swiss opponents', () => {
  const previous = getPreviousOpponents(tournament.schedule);
  const standings = computeSwissStandings(tournament.schedule, tournament.players, { scoringMode: ScoreMode.SETS, maxSets: 5 });
  expect(assignByeForRound(standings, tournament.schedule)).toBe('p2');
  const next = generateNextSwissRound(tournament);
  expect(next.byePlayerId).toBe('p4');
  for (const match of next.matches) {
    expect(previous.get(match.player1Id!)?.has(match.player2Id!)).toBe(false);
  }
  const assigned = [...next.matches.flatMap((match) => [match.player1Id, match.player2Id]), next.byePlayerId];
  expect(assigned).toHaveLength(tournament.players.length);
  expect(new Set(assigned)).toEqual(new Set(tournament.players.map((player) => player.id)));
  expect(new Set(next.matches.map((match) => match.id))).toEqual(new Set(['sw25', 'sw26', 'sw27', 'sw28']));
});

it.each([4, 5])('keeps the preferred BYE when fresh pairings are possible for %i players', (count) => {
  const players = tournament.players.slice(0, count);
  const schedule = generateSwissInitialSchedule(players);
  for (const match of schedule.rounds[0]!.matches) {
    match.winnerId = match.player1Id;
    match.scores = [[3, 0]];
  }
  const standings = computeSwissStandings(schedule, players, { scoringMode: ScoreMode.SETS, maxSets: 5 });
  const next = generateNextSwissRound({ ...tournament, players, schedule });
  expect(next.byePlayerId).toBe(assignByeForRound(standings, schedule));
  expect(next.matches).toHaveLength(Math.floor(count / 2));
  const previous = getPreviousOpponents(schedule);
  for (const match of next.matches) {
    expect(previous.get(match.player1Id!)?.has(match.player2Id!)).toBe(false);
  }
});
