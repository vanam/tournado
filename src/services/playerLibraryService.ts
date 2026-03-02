import { PLAYER_LIBRARY_KEY } from '../constants';
import type { PlayerLibrary, PlayerLibraryEntry, PlayerGroup } from '../types';

export function loadLibrary(): PlayerLibrary {
  try {
    const raw = localStorage.getItem(PLAYER_LIBRARY_KEY);
    if (raw === null) return { groups: [], players: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      Array.isArray((parsed as PlayerLibrary).groups) &&
      Array.isArray((parsed as PlayerLibrary).players)
    ) {
      return parsed as PlayerLibrary;
    }
    return { groups: [], players: [] };
  } catch {
    return { groups: [], players: [] };
  }
}

export function saveLibrary(lib: PlayerLibrary): void {
  localStorage.setItem(PLAYER_LIBRARY_KEY, JSON.stringify(lib));
}

export function addGroup(name: string): PlayerLibrary {
  const lib = loadLibrary();
  const group: PlayerGroup = { id: crypto.randomUUID(), name };
  lib.groups.push(group);
  saveLibrary(lib);
  return lib;
}

export function updateGroup(id: string, name: string): PlayerLibrary {
  const lib = loadLibrary();
  const group = lib.groups.find((g) => g.id === id);
  if (group !== undefined) {
    group.name = name;
  }
  saveLibrary(lib);
  return lib;
}

export function deleteGroup(id: string): PlayerLibrary {
  const lib = loadLibrary();
  lib.groups = lib.groups.filter((g) => g.id !== id);
  lib.players = lib.players.map((p) => ({
    ...p,
    groupIds: p.groupIds.filter((gid) => gid !== id),
  }));
  saveLibrary(lib);
  return lib;
}

export function addPlayer(name: string, elo?: number, groupIds: string[] = []): PlayerLibrary {
  const lib = loadLibrary();
  const player: PlayerLibraryEntry = { id: crypto.randomUUID(), name, groupIds };
  if (elo !== undefined) {
    player.elo = elo;
  }
  lib.players.push(player);
  saveLibrary(lib);
  return lib;
}

export function updatePlayer(id: string, patch: Partial<Omit<PlayerLibraryEntry, 'id'>>): PlayerLibrary {
  const lib = loadLibrary();
  const idx = lib.players.findIndex((p) => p.id === id);
  if (idx !== -1) {
    lib.players[idx] = { ...lib.players[idx], ...patch } as PlayerLibraryEntry;
  }
  saveLibrary(lib);
  return lib;
}

export function deletePlayer(id: string): PlayerLibrary {
  const lib = loadLibrary();
  lib.players = lib.players.filter((p) => p.id !== id);
  saveLibrary(lib);
  return lib;
}

export function deleteAllPlayers(): PlayerLibrary {
  const lib = loadLibrary();
  lib.players = [];
  saveLibrary(lib);
  return lib;
}

export function deleteAllGroups(): PlayerLibrary {
  const lib = loadLibrary();
  lib.groups = [];
  lib.players = lib.players.map((p) => ({ ...p, groupIds: [] }));
  saveLibrary(lib);
  return lib;
}
