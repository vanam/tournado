import { computeStandings } from '../../utils/roundRobinUtils';
import { computeSwissStandings } from '../../utils/swissUtils';
import { persistence } from '../../services/persistence';
import { Format } from '../../types';
import type { ScoreMode } from '../../types';

import { ensureParticipants, getParticipantPlayers } from '../../utils/participantUtils';
import type { MatrixCell, MatrixResponse } from '../types';
import { jsonResponse } from '../helpers';
import { notFound, badRequest } from '../errors';

export async function getStandings(_req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  const tournament = await persistence.load(id);
  if (tournament === null) {
    throw notFound(`Tournament ${id} not found`);
  }

  const storedParticipants = ensureParticipants(tournament.players, tournament.participants);
  const participantPlayers = getParticipantPlayers(tournament.players, storedParticipants);

  switch (tournament.format) {
    case Format.ROUND_ROBIN: {
      const rrOptions: { scoringMode?: ScoreMode; maxSets?: number } = {};
      if (tournament.scoringMode !== undefined) rrOptions.scoringMode = tournament.scoringMode;
      if (tournament.maxSets !== undefined) rrOptions.maxSets = tournament.maxSets;
      const standings = computeStandings(tournament.schedule, participantPlayers, rrOptions);
      return jsonResponse(standings);
    }
    case Format.SWISS: {
      const swOptions: { scoringMode?: ScoreMode; maxSets?: number } = {};
      if (tournament.scoringMode !== undefined) swOptions.scoringMode = tournament.scoringMode;
      if (tournament.maxSets !== undefined) swOptions.maxSets = tournament.maxSets;
      const standings = computeSwissStandings(tournament.schedule, participantPlayers, swOptions);
      return jsonResponse(standings);
    }
    case Format.SINGLE_ELIM:
    case Format.DOUBLE_ELIM:
    case Format.GROUPS_TO_BRACKET: {
      throw badRequest('Standings are only available for Round Robin and Swiss formats');
    }
  }
}

export async function getMatrix(_req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  const tournament = await persistence.load(id);
  if (tournament === null) {
    throw notFound(`Tournament ${id} not found`);
  }
  if (tournament.format !== Format.ROUND_ROBIN) {
    throw badRequest('Matrix is only available for Round Robin format');
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

  const response: MatrixResponse = { playerIds, cells };
  return jsonResponse(response);
}
