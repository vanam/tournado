import type { Bracket, Match, Player, RoundRobinSchedule, SetScore } from '../../types';

// Each SetScore entry is [p1Points, p2Points] for one game.
// getSetTotals counts how many games each player won — so a 3-1 result
// needs exactly 4 entries: 3 with p1 > p2, 1 with p2 > p1.

function makeMatch(
  id: string,
  p1: string,
  p2: string,
  winner: string,
  scores: SetScore[],
): Match {
  return {
    id,
    player1Id: p1,
    player2Id: p2,
    scores,
    winnerId: winner,
    walkover: false,
    dummy: false,
  };
}

// ── Single Elimination (8 players) ───────────────────────────────────────────

export const SINGLE_ELIM_PLAYERS: Player[] = [
  { id: 'se-p1', name: 'Alice', elo: 1600 },
  { id: 'se-p2', name: 'Bob', elo: 1500 },
  { id: 'se-p3', name: 'Carol', elo: 1450 },
  { id: 'se-p4', name: 'Dave', elo: 1400 },
  { id: 'se-p5', name: 'Eve', elo: 1350 },
  { id: 'se-p6', name: 'Frank', elo: 1300 },
  { id: 'se-p7', name: 'Grace', elo: 1250 },
  { id: 'se-p8', name: 'Henry', elo: 1200 },
];

export const SINGLE_ELIM_BRACKET: Bracket = {
  rounds: [
    // Quarterfinals
    [
      // Alice 3-1 Bob
      makeMatch('se-qf1', 'se-p1', 'se-p2', 'se-p1', [[11, 8], [11, 9], [9, 11], [11, 7]]),
      // Carol 3-0 Dave
      makeMatch('se-qf2', 'se-p3', 'se-p4', 'se-p3', [[11, 7], [11, 6], [11, 8]]),
      // Eve 3-2 Frank
      makeMatch('se-qf3', 'se-p5', 'se-p6', 'se-p5', [[11, 9], [9, 11], [11, 8], [8, 11], [11, 9]]),
      // Grace 3-1 Henry
      makeMatch('se-qf4', 'se-p7', 'se-p8', 'se-p7', [[11, 9], [11, 6], [8, 11], [11, 7]]),
    ],
    // Semifinals
    [
      // Alice 3-2 Carol
      makeMatch('se-sf1', 'se-p1', 'se-p3', 'se-p1', [[11, 9], [9, 11], [11, 8], [8, 11], [11, 9]]),
      // Eve 3-0 Grace
      makeMatch('se-sf2', 'se-p5', 'se-p7', 'se-p5', [[11, 6], [11, 8], [11, 7]]),
    ],
    // Final
    [
      // Alice 3-1 Eve
      makeMatch('se-f1', 'se-p1', 'se-p5', 'se-p1', [[11, 8], [11, 7], [9, 11], [11, 9]]),
    ],
  ],
};

// Carol 3-1 Grace (SF losers)
export const SINGLE_ELIM_3RD_PLACE: Match = makeMatch(
  'se-3p',
  'se-p3',
  'se-p7',
  'se-p3',
  [[11, 8], [11, 9], [8, 11], [11, 7]],
);

// ── Double Elimination (4 players) ───────────────────────────────────────────

export const DOUBLE_ELIM_PLAYERS: Player[] = [
  { id: 'de-p1', name: 'Alice', elo: 1600 },
  { id: 'de-p2', name: 'Bob', elo: 1500 },
  { id: 'de-p3', name: 'Carol', elo: 1450 },
  { id: 'de-p4', name: 'Dave', elo: 1400 },
];

export const DOUBLE_ELIM_WINNERS_BRACKET: Bracket = {
  rounds: [
    [
      // Alice 3-1 Bob
      makeMatch('de-wf1', 'de-p1', 'de-p2', 'de-p1', [[11, 8], [11, 9], [9, 11], [11, 7]]),
      // Carol 3-0 Dave
      makeMatch('de-wf2', 'de-p3', 'de-p4', 'de-p3', [[11, 7], [11, 6], [11, 8]]),
    ],
    [
      // Alice 3-2 Carol
      makeMatch('de-ws1', 'de-p1', 'de-p3', 'de-p1', [[11, 9], [9, 11], [11, 8], [8, 11], [11, 9]]),
    ],
  ],
};

export const DOUBLE_ELIM_LOSERS_BRACKET: Bracket = {
  rounds: [
    [
      // Bob 3-1 Dave
      makeMatch('de-lf1', 'de-p2', 'de-p4', 'de-p2', [[11, 8], [11, 6], [8, 11], [11, 9]]),
    ],
    [
      // Carol 3-2 Bob
      makeMatch('de-ls1', 'de-p3', 'de-p2', 'de-p3', [[11, 8], [9, 11], [11, 9], [7, 11], [11, 8]]),
    ],
  ],
};

