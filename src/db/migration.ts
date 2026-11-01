import type { Tournament } from '../types/tournament';
import type {
  PlayerLibrary,
  PlayerLibraryEntry,
  PlayerGroup,
} from '../types/playerLibrary';
import type { TournadoDatabase } from './collections';
import { validateImportEntities, DATA_VERSION, TOURNAMENT_VERSION } from '../utils/dataPortability';
import { normalizeTournament } from '../utils/tournamentCompatibility';

const MIGRATION_KEY = 'tournado-rxdb-migrated-v2';
const migrations = new WeakMap<TournadoDatabase, Promise<void>>();

type Legacy<T> = T extends { version: number }
  ? Omit<T, 'version'> & { version?: number }
  : never;

interface OldData {
  tournaments: Legacy<Tournament>[];
  players: Legacy<PlayerLibraryEntry>[];
  groups: Legacy<PlayerGroup>[];
}

/** Reads old formats without upgrading or modifying the original database. */
export function readOldDatabase(): Promise<OldData | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tournado');
    let absent = false;
    request.addEventListener('error', () => {
      if (!absent)
        reject(
          request.error ?? new Error('Legacy database could not be opened'),
        );
    });
    request.onupgradeneeded = (): void => {
      absent = true;
      request.transaction?.abort();
      resolve(null);
    };
    request.onsuccess = (): void => {
      const db = request.result;
      const stores = [
        'tournaments',
        'players',
        'groups',
        'playerLibrary',
      ].filter((name) => db.objectStoreNames.contains(name));
      if (stores.length === 0) {
        db.close();
        reject(new Error('Unrecognized legacy database'));
        return;
      }
      const tx = db.transaction(stores, 'readonly');
      const tournaments = stores.includes('tournaments')
        ? tx.objectStore('tournaments').getAll()
        : null;
      const players = stores.includes('players')
        ? tx.objectStore('players').getAll()
        : null;
      const groups = stores.includes('groups')
        ? tx.objectStore('groups').getAll()
        : null;
      const library = stores.includes('playerLibrary')
        ? tx.objectStore('playerLibrary')
        : null;
      const main = library?.get('main');
      const oldPlayers = library?.get('players');
      const oldGroups = library?.get('groups');
      tx.addEventListener('abort', () => {
        db.close();
        reject(tx.error ?? new Error('Legacy read aborted'));
      });
      tx.oncomplete = (): void => {
        const oldMain = main?.result as PlayerLibrary | undefined;
        const result: OldData = {
          tournaments: (tournaments?.result ?? []) as Legacy<Tournament>[],
          players: (players?.result ??
            oldPlayers?.result ??
            oldMain?.players ??
            []) as Legacy<PlayerLibraryEntry>[],
          groups: (groups?.result ??
            oldGroups?.result ??
            oldMain?.groups ??
            []) as Legacy<PlayerGroup>[],
        };
        db.close();
        resolve(result);
      };
    };
  });
}

/** Retrying a partial migration never overwrites newer destination records. */
export function migrateFromOldDatabase(db: TournadoDatabase): Promise<void> {
  const pending = migrations.get(db);
  if (pending) return pending;
  const migration = performMigration(db).finally(() => {
    migrations.delete(db);
  });
  migrations.set(db, migration);
  return migration;
}

async function performMigration(db: TournadoDatabase): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) return;
  const oldData = await readOldDatabase();
  if (oldData) {
    const tournaments = oldData.tournaments.map((t) => ({
      ...t,
      version: t.version ?? 1,
    }));
    const players = oldData.players.map((p) => ({
      ...p,
      version: p.version ?? 1,
    }));
    const groups = oldData.groups.map((g) => ({
      ...g,
      version: g.version ?? 1,
    }));
    validateImportEntities({
      version: DATA_VERSION,
      exportedAt: '',
      tournaments,
      players,
      groups,
    });
    const tournamentsDocs = await db.tournaments.find().exec();
    const existingTournaments = new Set(tournamentsDocs.map((d) => d.primary));
    const playersDocs = await db.players.find().exec();
    const existingPlayers = new Set(playersDocs.map((d) => d.primary));
    const playerGroupsDocs = await db.playerGroups.find().exec();
    const existingGroups = new Set(playerGroupsDocs.map((d) => d.primary));
    const results = await Promise.all([
      db.tournaments.bulkInsert(
        tournaments.filter((t) => !existingTournaments.has(t.id)).map((tournament) =>
          tournament.version === TOURNAMENT_VERSION ? normalizeTournament(tournament) : tournament,
        ),
      ),
      db.players.bulkInsert(players.filter((p) => !existingPlayers.has(p.id))),
      db.playerGroups.bulkInsert(
        groups.filter((g) => !existingGroups.has(g.id)),
      ),
    ]);
    if (
      results.some((result) =>
        result.error.some((error) => error.status !== 409),
      )
    )
      throw new Error('Legacy migration failed. Original data was preserved.');
  }
  localStorage.setItem(MIGRATION_KEY, '1');
}
