import { generateBracket } from '../../utils/bracketUtils';
import { generateDoubleElim } from '../../utils/doubleElimUtils';
import { generateSchedule } from '../../utils/roundRobinUtils';
import { generateSwissInitialSchedule, computeMinTotalRounds } from '../../utils/swissUtils';
import { createGroupStage } from '../../utils/groupStageUtils';
import { buildParticipants, getParticipantPlayers } from '../../utils/participantUtils';
import { computeTournamentProgress } from '../../utils/progressUtils';
import { getTournamentResults } from '../../utils/resultsUtils';
import { persistence } from '../../services/persistence';
import { Format } from '../../types';
import type {
  Player, Tournament,
  SingleElimTournament, DoubleElimTournament, RoundRobinTournament,
  SwissTournament, GroupsToBracketTournament,
} from '../../types';
import type { CreateTournamentRequest, TournamentSummary } from '../types';
import { jsonResponse, noContent, parseJsonBody } from '../helpers';
import { notFound, badRequest } from '../errors';

function toSummary(t: Tournament): TournamentSummary {
  return {
    id: t.id,
    name: t.name,
    format: t.format,
    createdAt: t.createdAt,
    completedAt: t.completedAt ?? null,
    winnerId: t.winnerId ?? null,
    playerCount: t.players.length,
    teamSize: t.teamSize ?? 1,
  };
}

export async function listTournaments(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const formatFilter = url.searchParams.get('format');
  const statusFilter = url.searchParams.get('status');

  let tournaments = await persistence.loadAll();

  if (formatFilter) {
    const filterValue = formatFilter as Format;
    tournaments = tournaments.filter((t) => t.format === filterValue);
  }
  if (statusFilter === 'completed') {
    tournaments = tournaments.filter((t) => t.completedAt != null);
  } else if (statusFilter === 'active') {
    tournaments = tournaments.filter((t) => t.completedAt == null);
  }

  return jsonResponse(tournaments.map((t) => toSummary(t)));
}

export async function createTournament(req: Request): Promise<Response> {
  const body = await parseJsonBody<CreateTournamentRequest>(req);
  const { name, format, players: playerInputs, teamSize = 1 } = body;

  if (!name || !Array.isArray(playerInputs) || playerInputs.length < 2) {
    throw badRequest('Name, format, and at least 2 players are required');
  }

  const players: Player[] = playerInputs.map((p) => {
    const player: Player = {
      id: crypto.randomUUID(),
      name: p.name,
    };
    if (p.seed !== undefined) player.seed = p.seed;
    if (p.elo !== undefined) player.elo = p.elo;
    if (p.libraryId !== undefined) player.libraryId = p.libraryId;
    return player;
  });

  const participants = buildParticipants(players, teamSize, []);
  const participantPlayers = getParticipantPlayers(players, participants);

  function applyOptionalFields<T extends Tournament>(t: T): T {
    if (body.scoringMode !== undefined) t.scoringMode = body.scoringMode;
    if (body.maxSets !== undefined) t.maxSets = body.maxSets;
    if (body.groupStageMaxSets !== undefined) t.groupStageMaxSets = body.groupStageMaxSets;
    if (body.bracketMaxSets !== undefined) t.bracketMaxSets = body.bracketMaxSets;
    return t;
  }

  const shared = {
    id: crypto.randomUUID(),
    name,
    players,
    teamSize,
    participants,
    createdAt: new Date().toISOString(),
    completedAt: null,
    winnerId: null,
  } satisfies Omit<SingleElimTournament, 'format' | 'bracket'>;

  let tournament: Tournament;

  switch (format) {
    case Format.SINGLE_ELIM: {
      const bracket = generateBracket(participantPlayers);
      tournament = applyOptionalFields({ ...shared, format: Format.SINGLE_ELIM, bracket } satisfies SingleElimTournament);
      break;
    }
    case Format.DOUBLE_ELIM: {
      const doubleElim = generateDoubleElim(participantPlayers);
      tournament = applyOptionalFields({ ...shared, format: Format.DOUBLE_ELIM, doubleElim } satisfies DoubleElimTournament);
      break;
    }
    case Format.ROUND_ROBIN: {
      const schedule = generateSchedule(participantPlayers);
      tournament = applyOptionalFields({ ...shared, format: Format.ROUND_ROBIN, schedule } satisfies RoundRobinTournament);
      break;
    }
    case Format.SWISS: {
      const schedule = generateSwissInitialSchedule(participantPlayers);
      const totalRounds = body.swissRounds ?? computeMinTotalRounds(participantPlayers.length);
      tournament = applyOptionalFields({ ...shared, format: Format.SWISS, schedule, totalRounds } satisfies SwissTournament);
      break;
    }
    case Format.GROUPS_TO_BRACKET: {
      const groupCount = body.groupCount ?? 2;
      const groupStage = createGroupStage(participantPlayers, {
        groupCount,
        qualifiers: body.qualifiers,
        consolation: body.consolation,
        bracketType: body.bracketType,
      });
      tournament = applyOptionalFields({ ...shared, format: Format.GROUPS_TO_BRACKET, groupStage } satisfies GroupsToBracketTournament);
      break;
    }
  }

  await persistence.save(tournament);
  return jsonResponse(tournament, 201);
}

export async function getTournament(_req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  const tournament = await persistence.load(id);
  if (tournament === null) {
    throw notFound(`Tournament ${id} not found`);
  }
  return jsonResponse(tournament);
}

export async function deleteTournament(_req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  await persistence.delete(id);
  return noContent();
}

export async function deleteAllTournaments(): Promise<Response> {
  await persistence.deleteAll();
  return noContent();
}

export async function duplicateTournament(_req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  const original = await persistence.load(id);
  if (original === null) {
    throw notFound(`Tournament ${id} not found`);
  }

  const cloned: Tournament = structuredClone(original);
  cloned.id = crypto.randomUUID();
  cloned.name = `${original.name} (copy)`;
  cloned.createdAt = new Date().toISOString();
  cloned.completedAt = null;
  cloned.winnerId = null;

  await persistence.save(cloned);
  return jsonResponse(cloned, 201);
}

export async function getProgress(_req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  const tournament = await persistence.load(id);
  if (tournament === null) {
    throw notFound(`Tournament ${id} not found`);
  }
  const progress = computeTournamentProgress(tournament);
  return jsonResponse(progress);
}

export async function getResults(_req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  const tournament = await persistence.load(id);
  if (tournament === null) {
    throw notFound(`Tournament ${id} not found`);
  }
  const results = getTournamentResults(tournament);
  return jsonResponse(results);
}

export async function renameTournamentPlayer(req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  const playerId = params['playerId'] ?? '';
  const body = await parseJsonBody<{ name: string }>(req);
  const name = body.name.trim();
  if (!name) throw badRequest('Name is required');

  const tournament = await persistence.load(id);
  if (tournament === null) throw notFound(`Tournament ${id} not found`);

  const player = tournament.players.find((p) => p.id === playerId);
  if (player === undefined) throw notFound(`Player ${playerId} not found`);

  player.name = name;
  await persistence.save(tournament);
  return noContent();
}
