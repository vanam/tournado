import type { Tournament } from './tournament';

// --- Storage ---

export interface TournamentStorageAdapter {
  loadAll: () => Tournament[];
  load: (id: string) => Tournament | null;
  save: (tournament: Tournament) => void;
  delete: (id: string) => void;
  deleteAll: () => void;
}

export interface PersistenceService {
  save: (tournament: Tournament) => void;
  load: (id: string) => Tournament | null;
  loadAll: () => Tournament[];
  delete: (id: string) => void;
  deleteAll: () => void;
  subscribe: (callback: () => void) => () => void;
}

// --- Match ID Generation ---

export interface MatchIdGenerator {
  nextId: (prefix?: string) => string;
  reset: () => void;
}
