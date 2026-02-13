import type { Tournament } from '../types';

export interface TournamentStorageAdapter {
  loadAll(): Tournament[];
  load(id: string): Tournament | null;
  save(tournament: Tournament): void;
  delete(id: string): void;
  deleteAll(): void;
}
