export interface PlayerGroup {
  id: string;
  name: string;
  version: number;
}

export interface PlayerLibraryEntry {
  id: string;
  name: string;
  version: number;
  elo?: number;
  groupIds: string[];
}

export interface PlayerLibrary {
  groups: PlayerGroup[];
  players: PlayerLibraryEntry[];
}
