import type { Tournament } from './tournament';
import type { PlayerLibrary, PlayerLibraryEntry } from './playerLibrary';

// --- Storage ---

export interface TournamentStorageAdapter {
  loadAll: () => Promise<Tournament[]>;
  load: (id: string) => Promise<Tournament | null>;
  save: (tournament: Tournament) => Promise<void>;
  delete: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
}

export interface PersistenceService {
  save: (tournament: Tournament) => Promise<void>;
  load: (id: string) => Promise<Tournament | null>;
  loadAll: () => Promise<Tournament[]>;
  delete: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  subscribe: (callback: () => void) => () => void;
}

// --- Player Library ---

export interface PlayerLibraryStorageAdapter {
  load: () => Promise<PlayerLibrary>;
  save: (library: PlayerLibrary) => Promise<void>;
}

export interface PlayerLibraryService {
  loadLibrary: () => Promise<PlayerLibrary>;
  saveLibrary: (lib: PlayerLibrary) => Promise<void>;
  addGroup: (name: string) => Promise<PlayerLibrary>;
  updateGroup: (id: string, name: string) => Promise<PlayerLibrary>;
  deleteGroup: (id: string) => Promise<PlayerLibrary>;
  addPlayer: (name: string, elo?: number, groupIds?: string[]) => Promise<PlayerLibrary>;
  updatePlayer: (id: string, patch: Partial<PlayerLibraryEntry>) => Promise<PlayerLibrary>;
  deletePlayer: (id: string) => Promise<PlayerLibrary>;
  deleteAllPlayers: () => Promise<PlayerLibrary>;
  deleteAllGroups: () => Promise<PlayerLibrary>;
  subscribe: (callback: () => void) => () => void;
}

// --- Match ID Generation ---

export interface MatchIdGenerator {
  nextId: (prefix?: string) => string;
  reset: () => void;
}
