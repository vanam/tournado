import { getDatabase } from '../db';
import { findBracketMatch, findDoubleElimMatch, findGroupMatch } from '../utils/matchFinders';
import { advanceWinner, canEditMatch, clearMatchResult } from '../utils/bracketUtils';
import { advanceDoubleElim, canEditDoubleElimMatch, clearDoubleElimMatch } from '../utils/doubleElimUtils';
import { Format } from '../types';
import type { Match, SetScore, GroupStagePlayoffs, Tournament } from '../types';

function findMatchInSchedule(
  schedule: { rounds: Array<{ matches: Match[] }> },
  matchId: string
): Match | null {
  for (const round of schedule.rounds) {
    const match = round.matches.find((m) => m.id === matchId);
    if (match) return match;
  }
  return null;
}

function determineWinner(scores: SetScore[], player1Id: string, player2Id: string): string {
  let p1Wins = 0;
  let p2Wins = 0;
  for (const [s1, s2] of scores) {
    if (s1 > s2) p1Wins++;
    else if (s2 > s1) p2Wins++;
  }
  return p1Wins >= p2Wins ? player1Id : player2Id;
}

function applyScheduleScore(
  schedule: { rounds: Array<{ matches: Match[] }> },
  matchId: string,
  setScores: SetScore[],
  walkover: boolean
): void {
  const match = findMatchInSchedule(schedule, matchId);
  if (match === null) throw new Error(`Match ${matchId} not found`);
  if (match.player1Id === null || match.player2Id === null) {
    throw new Error('Match does not have both players assigned');
  }
  match.scores = setScores;
  match.walkover = walkover;
  match.winnerId = determineWinner(setScores, match.player1Id, match.player2Id);
}

function clearScheduleScore(
  schedule: { rounds: Array<{ matches: Match[] }> },
  matchId: string
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
  walkover: boolean
): void {
  if (playoffs.mainBracket) {
    const match = findBracketMatch(playoffs.mainBracket, matchId);
    if (match?.player1Id !== null && match?.player2Id !== null && match !== null) {
      const winnerId = determineWinner(setScores, match.player1Id, match.player2Id);
      advanceWinner(playoffs.mainBracket, matchId, winnerId, setScores, walkover);
      return;
    }
  }
  if (playoffs.mainDoubleElim) {
    const match = findDoubleElimMatch(playoffs.mainDoubleElim, matchId);
    if (match?.player1Id !== null && match?.player2Id !== null && match !== null) {
      const winnerId = determineWinner(setScores, match.player1Id, match.player2Id);
      advanceDoubleElim(playoffs.mainDoubleElim, matchId, winnerId, setScores, walkover);
      return;
    }
  }
  if (playoffs.consolationBracket) {
    const match = findBracketMatch(playoffs.consolationBracket, matchId);
    if (match?.player1Id !== null && match?.player2Id !== null && match !== null) {
      const winnerId = determineWinner(setScores, match.player1Id, match.player2Id);
      advanceWinner(playoffs.consolationBracket, matchId, winnerId, setScores, walkover);
      return;
    }
  }
  if (playoffs.consolationDoubleElim) {
    const match = findDoubleElimMatch(playoffs.consolationDoubleElim, matchId);
    if (match?.player1Id !== null && match?.player2Id !== null && match !== null) {
      const winnerId = determineWinner(setScores, match.player1Id, match.player2Id);
      advanceDoubleElim(playoffs.consolationDoubleElim, matchId, winnerId, setScores, walkover);
      return;
    }
  }
  throw new Error(`Match ${matchId} not found in playoffs`);
}

function clearPlayoffScore(playoffs: GroupStagePlayoffs, matchId: string): void {
  if (playoffs.mainBracket && findBracketMatch(playoffs.mainBracket, matchId) !== null) {
    clearMatchResult(playoffs.mainBracket, matchId);
    return;
  }
  if (playoffs.mainDoubleElim && findDoubleElimMatch(playoffs.mainDoubleElim, matchId) !== null) {
    clearDoubleElimMatch(playoffs.mainDoubleElim, matchId);
    return;
  }
  if (playoffs.consolationBracket && findBracketMatch(playoffs.consolationBracket, matchId) !== null) {
    clearMatchResult(playoffs.consolationBracket, matchId);
    return;
  }
  if (playoffs.consolationDoubleElim && findDoubleElimMatch(playoffs.consolationDoubleElim, matchId) !== null) {
    clearDoubleElimMatch(playoffs.consolationDoubleElim, matchId);
    return;
  }
  throw new Error(`Match ${matchId} not found in playoffs`);
}

