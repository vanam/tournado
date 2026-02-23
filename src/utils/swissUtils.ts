import { createMatch } from './matchFactory';
import { createMatchIdGenerator } from './matchIdGenerator';
import { getSetTotals, isWalkoverScore } from './scoreUtils';
import { ScoreMode } from '../types';
import type {
  Player,
  Match,
  Round,
  RoundRobinSchedule,
  RankedResult,
  SwissTournament,
  SwissStandingsRow,
  SwissCriteriaKey,
} from '../types';

const BYE_PLAYER_ID = '__BYE__';

export function computeTotalRounds(playerCount: number): number {
  return Math.ceil(Math.log2(playerCount));
}

export function generateSwissRound1(players: Player[], idPrefix = 'sw'): Round {
  const idGen = createMatchIdGenerator();
  idGen.reset();

  const sorted = [...players].toSorted((a, b) => (b.elo ?? 1000) - (a.elo ?? 1000));

  const hasOdd = sorted.length % 2 !== 0;
  let byePlayerId: string | null = null;

  if (hasOdd) {
    byePlayerId = sorted.at(-1)?.id ?? null;
  }

  const activePlayers = hasOdd ? sorted.slice(0, -1) : sorted;
  const half = activePlayers.length / 2;
  const matches: Match[] = [];

  for (let i = 0; i < half; i++) {
    const p1 = activePlayers[i];
    const p2 = activePlayers[half + i];
    if (!p1 || !p2) continue;
    matches.push(
      createMatch(idGen.nextId(idPrefix), {
        player1Id: p1.id,
        player2Id: p2.id,
      })
    );
  }

  return { roundNumber: 1, byePlayerId, matches };
}

export function generateSwissInitialSchedule(players: Player[]): RoundRobinSchedule {
  return { rounds: [generateSwissRound1(players)] };
}

export function getPreviousOpponents(schedule: RoundRobinSchedule): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  function addOpponent(a: string, b: string): void {
    let set = map.get(a);
    if (!set) {
      set = new Set();
      map.set(a, set);
    }
    set.add(b);
  }

  for (const round of schedule.rounds) {
    if (round.byePlayerId) {
      addOpponent(round.byePlayerId, BYE_PLAYER_ID);
      addOpponent(BYE_PLAYER_ID, round.byePlayerId);
    }
    for (const match of round.matches) {
      if (match.player1Id && match.player2Id) {
        addOpponent(match.player1Id, match.player2Id);
        addOpponent(match.player2Id, match.player1Id);
      }
    }
  }

  return map;
}

// ─── Standings ───────────────────────────────────────────────────────────────

interface StandingsOptions {
  scoringMode?: ScoreMode;
  maxSets?: number;
}

type PlayerStats = {
  wins: number;
  losses: number;
  played: number;
  opponents: string[];
  wonAgainst: Set<string>;
  h2hWins: Map<string, number>;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
};

function emptyStats(): PlayerStats {
  return {
    wins: 0, losses: 0, played: 0,
    opponents: [], wonAgainst: new Set(), h2hWins: new Map(),
    setsWon: 0, setsLost: 0, pointsWon: 0, pointsLost: 0,
  };
}

function accumulatePoints(
  s1: PlayerStats,
  s2: PlayerStats,
  scores: Match['scores']
): void {
  const validScores = Array.isArray(scores) ? scores.filter((sc) => Array.isArray(sc)) : [];
  for (const sc of validScores) {
    const a = sc[0];
    const b = sc[1];
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (isWalkoverScore(a) || isWalkoverScore(b)) continue;
    s1.pointsWon += a;
    s1.pointsLost += b;
    s2.pointsWon += b;
    s2.pointsLost += a;
  }
}

