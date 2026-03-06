import { getDatabase } from '../db';
import { computeStandings } from '../utils/roundRobinUtils';
import { computeSwissStandings } from '../utils/swissUtils';
import { ensureParticipants, getParticipantPlayers } from '../utils/participantUtils';
import { Format } from '../types';
import type { ScoreMode, StandingsRow, SwissStandingsRow } from '../types';

export interface MatrixCell {
  player1Id: string;
  player2Id: string;
  scores: [number, number][];
  winnerId: string | null;
}

export interface MatrixResponse {
  playerIds: string[];
  cells: MatrixCell[];
}

export async function getStandings(tournamentId: string): Promise<StandingsRow[] | SwissStandingsRow[]> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  const storedParticipants = ensureParticipants(tournament.players, tournament.participants);
  const participantPlayers = getParticipantPlayers(tournament.players, storedParticipants);

  switch (tournament.format) {
    case Format.ROUND_ROBIN: {
      const rrOptions: { scoringMode?: ScoreMode; maxSets?: number } = {};
      if (tournament.scoringMode !== undefined) rrOptions.scoringMode = tournament.scoringMode;
      if (tournament.maxSets !== undefined) rrOptions.maxSets = tournament.maxSets;
      return computeStandings(tournament.schedule, participantPlayers, rrOptions);
    }
    case Format.SWISS: {
      const swOptions: { scoringMode?: ScoreMode; maxSets?: number } = {};
      if (tournament.scoringMode !== undefined) swOptions.scoringMode = tournament.scoringMode;
      if (tournament.maxSets !== undefined) swOptions.maxSets = tournament.maxSets;
      return computeSwissStandings(tournament.schedule, participantPlayers, swOptions);
    }
    case Format.SINGLE_ELIM:
    case Format.DOUBLE_ELIM:
    case Format.GROUPS_TO_BRACKET: {
      throw new Error('Standings are only available for Round Robin and Swiss formats');
    }
  }
}

export async function getMatrix(tournamentId: string): Promise<MatrixResponse> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  if (tournament.format !== Format.ROUND_ROBIN) {
    throw new Error('Matrix is only available for Round Robin format');
  }

  const storedParticipants = ensureParticipants(tournament.players, tournament.participants);
  const participantPlayers = getParticipantPlayers(tournament.players, storedParticipants);
  const playerIds = participantPlayers.map((p) => p.id);

  const cells: MatrixCell[] = [];
  for (const round of tournament.schedule.rounds) {
    for (const match of round.matches) {
      if (match.player1Id !== null && match.player2Id !== null) {
        cells.push({
          player1Id: match.player1Id,
          player2Id: match.player2Id,
          scores: match.scores,
          winnerId: match.winnerId,
        });
      }
    }
  }

  return { playerIds, cells };
}
