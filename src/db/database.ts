import { createRxDatabase, addRxPlugin } from 'rxdb';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { wrappedValidateZSchemaStorage } from 'rxdb/plugins/validate-z-schema';
import { tournamentSchema } from './schemas/tournament';
import { playerSchema } from './schemas/player';
import { playerGroupSchema } from './schemas/playerGroup';
import type { PlayerGroup } from '../types';
import type { DatabaseCollections, TournadoDatabase } from './collections';

addRxPlugin(RxDBMigrationSchemaPlugin);

let dbPromise: Promise<TournadoDatabase> | null = null;

async function _createDatabase(): Promise<TournadoDatabase> {
  if (import.meta.env.DEV) {
    const devModeModule = await import('rxdb/plugins/dev-mode');
    addRxPlugin(devModeModule.RxDBDevModePlugin);
  }

  const db = await createRxDatabase<DatabaseCollections>({
    name: 'tournado-rxdb',
    storage: wrappedValidateZSchemaStorage({
      storage: getRxStorageDexie(),
    }),
  });

  await db.addCollections({
    tournaments: { schema: tournamentSchema },
    players: { schema: playerSchema },
    playerGroups: { schema: playerGroupSchema, migrationStrategies: { 1: (doc: PlayerGroup): PlayerGroup => doc } },
  });

  return db;
}

export function getDatabase(): Promise<TournadoDatabase> {
  dbPromise ??= _createDatabase();
  return dbPromise;
}