function applyMatchResult(
  s1: PlayerStats,
  s2: PlayerStats,
  p1Id: string,
  p2Id: string,
  match: Match,
  options: StandingsOptions
): void {
  const { scoringMode = ScoreMode.SETS, maxSets } = options;

  s1.played += 1;
  s2.played += 1;
  s1.opponents.push(p2Id);
  s2.opponents.push(p1Id);

  const { p1Sets, p2Sets } = getSetTotals(match.scores, { scoringMode, maxSets });
  s1.setsWon += p1Sets;
  s1.setsLost += p2Sets;
  s2.setsWon += p2Sets;
  s2.setsLost += p1Sets;

  if (scoringMode === ScoreMode.POINTS) {
    accumulatePoints(s1, s2, match.scores);
  }

  if (match.winnerId === p1Id) {
    s1.wins += 1;
    s2.losses += 1;
    s1.wonAgainst.add(p2Id);
    s1.h2hWins.set(p2Id, (s1.h2hWins.get(p2Id) ?? 0) + 1);
  } else {
    s2.wins += 1;
    s1.losses += 1;
    s2.wonAgainst.add(p1Id);
    s2.h2hWins.set(p1Id, (s2.h2hWins.get(p1Id) ?? 0) + 1);
  }
}

function processRounds(
  rounds: Round[],
  statsMap: Map<string, PlayerStats>,
  options: StandingsOptions
): void {
  for (const round of rounds) {
    if (round.byePlayerId) {
      const s = statsMap.get(round.byePlayerId);
      if (s) {
        s.wins += 1;
        if (options.maxSets !== undefined) {
          s.setsWon += Math.ceil(options.maxSets / 2);
        }
      }
    }
    for (const match of round.matches) {
      const { player1Id: p1, player2Id: p2, winnerId } = match;
      if (!p1 || !p2 || !winnerId) continue;
      const s1 = statsMap.get(p1);
      const s2 = statsMap.get(p2);
      if (!s1 || !s2) continue;
      applyMatchResult(s1, s2, p1, p2, match, options);
    }
  }
}

// ─── Intermediate row (used for sorting) ─────────────────────────────────────

interface IntermediateRow {
  playerId: string;
  elo: number | undefined;
  wins: number;
  losses: number;
  played: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
  buchholz: number;
  sonnebornBerger: number;
  setRatio: number;
  ballRatio: number;
  headToHead: number;
}

function buildIntermediateRow(
  p: Player,
  s: PlayerStats,
  statsMap: Map<string, PlayerStats>
): IntermediateRow {
  let buchholz = 0;
  let sonnebornBerger = 0;
  for (const oppId of s.opponents) {
    buchholz += statsMap.get(oppId)?.wins ?? 0;
  }
  for (const oppId of s.wonAgainst) {
    sonnebornBerger += statsMap.get(oppId)?.wins ?? 0;
  }
  const setTotal = s.setsWon + s.setsLost;
  const pointTotal = s.pointsWon + s.pointsLost;
  return {
    playerId: p.id,
    elo: p.elo,
    wins: s.wins,
    losses: s.losses,
    played: s.played,
    setsWon: s.setsWon,
    setsLost: s.setsLost,
    pointsWon: s.pointsWon,
    pointsLost: s.pointsLost,
    buchholz,
    sonnebornBerger,
    setRatio: setTotal > 0 ? s.setsWon / setTotal : 0,
    ballRatio: pointTotal > 0 ? s.pointsWon / pointTotal : 0,
    headToHead: 0,
  };
}

// ─── Tiebreak cascade ─────────────────────────────────────────────────────────

const CRITERIA_ORDER: SwissCriteriaKey[] = [
  'buchholz', 'sonnebornBerger', 'headToHead', 'setRatio', 'ballRatio',
];

function criterionValue(row: IntermediateRow, key: SwissCriteriaKey): number {
  switch (key) {
    case 'buchholz': { return row.buchholz; }
    case 'sonnebornBerger': { return row.sonnebornBerger; }
    case 'headToHead': { return row.headToHead; }
    case 'setRatio': { return row.setRatio; }
    case 'ballRatio': { return row.ballRatio; }
  }
}

function computeH2HInGroup(
  playerId: string,
  groupIds: Set<string>,
  h2hWinsMap: Map<string, Map<string, number>>
): number {
  const playerH2H = h2hWinsMap.get(playerId);
  if (!playerH2H) return 0;
  let total = 0;
  for (const [oppId, count] of playerH2H) {
    if (groupIds.has(oppId)) total += count;
  }
  return total;
}

