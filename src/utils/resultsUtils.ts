import { computeStandings } from './roundRobinUtils';
import { getBracketWinner } from './bracketUtils';
import { getDoubleElimWinner } from './doubleElimUtils';
import { SCORE_MODES } from '../types';
import type { Player, Bracket, RoundRobinSchedule, StandingsRow, RankedResult, DoubleElim, ScoreMode, Match } from '../types';

interface TieKeyRow {
  points?: number | undefined;
  setsWon?: number | undefined;
  setsLost?: number | undefined;
  pointsWon?: number | undefined;
  pointsLost?: number | undefined;
}

interface RoundRobinOptions {
  scoringMode?: ScoreMode | undefined;
}

interface StandingsResultRow extends StandingsRow {
  rankStart: number;
  rankEnd: number;
}

interface RankInfo {
  rankStart: number;
  rankEnd: number;
}

function tieKey(row: TieKeyRow, scoringMode: ScoreMode): string {
  const setDiff = (row.setsWon ?? 0) - (row.setsLost ?? 0);
  const parts = [row.points ?? 0, setDiff, row.setsWon ?? 0];
  if (scoringMode === SCORE_MODES.POINTS) {
    const pointsDiff = (row.pointsWon ?? 0) - (row.pointsLost ?? 0);
    parts.push(pointsDiff);
  }
  return parts.join('|');
}

export function buildStandingsResults(standings: StandingsRow[], options: RoundRobinOptions = {}): StandingsResultRow[] {
  const scoringMode = options.scoringMode ?? SCORE_MODES.SETS;
  const results: StandingsResultRow[] = [];
  let index = 0;

  while (index < standings.length) {
    const baseStanding = standings[index];
    if (!baseStanding) break;
    const baseKey = tieKey(baseStanding, scoringMode);
    let endIndex = index + 1;
    while (endIndex < standings.length) {
      const nextStanding = standings[endIndex];
      if (!nextStanding || tieKey(nextStanding, scoringMode) !== baseKey) break;
      endIndex += 1;
    }

    const rankStart = index + 1;
    const rankEnd = endIndex;
    for (let i = index; i < endIndex; i += 1) {
      const standing = standings[i];
      if (!standing) continue;
      results.push({
        ...standing,
        rankStart,
        rankEnd,
      });
    }
    index = endIndex;
  }

  return results;
}

export function buildRoundRobinResults(schedule: RoundRobinSchedule, players: Player[], options: RoundRobinOptions = {}): StandingsResultRow[] {
  const standings = computeStandings(schedule, players, options);
  return buildStandingsResults(standings, options);
}

export function collectBracketPlayerIds(bracket: Bracket | null): Set<string> {
  const ids = new Set<string>();
  if (!bracket) return ids;
  for (const round of bracket.rounds) {
    for (const match of round) {
      if (match.player1Id) ids.add(match.player1Id);
      if (match.player2Id) ids.add(match.player2Id);
    }
  }
  return ids;
}

function assignRanksFromEliminations(eliminationGroups: string[][], totalPlayers: number): { rankByPlayer: Map<string, RankInfo> } {
  const rankByPlayer = new Map<string, RankInfo>();
  let current = totalPlayers;

  for (const group of eliminationGroups) {
    if (group.length === 0) continue;
    const rankStart = current - group.length + 1;
    const rankEnd = current;
    for (const playerId of group) {
      rankByPlayer.set(playerId, { rankStart, rankEnd });
    }
    current = rankStart - 1;
  }

  return { rankByPlayer };
}

export function sortResults(results: RankedResult[]): RankedResult[] {
  return [...results].toSorted((a, b) => {
    const aRank = a.rankStart ?? Number.POSITIVE_INFINITY;
    const bRank = b.rankStart ?? Number.POSITIVE_INFINITY;
    if (aRank !== bRank) return aRank - bRank;
    const aEnd = a.rankEnd ?? Number.POSITIVE_INFINITY;
    const bEnd = b.rankEnd ?? Number.POSITIVE_INFINITY;
    if (aEnd !== bEnd) return aEnd - bEnd;
    return a.name.localeCompare(b.name);
  });
}

export function offsetResults(results: RankedResult[], offset: number): RankedResult[] {
  if (!offset) return results;
  return results.map((row) => {
    if (row.rankStart == null || row.rankEnd == null) return row;
    return {
      ...row,
      rankStart: row.rankStart + offset,
      rankEnd: row.rankEnd + offset,
    };
  });
}

