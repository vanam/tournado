import { getDatabase } from '../db';
import { generateNextSwissRound, isCurrentRoundComplete } from '../utils/swissUtils';
import { Format } from '../types';
import type { Tournament } from '../types';

export async function generateNextRound(tournamentId: string): Promise<Tournament> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  if (tournament.format !== Format.SWISS) {
    throw new Error('Tournament is not a Swiss format');
  }

  if (!isCurrentRoundComplete(tournament.schedule)) {
    throw new Error('Current round is not complete');
  }

  if (tournament.schedule.rounds.length >= tournament.totalRounds) {
    throw new Error('All rounds have been played');
  }

  const round = generateNextSwissRound(tournament);
  tournament.schedule.rounds.push(round);

  await doc.incrementalModify(() => tournament);
  return tournament;
}

export async function isRoundComplete(tournamentId: string): Promise<boolean> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  if (tournament.format !== Format.SWISS) {
    throw new Error('Tournament is not a Swiss format');
  }

  return isCurrentRoundComplete(tournament.schedule);
}