// Carol 3-2 Alice (losers bracket player wins grand final → bracket reset!)
export const DOUBLE_ELIM_GRAND_FINAL: Match = makeMatch(
  'de-gf',
  'de-p1',
  'de-p3',
  'de-p3',
  [[9, 11], [11, 8], [8, 11], [11, 9], [8, 11]],
);

// Alice 3-2 Carol (bracket reset: Alice wins the rematch to take the title)
export const DOUBLE_ELIM_GRAND_FINAL_REMATCH: Match = makeMatch(
  'de-gf2',
  'de-p1',
  'de-p3',
  'de-p1',
  [[11, 9], [9, 11], [11, 8], [8, 11], [11, 9]],
);

// Bob 3-1 Dave (losers bracket R1 loser vs losers bracket final loser)
export const DOUBLE_ELIM_3RD_PLACE: Match = makeMatch(
  'de-3p',
  'de-p2',
  'de-p4',
  'de-p2',
  [[11, 8], [11, 7], [8, 11], [11, 9]],
);

// ── Round Robin (5 players) ───────────────────────────────────────────────────

export const RR_PLAYERS: Player[] = [
  { id: 'rr-p1', name: 'Alice', elo: 1500 },
  { id: 'rr-p2', name: 'Bob', elo: 1400 },
  { id: 'rr-p3', name: 'Carol', elo: 1350 },
  { id: 'rr-p4', name: 'Dave', elo: 1300 },
  { id: 'rr-p5', name: 'Eve', elo: 1200 },
];

// Final standings: Alice 4W, Bob 3W, Carol 2W, Dave 1W, Eve 0W
export const RR_SCHEDULE: RoundRobinSchedule = {
  rounds: [
    {
      roundNumber: 1,
      byePlayerId: 'rr-p3',
      matches: [
        // Alice 3-0 Eve
        makeMatch('rr-m01', 'rr-p1', 'rr-p5', 'rr-p1', [[11, 7], [11, 6], [11, 8]]),
        // Bob 3-2 Dave
        makeMatch('rr-m02', 'rr-p2', 'rr-p4', 'rr-p2', [[11, 9], [9, 11], [11, 8], [8, 11], [11, 9]]),
      ],
    },
    {
      roundNumber: 2,
      byePlayerId: 'rr-p5',
      matches: [
        // Alice 3-0 Dave
        makeMatch('rr-m03', 'rr-p1', 'rr-p4', 'rr-p1', [[11, 6], [11, 8], [11, 7]]),
        // Bob 3-1 Carol
        makeMatch('rr-m04', 'rr-p2', 'rr-p3', 'rr-p2', [[11, 8], [11, 9], [9, 11], [11, 7]]),
      ],
    },
    {
      roundNumber: 3,
      byePlayerId: 'rr-p2',
      matches: [
        // Alice 3-2 Carol
        makeMatch('rr-m05', 'rr-p1', 'rr-p3', 'rr-p1', [[11, 9], [9, 11], [11, 7], [8, 11], [11, 8]]),
        // Dave 3-1 Eve
        makeMatch('rr-m06', 'rr-p4', 'rr-p5', 'rr-p4', [[11, 8], [11, 7], [9, 11], [11, 9]]),
      ],
    },
    {
      roundNumber: 4,
      byePlayerId: 'rr-p4',
      matches: [
        // Alice 3-1 Bob
        makeMatch('rr-m07', 'rr-p1', 'rr-p2', 'rr-p1', [[11, 9], [11, 8], [8, 11], [11, 9]]),
        // Carol 3-0 Eve
        makeMatch('rr-m08', 'rr-p3', 'rr-p5', 'rr-p3', [[11, 6], [11, 7], [11, 8]]),
      ],
    },
    {
      roundNumber: 5,
      byePlayerId: 'rr-p1',
      matches: [
        // Bob 3-0 Eve
        makeMatch('rr-m09', 'rr-p2', 'rr-p5', 'rr-p2', [[11, 7], [11, 8], [11, 6]]),
        // Carol 3-1 Dave
        makeMatch('rr-m10', 'rr-p3', 'rr-p4', 'rr-p3', [[11, 8], [11, 9], [9, 11], [11, 7]]),
      ],
    },
  ],
};

// ── Groups Example (3 players, circular 1W–1L tie) ───────────────────────────
//
// ScoreMode.SETS: each match score is stored as [[setsWon_p1, setsWon_p2]].
//
// Results:
//   Round 1: Bob 2–1 Carol   (Alice has bye)
//   Round 2: Carol 2–1 Alice (Bob has bye)
//   Round 3: Alice 2–0 Bob   (Carol has bye)
//
// H2H wins: all 1 → tied.
// H2H set diff breaks the tie:
//   Alice: won 2-0 vs Bob, lost 1-2 vs Carol → H2H sets 3-2 → +1
//   Carol: won 2-1 vs Alice, lost 1-2 vs Bob → H2H sets 3-3 → 0
//   Bob:   won 2-1 vs Carol, lost 0-2 vs Alice → H2H sets 2-3 → −1
// Final rank: Alice #1, Carol #2, Bob #3.

