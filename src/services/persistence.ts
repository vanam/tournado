import type { Tournament, TournamentStorageAdapter, PersistenceService } from '../types';
import { createLocalStorageAdapter } from './localStorageAdapter';
import { STORAGE_KEY } from '../constants';

export function createPersistenceService(
  adapter: TournamentStorageAdapter = createLocalStorageAdapter()
): PersistenceService {
  const subscribers = new Set<() => void>();
  const cache = new Map<string, Tournament>();

  function notify(): void {
    for (const cb of subscribers) {
      cb();
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.storageArea !== localStorage) return;
      if (event.key !== null && event.key !== STORAGE_KEY) return;
      cache.clear();
      notify();
    });
  }

  return {
    save(tournament: Tournament): void {
      cache.set(tournament.id, tournament);
      adapter.save(tournament);
      notify();
    },

    load(id: string): Tournament | null {
      const cached = cache.get(id);
      if (cached) return cached;
      const tournament = adapter.load(id);
      if (tournament) {
        cache.set(id, tournament);
      }
      return tournament;
    },

    loadAll(): Tournament[] {
      return adapter.loadAll();
    },

    delete(id: string): void {
      cache.delete(id);
      adapter.delete(id);
      notify();
    },

    deleteAll(): void {
      cache.clear();
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
