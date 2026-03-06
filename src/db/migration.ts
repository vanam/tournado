import type { Tournament } from '../types/tournament';
import type { PlayerLibraryEntry, PlayerGroup } from '../types/playerLibrary';
import type { TournadoDatabase } from './collections';

const MIGRATION_KEY = 'tournado-rxdb-migrated';
const OLD_DB_NAME = 'tournado';

export async function migrateFromOldDatabase(db: TournadoDatabase): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const oldData = await readOldDatabase();
  if (!oldData) {
    localStorage.setItem(MIGRATION_KEY, '1');
    return;
  }

  const { tournaments, players, groups } = oldData;

  if (tournaments.length > 0) {
    await db.tournaments.bulkInsert(tournaments);
  }
  if (players.length > 0) {
    await db.players.bulkInsert(players);
  }
  if (groups.length > 0) {
    await db.playerGroups.bulkInsert(groups);
  }

  localStorage.setItem(MIGRATION_KEY, '1');
}

interface OldData {
  tournaments: Tournament[];
  players: PlayerLibraryEntry[];
  groups: PlayerGroup[];
}

function readOldDatabase(): Promise<OldData | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(OLD_DB_NAME);

    request.addEventListener('error', () => {
      resolve(null);
    });

    request.onsuccess = (): void => {
      const db = request.result;
      const storeNames = new Set(db.objectStoreNames);

      if (
        !storeNames.has('tournaments') ||
        !storeNames.has('players') ||
        !storeNames.has('groups')
      ) {
        db.close();
        resolve(null);
        return;
      }

      const tx = db.transaction(['tournaments', 'players', 'groups'], 'readonly');
      const result: OldData = { tournaments: [], players: [], groups: [] };

      const tournamentsReq = tx.objectStore('tournaments').getAll();
      const playersReq = tx.objectStore('players').getAll();
      const groupsReq = tx.objectStore('groups').getAll();

      tx.oncomplete = (): void => {
        result.tournaments = tournamentsReq.result as Tournament[];
        result.players = playersReq.result as PlayerLibraryEntry[];
        result.groups = groupsReq.result as PlayerGroup[];
        db.close();
        resolve(result);
      };

      tx.addEventListener('error', () => {
        db.close();
        resolve(null);
      });
    };

    request.onupgradeneeded = (): void => {
      // Old DB doesn't exist - abort so we don't create it
      request.transaction?.abort();
      resolve(null);
    };
  });
}
