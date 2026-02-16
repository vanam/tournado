import { describe, it, expect } from 'vitest';
import {
  generateSchedule,
  computeStandings,
  isScheduleComplete,
} from './roundRobinUtils';
import { ScoreMode } from '../types';
import type { Player, Match } from '../types';

function makePlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    seed: i + 1,
  }));
}

// Pomocná funkce pro hledání zápasu dvou hráčů (použita vícekrát)
function findMatch(schedule: { rounds: { matches: Match[] }[] }, id1: string, id2: string): Match | undefined {
  for (const round of schedule.rounds) {
    for (const match of round.matches) {
      if (
        (match.player1Id === id1 && match.player2Id === id2) ||
        (match.player1Id === id2 && match.player2Id === id1)
      ) return match;
    }
  }
  return undefined;
}

describe('generateSchedule', () => {
  it('generates correct number of rounds for even players', () => {
    const players = makePlayers(4);
    const schedule = generateSchedule(players);
    expect(schedule.rounds).toHaveLength(3); // n-1 rounds
  });

  it('generates correct number of rounds for odd players', () => {
    const players = makePlayers(5);
    const schedule = generateSchedule(players);
    expect(schedule.rounds).toHaveLength(5); // n rounds (padded to 6, then 5 rounds)
  });

  it('each round has correct number of matches for 4 players', () => {
    const players = makePlayers(4);
    const schedule = generateSchedule(players);
    for (const round of schedule.rounds) {
      expect(round.matches).toHaveLength(2);
      expect(round.byePlayerId).toBeNull();
    }
  });

  it('each round has a bye for 5 players', () => {
    const players = makePlayers(5);
    const schedule = generateSchedule(players);
    for (const round of schedule.rounds) {
      expect(round.matches).toHaveLength(2);
      expect(round.byePlayerId).toBeTruthy();
    }
  });

  it('every pair plays exactly once for 4 players', () => {
    const players = makePlayers(4);
    const schedule = generateSchedule(players);
    const pairs = new Set();
    for (const round of schedule.rounds) {
      for (const match of round.matches) {
        const pair = [match.player1Id ?? '', match.player2Id ?? ''].toSorted((a, b) => a.localeCompare(b)).join('-');
        expect(pairs.has(pair)).toBe(false);
        pairs.add(pair);
      }
    }
    // C(4,2) = 6 pairs
    expect(pairs.size).toBe(6);
  });

  it('every pair plays exactly once for 5 players', () => {
    const players = makePlayers(5);
    const schedule = generateSchedule(players);
    const pairs = new Set();
    for (const round of schedule.rounds) {
      for (const match of round.matches) {
        const pair = [match.player1Id ?? '', match.player2Id ?? ''].toSorted((a, b) => a.localeCompare(b)).join('-');
        expect(pairs.has(pair)).toBe(false);
        pairs.add(pair);
      }
    }
    // C(5,2) = 10 pairs
    expect(pairs.size).toBe(10);
  });

  it('every pair plays exactly once for 6 players', () => {
    const players = makePlayers(6);
    const schedule = generateSchedule(players);
    const pairs = new Set();
    for (const round of schedule.rounds) {
      for (const match of round.matches) {
        const pair = [match.player1Id ?? '', match.player2Id ?? ''].toSorted((a, b) => a.localeCompare(b)).join('-');
        expect(pairs.has(pair)).toBe(false);
        pairs.add(pair);
      }
    }
    expect(pairs.size).toBe(15);
  });

  it('each player has exactly one bye across all rounds for 5 players', () => {
    const players = makePlayers(5);
    const schedule = generateSchedule(players);
    const byeCounts: Record<string, number> = {};
    for (const p of players) byeCounts[p.id] = 0;
    for (const round of schedule.rounds) {
      if (round.byePlayerId) byeCounts[round.byePlayerId]!++;
    }
    for (const p of players) {
      expect(byeCounts[p.id]!).toBe(1);
    }
  });

  it('matches have unique IDs', () => {
    const players = makePlayers(6);
    const schedule = generateSchedule(players);
    const ids = new Set();
    for (const round of schedule.rounds) {
      for (const match of round.matches) {
        expect(ids.has(match.id)).toBe(false);
        ids.add(match.id);
      }
    }
  });
});

