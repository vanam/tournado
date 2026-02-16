import { getSetTotals, isWalkoverScore } from './scoreUtils';
import { SCORE_MODES } from '../types';
import { createMatchIdGenerator } from './matchIdGenerator';
import { createMatch } from './matchFactory';
import type { Player, Match, Round, RoundRobinSchedule, StandingsRow, ScoreMode, RoundRobinTiebreakDetails } from '../types';

interface ScheduleOptions {
  idPrefix?: string | undefined;
}

export function generateSchedule(players: Player[], options: ScheduleOptions = {}): RoundRobinSchedule {
  const { idPrefix = 'rr' } = options;
  const matchIdGenerator = createMatchIdGenerator();
  matchIdGenerator.reset();
  function nextId(): string {
    return matchIdGenerator.nextId(idPrefix);
  }

  const list: (string | null)[] = players.map((p) => p.id);
  if (list.length % 2 !== 0) {
    list.push(null); // ghost BYE player
  }

  const n = list.length;
  const numRounds = n - 1;
  const rounds: Round[] = [];

  // Circle method: fix first element, rotate the rest
  const fixed = list[0];
  if (fixed === undefined) return { rounds: [] };
  const rotating = list.slice(1);

  for (let r = 0; r < numRounds; r++) {
    const current = [fixed, ...rotating];
    const matches: Match[] = [];
    let byePlayerId: string | null = null;

    for (let i = 0; i < n / 2; i++) {
      const p1 = current[i] ?? null;
      const p2 = current[n - 1 - i] ?? null;

      if (p1 == null) {
        byePlayerId = p2;
        continue;
      }
      if (p2 == null) {
        byePlayerId = p1;
        continue;
      }

      matches.push(
        createMatch(nextId(), {
          player1Id: p1,
          player2Id: p2,
        })
      );
    }

    rounds.push({
      roundNumber: r + 1,
      byePlayerId,
      matches,
    });

    // Rotate: move last element to front of rotating array
    const last = rotating.pop();
    if (last !== undefined) rotating.unshift(last);
  }

  return { rounds };
}

interface StandingsOptions {
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
}

function updatePlayerStats(match: Match, stats: Record<string, StandingsRow>, scoringMode: ScoreMode, maxSets?: number): void {
  if (!match.winnerId) return;
  const p1Id = match.player1Id;
  const p2Id = match.player2Id;
  if (!p1Id || !p2Id) return;
  const p1 = stats[p1Id];
  const p2 = stats[p2Id];
  if (!p1 || !p2) return;

  p1.played++;
  p2.played++;

  const { p1Sets, p2Sets } = getSetTotals(match.scores, { scoringMode, maxSets });
  p1.setsWon += p1Sets;
  p1.setsLost += p2Sets;
  p2.setsWon += p2Sets;
  p2.setsLost += p1Sets;

  if (scoringMode === SCORE_MODES.POINTS) {
    const validScores = Array.isArray(match.scores)
      ? match.scores.filter((s) => Array.isArray(s))
      : [];
    for (const s of validScores) {
      const a = s[0];
      const b = s[1];
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      if (isWalkoverScore(a) || isWalkoverScore(b)) continue;
      p1.pointsWon += a;
      p1.pointsLost += b;
      p2.pointsWon += b;
      p2.pointsLost += a;
    }
  }

  if (match.winnerId === match.player1Id) {
    p1.wins++;
    p1.points += 1;
    p2.losses++;
  } else {
    p2.wins++;
    p2.points += 1;
    p1.losses++;
  }
}

interface MatchDetail {
  winnerId: string;
  p1Sets: number;
  p2Sets: number;
  p1Points: number;
  p2Points: number;
}

function computeMatchPoints(match: Match, scoringMode: ScoreMode): [number, number] {
  let p1Points = 0;
  let p2Points = 0;
  if (scoringMode === SCORE_MODES.POINTS) {
    const validScores = Array.isArray(match.scores)
      ? match.scores.filter((s) => Array.isArray(s))
      : [];
    for (const s of validScores) {
      const a = s[0];
      const b = s[1];
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      if (isWalkoverScore(a) || isWalkoverScore(b)) continue;
      p1Points += a;
      p2Points += b;
    }
  }
  return [p1Points, p2Points];
}

