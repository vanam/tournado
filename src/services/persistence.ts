import type { Tournament, TournamentStorageAdapter, PersistenceService } from '../types';
import { createIndexedDbAdapter } from './indexedDbAdapter';

export function createPersistenceService(
  adapter: TournamentStorageAdapter = createIndexedDbAdapter()
): PersistenceService {
  const subscribers = new Set<() => void>();
  const cache = new Map<string, Tournament>();

  function notify(): void {
    for (const cb of subscribers) {
      cb();
    }
  }

  return {
    async save(tournament: Tournament): Promise<void> {
      cache.set(tournament.id, tournament);
      await adapter.save(tournament);
      notify();
    },

    async load(id: string): Promise<Tournament | null> {
      const cached = cache.get(id);
      if (cached) return cached;
      const tournament = await adapter.load(id);
      if (tournament) {
        cache.set(id, tournament);
      }
      return tournament;
    },

    async loadAll(): Promise<Tournament[]> {
      return adapter.loadAll();
    },

    async delete(id: string): Promise<void> {
      cache.delete(id);
      await adapter.delete(id);
      notify();
    },

    async deleteAll(): Promise<void> {
      cache.clear();
      await adapter.deleteAll();
      notify();
    },

    subscribe(callback: () => void): () => void {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
  };
}

export const persistence = createPersistenceService();
