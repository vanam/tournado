import type { Tournament } from '../types';
import type { TournamentStorageAdapter } from './storageAdapter';

export function createMemoryStorageAdapter(initialData: Tournament[] = []): TournamentStorageAdapter {
  let tournaments: Tournament[] = [...initialData];

  return {
    loadAll(): Tournament[] {
      return [...tournaments];
    },

    load(id: string): Tournament | null {
      return tournaments.find((t) => t.id === id) ?? null;
    },

    save(tournament: Tournament): void {
      const index = tournaments.findIndex((t) => t.id === tournament.id);
      if (index === -1) {
        tournaments.push(tournament);
      } else {
        tournaments[index] = tournament;
      }
    },

    delete(id: string): void {
      tournaments = tournaments.filter((t) => t.id !== id);
    },

    deleteAll(): void {
      tournaments = [];
    },
  };
}
