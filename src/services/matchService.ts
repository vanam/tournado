import { getDatabase } from '../db';
import { syncGroupStageParticipants, GroupStageSyncBlockedError } from './groupStageService';
import {
  findBracketMatch,
  findDoubleElimMatch,
  findGroupMatch,
} from '../utils/matchFinders';
import {
  advanceWinner,
  canEditMatch,
  clearMatchResult,
} from '../utils/bracketUtils';
import {
  advanceDoubleElim,
  canEditDoubleElimMatch,
  clearDoubleElimMatch,
} from '../utils/doubleElimUtils';
import { updateTournamentStatus } from '../utils/tournamentStatus';
import { getScoreWinner } from '../utils/scoreUtils';
import { DEFAULT_MAX_SETS } from '../constants';
import { Format, ScoreMode } from '../types';
import type { Match, SetScore, GroupStagePlayoffs, Tournament } from '../types';

export type PlayoffSection = Exclude<keyof GroupStagePlayoffs, 'bracketType'>;

function findMatchInSchedule(
  schedule: { rounds: Array<{ matches: Match[] }> },
  matchId: string,
): Match | null {
  for (const round of schedule.rounds) {
    const match = round.matches.find((m) => m.id === matchId);
    if (match) return match;
  }
  return null;
}

function determineWinner(winnerIndex: 1 | 2, player1Id: string, player2Id: string): string {
  return winnerIndex === 1 ? player1Id : player2Id;
}

function applyScheduleScore(
  schedule: { rounds: Array<{ matches: Match[] }> },
  matchId: string,
  setScores: SetScore[],
  walkover: boolean,
  winnerIndex: 1 | 2,
): void {
  const match = findMatchInSchedule(schedule, matchId);
  if (match === null) throw new Error(`Match ${matchId} not found`);
  if (match.player1Id === null || match.player2Id === null) {
    throw new Error('Match does not have both players assigned');
  }
  match.scores = setScores;
  match.walkover = walkover;
  match.winnerId = determineWinner(winnerIndex, match.player1Id, match.player2Id);
}

function clearScheduleScore(
  schedule: { rounds: Array<{ matches: Match[] }> },
  matchId: string,
): void {
  const match = findMatchInSchedule(schedule, matchId);
  if (match === null) throw new Error(`Match ${matchId} not found`);
  match.winnerId = null;
  match.scores = [];
  match.walkover = false;
}

function recordPlayoffScore(
  playoffs: GroupStagePlayoffs,
  matchId: string,
  setScores: SetScore[],
  walkover: boolean,
  winnerIndex: 1 | 2,
  section?: PlayoffSection,
): void {
  if ((!section || section === 'mainBracket') && playoffs.mainBracket) {
    const match = findBracketMatch(playoffs.mainBracket, matchId);
    if (
      match?.player1Id !== null &&
      match?.player2Id !== null &&
      match !== null
    ) {
      const winnerId = determineWinner(
        winnerIndex,
        match.player1Id,
        match.player2Id,
      );
      advanceWinner(
        playoffs.mainBracket,
        matchId,
        winnerId,
        setScores,
        walkover,
      );
      return;
    }
  }
  if ((!section || section === 'mainDoubleElim') && playoffs.mainDoubleElim) {
    const match = findDoubleElimMatch(playoffs.mainDoubleElim, matchId);
    if (
      match?.player1Id !== null &&
      match?.player2Id !== null &&
      match !== null
    ) {
      const winnerId = determineWinner(
        winnerIndex,
        match.player1Id,
        match.player2Id,
      );
      advanceDoubleElim(
        playoffs.mainDoubleElim,
        matchId,
        winnerId,
        setScores,
        walkover,
      );
      return;
    }
  }
  if (
    (!section || section === 'consolationBracket') &&
    playoffs.consolationBracket
  ) {
    const match = findBracketMatch(playoffs.consolationBracket, matchId);
    if (
      match?.player1Id !== null &&
      match?.player2Id !== null &&
      match !== null
    ) {
      const winnerId = determineWinner(
        winnerIndex,
        match.player1Id,
        match.player2Id,
      );
      advanceWinner(
        playoffs.consolationBracket,
        matchId,
        winnerId,
        setScores,
        walkover,
      );
      return;
    }
  }
  if (
    (!section || section === 'consolationDoubleElim') &&
    playoffs.consolationDoubleElim
  ) {
    const match = findDoubleElimMatch(playoffs.consolationDoubleElim, matchId);
    if (
      match?.player1Id !== null &&
      match?.player2Id !== null &&
      match !== null
    ) {
      const winnerId = determineWinner(
        winnerIndex,
        match.player1Id,
        match.player2Id,
      );
      advanceDoubleElim(
        playoffs.consolationDoubleElim,
        matchId,
        winnerId,
        setScores,
        walkover,
      );
      return;
    }
  }
  throw new Error(`Match ${matchId} not found in playoffs`);
}

