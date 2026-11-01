import { getDatabase } from '../db';
import { findBracketMatch, findDoubleElimMatch } from '../utils/matchFinders';
import { canEditMatch } from '../utils/bracketUtils';
import { canEditDoubleElimMatch } from '../utils/doubleElimUtils';
import { planMatchChange, requiresHistoryConfirmation } from '../utils/matchChanges';
import type { MatchChange, MatchChangeImpact, PlayoffSection } from '../utils/matchChanges';
import { Format } from '../types';
import type { GroupStagePlayoffs, SetScore, Tournament } from '../types';
export type { PlayoffSection } from '../utils/matchChanges';

export class HistoryConfirmationRequiredError extends Error {
  constructor(readonly impact: MatchChangeImpact) {
    super('Confirm the current impact before deleting dependent results');
    this.name = 'HistoryConfirmationRequiredError';
  }
}

/** Replans against the latest document before saving the edit and all dependent invalidations atomically. */
export async function saveMatchChange(tournamentId: string, change: MatchChange, confirmedToken?: string): Promise<Tournament> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);
  const saved = await doc.incrementalModify((current) => {
    const { tournament, impact } = planMatchChange(current, change);
    if ((confirmedToken !== undefined || requiresHistoryConfirmation(impact)) && confirmedToken !== impact.token) {
      throw new HistoryConfirmationRequiredError(impact);
    }
    return tournament;
  });
  return saved.toMutableJSON();
}

export async function recordScore(tournamentId: string, matchId: string, scores: SetScore[], walkover = false,
  groupId?: string, section?: PlayoffSection): Promise<Tournament> {
  return saveMatchChange(tournamentId, { type: 'score', matchId, scores, walkover,
    ...(groupId && { groupId }), ...(section && { section }) });
}

export async function clearScore(tournamentId: string, matchId: string, groupId?: string, section?: PlayoffSection): Promise<Tournament> {
  return saveMatchChange(tournamentId, { type: 'clear', matchId, ...(groupId && { groupId }), ...(section && { section }) });
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
