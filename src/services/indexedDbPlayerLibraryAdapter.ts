import type { PlayerLibrary, PlayerLibraryStorageAdapter } from '../types';
import { clearAndPutAll, openDb, txPromise } from './db';

const PLAYERS_STORE = 'players';
const GROUPS_STORE = 'groups';

export function createIndexedDbPlayerLibraryAdapter(): PlayerLibraryStorageAdapter {
  return {
    async load(): Promise<PlayerLibrary> {
      const db = await openDb();
      const [groups, players] = await Promise.all([
        txPromise(db, GROUPS_STORE, 'readonly', (store) => store.getAll()),
        txPromise(db, PLAYERS_STORE, 'readonly', (store) => store.getAll()),
      ]);
      return {
        groups: groups as PlayerLibrary['groups'],
        players: players as PlayerLibrary['players'],
      };
    },

    async save(lib: PlayerLibrary): Promise<void> {
      const db = await openDb();
      await Promise.all([
        clearAndPutAll(db, GROUPS_STORE, lib.groups),
        clearAndPutAll(db, PLAYERS_STORE, lib.players),
      ]);
    },
  };
}
