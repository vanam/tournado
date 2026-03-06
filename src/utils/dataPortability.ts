import type { Tournament } from '../types';
import type { PlayerLibraryEntry, PlayerGroup } from '../types/playerLibrary';
import { getDatabase } from '../db';

export const DATA_VERSION = 4;

export const TOURNAMENT_VERSION = 1;
export const PLAYER_VERSION = 1;
export const GROUP_VERSION = 1;

export interface ImportResult {
  skippedTournaments: number;
  skippedPlayers: number;
  skippedGroups: number;
}

export interface ExportPayload {
  version: number;
  exportedAt: string;
  tournaments: Tournament[];
  players: PlayerLibraryEntry[];
  groups: PlayerGroup[];
}

export async function buildExportPayload(
  tournamentIds: Set<string>,
  playerIds: Set<string>,
  groupIds: Set<string>,
): Promise<ExportPayload> {
  const db = await getDatabase();
  const tournamentDocs = await db.tournaments.find().exec();
  const allTournaments = tournamentDocs.map(d => d.toMutableJSON());
  const playerDocs = await db.players.find().exec();
  const allPlayers = playerDocs.map(d => d.toJSON() as PlayerLibraryEntry);
  const groupDocs = await db.playerGroups.find().exec();
  const allGroups = groupDocs.map(d => d.toJSON() as PlayerGroup);

  const tournaments = allTournaments.filter((t) => tournamentIds.has(t.id));
  const groups = allGroups.filter((g) => groupIds.has(g.id));
  const players = allPlayers.filter((p) => playerIds.has(p.id));

  return {
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    tournaments,
    players,
    groups,
  };
}

export function downloadJson(payload: ExportPayload): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tournado-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseExportFile(text: string): ExportPayload | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>)['version'] !== 'number'
    ) {
      return null;
    }
    return parsed as ExportPayload;
  } catch {
    return null;
  }
}

export async function importPayload(payload: ExportPayload): Promise<ImportResult> {
  const compatTournaments = payload.tournaments.filter(
    (t) => t.version === TOURNAMENT_VERSION,
  );
  const compatPlayers = payload.players.filter(
    (p) => p.version === PLAYER_VERSION,
  );
  const compatGroups = payload.groups.filter(
    (g) => g.version === GROUP_VERSION,
  );

  const result: ImportResult = {
    skippedTournaments: payload.tournaments.length - compatTournaments.length,
    skippedPlayers: payload.players.length - compatPlayers.length,
    skippedGroups: payload.groups.length - compatGroups.length,
  };

  const db = await getDatabase();

  for (const tournament of compatTournaments) {
    await db.tournaments.upsert(tournament);
  }

  if (compatGroups.length > 0) {
    for (const group of compatGroups) {
      await db.playerGroups.upsert(group);
    }
  }

  if (compatPlayers.length > 0) {
    for (const player of compatPlayers) {
      await db.players.upsert(player);
    }
  }

  return result;
}
