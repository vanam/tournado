import { describe, it, expect } from 'vitest';
import {
  computeSwissStandings,
  generateSwissRound1,
  isCurrentRoundComplete,
} from './swissUtils';
import type { Player, Match, Round, RoundRobinSchedule } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function p(id: string, elo?: number): Player {
  return { id, name: id, elo };
}

// In default SETS mode, getSetTotals reads first element as [p1SetsWon, p2SetsWon].
// All test scores use that format: [[setsWonByP1, setsWonByP2]]
function match(
  id: string,
  p1: string,
  p2: string,
  winnerId?: string,
  scores?: [number, number][]
): Match {
  return {
    id,
    player1Id: p1,
    player2Id: p2,
    winnerId: winnerId ?? null,
    scores: scores ?? [],
    walkover: false,
    nextMatchId: null,
    dummy: false,
  };
}

function round(n: number, matches: Match[], bye?: string): Round {
  return { roundNumber: n, matches, byePlayerId: bye ?? null };
}

function sched(...rounds: Round[]): RoundRobinSchedule {
  return { rounds };
}

// p1 wins 3-0 in SETS mode format
function w30(id: string, p1: string, p2: string): Match {
  return match(id, p1, p2, p1, [[3, 0]]);
}

// p2 wins (from p1's perspective: 0-3 in SETS mode format)
function l30(id: string, p1: string, p2: string): Match {
  return match(id, p1, p2, p2, [[0, 3]]);
}

// ─── Scenario: T, M, V, P, F ─────────────────────────────────────────────────
//
// Round 1: T vs V → T wins 3-0 | M vs F → M wins 3-0 | P BYE
// Round 2: T vs M → M wins 3-0 | P vs V → V wins 3-0 | F BYE
// Round 3: M vs P → P wins 3-0 | T vs F → T wins 3-0 | V BYE
//
// Wins: T=2, M=2, V=2, P=2, F=1
// Expected ranking: M, T, V, P, F
//   M > T: buchholz(5)/SB(3) equal → H2H sub-group {M,T}: M beat T → M H2H=1, T H2H=0
//   V > P: buchholz(4)/SB(2) equal → H2H sub-group {V,P}: V beat P → V H2H=1, P H2H=0
//   T > V: same wins, higher buchholz (T=5 vs V=4)

const tmvpfPlayers = [p('t'), p('m'), p('v'), p('p_'), p('f')];

const tmvpfSchedule = sched(
  round(1, [
    w30('r1m1', 't', 'v'),  // T beats V 3-0
    w30('r1m2', 'm', 'f'),  // M beats F 3-0
  ], 'p_'),                 // P BYE
  round(2, [
    l30('r2m1', 't', 'm'),  // M beats T 3-0
    l30('r2m2', 'p_', 'v'), // V beats P 3-0
  ], 'f'),                  // F BYE
  round(3, [
    l30('r3m1', 'm', 'p_'), // P beats M 3-0
    w30('r3m2', 't', 'f'),  // T beats F 3-0
  ], 'v')                   // V BYE
);

// ─── computeSwissStandings ────────────────────────────────────────────────────

