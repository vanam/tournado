import Ajv from 'ajv';
import { tournamentSchema } from '../db/schemas/tournament';
import { playerSchema } from '../db/schemas/player';
import { playerGroupSchema } from '../db/schemas/playerGroup';
import { isValidTournament } from './validation';
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

const validator = new Ajv({ strict: false });
const validTournamentSchema = validator.compile<Tournament>(tournamentSchema);
const validPlayerSchema = validator.compile<PlayerLibraryEntry>(playerSchema);
const validGroupSchema = validator.compile<PlayerGroup>(playerGroupSchema);

export function validateImportEntities(payload: ExportPayload): void {
  if (payload.tournaments.some((t) => t.version === TOURNAMENT_VERSION && (!validTournamentSchema(t) || !isValidTournament(t)))
    || payload.players.some((p) => p.version === PLAYER_VERSION && !validPlayerSchema(p))
    || payload.groups.some((g) => g.version === GROUP_VERSION && !validGroupSchema(g))) {
    throw new Error('Invalid import entity');
  }
}

function isVersionedRecord(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'version' in value && Number.isInteger(value.version);
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
      !('version' in parsed) || !Number.isInteger(parsed.version) ||
      !('exportedAt' in parsed) || typeof parsed.exportedAt !== 'string' ||
      !('tournaments' in parsed) || !Array.isArray(parsed.tournaments) || !parsed.tournaments.every((entry) => isVersionedRecord(entry)) ||
      !('players' in parsed) || !Array.isArray(parsed.players) || !parsed.players.every((entry) => isVersionedRecord(entry)) ||
      !('groups' in parsed) || !Array.isArray(parsed.groups) || !parsed.groups.every((entry) => isVersionedRecord(entry))
    ) {
      return null;
    }
    const payload = parsed as ExportPayload;
    validateImportEntities(payload);
    return payload;
  } catch {
    return null;
  }
}

export async function importPayload(payload: ExportPayload): Promise<ImportResult> {
  validateImportEntities(payload);
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