export function buildBracketResults(bracket: Bracket | null, players: Player[]): RankedResult[] {
  if (!bracket) return [];
  const playerById = new Map(players.map((player) => [player.id, player]));
  const playerIds = [...collectBracketPlayerIds(bracket)];
  const eliminatedByRound: string[][] = [];
  const eliminated = new Set<string>();

  for (const [roundIndex, round] of bracket.rounds.entries()) {
    const roundElims: string[] = [];
    for (const match of round) {
      if (!match.winnerId) continue;
      if (!match.player1Id || !match.player2Id) continue;
      const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
      if (!eliminated.has(loserId)) {
        eliminated.add(loserId);
        roundElims.push(loserId);
      }
    }
    eliminatedByRound[roundIndex] = roundElims;
  }

  const { rankByPlayer } = assignRanksFromEliminations(eliminatedByRound, playerIds.length);
  const winnerId = getBracketWinner(bracket);
  if (winnerId) {
    rankByPlayer.set(winnerId, { rankStart: 1, rankEnd: 1 });
  }

  // Override 3rd/4th place ranks if the 3rd place match has been played
  if (bracket.thirdPlaceMatch?.winnerId) {
    const tpm = bracket.thirdPlaceMatch;
    const thirdPlaceLoserId = tpm.winnerId === tpm.player1Id ? tpm.player2Id : tpm.player1Id;
    if (tpm.winnerId) rankByPlayer.set(tpm.winnerId, { rankStart: 3, rankEnd: 3 });
    if (thirdPlaceLoserId) rankByPlayer.set(thirdPlaceLoserId, { rankStart: 4, rankEnd: 4 });
  }

  const rows: RankedResult[] = playerIds.map((playerId) => {
    const player = playerById.get(playerId);
    return {
      playerId,
      name: player?.name ?? playerId,
      ...rankByPlayer.get(playerId),
    };
  });

  return sortResults(rows);
}

function collectDoubleElimPlayerIds(doubleElim: DoubleElim | null): Set<string> {
  const ids = new Set<string>();
  if (!doubleElim) return ids;
  for (const round of doubleElim.winners.rounds) {
    for (const match of round) {
      if (match.player1Id) ids.add(match.player1Id);
      if (match.player2Id) ids.add(match.player2Id);
    }
  }
  for (const round of doubleElim.losers.rounds) {
    for (const match of round) {
      if (match.player1Id) ids.add(match.player1Id);
      if (match.player2Id) ids.add(match.player2Id);
    }
  }
  const finals = doubleElim.finals;
  if (finals.grandFinal.player1Id) ids.add(finals.grandFinal.player1Id);
  if (finals.grandFinal.player2Id) ids.add(finals.grandFinal.player2Id);
  if (finals.resetFinal.player1Id) ids.add(finals.resetFinal.player1Id);
  if (finals.resetFinal.player2Id) ids.add(finals.resetFinal.player2Id);
  return ids;
}

export function buildDoubleElimResults(doubleElim: DoubleElim | null, players: Player[]): RankedResult[] {
  if (!doubleElim) return [];
  const playerById = new Map(players.map((player) => [player.id, player]));
  const playerIds = [...collectDoubleElimPlayerIds(doubleElim)];
  const losses = new Map(playerIds.map((id) => [id, 0]));
  const eliminated = new Set<string>();
  const losersRounds = doubleElim.losers.rounds;
  const eliminationGroups: string[][] = Array.from({ length: losersRounds.length + 2 }, () => []);

  const recordLoss = (match: Match | undefined | null): void => {
    if (!match?.winnerId) return;
    if (!match.player1Id || !match.player2Id) return;
    const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
    losses.set(loserId, (losses.get(loserId) ?? 0) + 1);
  };

  const recordElimination = (match: Match | undefined | null, stageIndex: number): void => {
    if (!match?.winnerId) return;
    if (!match.player1Id || !match.player2Id) return;
    const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
    if (eliminated.has(loserId)) return;
    const nextLoss = (losses.get(loserId) ?? 0) + 1;
    losses.set(loserId, nextLoss);
    if (nextLoss >= 2) {
      const group = eliminationGroups[stageIndex];
      if (group) group.push(loserId);
      eliminated.add(loserId);
    }
  };

  for (const round of doubleElim.winners.rounds) {
    for (const match of round) {
      recordLoss(match);
    }
  }

  for (const [roundIndex, round] of losersRounds.entries()) {
    for (const match of round) { recordElimination(match, roundIndex); }
  }

  const finalsStage = losersRounds.length;
  recordElimination(doubleElim.finals.grandFinal, finalsStage);
  recordElimination(doubleElim.finals.resetFinal, finalsStage + 1);

  const { rankByPlayer } = assignRanksFromEliminations(eliminationGroups, playerIds.length);
  const winnerId = getDoubleElimWinner(doubleElim);
  if (winnerId) {
    rankByPlayer.set(winnerId, { rankStart: 1, rankEnd: 1 });
  }

  const rows: RankedResult[] = playerIds.map((playerId) => {
    const player = playerById.get(playerId);
    return {
      playerId,
      name: player?.name ?? playerId,
      ...rankByPlayer.get(playerId),
    };
  });

  return sortResults(rows);
}