function sortGroup(
  group: IntermediateRow[],
  h2hWinsMap: Map<string, Map<string, number>>
): IntermediateRow[] {
  const h2hIndex = CRITERIA_ORDER.indexOf('headToHead');
  const preH2HKeys = CRITERIA_ORDER.slice(0, h2hIndex); // ['buchholz', 'sonnebornBerger']

  const withH2H = group.map((row) => {
    const peerIds = new Set(
      group
        .filter((r) => preH2HKeys.every((key) => criterionValue(r, key) === criterionValue(row, key)))
        .map((r) => r.playerId)
    );
    return { ...row, headToHead: computeH2HInGroup(row.playerId, peerIds, h2hWinsMap) };
  });

  return withH2H.toSorted((a, b) => {
    for (const key of CRITERIA_ORDER) {
      const diff = criterionValue(b, key) - criterionValue(a, key);
      if (diff !== 0) return diff;
    }
    return (b.elo ?? 1000) - (a.elo ?? 1000);
  });
}

function computeTiebreakApplied(
  sortedRows: IntermediateRow[]
): Map<string, SwissCriteriaKey[]> {
  const appliedSets = new Map<string, Set<SwissCriteriaKey>>();
  for (const row of sortedRows) {
    appliedSets.set(row.playerId, new Set());
  }

  for (let i = 0; i < sortedRows.length - 1; i++) {
    const a = sortedRows[i];
    const b = sortedRows[i + 1];
    if (a?.wins !== b?.wins) continue;
    if (a === undefined || b === undefined) continue;
    for (const key of CRITERIA_ORDER) {
      appliedSets.get(a.playerId)?.add(key);
      appliedSets.get(b.playerId)?.add(key);
      const valuesEqual = criterionValue(a, key) === criterionValue(b, key);
      if (!valuesEqual) break;
    }
  }

  return new Map([...appliedSets.entries()].map(([id, set]) => [id, [...set]]));
}

function buildFinalRow(
  row: IntermediateRow,
  playerNameMap: Map<string, string>,
  tiebreakAppliedMap: Map<string, SwissCriteriaKey[]>
): SwissStandingsRow {
  const applied = tiebreakAppliedMap.get(row.playerId) ?? [];
  const base: SwissStandingsRow = {
    playerId: row.playerId,
    name: playerNameMap.get(row.playerId) ?? '',
    elo: row.elo,
    played: row.played,
    wins: row.wins,
    losses: row.losses,
    points: row.wins,
    setsWon: row.setsWon,
    setsLost: row.setsLost,
    pointsWon: row.pointsWon,
    pointsLost: row.pointsLost,
    buchholz: row.buchholz,
  };
  if (applied.length > 0) {
    base.tiebreakDetails = {
      buchholz: row.buchholz,
      sonnebornBerger: row.sonnebornBerger,
      headToHead: row.headToHead,
      setRatio: row.setRatio,
      ballRatio: row.ballRatio,
      tiebreakApplied: applied,
    };
  }
  return base;
}

export function computeSwissStandings(
  schedule: RoundRobinSchedule,
  players: Player[],
  options: StandingsOptions = {}
): SwissStandingsRow[] {
  // Phase 1: collect raw stats
  const statsMap = new Map<string, PlayerStats>();
  for (const p of players) {
    statsMap.set(p.id, emptyStats());
  }
  processRounds(schedule.rounds, statsMap, options);

  // Phase 2: build intermediate rows with derived values
  const h2hWinsMap = new Map<string, Map<string, number>>();
  const intermediateRows: IntermediateRow[] = [];
  for (const p of players) {
    const s = statsMap.get(p.id) ?? emptyStats();
    h2hWinsMap.set(p.id, s.h2hWins);
    intermediateRows.push(buildIntermediateRow(p, s, statsMap));
  }

  // Phase 3: group by wins, compute H2H within each group, sort
  const groups = new Map<number, IntermediateRow[]>();
  for (const row of intermediateRows) {
    const group = groups.get(row.wins);
    if (group) {
      group.push(row);
    } else {
      groups.set(row.wins, [row]);
    }
  }
  const sortedRows: IntermediateRow[] = [];
  for (const [, group] of [...groups.entries()].toSorted((a, b) => b[0] - a[0])) {
    sortedRows.push(...sortGroup(group, h2hWinsMap));
  }

  // Phase 4: compute which tiebreakers were applied
  const tiebreakAppliedMap = computeTiebreakApplied(sortedRows);

  // Phase 5: build final rows
  const playerNameMap = new Map(players.map((p) => [p.id, p.name]));
  return sortedRows.map((row) => buildFinalRow(row, playerNameMap, tiebreakAppliedMap));
}

