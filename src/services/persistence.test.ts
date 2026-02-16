import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPersistenceService, type PersistenceService } from './persistence';
import { createMemoryStorageAdapter } from './memoryStorageAdapter';
import { FORMATS } from '../types';
import type { Tournament } from '../types';

function makeTournament(id: string, name: string): Tournament {
  return {
    id,
    name,
    players: [],
    createdAt: '2024-01-01',
    format: FORMATS.SINGLE_ELIM,
    bracket: { rounds: [], thirdPlaceMatch: null },
  };
}

describe('PersistenceService', () => {
  let service: PersistenceService;

  beforeEach(() => {
    service = createPersistenceService(createMemoryStorageAdapter());
  });

  describe('loadAll', () => {
    it('returns empty array when storage is empty', () => {
      expect(service.loadAll()).toEqual([]);
    });

    it('returns tournaments from storage', () => {
      const tournament = makeTournament('t1', 'Test');
      service.save(tournament);
      expect(service.loadAll()).toHaveLength(1);
    });
  });

  describe('load', () => {
    it('returns null when tournament not found', () => {
      expect(service.load('nonexistent')).toBeNull();
    });

    it('returns tournament by id', () => {
      service.save(makeTournament('t1', 'Test'));
      expect(service.load('t1')?.name).toBe('Test');
    });
  });

  describe('save', () => {
    it('saves a new tournament', () => {
      const tournament = makeTournament('t1', 'Test');
      service.save(tournament);
      expect(service.loadAll()).toHaveLength(1);
      expect(service.load('t1')?.name).toBe('Test');
    });

    it('updates an existing tournament', () => {
      service.save(makeTournament('t1', 'Old'));
      service.save(makeTournament('t1', 'New'));
      expect(service.loadAll()).toHaveLength(1);
      expect(service.load('t1')?.name).toBe('New');
    });

    it('notifies subscribers on save', () => {
      const callback = vi.fn();
      service.subscribe(callback);
      service.save(makeTournament('t1', 'Test'));
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('deletes a tournament by id', () => {
      service.save(makeTournament('t1', 'One'));
      service.save(makeTournament('t2', 'Two'));
      service.delete('t1');
      expect(service.load('t1')).toBeNull();
      expect(service.loadAll()).toHaveLength(1);
    });

    it('notifies subscribers on delete', () => {
      service.save(makeTournament('t1', 'Test'));
      const callback = vi.fn();
      service.subscribe(callback);
      service.delete('t1');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteAll', () => {
    it('deletes all tournaments', () => {
      service.save(makeTournament('t1', 'One'));
      service.save(makeTournament('t2', 'Two'));
      service.deleteAll();
      expect(service.loadAll()).toEqual([]);
    });

    it('notifies subscribers on deleteAll', () => {
      const callback = vi.fn();
      service.subscribe(callback);
      service.deleteAll();
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribe', () => {
    it('returns unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('unsubscribe removes callback from subscribers', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);
      unsubscribe();
      service.save(makeTournament('t1', 'Test'));
      expect(callback).not.toHaveBeenCalled();
    });

    it('multiple subscribers are all notified', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      service.subscribe(callback1);
      service.subscribe(callback2);
      service.save(makeTournament('t1', 'Test'));
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });
});
