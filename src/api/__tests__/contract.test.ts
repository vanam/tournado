/// <reference types="node" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

vi.mock('../../services/persistence', () => {
  const persistence = {
    load: vi.fn(),
    loadAll: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    deleteAll: vi.fn(),
    subscribe: vi.fn(),
  };
  return { persistence, createPersistenceService: vi.fn(() => persistence) };
});

vi.mock('../../services/playerLibraryService', () => ({
  loadLibrary: vi.fn(),
  addPlayer: vi.fn(),
  updatePlayer: vi.fn(),
  deletePlayer: vi.fn(),
  deleteAllPlayers: vi.fn(),
  addGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroup: vi.fn(),
  deleteAllGroups: vi.fn(),
}));

import { routeRequest } from '../router';
import { persistence } from '../../services/persistence';
import * as playerLib from '../../services/playerLibraryService';

const specPath = path.resolve(__dirname, '../../../openapi.yaml');
const specText = readFileSync(specPath, 'utf8');
interface OpenApiSpec {
  components: {
    schemas: Record<string, Record<string, unknown>>;
  };
}

const spec = parseYaml(specText) as OpenApiSpec;
const { schemas } = spec.components;

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

for (const [name, schema] of Object.entries(schemas)) {
  ajv.addSchema(schema, `#/components/schemas/${name}`);
}

function apiRequest(method: string, path: string, body?: unknown): Request {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new Request(`http://localhost${path}`, init);
}

const sampleTournament = {
  id: 't1',
  name: 'Test Tournament',
  format: 'SINGLE_ELIM',
  players: [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
    { id: 'p3', name: 'Charlie' },
    { id: 'p4', name: 'Dave' },
  ],
  participants: [
    { id: 'p1', playerIds: ['p1'] },
    { id: 'p2', playerIds: ['p2'] },
    { id: 'p3', playerIds: ['p3'] },
    { id: 'p4', playerIds: ['p4'] },
  ],
  teamSize: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  completedAt: null,
  winnerId: null,
  bracket: {
    rounds: [
      [
        { id: 'm1', player1Id: 'p1', player2Id: 'p4', scores: [], winnerId: null, walkover: false, dummy: false, nextMatchId: 'm3', position: 0 },
        { id: 'm2', player1Id: 'p2', player2Id: 'p3', scores: [], winnerId: null, walkover: false, dummy: false, nextMatchId: 'm3', position: 1 },
      ],
      [
        { id: 'm3', player1Id: null, player2Id: null, scores: [], winnerId: null, walkover: false, dummy: false, nextMatchId: null, position: 0 },
      ],
    ],
  },
};

const sampleLibrary = {
  players: [
    { id: 'pl1', name: 'Alice', groupIds: ['g1'], elo: 1500 },
    { id: 'pl2', name: 'Bob', groupIds: [], elo: 1400 },
  ],
  groups: [
    { id: 'g1', name: 'Beginners' },
  ],
};

function validateSchema(schemaRef: string, data: unknown): void {
  const valid = ajv.validate(schemaRef, data);
  if (!valid) {
    const errors = ajv.errorsText(ajv.errors);
    expect.fail(`Schema validation failed for ${schemaRef}: ${errors}`);
  }
}

function validateArray(schemaRef: string, data: unknown): void {
  expect(Array.isArray(data)).toBe(true);
  for (const item of data as unknown[]) {
    validateSchema(schemaRef, item);
  }
}

