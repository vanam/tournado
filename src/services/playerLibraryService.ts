import type { PlayerLibrary, PlayerLibraryEntry, PlayerGroup, PlayerLibraryStorageAdapter, PlayerLibraryService } from '../types';
import { createIndexedDbPlayerLibraryAdapter } from './indexedDbPlayerLibraryAdapter';
import { PLAYER_VERSION, GROUP_VERSION } from '../utils/dataPortability';

export function createPlayerLibraryService(
  adapter: PlayerLibraryStorageAdapter = createIndexedDbPlayerLibraryAdapter()
): PlayerLibraryService {
  const subscribers = new Set<() => void>();

  function notify(): void {
    for (const cb of subscribers) {
      cb();
    }
  }

  async function persist(lib: PlayerLibrary): Promise<PlayerLibrary> {
    await adapter.save(lib);
    notify();
    return lib;
  }

  return {
    async loadLibrary(): Promise<PlayerLibrary> {
      return adapter.load();
    },

    async saveLibrary(lib: PlayerLibrary): Promise<void> {
      await persist(lib);
    },

    async addGroup(name: string): Promise<PlayerLibrary> {
      const lib = await adapter.load();
      const group: PlayerGroup = { id: crypto.randomUUID(), name, version: GROUP_VERSION };
      return persist({ ...lib, groups: [...lib.groups, group] });
    },

    async updateGroup(id: string, name: string): Promise<PlayerLibrary> {
      const lib = await adapter.load();
      return persist({
        ...lib,
        groups: lib.groups.map((g) => (g.id === id ? { ...g, name } : g)),
      });
    },

    async reorderGroups(ids: string[]): Promise<PlayerLibrary> {
      const lib = await adapter.load();
      const groupMap = new Map(lib.groups.map((g) => [g.id, g]));
      const reordered = ids.flatMap((id) => {
        const g = groupMap.get(id);
        return g === undefined ? [] : [g];
      });
      return persist({ ...lib, groups: reordered });
    },

    async deleteGroup(id: string): Promise<PlayerLibrary> {
      const lib = await adapter.load();
      return persist({
        groups: lib.groups.filter((g) => g.id !== id),
        players: lib.players.map((p) => ({
          ...p,
          groupIds: p.groupIds.filter((gid) => gid !== id),
        })),
      });
    },

    async addPlayer(name: string, elo?: number, groupIds: string[] = []): Promise<PlayerLibrary> {
      const lib = await adapter.load();
      const player: PlayerLibraryEntry = { id: crypto.randomUUID(), name, version: PLAYER_VERSION, groupIds };
      if (elo !== undefined) {
        player.elo = elo;
      }
      return persist({ ...lib, players: [...lib.players, player] });
    },

    async updatePlayer(id: string, patch: Partial<PlayerLibraryEntry>): Promise<PlayerLibrary> {
      const lib = await adapter.load();
      return persist({
        ...lib,
        players: lib.players.map((p) =>
          p.id === id ? ({ ...p, ...patch } as PlayerLibraryEntry) : p
        ),
      });
    },

    async deletePlayer(id: string): Promise<PlayerLibrary> {
      const lib = await adapter.load();
      return persist({ ...lib, players: lib.players.filter((p) => p.id !== id) });
    },

    async deleteAllPlayers(): Promise<PlayerLibrary> {
      const lib = await adapter.load();
      return persist({ ...lib, players: [] });
    },

    async deleteAllGroups(): Promise<PlayerLibrary> {
      const lib = await adapter.load();
      return persist({
        groups: [],
        players: lib.players.map((p) => ({ ...p, groupIds: [] })),
      });
    },

    subscribe(callback: () => void): () => void {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
  };
}

const _service = createPlayerLibraryService();

export const loadLibrary = (): Promise<PlayerLibrary> => _service.loadLibrary();
export const saveLibrary = (lib: PlayerLibrary): Promise<void> => _service.saveLibrary(lib);
export const addGroup = (name: string): Promise<PlayerLibrary> => _service.addGroup(name);
export const updateGroup = (id: string, name: string): Promise<PlayerLibrary> => _service.updateGroup(id, name);
export const deleteGroup = (id: string): Promise<PlayerLibrary> => _service.deleteGroup(id);
export const reorderGroups = (ids: string[]): Promise<PlayerLibrary> => _service.reorderGroups(ids);
export const addPlayer = (name: string, elo?: number, groupIds?: string[]): Promise<PlayerLibrary> => _service.addPlayer(name, elo, groupIds);
export const updatePlayer = (id: string, patch: Partial<PlayerLibraryEntry>): Promise<PlayerLibrary> => _service.updatePlayer(id, patch);
export const deletePlayer = (id: string): Promise<PlayerLibrary> => _service.deletePlayer(id);
export const deleteAllPlayers = (): Promise<PlayerLibrary> => _service.deleteAllPlayers();
export const deleteAllGroups = (): Promise<PlayerLibrary> => _service.deleteAllGroups();
export const subscribeToPlayerLibrary = (callback: () => void): (() => void) => _service.subscribe(callback);
