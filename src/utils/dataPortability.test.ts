import { afterEach, expect, it, vi } from 'vitest';

vi.mock('../db', () => ({ getDatabase: vi.fn() }));
afterEach(() => { vi.unstubAllGlobals(); });

it('loads import validation and rejects invalid entities with runtime code generation blocked', async () => {
  vi.resetModules();
  const blocked = vi.fn((): never => { throw new EvalError('Runtime code generation blocked by CSP'); });
  vi.stubGlobal('Function', new Proxy(globalThis.Function, { apply: blocked, construct: blocked }));
  const { parseExportFile } = await import('./dataPortability');
  const payload = {
    version: 4, exportedAt: '',
    tournaments: [{ id: 't1', name: 'CSP tournament', version: 1, createdAt: '', format: 'SINGLE_ELIM',
      players: [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
      bracket: { rounds: [[{ id: 'm1', player1Id: 'p1', player2Id: 'p2', scores: [], winnerId: null, walkover: false, dummy: false }]] },
    }],
    players: [{ id: 'p1', name: 'Alice', version: 1, groupIds: [], elo: 1500 }],
    groups: [{ id: 'g1', name: 'Club', version: 1 }],
  };
  expect(parseExportFile(JSON.stringify(payload))).toEqual(payload);
  expect(parseExportFile(JSON.stringify({ ...payload, players: [{ id: 'p1', name: 'Invalid', version: 1 }] }))).toBeNull();
  expect(parseExportFile(JSON.stringify({ ...payload, groups: [{ id: 'g1', version: 1 }] }))).toBeNull();
  expect(parseExportFile(JSON.stringify({ ...payload, tournaments: [{ ...payload.tournaments[0], bracket: undefined }] }))).toBeNull();
  expect(parseExportFile(JSON.stringify({ ...payload, players: [{ ...payload.players[0], elo: 'invalid' }] }))).toBeNull();
  expect(blocked).not.toHaveBeenCalled();
});