function buildMatchDetailsLookup(schedule: RoundRobinSchedule, scoringMode: ScoreMode, maxSets?: number): Record<string, MatchDetail> {
  const matchDetails: Record<string, MatchDetail> = {};
  for (const round of schedule.rounds) {
    for (const match of round.matches) {
      if (!match.winnerId || !match.player1Id || !match.player2Id) continue;
      const key = [match.player1Id, match.player2Id].toSorted((a, b) => a.localeCompare(b)).join('-');
      const { p1Sets, p2Sets } = getSetTotals(match.scores, { scoringMode, maxSets });
      const [p1Points, p2Points] = computeMatchPoints(match, scoringMode);
      const isP1First = match.player1Id.localeCompare(match.player2Id) < 0;
      matchDetails[key] = {
        winnerId: match.winnerId,
        p1Sets: isP1First ? p1Sets : p2Sets,
        p2Sets: isP1First ? p2Sets : p1Sets,
        p1Points: isP1First ? p1Points : p2Points,
        p2Points: isP1First ? p2Points : p1Points,
      };
    }
  }
  return matchDetails;
}

function sortStandings(standings: StandingsRow[]): StandingsRow[] {
  return [...standings].toSorted((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aDiff = a.setsWon - a.setsLost;
    const bDiff = b.setsWon - b.setsLost;
    if (bDiff !== aDiff) return bDiff - aDiff;
    return b.setsWon - a.setsWon;
  });
}

interface H2HStats {
  points: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
}

function computeH2HStats(
  playerId: string,
  tiedIds: string[],
  matchDetails: Record<string, MatchDetail>
): H2HStats {
  const stats: H2HStats = { points: 0, setsWon: 0, setsLost: 0, pointsWon: 0, pointsLost: 0 };
  for (const opponentId of tiedIds) {
    if (opponentId === playerId) continue;
    const key = [playerId, opponentId].toSorted((a, b) => a.localeCompare(b)).join('-');
    const detail = matchDetails[key];
    if (!detail) continue;
    const isP1 = playerId.localeCompare(opponentId) < 0;
    if (detail.winnerId === playerId) stats.points++;
    if (isP1) {
      stats.setsWon += detail.p1Sets;
      stats.setsLost += detail.p2Sets;
      stats.pointsWon += detail.p1Points;
      stats.pointsLost += detail.p2Points;
    } else {
      stats.setsWon += detail.p2Sets;
      stats.setsLost += detail.p1Sets;
      stats.pointsWon += detail.p2Points;
      stats.pointsLost += detail.p1Points;
    }
  }
  return stats;
}

function buildTiebreakDetails(
  row: StandingsRow,
  tiedIds: string[],
  matchDetails: Record<string, MatchDetail>,
  pointsDiffApplicable: boolean
): RoundRobinTiebreakDetails {
  const h2h = computeH2HStats(row.playerId, tiedIds, matchDetails);
  return {
    headToHead: h2h.points,
    headToHeadSetDiff: h2h.setsWon - h2h.setsLost,
    headToHeadSetsWon: h2h.setsWon,
    setDiff: row.setsWon - row.setsLost,
    setsWon: row.setsWon,
    pointsDiff: row.pointsWon - row.pointsLost,
    pointsDiffApplicable,
    tiebreakApplied: [],
  };
}

function compareByTiebreakers(a: RoundRobinTiebreakDetails, b: RoundRobinTiebreakDetails): number {
  if (b.headToHead !== a.headToHead) return b.headToHead - a.headToHead;
  if (b.headToHeadSetDiff !== a.headToHeadSetDiff) return b.headToHeadSetDiff - a.headToHeadSetDiff;
  if (b.headToHeadSetsWon !== a.headToHeadSetsWon) return b.headToHeadSetsWon - a.headToHeadSetsWon;
  if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff;
  if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;
  if (a.pointsDiffApplicable && b.pointsDiffApplicable && b.pointsDiff !== a.pointsDiff) {
    return b.pointsDiff - a.pointsDiff;
  }
  return 0;
}

function getAppliedCriteria(a: RoundRobinTiebreakDetails, b: RoundRobinTiebreakDetails): string[] {
  const applied: string[] = [];
  if (a.headToHead !== b.headToHead) {
    applied.push('headToHead');
    return applied;
  }
  applied.push('headToHead');
  if (a.headToHeadSetDiff !== b.headToHeadSetDiff) {
    applied.push('headToHeadSetDiff');
    return applied;
  }
  applied.push('headToHeadSetDiff');
  if (a.headToHeadSetsWon !== b.headToHeadSetsWon) {
    applied.push('headToHeadSetsWon');
    return applied;
  }
  applied.push('headToHeadSetsWon');
  if (a.setDiff !== b.setDiff) {
    applied.push('setDiff');
    return applied;
  }
  applied.push('setDiff');
  if (a.setsWon !== b.setsWon) {
    applied.push('setsWon');
    return applied;
  }
  applied.push('setsWon');
  if (a.pointsDiffApplicable && b.pointsDiffApplicable) {
    if (a.pointsDiff !== b.pointsDiff) {
      applied.push('pointsDiff');
      return applied;
    }
    applied.push('pointsDiff');
  }
  return applied;
}

