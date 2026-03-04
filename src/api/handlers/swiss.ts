import { generateNextSwissRound, isCurrentRoundComplete } from '../../utils/swissUtils';
import { persistence } from '../../services/persistence';
import { Format } from '../../types';
import { jsonResponse } from '../helpers';
import { notFound, badRequest } from '../errors';

export async function nextRound(_req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  const tournament = await persistence.load(id);
  if (tournament === null) {
    throw notFound(`Tournament ${id} not found`);
  }
  if (tournament.format !== Format.SWISS) {
    throw badRequest('Tournament is not a Swiss format');
  }

  if (!isCurrentRoundComplete(tournament.schedule)) {
    throw badRequest('Current round is not complete');
  }

  if (tournament.schedule.rounds.length >= tournament.totalRounds) {
    throw badRequest('All rounds have been played');
  }

  const round = generateNextSwissRound(tournament);
  tournament.schedule.rounds.push(round);

  await persistence.save(tournament);
  return jsonResponse(tournament);
}

export async function roundComplete(_req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  const tournament = await persistence.load(id);
  if (tournament === null) {
    throw notFound(`Tournament ${id} not found`);
  }
  if (tournament.format !== Format.SWISS) {
    throw badRequest('Tournament is not a Swiss format');
  }

  const complete = isCurrentRoundComplete(tournament.schedule);

  return jsonResponse({ complete });
}