// ── Swiss System (6 players, 4 rounds) ───────────────────────────────────────
//
// Fold pairing in R1, then standings-based with backtracking (no rematches).
//
// Results:
//   R1: Alice beats Dave;  Bob beats Eve;   Carol beats Frank
//   R2: Alice beats Bob;   Carol beats Dave; Eve beats Frank
//   R3: Alice beats Carol; Bob beats Frank;  Eve beats Dave
//   R4: Alice beats Eve;   Carol beats Bob;  Dave beats Frank
//
// Final wins: Alice 4W, Carol 3W, Bob 2W, Eve 2W, Dave 1W, Frank 0W
//
// Tiebreak — Bob vs Eve (both 2W):
//   Bob's  opponents: Eve (2W) + Alice (4W) + Frank (0W) + Carol (3W) → Buchholz 9
//   Eve's  opponents: Bob (2W) + Frank (0W) + Dave  (1W) + Alice (4W) → Buchholz 7
//   Buchholz breaks the tie → Bob #3, Eve #4.

export const SWISS_PLAYERS: Player[] = [
  { id: 'sw-p1', name: 'Alice', elo: 1500 },
  { id: 'sw-p2', name: 'Bob',   elo: 1400 },
  { id: 'sw-p3', name: 'Carol', elo: 1350 },
  { id: 'sw-p4', name: 'Dave',  elo: 1300 },
  { id: 'sw-p5', name: 'Eve',   elo: 1200 },
  { id: 'sw-p6', name: 'Frank', elo: 1100 },
];

export const SWISS_SCHEDULE: RoundRobinSchedule = {
  rounds: [
    {
      roundNumber: 1,
      byePlayerId: null,
      matches: [
        makeMatch('sw-m01', 'sw-p1', 'sw-p4', 'sw-p1', [[3, 1]]), // Alice beats Dave 3-1
        makeMatch('sw-m02', 'sw-p2', 'sw-p5', 'sw-p2', [[3, 0]]), // Bob beats Eve 3-0
        makeMatch('sw-m03', 'sw-p3', 'sw-p6', 'sw-p3', [[3, 2]]), // Carol beats Frank 3-2
      ],
    },
    {
      roundNumber: 2,
      byePlayerId: null,
      matches: [
        makeMatch('sw-m04', 'sw-p1', 'sw-p2', 'sw-p1', [[3, 2]]), // Alice beats Bob 3-2
        makeMatch('sw-m05', 'sw-p3', 'sw-p4', 'sw-p3', [[3, 1]]), // Carol beats Dave 3-1
        makeMatch('sw-m06', 'sw-p5', 'sw-p6', 'sw-p5', [[3, 0]]), // Eve beats Frank 3-0
      ],
    },
    {
      roundNumber: 3,
      byePlayerId: null,
      matches: [
        makeMatch('sw-m07', 'sw-p1', 'sw-p3', 'sw-p1', [[3, 1]]), // Alice beats Carol 3-1
        makeMatch('sw-m08', 'sw-p2', 'sw-p6', 'sw-p2', [[3, 0]]), // Bob beats Frank 3-0
        makeMatch('sw-m09', 'sw-p5', 'sw-p4', 'sw-p5', [[3, 2]]), // Eve beats Dave 3-2
      ],
    },
    {
      roundNumber: 4,
      byePlayerId: null,
      matches: [
        makeMatch('sw-m10', 'sw-p1', 'sw-p5', 'sw-p1', [[3, 0]]), // Alice beats Eve 3-0
        makeMatch('sw-m11', 'sw-p3', 'sw-p2', 'sw-p3', [[3, 1]]), // Carol beats Bob 3-1
        makeMatch('sw-m12', 'sw-p4', 'sw-p6', 'sw-p4', [[3, 2]]), // Dave beats Frank 3-2
      ],
    },
  ],
};

// ── Groups Example (3 players, circular 1W–1L tie) ───────────────────────────
//
export const GROUPS_PLAYERS: Player[] = [
  { id: 'grp-p1', name: 'Alice' },
  { id: 'grp-p2', name: 'Bob' },
  { id: 'grp-p3', name: 'Carol' },
];

export const GROUPS_SCHEDULE: RoundRobinSchedule = {
  rounds: [
    {
      roundNumber: 1,
      byePlayerId: 'grp-p1',
      matches: [
        // Bob 2-1 Carol
        makeMatch('grp-m1', 'grp-p2', 'grp-p3', 'grp-p2', [[2, 1]]),
      ],
    },
    {
      roundNumber: 2,
      byePlayerId: 'grp-p2',
      matches: [
        // Carol 2-1 Alice (Carol=p1, Alice=p2)
        makeMatch('grp-m2', 'grp-p3', 'grp-p1', 'grp-p3', [[2, 1]]),
      ],
    },
    {
      roundNumber: 3,
      byePlayerId: 'grp-p3',
      matches: [
        // Alice 2-0 Bob
        makeMatch('grp-m3', 'grp-p1', 'grp-p2', 'grp-p1', [[2, 0]]),
      ],
    },
  ],
};
