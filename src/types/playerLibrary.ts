export interface PlayerGroup {
  id: string;
  name: string;
}

export interface PlayerLibraryEntry {
  id: string;
  name: string;
  elo?: number;
  groupIds: string[];
}

export interface PlayerLibrary {
  groups: PlayerGroup[];
  players: PlayerLibraryEntry[];
}
