import { computeStandings } from '../../utils/roundRobinUtils';
import { getGroupAdvancers, buildGroupStagePlayoffs, getGroupPlayers } from '../../utils/groupStageUtils';
import { persistence } from '../../services/persistence';
import { Format } from '../../types';
import { ensureParticipants, getParticipantPlayers } from '../../utils/participantUtils';
import { jsonResponse } from '../helpers';
import { notFound, badRequest } from '../errors';

export async function getGroupStandings(_req: Request, params: Record<string, string>): Promise<Response> {
  const tournamentId = params['id'] ?? '';
  const groupId = params['groupId'] ?? '';

  const tournament = await persistence.load(tournamentId);
  if (tournament === null) {
    throw notFound(`Tournament ${tournamentId} not found`);
  }
  if (tournament.format !== Format.GROUPS_TO_BRACKET) {
    throw badRequest('Tournament is not a Groups to Bracket format');
  }

  const group = tournament.groupStage.groups.find((g) => g.id === groupId);
  if (group === undefined) {
    throw notFound(`Group ${groupId} not found`);
  }

  const storedParticipants = ensureParticipants(tournament.players, tournament.participants);
  const participantPlayers = getParticipantPlayers(tournament.players, storedParticipants);
  const groupPlayers = getGroupPlayers(group, participantPlayers);
  const standings = computeStandings(group.schedule, groupPlayers, {
    scoringMode: tournament.scoringMode,
    maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
  });

  return jsonResponse(standings);
}

export async function getAdvancers(_req: Request, params: Record<string, string>): Promise<Response> {
  const tournamentId = params['id'] ?? '';

  const tournament = await persistence.load(tournamentId);
  if (tournament === null) {
    throw notFound(`Tournament ${tournamentId} not found`);
  }
  if (tournament.format !== Format.GROUPS_TO_BRACKET) {
    throw badRequest('Tournament is not a Groups to Bracket format');
  }

  const storedParticipants = ensureParticipants(tournament.players, tournament.participants);
  const participantPlayers = getParticipantPlayers(tournament.players, storedParticipants);
  const advancers = getGroupAdvancers(tournament.groupStage, participantPlayers, {
    scoringMode: tournament.scoringMode,
    maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
  });

  return jsonResponse(advancers);
}

export async function generatePlayoffs(_req: Request, params: Record<string, string>): Promise<Response> {
  const tournamentId = params['id'] ?? '';

  const tournament = await persistence.load(tournamentId);
  if (tournament === null) {
    throw notFound(`Tournament ${tournamentId} not found`);
  }
  if (tournament.format !== Format.GROUPS_TO_BRACKET) {
    throw badRequest('Tournament is not a Groups to Bracket format');
  }

  const storedParticipants = ensureParticipants(tournament.players, tournament.participants);
  const participantPlayers = getParticipantPlayers(tournament.players, storedParticipants);
  const playoffs = buildGroupStagePlayoffs(tournament.groupStage, participantPlayers, {
    scoringMode: tournament.scoringMode,
    maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
  });

  tournament.groupStagePlayoffs = playoffs;

  await persistence.save(tournament);
  return jsonResponse(tournament);
}