function clearPlayoffScore(
  playoffs: GroupStagePlayoffs,
  matchId: string,
  section?: PlayoffSection,
): void {
  if (
    (!section || section === 'mainBracket') &&
    playoffs.mainBracket &&
    findBracketMatch(playoffs.mainBracket, matchId) !== null
  ) {
    clearMatchResult(playoffs.mainBracket, matchId);
    return;
  }
  if (
    (!section || section === 'mainDoubleElim') &&
    playoffs.mainDoubleElim &&
    findDoubleElimMatch(playoffs.mainDoubleElim, matchId) !== null
  ) {
    clearDoubleElimMatch(playoffs.mainDoubleElim, matchId);
    return;
  }
  if (
    (!section || section === 'consolationBracket') &&
    playoffs.consolationBracket &&
    findBracketMatch(playoffs.consolationBracket, matchId) !== null
  ) {
    clearMatchResult(playoffs.consolationBracket, matchId);
    return;
  }
  if (
    (!section || section === 'consolationDoubleElim') &&
    playoffs.consolationDoubleElim &&
    findDoubleElimMatch(playoffs.consolationDoubleElim, matchId) !== null
  ) {
    clearDoubleElimMatch(playoffs.consolationDoubleElim, matchId);
    return;
  }
  throw new Error(`Match ${matchId} not found in playoffs`);
}

function checkGroupStageEditable(
  tournament: {
    groupStagePlayoffs?: GroupStagePlayoffs | null;
    groupStageBrackets?: GroupStagePlayoffs | null;
  },
  matchId: string,
): boolean {
  const playoffs =
    tournament.groupStagePlayoffs ?? tournament.groupStageBrackets;
  if (playoffs == null) {
    return true;
  }
  if (
    playoffs.mainBracket &&
    findBracketMatch(playoffs.mainBracket, matchId) !== null
  ) {
    return canEditMatch(playoffs.mainBracket, matchId);
  }
  if (
    playoffs.mainDoubleElim &&
    findDoubleElimMatch(playoffs.mainDoubleElim, matchId) !== null
  ) {
    return canEditDoubleElimMatch(playoffs.mainDoubleElim, matchId);
  }
  if (
    playoffs.consolationBracket &&
    findBracketMatch(playoffs.consolationBracket, matchId) !== null
  ) {
    return canEditMatch(playoffs.consolationBracket, matchId);
  }
  if (
    playoffs.consolationDoubleElim &&
    findDoubleElimMatch(playoffs.consolationDoubleElim, matchId) !== null
  ) {
    return canEditDoubleElimMatch(playoffs.consolationDoubleElim, matchId);
  }
  return true;
}