describe('computeStandings', () => {
  it('returns all players with zero stats initially', () => {
    const players = makePlayers(4);
    const schedule = generateSchedule(players);
    const standings = computeStandings(schedule, players);
    expect(standings).toHaveLength(4);
    for (const row of standings) {
      expect(row.played).toBe(0);
      expect(row.points).toBe(0);
    }
  });

  it('correctly computes stats after one match', () => {
    const players = makePlayers(4);
    const schedule = generateSchedule(players);
    const match = schedule.rounds[0]!.matches[0]!;
    match.winnerId = match.player1Id;
    match.scores = [[11, 5], [11, 7], [11, 3]];

    const standings = computeStandings(schedule, players);
    const winner = standings.find((s) => s.playerId === match.player1Id)!;
    const loser = standings.find((s) => s.playerId === match.player2Id)!;

    expect(winner.played).toBe(1);
    expect(winner.wins).toBe(1);
    expect(winner.points).toBe(1);
    expect(winner.setsWon).toBe(3);
    expect(winner.setsLost).toBe(0);

    expect(loser.played).toBe(1);
    expect(loser.losses).toBe(1);
    expect(loser.points).toBe(0);
    expect(loser.setsWon).toBe(0);
    expect(loser.setsLost).toBe(3);
  });

  it('sorts by points then set difference', () => {
    const players = makePlayers(3);
    const schedule = generateSchedule(players);

    // Play all matches
    for (const round of schedule.rounds) {
      for (const match of round.matches) {
        match.winnerId = match.player1Id;
        match.scores = [[11, 5], [11, 7], [11, 3]];
      }
    }

    const standings = computeStandings(schedule, players);
    // Should be sorted by points descending
    for (let i = 1; i < standings.length; i++) {
      expect(standings[i - 1]!.points).toBeGreaterThanOrEqual(standings[i]!.points);
    }
  });

  it('uses head-to-head to break 2-player tie', () => {
    // 4 players: engineer p1 and p2 to have equal points,
    // but p2 beat p1 in their direct match → p2 ranks higher
    const players = makePlayers(4);
    const schedule = generateSchedule(players);

    // p2 beats p1
    const m12 = findMatch(schedule, 'p1', 'p2')!;
    m12.winnerId = 'p2';
    m12.scores = [[11, 9], [11, 9], [11, 9]];

    // p1 beats p3
    const m13 = findMatch(schedule, 'p1', 'p3')!;
    m13.winnerId = 'p1';
    m13.scores = [[11, 9], [11, 9], [11, 9]];

    // p2 loses to p3
    const m23 = findMatch(schedule, 'p2', 'p3')!;
    m23.winnerId = 'p3';
    m23.scores = [[11, 9], [11, 9], [11, 9]];

    // p4 loses all remaining
    const m14 = findMatch(schedule, 'p1', 'p4')!;
    m14.winnerId = 'p1';
    m14.scores = [[11, 9], [11, 9], [11, 9]];

    const m24 = findMatch(schedule, 'p2', 'p4')!;
    m24.winnerId = 'p2';
    m24.scores = [[11, 9], [11, 9], [11, 9]];

    const m34 = findMatch(schedule, 'p3', 'p4')!;
    m34.winnerId = 'p3';
    m34.scores = [[11, 9], [11, 9], [11, 9]];

    // p1: beat p3, p4 → 2 pts; p2: beat p1, p4 → 2 pts; p3: beat p2, p4 → 2 pts
    // Actually all three have 2 pts — use 3-player h2h (circular), fall to set diff (all equal), then sets won
    // Let's adjust so only p1 and p2 tie at 2 pts, p3 has different points

    // Reset: p3 loses to p2 instead
    m23.winnerId = 'p2';

    // Now: p1 beats p3,p4 (2pts), p2 beats p1,p4 (2pts), p3 beats nobody (0pts wait...)
    // p3 has m13 loss, m23 loss, m34...
    // Let p3 beat p4
    // p1: 2pts (beat p3,p4), p2: 2pts (beat p1,p4), p3: 1pt (beat p4), p4: 0pts
    // Tie between p1 & p2: p2 beat p1 → p2 ranks higher

    const standings = computeStandings(schedule, players);
    const p1Rank = standings.findIndex((s) => s.playerId === 'p1');
    const p2Rank = standings.findIndex((s) => s.playerId === 'p2');
    expect(p2Rank).toBeLessThan(p1Rank); // p2 ranks higher (lower index)
  });

  it('3-player circular h2h tie falls back to set difference', () => {
    // 3 players: A beats B, B beats C, C beats A — all 1 point each
    // h2h among all 3 is circular (1 h2h point each), so falls to set diff
    const players = makePlayers(3);
    const schedule = generateSchedule(players);

    // p1 beats p2: 3-1 in sets → set diff +2
    const m12 = findMatch(schedule, 'p1', 'p2')!;
    m12.winnerId = 'p1';
    m12.scores = [[11, 5], [11, 5], [5, 11], [11, 5]];

    // p2 beats p3: 3-0 in sets → set diff +3
    const m23 = findMatch(schedule, 'p2', 'p3')!;
    m23.winnerId = 'p2';
    m23.scores = [[11, 5], [11, 5], [11, 5]];

    // p3 beats p1: 3-2 in sets → set diff +1
    const m31 = findMatch(schedule, 'p3', 'p1')!;
    m31.winnerId = 'p3';
    m31.scores = [[11, 5], [5, 11], [11, 5], [5, 11], [11, 5]];

    // All have 1 point, h2h is circular (1 h2h point each)
    // Set diffs: p1: won 3+2=5, lost 1+3=4 → +1; p2: won 1+3=4, lost 3+0=3 → +1; p3: won 0+3=3, lost 3+2=5 → -2
    // Actually let me compute properly:
    // p1: setsWon = 3(vs p2) + 2(vs p3) = 5, setsLost = 1(vs p2) + 3(vs p3) = 4 → diff +1
    // p2: setsWon = 1(vs p1) + 3(vs p3) = 4, setsLost = 3(vs p1) + 0(vs p3) = 3 → diff +1
    // p3: setsWon = 0(vs p2) + 3(vs p1) = 3, setsLost = 3(vs p2) + 2(vs p1) = 5 → diff -2

    // p1 and p2 both have diff +1, but p1 has 5 sets won vs p2 has 4 → p1 ranks first
    const standings = computeStandings(schedule, players);
    expect(standings[0]!.playerId).toBe('p1');
    expect(standings[1]!.playerId).toBe('p2');
    expect(standings[2]!.playerId).toBe('p3');
  });

  it('ignores WO sentinel points when computing points totals', () => {
    const players = makePlayers(2);
    const schedule = generateSchedule(players);
    const match = schedule.rounds[0]!.matches[0]!;
    match.winnerId = match.player1Id;
    match.scores = [[11, 3], [111, 0], [111, 0]];

    const standings = computeStandings(schedule, players, { scoringMode: ScoreMode.POINTS });
    const winner = standings.find((s) => s.playerId === match.player1Id)!;
    const loser = standings.find((s) => s.playerId === match.player2Id)!;

    expect(winner.pointsWon).toBe(11);
    expect(winner.pointsLost).toBe(3);
    expect(loser.pointsWon).toBe(3);
    expect(loser.pointsLost).toBe(11);
  });
});

