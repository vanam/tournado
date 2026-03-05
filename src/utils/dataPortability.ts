import type { Tournament } from '../types';
import type { PlayerLibraryEntry, PlayerGroup } from '../types/playerLibrary';
import { persistence } from '../services/persistence';
import { loadLibrary, saveLibrary } from '../services/playerLibraryService';

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
  const allTournaments = await persistence.loadAll();
  const library = await loadLibrary();

  const tournaments = allTournaments.filter((t) => tournamentIds.has(t.id));
  const groups = library.groups.filter((g) => groupIds.has(g.id));
  const players = library.players.filter((p) => playerIds.has(p.id));

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

  for (const tournament of compatTournaments) {
    await persistence.save(tournament);
  }

  if (compatPlayers.length > 0 || compatGroups.length > 0) {
    const library = await loadLibrary();

    const existingGroupIds = new Set(library.groups.map((g) => g.id));
    const newGroups = compatGroups.filter((g) => !existingGroupIds.has(g.id));
    const updatedGroups = library.groups.map((g) => {
      const incoming = compatGroups.find((ig) => ig.id === g.id);
      return incoming ?? g;
    });
    const mergedGroups = [...updatedGroups, ...newGroups];

    const existingPlayerIds = new Set(library.players.map((p) => p.id));
    const newPlayers = compatPlayers.filter((p) => !existingPlayerIds.has(p.id));
    const updatedPlayers = library.players.map((p) => {
      const incoming = compatPlayers.find((ip) => ip.id === p.id);
      return incoming ?? p;
    });
    const mergedPlayers = [...updatedPlayers, ...newPlayers];

    await saveLibrary({ groups: mergedGroups, players: mergedPlayers });
  }

  return result;
}