describe('computeSwissStandings', () => {
  describe('basic stats', () => {
    it('counts wins and losses from actual matches', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const t = standings.find((s) => s.playerId === 't')!;
      const m = standings.find((s) => s.playerId === 'm')!;
      const f = standings.find((s) => s.playerId === 'f')!;

      expect(t.wins).toBe(2);
      expect(t.losses).toBe(1);
      expect(m.wins).toBe(2);
      expect(m.losses).toBe(1);
      expect(f.wins).toBe(1);
      expect(f.losses).toBe(2);
    });

    it('counts BYE as a win', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const v = standings.find((s) => s.playerId === 'v')!;
      const pp = standings.find((s) => s.playerId === 'p_')!;

      // V: 1 actual win (vs P in R2) + 1 BYE (R3) = 2 wins
      expect(v.wins).toBe(2);
      // P: 1 BYE (R1) + 1 actual win (vs M in R3) = 2 wins
      expect(pp.wins).toBe(2);
    });

    it('tracks actual sets won and lost from matches', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const t = standings.find((s) => s.playerId === 't')!;
      const m = standings.find((s) => s.playerId === 'm')!;

      // T: beat V 3-0 + lost to M 0-3 + beat F 3-0 = 6 won, 3 lost
      expect(t.setsWon).toBe(6);
      expect(t.setsLost).toBe(3);
      // M: beat F 3-0 + beat T 3-0 + lost to P 0-3 = 6 won, 3 lost
      expect(m.setsWon).toBe(6);
      expect(m.setsLost).toBe(3);
    });

    it('played reflects actual match count, not BYEs', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const t = standings.find((s) => s.playerId === 't')!;
      const v = standings.find((s) => s.playerId === 'v')!;

      // T: 3 matches, no BYE → played=3
      expect(t.played).toBe(3);
      // V: 2 actual matches + 1 BYE → played=2
      expect(v.played).toBe(2);
    });
  });

  describe('BYE set crediting', () => {
    it('does not add sets for BYE when maxSets is not provided', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const v = standings.find((s) => s.playerId === 'v')!;
      const pp = standings.find((s) => s.playerId === 'p_')!;

      // V actual sets: won 3 (vs P in R2), lost 3 (vs T in R1) — BYE adds nothing
      expect(v.setsWon).toBe(3);
      expect(v.setsLost).toBe(3);
      // P actual sets: lost 3 (vs V in R2), won 3 (vs M in R3)
      expect(pp.setsWon).toBe(3);
      expect(pp.setsLost).toBe(3);
    });

    it('adds ceil(maxSets/2) sets won to BYE player when maxSets=5', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers, { maxSets: 5 });
      const v = standings.find((s) => s.playerId === 'v')!;
      const pp = standings.find((s) => s.playerId === 'p_')!;
      const f = standings.find((s) => s.playerId === 'f')!;

      // V: 3 (vs P) + ceil(5/2)=3 (BYE in R3) = 6 sets won, 3 sets lost
      expect(v.setsWon).toBe(6);
      expect(v.setsLost).toBe(3);
      // P: ceil(5/2)=3 (BYE in R1) + 3 (vs M) = 6 sets won, 3 sets lost
      expect(pp.setsWon).toBe(6);
      expect(pp.setsLost).toBe(3);
      // F: ceil(5/2)=3 (BYE in R2) + 0 actual wins = 3 sets won, 6 sets lost
      expect(f.setsWon).toBe(3);
      expect(f.setsLost).toBe(6);
    });

    it('adds ceil(maxSets/2)=2 sets won for maxSets=3 (best-of-3)', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers, { maxSets: 3 });
      const v = standings.find((s) => s.playerId === 'v')!;

      // V: 3 (vs P) + ceil(3/2)=2 (BYE in R3) = 5 sets won
      expect(v.setsWon).toBe(5);
    });

    it('does not add sets lost for BYE (clean win simulation)', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers, { maxSets: 5 });
      const v = standings.find((s) => s.playerId === 'v')!;

      // V's only sets lost come from actual match (R1 vs T: 0-3)
      expect(v.setsLost).toBe(3);
    });

    it('non-BYE players are unaffected by maxSets option', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers, { maxSets: 5 });
      const t = standings.find((s) => s.playerId === 't')!;
      const m = standings.find((s) => s.playerId === 'm')!;

      // T and M have no BYE — their set counts should be unchanged
      expect(t.setsWon).toBe(6);
      expect(t.setsLost).toBe(3);
      expect(m.setsWon).toBe(6);
      expect(m.setsLost).toBe(3);
    });
  });

  describe('buchholz', () => {
    it('computes buchholz as sum of opponents wins from actual matches', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const t = standings.find((s) => s.playerId === 't')!;
      const m = standings.find((s) => s.playerId === 'm')!;
      const v = standings.find((s) => s.playerId === 'v')!;
      const pp = standings.find((s) => s.playerId === 'p_')!;

      // T's opponents: V(2 wins) + M(2 wins) + F(1 win) = 5
      expect(t.buchholz).toBe(5);
      // M's opponents: F(1 win) + T(2 wins) + P(2 wins) = 5
      expect(m.buchholz).toBe(5);
      // V's actual opponents: T(2 wins) + P(2 wins) = 4  (BYE round not counted)
      expect(v.buchholz).toBe(4);
      // P's actual opponents: V(2 wins) + M(2 wins) = 4
      expect(pp.buchholz).toBe(4);
    });

    it('BYE round does not contribute to buchholz', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const f = standings.find((s) => s.playerId === 'f')!;

      // F's actual opponents: M(2 wins) + T(2 wins) = 4 — BYE in R2 not counted
      expect(f.buchholz).toBe(4);
    });

    it('higher buchholz separates players with equal wins', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const tRank = standings.findIndex((s) => s.playerId === 't');
      const vRank = standings.findIndex((s) => s.playerId === 'v');

      // T (buchholz=5) ranks above V (buchholz=4) despite equal wins
      expect(tRank).toBeLessThan(vRank);
    });
  });

  describe('head-to-head tiebreak within win group', () => {
    it('ranks M above T via H2H within the {M,T} buchholz+SB sub-group', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const mRank = standings.findIndex((s) => s.playerId === 'm');
      const tRank = standings.findIndex((s) => s.playerId === 't');

      // M and T share buchholz=5 and SB=3, forming sub-group {M,T}.
      // M beat T directly → M sub-group H2H=1, T sub-group H2H=0 → M > T.
      expect(mRank).toBeLessThan(tRank);
    });

    it('ranks V above P via H2H within the {V,P} buchholz+SB sub-group', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const vRank = standings.findIndex((s) => s.playerId === 'v');
      const pRank = standings.findIndex((s) => s.playerId === 'p_');

      // V and P share buchholz=4 and SB=2, forming sub-group {V,P}.
      // V beat P directly → V sub-group H2H=1, P sub-group H2H=0 → V > P.
      expect(vRank).toBeLessThan(pRank);
    });

    it('winner of direct match ranks higher in a simple 2-player schedule', () => {
      const ps = [p('a'), p('b')];
      const s = sched(
        round(1, [match('m1', 'a', 'b', 'a', [[2, 0]])])
      );
      const standings = computeSwissStandings(s, ps);
      expect(standings[0]!.playerId).toBe('a');
      expect(standings[1]!.playerId).toBe('b');
    });

    it('3-player circular H2H: group H2H equal, ELO determines final order', () => {
      // A(1300) beats B(1200), C(1100) gets BYE  → A=1, B=0, C=1
      // B beats C, A gets BYE                    → A=2, B=1, C=1
      // C beats A, B gets BYE                    → A=2, B=2, C=2
      //
      // All wins=2. Within the group:
      //   buchholz = 4 each (opponents each have 2 wins)
      //   SB = 2 each (each beat one player who has 2 wins)
      //   {A,B,C} share equal buchholz=4 and SB=2, so they form one sub-group for H2H.
      //   sub-group H2H = 1 each (A beat B, B beat C, C beat A — circular)
      //   setRatio = 0.5 each (3 sets won, 3 sets lost)
      //   ballRatio = 0 each (SETS mode)
      // → ELO tiebreak: A(1300) > B(1200) > C(1100)
      const circularPlayers = [p('ca', 1300), p('cb', 1200), p('cc', 1100)];
      const circularSchedule = sched(
        round(1, [w30('c1m1', 'ca', 'cb')], 'cc'),
        round(2, [w30('c2m1', 'cb', 'cc')], 'ca'),
        round(3, [w30('c3m1', 'cc', 'ca')], 'cb')
      );
      const standings = computeSwissStandings(circularSchedule, circularPlayers);

      expect(standings[0]!.playerId).toBe('ca');
      expect(standings[1]!.playerId).toBe('cb');
      expect(standings[2]!.playerId).toBe('cc');
    });
  });

  describe('full T/M/V/P/F ranking', () => {
    it('produces ranking M, T, V, P, F', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);

      expect(standings[0]!.playerId).toBe('m');
      expect(standings[1]!.playerId).toBe('t');
      expect(standings[2]!.playerId).toBe('v');
      expect(standings[3]!.playerId).toBe('p_');
      expect(standings[4]!.playerId).toBe('f');
    });

    it('ranking is consistent with maxSets=5 provided', () => {
      // BYE set crediting improves setRatio for V and P, but pairwise H2H
      // already resolves {M,T} and {V,P} before setRatio is needed.
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers, { maxSets: 5 });

      expect(standings[0]!.playerId).toBe('m');
      expect(standings[1]!.playerId).toBe('t');
      expect(standings[2]!.playerId).toBe('v');
      expect(standings[3]!.playerId).toBe('p_');
      expect(standings[4]!.playerId).toBe('f');
    });

    it('F is last with fewest wins', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      expect(standings.at(-1)!.playerId).toBe('f');
      expect(standings.at(-1)!.wins).toBe(1);
    });
  });

  describe('sonnebornBerger', () => {
    it('computes SB as sum of wins of players you beat (actual matches only)', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const t = standings.find((s) => s.playerId === 't')!;
      const m = standings.find((s) => s.playerId === 'm')!;
      const v = standings.find((s) => s.playerId === 'v')!;
      const pp = standings.find((s) => s.playerId === 'p_')!;

      // T beat V(2 wins) and F(1 win) → SB = 3
      expect(t.tiebreakDetails!.sonnebornBerger).toBe(3);
      // M beat F(1 win) and T(2 wins) → SB = 3
      expect(m.tiebreakDetails!.sonnebornBerger).toBe(3);
      // V beat P(2 wins) → SB = 2  (BYE win does not count toward SB)
      expect(v.tiebreakDetails!.sonnebornBerger).toBe(2);
      // P beat M(2 wins) → SB = 2
      expect(pp.tiebreakDetails!.sonnebornBerger).toBe(2);
    });
  });

  describe('setRatio tiebreak', () => {
    it('uses setRatio to break tie when buchholz, SB, and H2H are all equal', () => {
      // 4 players: A, B, C, D
      // R1: A beats C 3-0, B beats D 3-2  (A and B never meet)
      // R2: A beats D 3-0, B beats C 3-0
      // wins: A=2, B=2, C=0, D=0
      // buchholz:  A = wins(C)+wins(D) = 0,  B = wins(D)+wins(C) = 0  → equal
      // SB:        A = 0,  B = 0                                       → equal
      // H2H pairwise: A and B never played → both 0                   → equal
      // setRatio: A = 6/(6+0) = 1.0,  B = 6/(6+2) = 0.75
      // A ranks above B
      const players4 = [p('a'), p('b'), p('c'), p('d')];
      const s = sched(
        round(1, [
          match('m1', 'a', 'c', 'a', [[3, 0]]), // A beats C 3-0
          match('m2', 'b', 'd', 'b', [[3, 2]]), // B beats D 3-2
        ]),
        round(2, [
          match('m3', 'a', 'd', 'a', [[3, 0]]), // A beats D 3-0
          match('m4', 'b', 'c', 'b', [[3, 0]]), // B beats C 3-0
        ])
      );
      const standings = computeSwissStandings(s, players4);
      const aRank = standings.findIndex((s) => s.playerId === 'a');
      const bRank = standings.findIndex((s) => s.playerId === 'b');
      expect(aRank).toBeLessThan(bRank);
    });
  });

  describe('tiebreakApplied tracking', () => {
    it('marks buchholz, sonnebornBerger, headToHead for M-T tie pair', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const m = standings.find((s) => s.playerId === 'm')!;
      const t = standings.find((s) => s.playerId === 't')!;

      expect(m.tiebreakDetails!.tiebreakApplied).toContain('buchholz');
      expect(m.tiebreakDetails!.tiebreakApplied).toContain('sonnebornBerger');
      expect(m.tiebreakDetails!.tiebreakApplied).toContain('headToHead');
      expect(t.tiebreakDetails!.tiebreakApplied).toContain('buchholz');
      expect(t.tiebreakDetails!.tiebreakApplied).toContain('sonnebornBerger');
      expect(t.tiebreakDetails!.tiebreakApplied).toContain('headToHead');
    });

    it('marks buchholz, sonnebornBerger, headToHead for V-P tie pair', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const v = standings.find((s) => s.playerId === 'v')!;
      const pp = standings.find((s) => s.playerId === 'p_')!;

      expect(v.tiebreakDetails!.tiebreakApplied).toContain('buchholz');
      expect(v.tiebreakDetails!.tiebreakApplied).toContain('sonnebornBerger');
      expect(v.tiebreakDetails!.tiebreakApplied).toContain('headToHead');
      expect(pp.tiebreakDetails!.tiebreakApplied).toContain('buchholz');
      expect(pp.tiebreakDetails!.tiebreakApplied).toContain('sonnebornBerger');
      expect(pp.tiebreakDetails!.tiebreakApplied).toContain('headToHead');
    });

    it('F has no tiebreakDetails (uniquely last by wins)', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const f = standings.find((s) => s.playerId === 'f')!;
      expect(f.tiebreakDetails).toBeUndefined();
    });

    it('does not include setRatio or ballRatio when headToHead resolves the tie', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const m = standings.find((s) => s.playerId === 'm')!;

      expect(m.tiebreakDetails!.tiebreakApplied).not.toContain('setRatio');
      expect(m.tiebreakDetails!.tiebreakApplied).not.toContain('ballRatio');
    });

    it('marks setRatio as applied when it resolves the tie', () => {
      const players4 = [p('a'), p('b'), p('c'), p('d')];
      const s = sched(
        round(1, [
          match('m1', 'a', 'c', 'a', [[3, 0]]),
          match('m2', 'b', 'd', 'b', [[3, 2]]), // B's sets give lower ratio
        ]),
        round(2, [
          match('m3', 'a', 'd', 'a', [[3, 0]]),
          match('m4', 'b', 'c', 'b', [[3, 0]]),
        ])
      );
      const standings = computeSwissStandings(s, players4);
      const a = standings.find((s) => s.playerId === 'a')!;
      const b = standings.find((s) => s.playerId === 'b')!;

      expect(a.tiebreakDetails!.tiebreakApplied).toContain('setRatio');
      expect(b.tiebreakDetails!.tiebreakApplied).toContain('setRatio');
    });
  });

  describe('buchholz on row', () => {
    it('exposes buchholz directly on the standings row', () => {
      const standings = computeSwissStandings(tmvpfSchedule, tmvpfPlayers);
      const t = standings.find((s) => s.playerId === 't')!;
      const m = standings.find((s) => s.playerId === 'm')!;

      expect(t.buchholz).toBe(5);
      expect(m.buchholz).toBe(5);
    });
  });
});

