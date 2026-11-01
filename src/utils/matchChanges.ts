import { getTournamentPlayoffs, normalizeTournament } from './tournamentCompatibility';
import { Format, ScoreMode } from '../types';
import type { Bracket, DoubleElim, GroupStagePlayoffs, Match, SetScore, Tournament } from '../types';
import { DEFAULT_MAX_SETS } from '../constants';
import { getScoreWinner } from './scoreUtils';
import { replayElimination } from './replayElimination';
import { reseedPlayoffs } from './playoffLifecycle';
import { updateTournamentStatus } from './tournamentStatus';

export type PlayoffSection = Exclude<keyof GroupStagePlayoffs, 'bracketType'>;
export interface MatchTarget { matchId: string; groupId?: string; section?: PlayoffSection; expectedPlayers?: [string | null, string | null] }
export type MatchChange = (MatchTarget & ({ type: 'score'; scores: SetScore[]; walkover: boolean } | { type: 'clear' })) | { type: 'reseed' };
export class MatchParticipantsChangedError extends Error {
  constructor() {
    super('Match participants changed while the score editor was open');
    this.name = 'MatchParticipantsChangedError';
  }
}
export interface LocatedMatch {
  key: string;
  match: Match;
  stage: string;
  round: number;
  section?: PlayoffSection;
  groupId?: string;
  groupName?: string;
  elimination?: Bracket | DoubleElim;
}
export interface MatchChangeImpact {
  token: string;
  deletedResults: LocatedMatch[];
  changedMatches: LocatedMatch[];
  removedRounds: number[];
  previousWinnerId: string | null;
  nextWinnerId: string | null;
  reopens: boolean;
}

function bracketMatches(bracket: Bracket | DoubleElim, scope: string, section?: PlayoffSection): LocatedMatch[] {
  const rows: LocatedMatch[] = [];
  const add = (match: Match, stage: string, round: number): void => {
    if (!match.dummy) rows.push({ key: `${scope}/${match.id}`, match, stage, round, elimination: bracket, ...(section && { section }) });
  };
  const addRounds = (value: Bracket, stage?: string): void => {
    for (const [r, round] of value.rounds.entries()) {
      const remaining = value.rounds.length - r;
      const label = stage ?? (remaining > 3 ? 'bracket.round' : ['bracket.round', 'bracket.final', 'bracket.semifinals', 'bracket.quarterfinals'][remaining] ?? 'bracket.round');
      for (const match of round) add(match, label, r + 1);
    }
  };
  if ('winners' in bracket) {
    addRounds(bracket.winners, 'doubleElim.winnersBracket');
    addRounds(bracket.losers, 'doubleElim.losersBracket');
    add(bracket.finals.grandFinal, 'doubleElim.grandFinal', 0);
    add(bracket.finals.resetFinal, 'doubleElim.resetFinal', 0);
  } else {
    addRounds(bracket);
    if (bracket.thirdPlaceMatch) add(bracket.thirdPlaceMatch, 'bracket.thirdPlace', 0);
  }
  return rows;
}

export function listTournamentMatches(tournament: Tournament): LocatedMatch[] {
  if (tournament.format === Format.SINGLE_ELIM) return bracketMatches(tournament.bracket, 'single');
  if (tournament.format === Format.DOUBLE_ELIM) return bracketMatches(tournament.doubleElim, 'double');
  if (tournament.format === Format.GROUPS_TO_BRACKET) {
    const rows = tournament.groupStage.groups.flatMap((group) => group.schedule.rounds.flatMap((round) => round.matches.map((match) => ({
      key: `group/${group.id}/${match.id}`, match, stage: 'roundRobin.round', round: round.roundNumber, groupId: group.id, groupName: group.name,
    }))));
    const result: LocatedMatch[] = [...rows];
    const playoffs = getTournamentPlayoffs(tournament);
    if (playoffs) for (const section of ['mainBracket', 'consolationBracket', 'mainDoubleElim', 'consolationDoubleElim'] as const) {
      const bracket = playoffs[section];
      if (bracket) result.push(...bracketMatches(bracket, section, section));
    }
    return result;
  }
  const stage = tournament.format === Format.SWISS ? 'swiss.round' : 'roundRobin.round';
  return tournament.schedule.rounds.flatMap((round) => round.matches.map((match) => ({ key: `schedule/${match.id}`, match, stage, round: round.roundNumber })));
}

/** Resolves the same scoped target for editing, impact planning and saving. */
export function findTournamentMatch(tournament: Tournament, target: MatchTarget): LocatedMatch | undefined {
  return listTournamentMatches(tournament).find((entry) => entry.match.id === target.matchId
    && entry.groupId === target.groupId && (!target.section || entry.section === target.section));
}

