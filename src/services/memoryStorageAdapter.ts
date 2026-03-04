import type { Tournament, TournamentStorageAdapter } from '../types';

export function createMemoryStorageAdapter(initialData: Tournament[] = []): TournamentStorageAdapter {
  let tournaments: Tournament[] = [...initialData];

  return {
    loadAll(): Promise<Tournament[]> {
      return Promise.resolve([...tournaments]);
    },

    load(id: string): Promise<Tournament | null> {
      return Promise.resolve(tournaments.find((t) => t.id === id) ?? null);
    },

    save(tournament: Tournament): Promise<void> {
      const index = tournaments.findIndex((t) => t.id === tournament.id);
      if (index === -1) {
        tournaments.push(tournament);
      } else {
        tournaments[index] = tournament;
      }
      return Promise.resolve();
    },

    delete(id: string): Promise<void> {
      tournaments = tournaments.filter((t) => t.id !== id);
      return Promise.resolve();
    },

    deleteAll(): Promise<void> {
      tournaments = [];
      return Promise.resolve();
    },
  };
}