// ─── isCurrentRoundComplete ───────────────────────────────────────────────────

describe('isCurrentRoundComplete', () => {
  it('returns false when the last round has unfinished matches', () => {
    const s = sched(
      round(1, [match('m1', 'a', 'b')]) // no winnerId
    );
    expect(isCurrentRoundComplete(s)).toBe(false);
  });

  it('returns true when all matches in the last round have a winner', () => {
    const s = sched(
      round(1, [match('m1', 'a', 'b')]),
      round(2, [match('m2', 'a', 'c', 'a', [[3, 0]])]) // completed
    );
    expect(isCurrentRoundComplete(s)).toBe(true);
  });

  it('returns false when the schedule has no rounds', () => {
    expect(isCurrentRoundComplete({ rounds: [] })).toBe(false);
  });

  it('returns true for a round that has only a BYE and no matches', () => {
    const s = sched(
      round(1, [], 'a') // BYE only — no matches to block completion
    );
    expect(isCurrentRoundComplete(s)).toBe(true);
  });

  it('returns false when one match is complete but another is not', () => {
    const s = sched(
      round(1, [
        match('m1', 'a', 'b', 'a', [[3, 0]]), // done
        match('m2', 'c', 'd'),                 // not done
      ])
    );
    expect(isCurrentRoundComplete(s)).toBe(false);
  });
});

