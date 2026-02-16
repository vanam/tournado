import type { Tournament, TournamentStorageAdapter, PersistenceService } from '../types';
import { createLocalStorageAdapter } from './localStorageAdapter';

export function createPersistenceService(
  adapter: TournamentStorageAdapter = createLocalStorageAdapter()
): PersistenceService {
  const subscribers = new Set<() => void>();

  function notify(): void {
    for (const cb of subscribers) {
      cb();
    }
  }

  return {
    save(tournament: Tournament): void {
      adapter.save(tournament);
      notify();
    },

    load(id: string): Tournament | null {
      return adapter.load(id);
    },

    loadAll(): Tournament[] {
      return adapter.loadAll();
    },

    delete(id: string): void {
      adapter.delete(id);
      notify();
    },

    deleteAll(): void {
      adapter.deleteAll();
      notify();
    },

    subscribe(callback: () => void): () => void {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
  };
}

export const persistence = createPersistenceService();
