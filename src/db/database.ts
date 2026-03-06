import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { wrappedValidateZSchemaStorage } from 'rxdb/plugins/validate-z-schema';
import { tournamentSchema } from './schemas/tournament';
import { playerSchema } from './schemas/player';
import { playerGroupSchema } from './schemas/playerGroup';
import type { DatabaseCollections, TournadoDatabase } from './collections';

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
    playerGroups: { schema: playerGroupSchema },
  });

  return db;
}

export function getDatabase(): Promise<TournadoDatabase> {
  dbPromise ??= _createDatabase();
  return dbPromise;
}