// ─── Round generation ─────────────────────────────────────────────────────────

export function assignByeForRound(
  standings: SwissStandingsRow[],
  schedule: RoundRobinSchedule
): string | null {
  if (standings.length % 2 === 0) return null;

  const hadBye = new Set<string>();
  for (const round of schedule.rounds) {
    if (round.byePlayerId) hadBye.add(round.byePlayerId);
  }

  for (let i = standings.length - 1; i >= 0; i--) {
    const row = standings[i];
    if (row && !hadBye.has(row.playerId)) {
      return row.playerId;
    }
  }

  return standings.at(-1)?.playerId ?? null;
}

function pairRound(
  unpaired: string[],
  prevOpponents: Map<string, Set<string>>,
  idGen: ReturnType<typeof createMatchIdGenerator>,
  idPrefix: string,
  _roundNumber: number
): Match[] | null {
  if (unpaired.length === 0) return [];

  const first = unpaired[0];
  if (!first) return null;

  for (let i = 1; i < unpaired.length; i++) {
    const partner = unpaired[i];
    if (!partner) continue;
    if (prevOpponents.get(first)?.has(partner)) continue;

    const remaining = unpaired.filter((_, idx) => idx !== 0 && idx !== i);
    const rest = pairRound(remaining, prevOpponents, idGen, idPrefix, _roundNumber);
    if (rest !== null) {
      return [
        createMatch(idGen.nextId(idPrefix), {
          player1Id: first,
          player2Id: partner,
        }),
        ...rest,
      ];
    }
  }

  return null;
}

export function generateNextSwissRound(tournament: SwissTournament): Round {
  const { schedule, players } = tournament;
  const roundNumber = schedule.rounds.length + 1;
  const idPrefix = 'sw';
  const idGen = createMatchIdGenerator(schedule.rounds.reduce((sum, r) => sum + r.matches.length, 0));

  const standings = computeSwissStandings(schedule, players);
  const byePlayerId = assignByeForRound(standings, schedule);
  const prevOpponents = getPreviousOpponents(schedule);

  const orderedIds = standings
    .map((r) => r.playerId)
    .filter((id) => id !== byePlayerId);

  const paired = pairRound(orderedIds, prevOpponents, idGen, idPrefix, roundNumber);

  let matches: Match[];
  if (paired === null) {
    matches = [];
    for (let i = 0; i < orderedIds.length - 1; i += 2) {
      const p1 = orderedIds[i];
      const p2 = orderedIds[i + 1];
      if (!p1 || !p2) continue;
      matches.push(
        createMatch(idGen.nextId(idPrefix), {
          player1Id: p1,
          player2Id: p2,
        })
      );
    }
  } else {
    matches = paired;
  }

  return { roundNumber, byePlayerId, matches };
}

// ─── Completion helpers ───────────────────────────────────────────────────────

export function isCurrentRoundComplete(schedule: RoundRobinSchedule): boolean {
  const lastRound = schedule.rounds.at(-1);
  if (!lastRound) return false;
  return lastRound.matches.every((m) => m.winnerId !== null);
}

export function isSwissTournamentComplete(tournament: SwissTournament): boolean {
  return (
    isCurrentRoundComplete(tournament.schedule) &&
    tournament.schedule.rounds.length >= tournament.totalRounds
  );
}

export function buildSwissResults(standings: SwissStandingsRow[]): RankedResult[] {
  return standings.map((row, i) => ({
    playerId: row.playerId,
    name: row.name,
    rankStart: i + 1,
    rankEnd: i + 1,
  }));
}