function resolveGroupTie(group: StandingsRow[], matchDetails: Record<string, MatchDetail>, pointsDiffApplicable: boolean): StandingsRow[] {
  const tiedIds = group.map((p) => p.playerId);
  for (const row of group) {
    row.tiebreakDetails = buildTiebreakDetails(row, tiedIds, matchDetails, pointsDiffApplicable);
  }

  const sorted = [...group].toSorted((a, b) => {
    const aDetail = a.tiebreakDetails;
    const bDetail = b.tiebreakDetails;
    if (!aDetail || !bDetail) return 0;
    return compareByTiebreakers(aDetail, bDetail);
  });

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (!current?.tiebreakDetails) continue;
    current.tiebreakDetails.tiebreakApplied = next?.tiebreakDetails && current.points === next.points
      ? getAppliedCriteria(current.tiebreakDetails, next.tiebreakDetails)
      : [];
  }

  return sorted;
}

function resolveTwoPlayerTie(
  standings: StandingsRow[],
  i: number,
  matchDetails: Record<string, MatchDetail>,
  pointsDiffApplicable: boolean
): void {
  const a = standings[i];
  const b = standings[i + 1];
  if (!a || !b) return;
  const tiedIds = [a.playerId, b.playerId];
  a.tiebreakDetails = buildTiebreakDetails(a, tiedIds, matchDetails, pointsDiffApplicable);
  b.tiebreakDetails = buildTiebreakDetails(b, tiedIds, matchDetails, pointsDiffApplicable);
  const cmp = compareByTiebreakers(a.tiebreakDetails, b.tiebreakDetails);
  if (cmp > 0) {
    standings[i] = b;
    standings[i + 1] = a;
  }
  const firstDetail = standings[i]?.tiebreakDetails;
  const secondDetail = standings[i + 1]?.tiebreakDetails;
  if (firstDetail && secondDetail) {
    const applied = getAppliedCriteria(firstDetail, secondDetail);
    firstDetail.tiebreakApplied = applied;
    secondDetail.tiebreakApplied = applied;
  }
}

function resolveSinglePlayer(standings: StandingsRow[], i: number, pointsDiffApplicable: boolean): void {
  const row = standings[i];
  if (!row) return;
  row.tiebreakDetails = {
    headToHead: 0,
    headToHeadSetDiff: 0,
    headToHeadSetsWon: 0,
    setDiff: row.setsWon - row.setsLost,
    setsWon: row.setsWon,
    pointsDiff: row.pointsWon - row.pointsLost,
    pointsDiffApplicable,
    tiebreakApplied: [],
  };
}

function resolveTies(standings: StandingsRow[], matchDetails: Record<string, MatchDetail>, pointsDiffApplicable: boolean): StandingsRow[] {
  let i = 0;
  while (i < standings.length) {
    let j = i + 1;
    const standingI = standings[i];
    if (!standingI) break;
    while (j < standings.length && standings[j]?.points === standingI.points) {
      j++;
    }
    const groupSize = j - i;

    if (groupSize === 2) {
      resolveTwoPlayerTie(standings, i, matchDetails, pointsDiffApplicable);
    } else if (groupSize >= 3) {
      const group = standings.slice(i, j);
      const sortedGroup = resolveGroupTie(group, matchDetails, pointsDiffApplicable);
      for (const [k, entry] of sortedGroup.entries()) {
        standings[i + k] = entry;
      }
    } else {
      resolveSinglePlayer(standings, i, pointsDiffApplicable);
    }
    i = j;
  }
  return standings;
}

export function computeStandings(schedule: RoundRobinSchedule, players: Player[], options: StandingsOptions = {}): StandingsRow[] {
  const { scoringMode = SCORE_MODES.POINTS, maxSets } = options;
  const stats: Record<string, StandingsRow> = {};
  for (const p of players) {
    stats[p.id] = {
      playerId: p.id,
      name: p.name,
      elo: typeof p.elo === 'number' && Number.isFinite(p.elo) ? p.elo : undefined,
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
      setsWon: 0,
      setsLost: 0,
      pointsWon: 0,
      pointsLost: 0,
    };
  }

  for (const round of schedule.rounds) {
    for (const match of round.matches) {
      updatePlayerStats(match, stats, scoringMode, maxSets);
    }
  }

  const matchDetails = buildMatchDetailsLookup(schedule, scoringMode, maxSets);
  const pointsDiffApplicable = scoringMode === SCORE_MODES.POINTS;
  let standings = Object.values(stats);
  standings = sortStandings(standings);
  standings = resolveTies(standings, matchDetails, pointsDiffApplicable);
  return standings;
}

export function isScheduleComplete(schedule: RoundRobinSchedule): boolean {
  return schedule.rounds.every((round) =>
    round.matches.every((match) => match.winnerId)
  );
}