export async function recordScore(
  tournamentId: string,
  matchId: string,
  scores: SetScore[],
  walkover: boolean = false,
  groupId?: string,
  section?: PlayoffSection,
): Promise<Tournament> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const saved = await doc.incrementalModify((tournament) => {
    if (!Array.isArray(scores) || scores.length === 0) {
      throw new Error('Scores array is required');
    }

    let maxSets = tournament.maxSets;
    if (tournament.format === Format.GROUPS_TO_BRACKET) {
      maxSets = (groupId ? tournament.groupStageMaxSets : tournament.bracketMaxSets) ?? maxSets;
    }
    const winnerIndex = getScoreWinner(scores, {
      scoringMode: tournament.scoringMode ?? ScoreMode.SETS,
      maxSets: maxSets ?? DEFAULT_MAX_SETS,
    });
    if (!winnerIndex) throw new Error('Scores must be valid and have a decisive winner');
    const setScores: SetScore[] = scores.map(([a, b]) => [a, b]);

    switch (tournament.format) {
      case Format.SINGLE_ELIM: {
        const match = findBracketMatch(tournament.bracket, matchId);
        if (match === null) throw new Error(`Match ${matchId} not found`);
        if (match.player1Id === null || match.player2Id === null) {
          throw new Error('Match does not have both players assigned');
        }
        const winnerId = determineWinner(
          winnerIndex,
          match.player1Id,
          match.player2Id,
        );
        advanceWinner(
          tournament.bracket,
          matchId,
          winnerId,
          setScores,
          walkover,
        );
        break;
      }
      case Format.DOUBLE_ELIM: {
        const match = findDoubleElimMatch(tournament.doubleElim, matchId);
        if (match === null) throw new Error(`Match ${matchId} not found`);
        if (match.player1Id === null || match.player2Id === null) {
          throw new Error('Match does not have both players assigned');
        }
        const winnerId = determineWinner(
          winnerIndex,
          match.player1Id,
          match.player2Id,
        );
        advanceDoubleElim(
          tournament.doubleElim,
          matchId,
          winnerId,
          setScores,
          walkover,
        );
        break;
      }
      case Format.ROUND_ROBIN: {
        applyScheduleScore(tournament.schedule, matchId, setScores, walkover, winnerIndex);
        break;
      }
      case Format.SWISS: {
        applyScheduleScore(tournament.schedule, matchId, setScores, walkover, winnerIndex);
        break;
      }
      case Format.GROUPS_TO_BRACKET: {
        if (groupId) {
          const match = findGroupMatch(tournament.groupStage, groupId, matchId);
          if (match === null)
            throw new Error(`Match ${matchId} not found in group ${groupId}`);
          if (match.player1Id === null || match.player2Id === null) {
            throw new Error('Match does not have both players assigned');
          }
          match.scores = setScores;
          match.walkover = walkover;
          match.winnerId = determineWinner(
            winnerIndex,
            match.player1Id,
            match.player2Id,
          );
        } else {
          const playoffs =
            tournament.groupStagePlayoffs ?? tournament.groupStageBrackets;
          if (playoffs == null) {
            throw new Error('Playoffs not yet generated');
          }
          recordPlayoffScore(playoffs, matchId, setScores, walkover, winnerIndex, section);
        }
        break;
      }
    }

    if (tournament.format === Format.GROUPS_TO_BRACKET && groupId && syncGroupStageParticipants(tournament).blocked) throw new GroupStageSyncBlockedError();
    updateTournamentStatus(tournament);
    return tournament;
  });
  return saved.toMutableJSON();
}

export async function clearScore(
  tournamentId: string,
  matchId: string,
  groupId?: string,
  section?: PlayoffSection,
): Promise<Tournament> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const saved = await doc.incrementalModify((tournament) => {
    switch (tournament.format) {
      case Format.SINGLE_ELIM: {
        clearMatchResult(tournament.bracket, matchId);
        break;
      }
      case Format.DOUBLE_ELIM: {
        clearDoubleElimMatch(tournament.doubleElim, matchId);
        break;
      }
      case Format.ROUND_ROBIN: {
        clearScheduleScore(tournament.schedule, matchId);
        break;
      }
      case Format.SWISS: {
        clearScheduleScore(tournament.schedule, matchId);
        break;
      }
      case Format.GROUPS_TO_BRACKET: {
        if (groupId) {
          const match = findGroupMatch(tournament.groupStage, groupId, matchId);
          if (match === null)
            throw new Error(`Match ${matchId} not found in group ${groupId}`);
          match.winnerId = null;
          match.scores = [];
          match.walkover = false;
        } else {
          const playoffs =
            tournament.groupStagePlayoffs ?? tournament.groupStageBrackets;
          if (playoffs == null) {
            throw new Error('Playoffs not yet generated');
          }
          clearPlayoffScore(playoffs, matchId, section);
        }
        break;
      }
    }

    if (tournament.format === Format.GROUPS_TO_BRACKET && groupId && syncGroupStageParticipants(tournament).blocked) throw new GroupStageSyncBlockedError();
    updateTournamentStatus(tournament);
    return tournament;
  });
  return saved.toMutableJSON();
}

export async function isMatchEditable(
  tournamentId: string,
  matchId: string,
): Promise<boolean> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  let editable = false;

  switch (tournament.format) {
    case Format.SINGLE_ELIM: {
      editable = canEditMatch(tournament.bracket, matchId);
      break;
    }
    case Format.DOUBLE_ELIM: {
      editable = canEditDoubleElimMatch(tournament.doubleElim, matchId);
      break;
    }
    case Format.ROUND_ROBIN:
    case Format.SWISS: {
      editable = true;
      break;
    }
    case Format.GROUPS_TO_BRACKET: {
      editable = checkGroupStageEditable(tournament, matchId);
      break;
    }
  }

  return editable;
}
