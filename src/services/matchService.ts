import { getDatabase } from '../db';
import { planMatchChange, requiresHistoryConfirmation } from '../utils/matchChanges';
import type { MatchChange, MatchChangeImpact, PlayoffSection } from '../utils/matchChanges';
import type { SetScore, Tournament } from '../types';
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
