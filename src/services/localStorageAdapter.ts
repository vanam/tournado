import { STORAGE_KEY } from '../constants';
import type { Tournament, TournamentStorageAdapter } from '../types';
import { validateTournaments } from '../utils/validation';

export function createLocalStorageAdapter(): TournamentStorageAdapter {
  return {
    loadAll(): Tournament[] {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        return validateTournaments(data ? JSON.parse(data) : []);
      } catch {
        return [];
      }
    },

    load(id: string): Tournament | null {
      return this.loadAll().find((t) => t.id === id) ?? null;
    },

    save(tournament: Tournament): void {
      const tournaments = this.loadAll();
      const index = tournaments.findIndex((t) => t.id === tournament.id);
      if (index === -1) {
        tournaments.push(tournament);
      } else {
        tournaments[index] = tournament;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
    },

    delete(id: string): void {
      const tournaments = this.loadAll().filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
    },

    deleteAll(): void {
      localStorage.setItem(STORAGE_KEY, '[]');
    },
  };
}