function checkGroupStageEditable(
  tournament: { groupStagePlayoffs?: GroupStagePlayoffs | null; groupStageBrackets?: GroupStagePlayoffs | null },
  matchId: string
): boolean {
  const playoffs = tournament.groupStagePlayoffs ?? tournament.groupStageBrackets;
  if (playoffs == null) {
    return true;
  }
  if (playoffs.mainBracket && findBracketMatch(playoffs.mainBracket, matchId) !== null) {
    return canEditMatch(playoffs.mainBracket, matchId);
  }
  if (playoffs.mainDoubleElim && findDoubleElimMatch(playoffs.mainDoubleElim, matchId) !== null) {
    return canEditDoubleElimMatch(playoffs.mainDoubleElim, matchId);
  }
  if (playoffs.consolationBracket && findBracketMatch(playoffs.consolationBracket, matchId) !== null) {
    return canEditMatch(playoffs.consolationBracket, matchId);
  }
  if (playoffs.consolationDoubleElim && findDoubleElimMatch(playoffs.consolationDoubleElim, matchId) !== null) {
    return canEditDoubleElimMatch(playoffs.consolationDoubleElim, matchId);
  }
  return true;
}

export async function recordScore(
  tournamentId: string,
  matchId: string,
  scores: SetScore[],
  walkover: boolean = false,
  groupId?: string
): Promise<Tournament> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();

  if (!Array.isArray(scores) || scores.length === 0) {
    throw new Error('Scores array is required');
  }

  const setScores: SetScore[] = scores.map(([a, b]) => [a, b]);

  switch (tournament.format) {
    case Format.SINGLE_ELIM: {
      const match = findBracketMatch(tournament.bracket, matchId);
      if (match === null) throw new Error(`Match ${matchId} not found`);
      if (match.player1Id === null || match.player2Id === null) {
        throw new Error('Match does not have both players assigned');
      }
      const winnerId = determineWinner(setScores, match.player1Id, match.player2Id);
      advanceWinner(tournament.bracket, matchId, winnerId, setScores, walkover);
      break;
    }
    case Format.DOUBLE_ELIM: {
      const match = findDoubleElimMatch(tournament.doubleElim, matchId);
      if (match === null) throw new Error(`Match ${matchId} not found`);
      if (match.player1Id === null || match.player2Id === null) {
        throw new Error('Match does not have both players assigned');
      }
      const winnerId = determineWinner(setScores, match.player1Id, match.player2Id);
      advanceDoubleElim(tournament.doubleElim, matchId, winnerId, setScores, walkover);
      break;
    }
    case Format.ROUND_ROBIN: {
      applyScheduleScore(tournament.schedule, matchId, setScores, walkover);
      break;
    }
    case Format.SWISS: {
      applyScheduleScore(tournament.schedule, matchId, setScores, walkover);
      break;
    }
    case Format.GROUPS_TO_BRACKET: {
      if (groupId) {
        const match = findGroupMatch(tournament.groupStage, groupId, matchId);
        if (match === null) throw new Error(`Match ${matchId} not found in group ${groupId}`);
        if (match.player1Id === null || match.player2Id === null) {
          throw new Error('Match does not have both players assigned');
        }
        match.scores = setScores;
        match.walkover = walkover;
        match.winnerId = determineWinner(setScores, match.player1Id, match.player2Id);
      } else {
        const playoffs = tournament.groupStagePlayoffs ?? tournament.groupStageBrackets;
        if (playoffs == null) {
          throw new Error('Playoffs not yet generated');
        }
        recordPlayoffScore(playoffs, matchId, setScores, walkover);
      }
      break;
    }
  }

  await doc.incrementalModify(() => tournament);
  return tournament;
}

export async function clearScore(
  tournamentId: string,
  matchId: string,
  groupId?: string
): Promise<Tournament> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();

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
        if (match === null) throw new Error(`Match ${matchId} not found in group ${groupId}`);
        match.winnerId = null;
        match.scores = [];
        match.walkover = false;
      } else {
        const playoffs = tournament.groupStagePlayoffs ?? tournament.groupStageBrackets;
        if (playoffs == null) {
          throw new Error('Playoffs not yet generated');
        }
        clearPlayoffScore(playoffs, matchId);
      }
      break;
    }
  }

  await doc.incrementalModify(() => tournament);
  return tournament;
}

export async function isMatchEditable(
  tournamentId: string,
  matchId: string
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
