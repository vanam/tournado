import { getDatabase } from '../db';
import { getTournamentResults } from '../utils/resultsUtils';
import { parseBulkInput } from '../utils/importUtils';
import { PLAYER_VERSION } from '../utils/dataPortability';
import type { Format, PlayerLibraryEntry } from '../types';

export interface PlayerProfile {
  id: string;
  name: string;
  elo?: number;
  groupIds: string[];
  tournaments: Array<{
    tournamentId: string;
    tournamentName: string;
    format: Format;
    teamSize: number;
    playerCount: number;
    createdAt: string;
    isCompleted: boolean;
    rankStart?: number;
    rankEnd?: number;
  }>;
}

export async function listPlayers(groupId?: string): Promise<PlayerLibraryEntry[]> {
  const db = await getDatabase();
  const docs = await db.players.find().exec();
  let players = docs.map(d => d.toJSON() as PlayerLibraryEntry);
  if (groupId) players = players.filter(p => p.groupIds.includes(groupId));
  return players;
}

export async function createPlayer(name: string, elo?: number, groupIds: string[] = []): Promise<PlayerLibraryEntry> {
  const db = await getDatabase();
  const player: PlayerLibraryEntry = {
    id: crypto.randomUUID(),
    name,
    version: PLAYER_VERSION,
    groupIds,
  };
  if (elo !== undefined) player.elo = elo;
  await db.players.insert(player);
  return player;
}

export async function updatePlayer(
  id: string,
  patch: { name?: string; elo?: number; groupIds?: string[] },
  translate: (key: string) => string = (k) => k
): Promise<PlayerLibraryEntry> {
  const db = await getDatabase();
  const doc = await db.players.findOne(id).exec();
  if (!doc) throw new Error(`Player ${id} not found`);

  if (patch.name !== undefined) {
    const trimmedName = patch.name.trim();
    const allDocs = await db.players.find().exec();
    const isDuplicate = allDocs.some(
      (p) => p.toJSON().id !== id && (p.toJSON() as PlayerLibraryEntry).name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error(translate('players.errorUnique'));
    }
    patch = { ...patch, name: trimmedName };
  }

  const updated = { ...doc.toMutableJSON(), ...patch } as PlayerLibraryEntry;
  await doc.incrementalModify(() => updated);
  return updated;
}

export async function deletePlayer(id: string): Promise<void> {
  const db = await getDatabase();
  const doc = await db.players.findOne(id).exec();
  if (doc) await doc.remove();
}

export async function deleteAllPlayers(): Promise<void> {
  const db = await getDatabase();
  const docs = await db.players.find().exec();
  await Promise.all(docs.map(d => d.remove()));
}

export async function bulkImportPlayers(
  text: string,
  groupIds: string[] = [],
  translate: (key: string) => string = (k) => k
): Promise<{ imported: number; errors: Array<{ line: number; message: string }> }> {
  if (!text || text.trim() === '') {
    throw new Error('Import text is required');
  }

  const db = await getDatabase();
  const existingDocs = await db.players.find().exec();
  const existingNames = existingDocs.map(d => (d.toJSON() as PlayerLibraryEntry).name);

  const { parsed, errors } = parseBulkInput(text, existingNames);

  if (errors.length > 0) {
    const translatedErrors = errors.map((e) => ({ line: e.line, message: translate(e.msgKey) }));
    return { imported: 0, errors: translatedErrors };
  }

  for (const entry of parsed) {
    const player: PlayerLibraryEntry = {
      id: crypto.randomUUID(),
      name: entry.name,
      version: PLAYER_VERSION,
      groupIds,
    };
    if (entry.elo !== undefined) player.elo = entry.elo;
    await db.players.insert(player);
  }

  return { imported: parsed.length, errors: [] };
}

export async function getPlayerProfile(playerId: string): Promise<PlayerProfile> {
  const db = await getDatabase();
  const playerDoc = await db.players.findOne(playerId).exec();
  if (!playerDoc) throw new Error(`Player ${playerId} not found`);

  const libraryPlayer = playerDoc.toJSON() as PlayerLibraryEntry;

  const tournamentDocs = await db.tournaments.find().exec();
  const tournaments = tournamentDocs.map(d => d.toMutableJSON());
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

  return profile;
}
