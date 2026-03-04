import type { Tournament, TournamentStorageAdapter } from '../types';
import { validateTournaments } from '../utils/validation';
import { openDb, txPromise } from './db';

const STORE_NAME = 'tournaments';

export function createIndexedDbAdapter(): TournamentStorageAdapter {
  return {
    async loadAll(): Promise<Tournament[]> {
      const db = await openDb();
      const raw = await txPromise<unknown[]>(db, STORE_NAME, 'readonly', (store) => store.getAll());
      return validateTournaments(raw);
    },

    async load(id: string): Promise<Tournament | null> {
      const db = await openDb();
      const raw = await txPromise<unknown>(db, STORE_NAME, 'readonly', (store) => store.get(id));
      if (raw === undefined) return null;
      const validated = validateTournaments([raw]);
      return validated.at(0) ?? null;
    },

    async save(tournament: Tournament): Promise<void> {
      const db = await openDb();
      await txPromise(db, STORE_NAME, 'readwrite', (store) => store.put(tournament));
    },

    async delete(id: string): Promise<void> {
      const db = await openDb();
      await txPromise(db, STORE_NAME, 'readwrite', (store) => store.delete(id));
    },

    async deleteAll(): Promise<void> {
      const db = await openDb();
      await txPromise(db, STORE_NAME, 'readwrite', (store) => store.clear());
    },
  };
}
