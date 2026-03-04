import {
  loadLibrary,
  addPlayer,
  updatePlayer,
  deletePlayer,
  deleteAllPlayers,
} from '../../services/playerLibraryService';
import { persistence } from '../../services/persistence';
import { getTournamentResults } from '../../utils/resultsUtils';
import { parseBulkInput } from '../../utils/importUtils';
import type { CreatePlayerRequest, UpdatePlayerRequest, BulkImportRequest, PlayerProfile } from '../types';
import { jsonResponse, noContent, parseJsonBody } from '../helpers';
import { notFound, badRequest } from '../errors';

export async function listPlayers(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');

  const library = await loadLibrary();
  let players = library.players;

  if (groupId) {
    players = players.filter((p) => p.groupIds.includes(groupId));
  }

  return jsonResponse(players);
}

export async function createPlayerHandler(req: Request): Promise<Response> {
  const body = await parseJsonBody<CreatePlayerRequest>(req);

  if (!body.name || body.name.trim() === '') {
    throw badRequest('Player name is required');
  }

  const library = await addPlayer(body.name.trim(), body.elo, body.groupIds ?? []);
  const created = library.players.at(-1);
  return jsonResponse(created, 201);
}

export async function updatePlayerHandler(req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  const body = await parseJsonBody<UpdatePlayerRequest>(req);

  const library = await loadLibrary();
  const existing = library.players.find((p) => p.id === id);
  if (existing === undefined) {
    throw notFound(`Player ${id} not found`);
  }

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch['name'] = body.name;
  if (body.elo !== undefined) patch['elo'] = body.elo;
  if (body.groupIds !== undefined) patch['groupIds'] = body.groupIds;

  const updated = await updatePlayer(id, patch);
  const player = updated.players.find((p) => p.id === id);
  return jsonResponse(player);
}

export async function deletePlayerHandler(_req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  await deletePlayer(id);
  return noContent();
}

export async function deleteAllPlayersHandler(): Promise<Response> {
  await deleteAllPlayers();
  return noContent();
}

export async function bulkImport(req: Request): Promise<Response> {
  const body = await parseJsonBody<BulkImportRequest>(req);

  if (!body.text || body.text.trim() === '') {
    throw badRequest('Import text is required');
  }

  const library = await loadLibrary();
  const existingNames = library.players.map((p) => p.name);
  const { parsed, errors } = parseBulkInput(body.text, existingNames);

  if (errors.length > 0) {
    return jsonResponse({ imported: 0, errors }, 422);
  }

  for (const entry of parsed) {
    await addPlayer(entry.name, entry.elo);
  }

  return jsonResponse({ imported: parsed.length, errors: [] }, 201);
}

export async function getPlayerProfile(_req: Request, params: Record<string, string>): Promise<Response> {
  const playerId = params['id'] ?? '';

  const library = await loadLibrary();
  const libraryPlayer = library.players.find((p) => p.id === playerId);
  if (libraryPlayer === undefined) {
    throw notFound(`Player ${playerId} not found`);
  }

  const tournaments = await persistence.loadAll();
  const tournamentEntries: PlayerProfile['tournaments'] = [];

  for (const tournament of tournaments) {
    const playerInTournament = tournament.players.some(
      (p) => p.libraryId === playerId || p.id === playerId
    );
    if (!playerInTournament) continue;

    const results = getTournamentResults(tournament);
    const playerResult = results.find(
      (r) => {
        const matchingPlayer = tournament.players.find(
          (p) => p.id === r.playerId || p.libraryId === r.playerId
        );
        return matchingPlayer?.libraryId === playerId || matchingPlayer?.id === playerId;
      }
    );

    const entry: PlayerProfile['tournaments'][number] = {
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      format: tournament.format,
      teamSize: tournament.teamSize ?? 1,
      playerCount: tournament.players.length,
      createdAt: tournament.createdAt,
      isCompleted: !!tournament.winnerId,
    };
    if (playerResult?.rankStart !== undefined) entry.rankStart = playerResult.rankStart;
    if (playerResult?.rankEnd !== undefined) entry.rankEnd = playerResult.rankEnd;
    tournamentEntries.push(entry);
  }

  const profile: PlayerProfile = {
    id: libraryPlayer.id,
    name: libraryPlayer.name,
    groupIds: libraryPlayer.groupIds,
    tournaments: tournamentEntries,
  };
  if (libraryPlayer.elo !== undefined) profile.elo = libraryPlayer.elo;

  return jsonResponse(profile);
}
