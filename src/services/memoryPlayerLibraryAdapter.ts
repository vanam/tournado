import type { PlayerLibrary, PlayerLibraryStorageAdapter } from '../types';

export function createMemoryPlayerLibraryAdapter(
  initial?: PlayerLibrary
): PlayerLibraryStorageAdapter {
  let library: PlayerLibrary = initial ? { ...initial } : { groups: [], players: [] };

  return {
    load(): Promise<PlayerLibrary> {
      return Promise.resolve({ ...library, groups: [...library.groups], players: [...library.players] });
    },

    save(lib: PlayerLibrary): Promise<void> {
      library = lib;
      return Promise.resolve();
    },
  };
}