describe('isScheduleComplete', () => {
  it('returns false when no matches played', () => {
    const players = makePlayers(4);
    const schedule = generateSchedule(players);
    expect(isScheduleComplete(schedule)).toBe(false);
  });

  it('returns true when all matches have winners', () => {
    const players = makePlayers(4);
    const schedule = generateSchedule(players);
    for (const round of schedule.rounds) {
      for (const match of round.matches) {
        match.winnerId = match.player1Id;
        match.scores = [[11, 5]];
      }
    }
    expect(isScheduleComplete(schedule)).toBe(true);
  });

  it('returns false when some matches are unplayed', () => {
    const players = makePlayers(4);
    const schedule = generateSchedule(players);
    schedule.rounds[0]!.matches[0]!.winnerId = schedule.rounds[0]!.matches[0]!.player1Id;
    expect(isScheduleComplete(schedule)).toBe(false);
  });
});

describe('tiebreaker logic', () => {
  it('populates tiebreakDetails for each player', () => {
    const players = makePlayers(3);
    const schedule = generateSchedule(players);
    for (const round of schedule.rounds) {
      for (const match of round.matches) {
        match.winnerId = match.player1Id;
        match.scores = [[11, 5], [11, 5]];
      }
    }
    const standings = computeStandings(schedule, players);
    for (const row of standings) {
      expect(row.tiebreakDetails).toBeDefined();
      expect(row.tiebreakDetails!.headToHead).toBeGreaterThanOrEqual(0);
      expect(row.tiebreakDetails!.setDiff).toBe(row.setsWon - row.setsLost);
    }
  });

  it('sets headToHead correctly for 2-player tie', () => {
    const players = makePlayers(2);
    const schedule = generateSchedule(players);
    const match = schedule.rounds[0]!.matches[0]!;
    match.winnerId = match.player1Id;
    match.scores = [[11, 5], [11, 5]];

    const standings = computeStandings(schedule, players);
    const winner = standings.find((s) => s.playerId === match.player1Id)!;
    const loser = standings.find((s) => s.playerId === match.player2Id)!;

    expect(winner.points).toBe(1);
    expect(loser.points).toBe(0);
    expect(winner.tiebreakDetails!.headToHead).toBe(0);
    expect(loser.tiebreakDetails!.headToHead).toBe(0);
  });

  it('sets headToHead correctly when players are tied', () => {
    const players = makePlayers(4);
    const schedule = generateSchedule(players);

    const m12 = findMatch(schedule, 'p1', 'p2')!;
    m12.winnerId = 'p2';
    m12.scores = [[11, 5]];

    const m13 = findMatch(schedule, 'p1', 'p3')!;
    m13.winnerId = 'p1';
    m13.scores = [[11, 5]];

    const m14 = findMatch(schedule, 'p1', 'p4')!;
    m14.winnerId = 'p1';
    m14.scores = [[11, 5]];

    const m23 = findMatch(schedule, 'p2', 'p3')!;
    m23.winnerId = 'p3';
    m23.scores = [[11, 5]];

    const m24 = findMatch(schedule, 'p2', 'p4')!;
    m24.winnerId = 'p2';
    m24.scores = [[11, 5]];

    const m34 = findMatch(schedule, 'p3', 'p4')!;
    m34.winnerId = 'p4';
    m34.scores = [[11, 5]];

    const standings = computeStandings(schedule, players);
    const p1 = standings.find((s) => s.playerId === 'p1')!;
    const p2 = standings.find((s) => s.playerId === 'p2')!;

    expect(p1.points).toBe(2);
    expect(p2.points).toBe(2);
    expect(p2.tiebreakDetails!.headToHead).toBe(1);
    expect(p1.tiebreakDetails!.headToHead).toBe(0);
  });

  it('sets headToHead for 3-player circular tie', () => {
    const players = makePlayers(3);
    const schedule = generateSchedule(players);

    const m12 = findMatch(schedule, 'p1', 'p2')!;
    m12.winnerId = 'p1';
    m12.scores = [[11, 5]];

    const m23 = findMatch(schedule, 'p2', 'p3')!;
    m23.winnerId = 'p2';
    m23.scores = [[11, 5]];

    const m13 = findMatch(schedule, 'p1', 'p3')!;
    m13.winnerId = 'p3';
    m13.scores = [[11, 5]];

    const standings = computeStandings(schedule, players);
    const p1 = standings.find((s) => s.playerId === 'p1')!;
    const p2 = standings.find((s) => s.playerId === 'p2')!;
    const p3 = standings.find((s) => s.playerId === 'p3')!;

    expect(p1.tiebreakDetails!.headToHead).toBe(1);
    expect(p2.tiebreakDetails!.headToHead).toBe(1);
    expect(p3.tiebreakDetails!.headToHead).toBe(1);
  });

  it('computes headToHeadSetDiff correctly', () => {
    const players = makePlayers(3);
    const schedule = generateSchedule(players);

    const m12 = findMatch(schedule, 'p1', 'p2')!;
    m12.winnerId = 'p1';
    m12.scores = [[11, 5], [11, 5], [5, 11]];

    const m23 = findMatch(schedule, 'p2', 'p3')!;
    m23.winnerId = 'p2';
    m23.scores = [[11, 5], [11, 5]];

    const m13 = findMatch(schedule, 'p1', 'p3')!;
    m13.winnerId = 'p3';
    m13.scores = [[11, 5], [5, 11], [5, 11]];

    const standings = computeStandings(schedule, players);
    const p1 = standings.find((s) => s.playerId === 'p1')!;
    const p2 = standings.find((s) => s.playerId === 'p2')!;
    const p3 = standings.find((s) => s.playerId === 'p3')!;

    expect(p1.points).toBe(1);
    expect(p2.points).toBe(1);
    expect(p3.points).toBe(1);
    expect(p1.tiebreakDetails!.headToHeadSetDiff).toBe(0);
    expect(p2.tiebreakDetails!.headToHeadSetDiff).toBe(1);
    expect(p3.tiebreakDetails!.headToHeadSetDiff).toBe(-1);
  });

  it('resolves tie by headToHeadSetDiff when headToHead is equal', () => {
    const players = makePlayers(3);
    const schedule = generateSchedule(players);

    const m12 = findMatch(schedule, 'p1', 'p2')!;
    m12.winnerId = 'p1';
    m12.scores = [[11, 5], [11, 5], [5, 11]];

    const m23 = findMatch(schedule, 'p2', 'p3')!;
    m23.winnerId = 'p2';
    m23.scores = [[11, 5], [11, 5], [11, 5]];

    const m13 = findMatch(schedule, 'p1', 'p3')!;
    m13.winnerId = 'p3';
    m13.scores = [[11, 5], [5, 11], [5, 11]];

    const standings = computeStandings(schedule, players);
    expect(standings[0]!.playerId).toBe('p2');
    expect(standings[1]!.playerId).toBe('p1');
    expect(standings[2]!.playerId).toBe('p3');
  });

  it('resolves tie by overall setDiff when H2H is exhausted', () => {
    const players = makePlayers(4);
    const schedule = generateSchedule(players);

    const m12 = findMatch(schedule, 'p1', 'p2')!;
    m12.winnerId = 'p1';
    m12.scores = [[11, 5], [11, 5], [11, 5]];

    const m34 = findMatch(schedule, 'p3', 'p4')!;
    m34.winnerId = 'p3';
    m34.scores = [[11, 9], [11, 9]];

    const m13 = findMatch(schedule, 'p1', 'p3')!;
    m13.winnerId = 'p3';
    m13.scores = [[5, 11], [5, 11]];

    const m24 = findMatch(schedule, 'p2', 'p4')!;
    m24.winnerId = 'p2';
    m24.scores = [[11, 5], [11, 5], [11, 5]];

    const m14 = findMatch(schedule, 'p1', 'p4')!;
    m14.winnerId = 'p1';
    m14.scores = [[11, 5], [11, 5], [11, 5]];

    const m23 = findMatch(schedule, 'p2', 'p3')!;
    m23.winnerId = 'p2';
    m23.scores = [[11, 5], [11, 5], [11, 5]];

    const standings = computeStandings(schedule, players);

    expect(standings[0]!.playerId).toBe('p1');
    expect(standings[1]!.playerId).toBe('p2');
    expect(standings[2]!.playerId).toBe('p3');
    expect(standings[3]!.playerId).toBe('p4');

    expect(standings[0]!.tiebreakDetails!.headToHead).toBe(1);
    expect(standings[1]!.tiebreakDetails!.headToHead).toBe(1);
    expect(standings[2]!.tiebreakDetails!.headToHead).toBe(1);
  });

  it('uses pointsDiff when scoringMode is POINTS', () => {
    const players = makePlayers(2);
    const schedule = generateSchedule(players);
    const match = schedule.rounds[0]!.matches[0]!;
    match.winnerId = match.player1Id;
    match.scores = [[11, 5], [11, 3]];

    const standings = computeStandings(schedule, players, { scoringMode: ScoreMode.POINTS });
    const winner = standings.find((s) => s.playerId === match.player1Id)!;

    expect(winner.tiebreakDetails!.pointsDiffApplicable).toBe(true);
    expect(winner.tiebreakDetails!.pointsDiff).toBe(14);
  });

  it('does not use pointsDiff when scoringMode is SETS', () => {
    const players = makePlayers(2);
    const schedule = generateSchedule(players);
    const match = schedule.rounds[0]!.matches[0]!;
    match.winnerId = match.player1Id;
    match.scores = [[11, 5], [11, 3]];

    const standings = computeStandings(schedule, players, { scoringMode: ScoreMode.SETS });
    const winner = standings.find((s) => s.playerId === match.player1Id)!;

    expect(winner.tiebreakDetails!.pointsDiffApplicable).toBe(false);
  });

  it('sets tiebreakApplied for tied players', () => {
    const players = makePlayers(4);
    const schedule = generateSchedule(players);

    const m12 = findMatch(schedule, 'p1', 'p2')!;
    m12.winnerId = 'p2';
    m12.scores = [[11, 5]];

    const m13 = findMatch(schedule, 'p1', 'p3')!;
    m13.winnerId = 'p1';
    m13.scores = [[11, 5]];

    const m14 = findMatch(schedule, 'p1', 'p4')!;
    m14.winnerId = 'p1';
    m14.scores = [[11, 5]];

    const m23 = findMatch(schedule, 'p2', 'p3')!;
    m23.winnerId = 'p3';
    m23.scores = [[11, 5]];

    const m24 = findMatch(schedule, 'p2', 'p4')!;
    m24.winnerId = 'p2';
    m24.scores = [[11, 5]];

    const m34 = findMatch(schedule, 'p3', 'p4')!;
    m34.winnerId = 'p4';
    m34.scores = [[11, 5]];

    const standings = computeStandings(schedule, players);
    const p1 = standings.find((s) => s.playerId === 'p1')!;
    const p2 = standings.find((s) => s.playerId === 'p2')!;

    expect(p1.points).toBe(2);
    expect(p2.points).toBe(2);
    expect(p1.tiebreakDetails!.tiebreakApplied).toEqual(['headToHead']);
    expect(p2.tiebreakDetails!.tiebreakApplied).toEqual(['headToHead']);
  });

  it('sets tiebreakApplied to empty array for non-tied players', () => {
    const players = makePlayers(4);
    const schedule = generateSchedule(players);
    for (const round of schedule.rounds) {
      for (const match of round.matches) {
        match.winnerId = match.player1Id;
        match.scores = [[11, 5], [11, 5]];
      }
    }

    const standings = computeStandings(schedule, players);
    expect(standings[3]!.tiebreakDetails!.tiebreakApplied).toEqual([]);
  });

  it('records multiple tiebreakApplied criteria when needed', () => {
    const players = makePlayers(3);
    const schedule = generateSchedule(players);

    const m12 = findMatch(schedule, 'p1', 'p2')!;
    m12.winnerId = 'p1';
    m12.scores = [[11, 5], [11, 5]];

    const m23 = findMatch(schedule, 'p2', 'p3')!;
    m23.winnerId = 'p2';
    m12.scores = [[11, 5], [11, 5]];

    const m13 = findMatch(schedule, 'p1', 'p3')!;
    m13.winnerId = 'p3';
    m13.scores = [[11, 5], [11, 5]];

    const standings = computeStandings(schedule, players);
    expect(standings[0]!.tiebreakDetails!.tiebreakApplied).toContain('headToHead');
    expect(standings[1]!.tiebreakDetails!.tiebreakApplied).toContain('headToHead');
  });

  it('correctly ranks player who won head-to-head in 2-player tie', () => {
    const players = [
      { id: 'A', name: 'A', seed: 1 },
      { id: 'B', name: 'B', seed: 2 },
      { id: 'C', name: 'C', seed: 3 },
      { id: 'D', name: 'D', seed: 4 },
      { id: 'E', name: 'E', seed: 5 },
    ];
    const schedule = generateSchedule(players);

    const setResult = (id1: string, id2: string, winnerId: string, p1Sets: number, p2Sets: number): void => {
      const match = findMatch(schedule, id1, id2)!;
      match.winnerId = winnerId;
      const sets: [number, number][] = [];
      for (let i = 0; i < p1Sets; i++) sets.push([11, 5]);
      for (let i = 0; i < p2Sets; i++) sets.push([5, 11]);
      match.scores = sets;
    };

    setResult('A', 'B', 'B', 1, 2);
    setResult('A', 'C', 'A', 2, 1);
    setResult('A', 'D', 'A', 2, 1);
    setResult('A', 'E', 'E', 1, 2);

    setResult('B', 'C', 'B', 2, 1);
    setResult('B', 'D', 'B', 2, 1);
    setResult('B', 'E', 'B', 2, 1);

    setResult('C', 'D', 'D', 1, 2);
    setResult('C', 'E', 'C', 2, 1);

    setResult('D', 'E', 'E', 1, 2);

    const standings = computeStandings(schedule, players);

    expect(standings[0]!.playerId).toBe('B');
    expect(standings[1]!.playerId).toBe('E');
    expect(standings[2]!.playerId).toBe('A');
    expect(standings[3]!.playerId).toBe('D');
    expect(standings[4]!.playerId).toBe('C');

    expect(standings[1]!.tiebreakDetails!.headToHead).toBe(1);
    expect(standings[2]!.tiebreakDetails!.headToHead).toBe(0);
    expect(standings[3]!.tiebreakDetails!.headToHead).toBe(1);
    expect(standings[4]!.tiebreakDetails!.headToHead).toBe(0);
  });

  describe('headToHead criterion', () => {
    it('ranks player with more H2H wins higher in 2-player tie', () => {
      const players = makePlayers(4);
      const schedule = generateSchedule(players);

      const m12 = findMatch(schedule, 'p1', 'p2')!;
      m12.winnerId = 'p2';
      m12.scores = [[11, 5]];

      const m13 = findMatch(schedule, 'p1', 'p3')!;
      m13.winnerId = 'p1';
      m13.scores = [[11, 5]];

      const m14 = findMatch(schedule, 'p1', 'p4')!;
      m14.winnerId = 'p1';
      m14.scores = [[11, 5]];

      const m23 = findMatch(schedule, 'p2', 'p3')!;
      m23.winnerId = 'p3';
      m23.scores = [[11, 5]];

      const m24 = findMatch(schedule, 'p2', 'p4')!;
      m24.winnerId = 'p2';
      m24.scores = [[11, 5]];

      const m34 = findMatch(schedule, 'p3', 'p4')!;
      m34.winnerId = 'p4';
      m34.scores = [[11, 5]];

      const standings = computeStandings(schedule, players);
      expect(standings[0]!.playerId).toBe('p2');
      expect(standings[1]!.playerId).toBe('p1');
      expect(standings[0]!.tiebreakDetails!.headToHead).toBe(1);
      expect(standings[1]!.tiebreakDetails!.headToHead).toBe(0);
    });

    it('H2H counts only wins against tied players', () => {
      const players = makePlayers(3);
      const schedule = generateSchedule(players);

      const m12 = findMatch(schedule, 'p1', 'p2')!;
      m12.winnerId = 'p1';
      m12.scores = [[11, 5]];

      const m23 = findMatch(schedule, 'p2', 'p3')!;
      m23.winnerId = 'p2';
      m23.scores = [[11, 5]];

      const m13 = findMatch(schedule, 'p1', 'p3')!;
      m13.winnerId = 'p3';
      m13.scores = [[11, 5]];

      const standings = computeStandings(schedule, players);
      expect(standings.every(s => s.tiebreakDetails!.headToHead === 1)).toBe(true);
    });
  });

  describe('headToHeadSetDiff criterion', () => {
    it('breaks tie when H2H wins are equal but H2H set diff differs', () => {
      const players = makePlayers(3);
      const schedule = generateSchedule(players);

      const m12 = findMatch(schedule, 'p1', 'p2')!;
      m12.winnerId = 'p1';
      m12.scores = [[11, 5], [11, 5], [5, 11]];

      const m23 = findMatch(schedule, 'p2', 'p3')!;
      m23.winnerId = 'p2';
      m23.scores = [[11, 5], [11, 5], [11, 5]];

      const m13 = findMatch(schedule, 'p1', 'p3')!;
      m13.winnerId = 'p3';
      m13.scores = [[11, 5], [5, 11], [5, 11]];

      const standings = computeStandings(schedule, players);

      expect(standings[0]!.playerId).toBe('p2');
      expect(standings[1]!.playerId).toBe('p1');
      expect(standings[2]!.playerId).toBe('p3');

      expect(standings[0]!.tiebreakDetails!.headToHeadSetDiff).toBe(2);
      expect(standings[1]!.tiebreakDetails!.headToHeadSetDiff).toBe(0);
      expect(standings[2]!.tiebreakDetails!.headToHeadSetDiff).toBe(-2);
    });
  });

  describe('setDiff criterion (overall)', () => {
    it('breaks tie when all H2H criteria are exhausted', () => {
      const players = makePlayers(4);
      const schedule = generateSchedule(players);

      const m12 = findMatch(schedule, 'p1', 'p2')!;
      m12.winnerId = 'p1';
      m12.scores = [[11, 5], [11, 5], [11, 5]];

      const m34 = findMatch(schedule, 'p3', 'p4')!;
      m34.winnerId = 'p3';
      m34.scores = [[11, 9], [11, 9]];

      const m13 = findMatch(schedule, 'p1', 'p3')!;
      m13.winnerId = 'p3';
      m13.scores = [[5, 11], [5, 11]];

      const m24 = findMatch(schedule, 'p2', 'p4')!;
      m24.winnerId = 'p2';
      m24.scores = [[11, 5], [11, 5], [11, 5]];

      const m14 = findMatch(schedule, 'p1', 'p4')!;
      m14.winnerId = 'p1';
      m14.scores = [[11, 5], [11, 5], [11, 5]];

      const m23 = findMatch(schedule, 'p2', 'p3')!;
      m23.winnerId = 'p2';
      m23.scores = [[11, 5], [11, 5], [11, 5]];

      const standings = computeStandings(schedule, players);

      expect(standings[0]!.playerId).toBe('p1');
      expect(standings[1]!.playerId).toBe('p2');
      expect(standings[2]!.playerId).toBe('p3');
      expect(standings[3]!.playerId).toBe('p4');

      expect(standings[0]!.setsWon - standings[0]!.setsLost).toBe(4);
    });

    it('setDiff is total sets won minus total sets lost', () => {
      const players = makePlayers(2);
      const schedule = generateSchedule(players);
      const match = schedule.rounds[0]!.matches[0]!;
      match.winnerId = match.player1Id;
      match.scores = [[11, 5], [5, 11], [11, 3]];

      const standings = computeStandings(schedule, players);
      const winner = standings.find(s => s.playerId === match.player1Id)!;
      const loser = standings.find(s => s.playerId === match.player2Id)!;

      expect(winner.tiebreakDetails!.setDiff).toBe(1);
      expect(loser.tiebreakDetails!.setDiff).toBe(-1);
    });
  });

  describe('setsWon criterion (overall)', () => {
    it('setsWon counts all sets won across all matches', () => {
      const players = makePlayers(2);
      const schedule = generateSchedule(players);
      const match = schedule.rounds[0]!.matches[0]!;
      match.winnerId = match.player1Id;
      match.scores = [[11, 5], [11, 7], [11, 3]];

      const standings = computeStandings(schedule, players);
      const winner = standings.find(s => s.playerId === match.player1Id)!;

      expect(winner.tiebreakDetails!.setsWon).toBe(3);
    });
  });

  describe('pointsDiff criterion', () => {
    it('breaks tie when all set criteria are exhausted in POINTS mode', () => {
      const players = makePlayers(2);
      const schedule = generateSchedule(players);
      const match = schedule.rounds[0]!.matches[0]!;
      match.winnerId = match.player1Id;
      match.scores = [[11, 5], [11, 3]];

      const standings = computeStandings(schedule, players, { scoringMode: ScoreMode.POINTS });
      const winner = standings.find(s => s.playerId === match.player1Id)!;
      const loser = standings.find(s => s.playerId === match.player2Id)!;

      expect(winner.tiebreakDetails!.pointsDiff).toBe(14);
      expect(loser.tiebreakDetails!.pointsDiff).toBe(-14);
    });

    it('pointsDiff is total points won minus total points lost', () => {
      const players = makePlayers(2);
      const schedule = generateSchedule(players);
      const match = schedule.rounds[0]!.matches[0]!;
      match.winnerId = match.player1Id;
      match.scores = [[11, 5], [11, 3]];

      const standings = computeStandings(schedule, players, { scoringMode: ScoreMode.POINTS });
      const winner = standings.find(s => s.playerId === match.player1Id)!;
      const loser = standings.find(s => s.playerId === match.player2Id)!;

      expect(winner.tiebreakDetails!.pointsDiff).toBe(14);
      expect(loser.tiebreakDetails!.pointsDiff).toBe(-14);
    });

    it('pointsDiff is not used when scoringMode is SETS', () => {
      const players = makePlayers(2);
      const schedule = generateSchedule(players);
      const match = schedule.rounds[0]!.matches[0]!;
      match.winnerId = match.player1Id;
      match.scores = [[11, 5], [11, 3]];

      const standings = computeStandings(schedule, players, { scoringMode: ScoreMode.SETS });
      const winner = standings.find(s => s.playerId === match.player1Id)!;

      expect(winner.tiebreakDetails!.pointsDiffApplicable).toBe(false);
    });

    it('ignores walkover scores in point diff calculation', () => {
      const players = makePlayers(2);
      const schedule = generateSchedule(players);
      const match = schedule.rounds[0]!.matches[0]!;
      match.winnerId = match.player1Id;
      match.scores = [[11, 5], [111, 0], [111, 0]];

      const standings = computeStandings(schedule, players, { scoringMode: ScoreMode.POINTS });
      const winner = standings.find(s => s.playerId === match.player1Id)!;

      expect(winner.tiebreakDetails!.pointsDiff).toBe(6);
    });
  });

  describe('tiebreakApplied tracking', () => {
    it('records headToHead when it breaks the tie', () => {
      const players = makePlayers(4);
      const schedule = generateSchedule(players);

      const m12 = findMatch(schedule, 'p1', 'p2')!;
      m12.winnerId = 'p2';
      m12.scores = [[11, 5]];

      const m13 = findMatch(schedule, 'p1', 'p3')!;
      m13.winnerId = 'p1';
      m13.scores = [[11, 5]];

      const m14 = findMatch(schedule, 'p1', 'p4')!;
      m14.winnerId = 'p1';
      m14.scores = [[11, 5]];

      const m23 = findMatch(schedule, 'p2', 'p3')!;
      m23.winnerId = 'p3';
      m23.scores = [[11, 5]];

      const m24 = findMatch(schedule, 'p2', 'p4')!;
      m24.winnerId = 'p2';
      m24.scores = [[11, 5]];

      const m34 = findMatch(schedule, 'p3', 'p4')!;
      m34.winnerId = 'p4';
      m34.scores = [[11, 5]];

      const standings = computeStandings(schedule, players);
      const p1 = standings.find(s => s.playerId === 'p1')!;
      const p2 = standings.find(s => s.playerId === 'p2')!;

      expect(p1.tiebreakDetails!.tiebreakApplied).toEqual(['headToHead']);
      expect(p2.tiebreakDetails!.tiebreakApplied).toEqual(['headToHead']);
    });

    it('records headToHeadSetDiff when headToHead is tied', () => {
      const players = makePlayers(3);
      const schedule = generateSchedule(players);

      const m12 = findMatch(schedule, 'p1', 'p2')!;
      m12.winnerId = 'p1';
      m12.scores = [[11, 5], [11, 5], [5, 11]];

      const m23 = findMatch(schedule, 'p2', 'p3')!;
      m23.winnerId = 'p2';
      m23.scores = [[11, 5], [11, 5], [11, 5]];

      const m13 = findMatch(schedule, 'p1', 'p3')!;
      m13.winnerId = 'p3';
      m13.scores = [[11, 5], [5, 11], [5, 11]];

      const standings = computeStandings(schedule, players);

      expect(standings[0]!.tiebreakDetails!.tiebreakApplied).toContain('headToHead');
      expect(standings[0]!.tiebreakDetails!.tiebreakApplied).toContain('headToHeadSetDiff');
      expect(standings[1]!.tiebreakDetails!.tiebreakApplied).toContain('headToHead');
      expect(standings[1]!.tiebreakDetails!.tiebreakApplied).toContain('headToHeadSetDiff');
    });
  });

  describe('multi-way ties (3+ players)', () => {
    it('handles 3-way circular tie with equal H2H', () => {
      const players = makePlayers(3);
      const schedule = generateSchedule(players);

      const m12 = findMatch(schedule, 'p1', 'p2')!;
      m12.winnerId = 'p1';
      m12.scores = [[11, 5]];

      const m23 = findMatch(schedule, 'p2', 'p3')!;
      m23.winnerId = 'p2';
      m23.scores = [[11, 5]];

      const m13 = findMatch(schedule, 'p1', 'p3')!;
      m13.winnerId = 'p3';
      m13.scores = [[11, 5]];

      const standings = computeStandings(schedule, players);

      expect(standings.every(s => s.points === 1)).toBe(true);
      expect(standings.every(s => s.tiebreakDetails!.headToHead === 1)).toBe(true);
    });

    it('handles nested ties within larger tie group', () => {
      const players = makePlayers(4);
      const schedule = generateSchedule(players);

      const m12 = findMatch(schedule, 'p1', 'p2')!;
      m12.winnerId = 'p1';
      m12.scores = [[11, 5], [11, 5], [11, 5]];

      const m34 = findMatch(schedule, 'p3', 'p4')!;
      m34.winnerId = 'p3';
      m34.scores = [[11, 9], [11, 9]];

      const m13 = findMatch(schedule, 'p1', 'p3')!;
      m13.winnerId = 'p3';
      m13.scores = [[5, 11], [5, 11]];

      const m24 = findMatch(schedule, 'p2', 'p4')!;
      m24.winnerId = 'p2';
      m24.scores = [[11, 5], [11, 5], [11, 5]];

      const m14 = findMatch(schedule, 'p1', 'p4')!;
      m14.winnerId = 'p1';
      m14.scores = [[11, 5], [11, 5], [11, 5]];

      const m23 = findMatch(schedule, 'p2', 'p3')!;
      m23.winnerId = 'p2';
      m23.scores = [[11, 5], [11, 5], [11, 5]];

      const standings = computeStandings(schedule, players);

      expect(standings[0]!.points).toBe(2);
      expect(standings[1]!.points).toBe(2);
      expect(standings[2]!.points).toBe(2);
    });
  });

  describe('unresolved ties', () => {
    it('leaves players tied when all criteria are equal', () => {
      const players = makePlayers(3);
      const schedule = generateSchedule(players);

      const m12 = findMatch(schedule, 'p1', 'p2')!;
      m12.winnerId = 'p1';
      m12.scores = [[11, 5], [11, 5]];

      const m23 = findMatch(schedule, 'p2', 'p3')!;
      m23.winnerId = 'p2';
      m23.scores = [[11, 5], [11, 5]];

      const m13 = findMatch(schedule, 'p1', 'p3')!;
      m13.winnerId = 'p3';
      m13.scores = [[11, 5], [11, 5]];

      const standings = computeStandings(schedule, players);

      expect(standings.every(s => s.points === 1)).toBe(true);
      expect(standings.every(s => s.tiebreakDetails!.headToHead === 1)).toBe(true);
    });
  });
});