export function getMatchScoring(tournament: Tournament, target: Pick<MatchTarget, 'groupId'>): { scoringMode: ScoreMode; maxSets: number } {
  let maxSets = tournament.maxSets;
  if (tournament.format === Format.GROUPS_TO_BRACKET) maxSets = (target.groupId ? tournament.groupStageMaxSets : tournament.bracketMaxSets) ?? maxSets;
  return { scoringMode: tournament.scoringMode ?? ScoreMode.SETS, maxSets: maxSets ?? DEFAULT_MAX_SETS };
}

function applyScoreChange(tournament: Tournament, row: LocatedMatch, change: Exclude<MatchChange, { type: 'reseed' }>, removedRounds: number[]): { previousWinnerId: string | null; nextWinnerId: string | null } {
  const { match } = row;

  const previousWinnerId = match.winnerId;
  let nextWinnerId: string | null = null;
  let scores: SetScore[] = [];
  let walkover = false;
  if (change.type === 'score') {
    if (!match.player1Id || !match.player2Id) throw new Error('Match does not have both players assigned');
    const side = getScoreWinner(change.scores, getMatchScoring(tournament, row));
    if (!side) throw new Error('Scores must be valid and have a decisive winner');
    nextWinnerId = side === 1 ? match.player1Id : match.player2Id;
    scores = change.scores.map(([a, b]) => [a, b]);
    walkover = change.walkover;
  }
  const result = { matchId: match.id, winnerId: nextWinnerId, scores, walkover };
  if (row.elimination) replayElimination(row.elimination, result);
  else Object.assign(match, { winnerId: nextWinnerId, scores, walkover });
  if (previousWinnerId !== nextWinnerId) {
    if (tournament.format === Format.SWISS && previousWinnerId) {
      removedRounds.push(...tournament.schedule.rounds.filter((round) => round.roundNumber > row.round).map((round) => round.roundNumber));
      tournament.schedule.rounds = tournament.schedule.rounds.filter((round) => round.roundNumber <= row.round);
    }
    if (tournament.format === Format.GROUPS_TO_BRACKET && row.groupId) reseedPlayoffs(tournament);
  }
  return { previousWinnerId, nextWinnerId };
}

/** Plans and applies on a private copy. The same plan drives the warning and the atomic write. */
export function planMatchChange(original: Tournament, change: MatchChange): { tournament: Tournament; impact: MatchChangeImpact } {
  const tournament = normalizeTournament(structuredClone(original));
  const before = listTournamentMatches(original);
  let editedKey: string | undefined;
  let previousWinnerId: string | null = null;
  let nextWinnerId: string | null = null;
  const removedRounds: number[] = [];
  if (change.type === 'reseed') {
    if (tournament.format !== Format.GROUPS_TO_BRACKET) throw new Error('Only group playoffs can be reseeded');
    reseedPlayoffs(tournament);
  } else {
    const row = findTournamentMatch(tournament, change);
    if (!row) throw new Error('Match not found');
    if (change.expectedPlayers && (row.match.player1Id !== change.expectedPlayers[0] || row.match.player2Id !== change.expectedPlayers[1])) throw new MatchParticipantsChangedError();
    editedKey = row.key;
    ({ previousWinnerId, nextWinnerId } = applyScoreChange(tournament, row, change, removedRounds));
  }
  updateTournamentStatus(tournament);
  const after = new Map(listTournamentMatches(tournament).map((row) => [row.key, row.match]));
  const changed = before.filter((row) => {
    if (row.key === editedKey) return false;
    const match = after.get(row.key);
    if (!match) return true;
    return match.player1Id !== row.match.player1Id || match.player2Id !== row.match.player2Id || match.winnerId !== row.match.winnerId;
  });
  const deletedResults = changed.filter(({ match }) => !match.dummy && match.player1Id && match.player2Id && match.winnerId);
  const changedMatches = changed.filter((row) => !deletedResults.includes(row));
  const impact: MatchChangeImpact = { token: JSON.stringify({ change, before: before.map((row) => matchSnapshot(row)), after: listTournamentMatches(tournament).map((row) => matchSnapshot(row)), removedRounds }), deletedResults, changedMatches, removedRounds,
    previousWinnerId, nextWinnerId, reopens: !!original.completedAt && !tournament.completedAt };
  return { tournament, impact };
}

export function requiresHistoryConfirmation(impact: MatchChangeImpact): boolean {
  return impact.deletedResults.length > 0 || impact.removedRounds.length > 0;
}

function matchSnapshot({ key, match }: LocatedMatch): unknown[] {
  return [key, match.player1Id, match.player2Id, match.winnerId, match.scores, match.walkover];
}