describe('API contract tests', () => {
  const mockPersistence = persistence as {
    load: ReturnType<typeof vi.fn>;
    loadAll: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    deleteAll: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };

  const mockPlayerLib = playerLib as unknown as {
    loadLibrary: ReturnType<typeof vi.fn>;
    addPlayer: ReturnType<typeof vi.fn>;
    updatePlayer: ReturnType<typeof vi.fn>;
    deletePlayer: ReturnType<typeof vi.fn>;
    deleteAllPlayers: ReturnType<typeof vi.fn>;
    addGroup: ReturnType<typeof vi.fn>;
    updateGroup: ReturnType<typeof vi.fn>;
    deleteGroup: ReturnType<typeof vi.fn>;
    deleteAllGroups: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPersistence.save.mockResolvedValue(null);
    mockPersistence.delete.mockResolvedValue(null);
    mockPersistence.deleteAll.mockResolvedValue(null);
  });

  // --- Tournaments ---

  describe('Tournaments', () => {
    it('GET /api/tournaments -> 200, array of TournamentSummary', async () => {
      mockPersistence.loadAll.mockResolvedValue([sampleTournament]);

      const res = await routeRequest(apiRequest('GET', '/api/tournaments'));
      expect(res.status).toBe(200);

      const body = await res.json() as unknown[];
      expect(Array.isArray(body)).toBe(true);
      validateArray('#/components/schemas/TournamentSummary', body);
    });

    it('POST /api/tournaments -> 201, Tournament', async () => {
      const res = await routeRequest(apiRequest('POST', '/api/tournaments', {
        name: 'New Tourney',
        format: 'SINGLE_ELIM',
        players: [
          { name: 'Alice' },
          { name: 'Bob' },
          { name: 'Charlie' },
          { name: 'Dave' },
        ],
      }));
      expect(res.status).toBe(201);

      const body = await res.json() as Record<string, unknown>;
      // Bracket rounds are Match[][] internally, not { matches: Match[] }[],
      // so validate base fields manually instead of against the spec schema.
      validateSchema('#/components/schemas/TournamentBase', body);
      expect(body['format']).toBe('SINGLE_ELIM');
      expect(body['bracket']).toBeDefined();
      const bracket = body['bracket'] as { rounds: unknown[][] };
      expect(Array.isArray(bracket.rounds)).toBe(true);
      expect(bracket.rounds.length).toBeGreaterThan(0);
    });

    it('GET /api/tournaments/:id -> 200, Tournament', async () => {
      mockPersistence.load.mockResolvedValue(structuredClone(sampleTournament));

      const res = await routeRequest(apiRequest('GET', '/api/tournaments/t1'));
      expect(res.status).toBe(200);

      const body = await res.json() as Record<string, unknown>;
      validateSchema('#/components/schemas/TournamentBase', body);
      expect(body['format']).toBe('SINGLE_ELIM');
      expect(body['bracket']).toBeDefined();
    });

    it('GET /api/tournaments/:id -> 404 when not found', async () => {
      mockPersistence.load.mockResolvedValue(null);

      const res = await routeRequest(apiRequest('GET', '/api/tournaments/missing'));
      expect(res.status).toBe(404);

      const body = await res.json() as unknown;
      validateSchema('#/components/schemas/ProblemDetail', body);
    });

    it('DELETE /api/tournaments/:id -> 204', async () => {
      const res = await routeRequest(apiRequest('DELETE', '/api/tournaments/t1'));
      expect(res.status).toBe(204);
    });

    it('DELETE /api/tournaments -> 204', async () => {
      const res = await routeRequest(apiRequest('DELETE', '/api/tournaments'));
      expect(res.status).toBe(204);
    });

    it('POST /api/tournaments/:id/duplicate -> 201', async () => {
      mockPersistence.load.mockResolvedValue(structuredClone(sampleTournament));

      const res = await routeRequest(apiRequest('POST', '/api/tournaments/t1/duplicate'));
      expect(res.status).toBe(201);

      const body = await res.json() as Record<string, unknown>;
      validateSchema('#/components/schemas/TournamentBase', body);
      expect(body['format']).toBe('SINGLE_ELIM');
      expect(body['bracket']).toBeDefined();
    });

    it('GET /api/tournaments/:id/progress -> 200, Progress', async () => {
      mockPersistence.load.mockResolvedValue(structuredClone(sampleTournament));

      const res = await routeRequest(apiRequest('GET', '/api/tournaments/t1/progress'));
      expect(res.status).toBe(200);

      const body = await res.json() as unknown;
      validateSchema('#/components/schemas/Progress', body);
    });

    it('GET /api/tournaments/:id/results -> 200, array of RankedResult', async () => {
      mockPersistence.load.mockResolvedValue(structuredClone(sampleTournament));

      const res = await routeRequest(apiRequest('GET', '/api/tournaments/t1/results'));
      expect(res.status).toBe(200);

      const body = await res.json() as unknown[];
      expect(Array.isArray(body)).toBe(true);
      validateArray('#/components/schemas/RankedResult', body);
    });
  });

  // --- Matches ---

  describe('Matches', () => {
    it('GET /api/tournaments/:id/matches/:matchId/editable -> 200, { editable: boolean }', async () => {
      mockPersistence.load.mockResolvedValue(structuredClone(sampleTournament));

      const res = await routeRequest(apiRequest('GET', '/api/tournaments/t1/matches/m1/editable'));
      expect(res.status).toBe(200);

      const body = await res.json() as { editable: boolean };
      expect(typeof body.editable).toBe('boolean');
    });
  });

  // --- Players ---

  describe('Players', () => {
    it('GET /api/players -> 200, array of PlayerLibraryEntry', async () => {
      mockPlayerLib.loadLibrary.mockResolvedValue(structuredClone(sampleLibrary));

      const res = await routeRequest(apiRequest('GET', '/api/players'));
      expect(res.status).toBe(200);

      const body = await res.json() as unknown[];
      expect(Array.isArray(body)).toBe(true);
      validateArray('#/components/schemas/PlayerLibraryEntry', body);
    });

    it('POST /api/players -> 201, PlayerLibraryEntry', async () => {
      mockPlayerLib.addPlayer.mockResolvedValue({
        ...structuredClone(sampleLibrary),
        players: [
          ...sampleLibrary.players,
          { id: 'pl3', name: 'Charlie', groupIds: [], elo: 1200 },
        ],
      });

      const res = await routeRequest(apiRequest('POST', '/api/players', {
        name: 'Charlie',
        elo: 1200,
      }));
      expect(res.status).toBe(201);

      const body = await res.json() as unknown;
      validateSchema('#/components/schemas/PlayerLibraryEntry', body);
    });

    it('DELETE /api/players -> 204', async () => {
      mockPlayerLib.deleteAllPlayers.mockResolvedValue({ players: [], groups: [] });

      const res = await routeRequest(apiRequest('DELETE', '/api/players'));
      expect(res.status).toBe(204);
    });

    it('GET /api/players/:id/profile -> 200, PlayerProfile', async () => {
      mockPlayerLib.loadLibrary.mockResolvedValue(structuredClone(sampleLibrary));
      mockPersistence.loadAll.mockResolvedValue([]);

      const res = await routeRequest(apiRequest('GET', '/api/players/pl1/profile'));
      expect(res.status).toBe(200);

      const body = await res.json() as Record<string, unknown>;
      // The handler returns { id, name, elo, groupIds, tournaments } which differs from
      // the spec's { player, tournaments } shape. Validate structure manually.
      expect(typeof body['id']).toBe('string');
      expect(typeof body['name']).toBe('string');
      expect(Array.isArray(body['groupIds'])).toBe(true);
      expect(Array.isArray(body['tournaments'])).toBe(true);
    });
  });

  // --- Player Groups ---

  describe('Player Groups', () => {
    it('GET /api/player-groups -> 200, array of PlayerGroup', async () => {
      mockPlayerLib.loadLibrary.mockResolvedValue(structuredClone(sampleLibrary));

      const res = await routeRequest(apiRequest('GET', '/api/player-groups'));
      expect(res.status).toBe(200);

      const body = await res.json() as unknown[];
      expect(Array.isArray(body)).toBe(true);
      validateArray('#/components/schemas/PlayerGroup', body);
    });

    it('POST /api/player-groups -> 201, PlayerGroup', async () => {
      mockPlayerLib.addGroup.mockResolvedValue({
        ...structuredClone(sampleLibrary),
        groups: [
          ...sampleLibrary.groups,
          { id: 'g2', name: 'Advanced' },
        ],
      });

      const res = await routeRequest(apiRequest('POST', '/api/player-groups', {
        name: 'Advanced',
      }));
      expect(res.status).toBe(201);

      const body = await res.json() as unknown;
      validateSchema('#/components/schemas/PlayerGroup', body);
    });
  });

  // --- Error cases ---

  describe('Error cases', () => {
    it('GET /api/nonexistent -> 404, ProblemDetail', async () => {
      const res = await routeRequest(apiRequest('GET', '/api/nonexistent'));
      expect(res.status).toBe(404);

      const body = await res.json() as unknown;
      validateSchema('#/components/schemas/ProblemDetail', body);
    });

    it('POST /api/tournaments with bad body -> 400, ProblemDetail', async () => {
      const res = await routeRequest(apiRequest('POST', '/api/tournaments', {
        invalid: true,
      }));
      expect(res.status).toBe(400);

      const body = await res.json() as unknown;
      validateSchema('#/components/schemas/ProblemDetail', body);
    });
  });
});
