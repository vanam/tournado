import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPlayerLibraryService } from './playerLibraryService';
import { createMemoryPlayerLibraryAdapter } from './memoryPlayerLibraryAdapter';
import type { PlayerLibraryService } from '../types';

describe('PlayerLibraryService', () => {
  let service: PlayerLibraryService;

  beforeEach(() => {
    service = createPlayerLibraryService(createMemoryPlayerLibraryAdapter());
  });

  describe('loadLibrary', () => {
    it('returns empty library initially', async () => {
      const lib = await service.loadLibrary();
      expect(lib.groups).toEqual([]);
      expect(lib.players).toEqual([]);
    });
  });

  describe('addGroup', () => {
    it('adds a group', async () => {
      const lib = await service.addGroup('Group A');
      expect(lib.groups).toHaveLength(1);
      const group = lib.groups.at(0);
      expect(group?.name).toBe('Group A');
    });

    it('notifies subscribers on addGroup', async () => {
      const callback = vi.fn();
      service.subscribe(callback);
      await service.addGroup('Group A');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateGroup', () => {
    it('updates group name', async () => {
      const added = await service.addGroup('Old Name');
      const id = added.groups.at(0)?.id;
      expect(id).toBeDefined();
      if (id === undefined) return;
      const updated = await service.updateGroup(id, 'New Name');
      expect(updated.groups.at(0)?.name).toBe('New Name');
    });

    it('notifies subscribers on updateGroup', async () => {
      const added = await service.addGroup('G');
      const id = added.groups.at(0)?.id;
      expect(id).toBeDefined();
      if (id === undefined) return;
      const callback = vi.fn();
      service.subscribe(callback);
      await service.updateGroup(id, 'G2');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteGroup', () => {
    it('deletes group and removes it from players', async () => {
      const withGroup = await service.addGroup('G');
      const gid = withGroup.groups.at(0)?.id;
      expect(gid).toBeDefined();
      if (gid === undefined) return;
      await service.addPlayer('Alice', undefined, [gid]);
      const lib = await service.deleteGroup(gid);
      expect(lib.groups).toHaveLength(0);
      expect(lib.players.at(0)?.groupIds).toEqual([]);
    });

    it('notifies subscribers on deleteGroup', async () => {
      const added = await service.addGroup('G');
      const id = added.groups.at(0)?.id;
      expect(id).toBeDefined();
      if (id === undefined) return;
      const callback = vi.fn();
      service.subscribe(callback);
      await service.deleteGroup(id);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('addPlayer', () => {
    it('adds a player without elo', async () => {
      const lib = await service.addPlayer('Alice');
      expect(lib.players).toHaveLength(1);
      const player = lib.players.at(0);
      expect(player?.name).toBe('Alice');
      expect(player?.elo).toBeUndefined();
    });

    it('adds a player with elo and groupIds', async () => {
      const lib = await service.addPlayer('Bob', 1200, ['g1']);
      const player = lib.players.at(0);
      expect(player?.elo).toBe(1200);
      expect(player?.groupIds).toEqual(['g1']);
    });

    it('notifies subscribers on addPlayer', async () => {
      const callback = vi.fn();
      service.subscribe(callback);
      await service.addPlayer('Alice');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePlayer', () => {
    it('patches player fields', async () => {
      const added = await service.addPlayer('Alice', 1000);
      const id = added.players.at(0)?.id;
      expect(id).toBeDefined();
      if (id === undefined) return;
      const updated = await service.updatePlayer(id, { elo: 1100 });
      const player = updated.players.at(0);
      expect(player?.elo).toBe(1100);
      expect(player?.name).toBe('Alice');
    });

    it('notifies subscribers on updatePlayer', async () => {
      const added = await service.addPlayer('Alice');
      const id = added.players.at(0)?.id;
      expect(id).toBeDefined();
      if (id === undefined) return;
      const callback = vi.fn();
      service.subscribe(callback);
      await service.updatePlayer(id, { name: 'Bob' });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('deletePlayer', () => {
    it('deletes a player', async () => {
      const added = await service.addPlayer('Alice');
      const id = added.players.at(0)?.id;
      expect(id).toBeDefined();
      if (id === undefined) return;
      const lib = await service.deletePlayer(id);
      expect(lib.players).toHaveLength(0);
    });

    it('notifies subscribers on deletePlayer', async () => {
      const added = await service.addPlayer('Alice');
      const id = added.players.at(0)?.id;
      expect(id).toBeDefined();
      if (id === undefined) return;
      const callback = vi.fn();
      service.subscribe(callback);
      await service.deletePlayer(id);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteAllPlayers', () => {
    it('removes all players', async () => {
      await service.addPlayer('Alice');
      await service.addPlayer('Bob');
      const lib = await service.deleteAllPlayers();
      expect(lib.players).toEqual([]);
    });

    it('notifies subscribers on deleteAllPlayers', async () => {
      const callback = vi.fn();
      service.subscribe(callback);
      await service.deleteAllPlayers();
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteAllGroups', () => {
    it('removes all groups and clears groupIds from players', async () => {
      const withGroup = await service.addGroup('G');
      const gid = withGroup.groups.at(0)?.id;
      expect(gid).toBeDefined();
      if (gid === undefined) return;
      await service.addPlayer('Alice', undefined, [gid]);
      const lib = await service.deleteAllGroups();
      expect(lib.groups).toEqual([]);
      expect(lib.players.at(0)?.groupIds).toEqual([]);
    });

    it('notifies subscribers on deleteAllGroups', async () => {
      const callback = vi.fn();
      service.subscribe(callback);
      await service.deleteAllGroups();
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribe', () => {
    it('returns an unsubscribe function', () => {
      const unsubscribe = service.subscribe(vi.fn());
      expect(typeof unsubscribe).toBe('function');
    });

    it('unsubscribe removes callback', async () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);
      unsubscribe();
      await service.addPlayer('Alice');
      expect(callback).not.toHaveBeenCalled();
    });

    it('multiple subscribers are all notified', async () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      service.subscribe(cb1);
      service.subscribe(cb2);
      await service.addPlayer('Alice');
      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveLibrary', () => {
    it('replaces the library and notifies', async () => {
      const callback = vi.fn();
      service.subscribe(callback);
      await service.saveLibrary({ groups: [{ id: 'g1', name: 'G' }], players: [] });
      const lib = await service.loadLibrary();
      expect(lib.groups).toHaveLength(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
