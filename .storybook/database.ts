import { addRxPlugin, createRxDatabase } from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { tournamentSchema } from '../src/db/schemas/tournament';
import { playerSchema } from '../src/db/schemas/player';
import { playerGroupSchema } from '../src/db/schemas/playerGroup';
import type {
  DatabaseCollections,
  TournadoDatabase,
} from '../src/db/collections';
import type { PlayerGroup } from '../src/types';
import { libraryGroups, libraryPlayers, tournaments } from './fixtures';

addRxPlugin(RxDBMigrationSchemaPlugin);
let active: TournadoDatabase | null = null;
let count = 0;

/** Storybook never opens IndexedDB or runs the production migration. */
export function getDatabase(): Promise<TournadoDatabase> {
  if (!active)
    return Promise.reject(new Error('Story database is not initialized'));
  return Promise.resolve(active);
}

export async function resetStoryDatabase(
  empty = false,
): Promise<TournadoDatabase> {
  if (active) await active.remove();
  count++;
  const db = await createRxDatabase<DatabaseCollections>({
    name: `storybook-${count}`,
    storage: getRxStorageMemory(),
    multiInstance: false,
  });
  await db.addCollections({
    tournaments: { schema: tournamentSchema },
    players: { schema: playerSchema },
    playerGroups: {
      schema: playerGroupSchema,
      migrationStrategies: { 1: (doc: PlayerGroup): PlayerGroup => doc },
    },
  });
  if (!empty) {
    await db.tournaments.bulkInsert(structuredClone(tournaments));
    await db.players.bulkInsert(structuredClone(libraryPlayers));
    await db.playerGroups.bulkInsert(structuredClone(libraryGroups));
  }
  active = db;
  return db;
}
