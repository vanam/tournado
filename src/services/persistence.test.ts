import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPersistenceService } from './persistence';
import { createMemoryStorageAdapter } from './memoryStorageAdapter';
import { Format } from '../types';
import type { Tournament, PersistenceService } from '../types';

function makeTournament(id: string, name: string): Tournament {
  return {
    id,
    name,
    version: 1,
    players: [],
    createdAt: '2024-01-01',
    format: Format.SINGLE_ELIM,
    bracket: { rounds: [], thirdPlaceMatch: null },
  };
}

describe('PersistenceService', () => {
  let service: PersistenceService;

  beforeEach(() => {
    service = createPersistenceService(createMemoryStorageAdapter());
  });

  describe('loadAll', () => {
    it('returns empty array when storage is empty', async () => {
      expect(await service.loadAll()).toEqual([]);
    });

    it('returns tournaments from storage', async () => {
      const tournament = makeTournament('t1', 'Test');
      await service.save(tournament);
      expect(await service.loadAll()).toHaveLength(1);
    });
  });

  describe('load', () => {
    it('returns null when tournament not found', async () => {
      expect(await service.load('nonexistent')).toBeNull();
    });

    it('returns tournament by id', async () => {
      await service.save(makeTournament('t1', 'Test'));
      const loaded = await service.load('t1');
      expect(loaded?.name).toBe('Test');
    });
  });

  describe('save', () => {
    it('saves a new tournament', async () => {
      const tournament = makeTournament('t1', 'Test');
      await service.save(tournament);
      const all = await service.loadAll();
      expect(all).toHaveLength(1);
      const loaded = await service.load('t1');
      expect(loaded?.name).toBe('Test');
    });

    it('updates an existing tournament', async () => {
      await service.save(makeTournament('t1', 'Old'));
      await service.save(makeTournament('t1', 'New'));
      const all = await service.loadAll();
      expect(all).toHaveLength(1);
      const loaded = await service.load('t1');
      expect(loaded?.name).toBe('New');
    });

    it('notifies subscribers on save', async () => {
      const callback = vi.fn();
      service.subscribe(callback);
      await service.save(makeTournament('t1', 'Test'));
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('deletes a tournament by id', async () => {
      await service.save(makeTournament('t1', 'One'));
      await service.save(makeTournament('t2', 'Two'));
      await service.delete('t1');
      expect(await service.load('t1')).toBeNull();
      expect(await service.loadAll()).toHaveLength(1);
    });

    it('notifies subscribers on delete', async () => {
      await service.save(makeTournament('t1', 'Test'));
      const callback = vi.fn();
      service.subscribe(callback);
      await service.delete('t1');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteAll', () => {
    it('deletes all tournaments', async () => {
      await service.save(makeTournament('t1', 'One'));
      await service.save(makeTournament('t2', 'Two'));
      await service.deleteAll();
      expect(await service.loadAll()).toEqual([]);
    });

    it('notifies subscribers on deleteAll', async () => {
      const callback = vi.fn();
      service.subscribe(callback);
      await service.deleteAll();
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribe', () => {
    it('returns unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('unsubscribe removes callback from subscribers', async () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);
      unsubscribe();
      await service.save(makeTournament('t1', 'Test'));
      expect(callback).not.toHaveBeenCalled();
    });

    it('multiple subscribers are all notified', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      service.subscribe(callback1);
      service.subscribe(callback2);
      await service.save(makeTournament('t1', 'Test'));
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });
});