// ─── generateSwissRound1 ──────────────────────────────────────────────────────

describe('generateSwissRound1', () => {
  it('creates correct number of matches for even player count', () => {
    const players = [p('a', 1400), p('b', 1300), p('c', 1200), p('d', 1100)];
    const r = generateSwissRound1(players);
    expect(r.matches).toHaveLength(2);
    expect(r.byePlayerId).toBeNull();
  });

  it('assigns BYE to the lowest-ELO player for odd player count', () => {
    const players = [p('a', 1400), p('b', 1300), p('c', 1200), p('d', 1100), p('e', 1000)];
    const r = generateSwissRound1(players);
    expect(r.matches).toHaveLength(2);
    expect(r.byePlayerId).toBe('e'); // lowest ELO gets BYE
  });

  it('pairs top-half vs bottom-half by ELO (fold pairing)', () => {
    // 4 players sorted by ELO desc: A(1400), B(1300), C(1200), D(1100)
    // Fold: rank1 vs rank3 (A vs C), rank2 vs rank4 (B vs D)
    const players = [p('a', 1400), p('b', 1300), p('c', 1200), p('d', 1100)];
    const r = generateSwissRound1(players);
    const pairings = r.matches.map((m) => [m.player1Id, m.player2Id].toSorted((a, b) => String(a).localeCompare(String(b))).join('-'));
    expect(pairings).toContain('a-c');
    expect(pairings).toContain('b-d');
  });

  it('assigns roundNumber = 1', () => {
    const players = [p('a'), p('b')];
    const r = generateSwissRound1(players);
    expect(r.roundNumber).toBe(1);
  });
});
