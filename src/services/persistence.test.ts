import { migrateFromOldDatabase } from '../db/migration';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { addRxPlugin, createRxDatabase } from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { getDatabase } from '../db';
import { tournamentSchema } from '../db/schemas/tournament';
import { playerSchema } from '../db/schemas/player';
import { playerGroupSchema } from '../db/schemas/playerGroup';
import type { DatabaseCollections, TournadoDatabase } from '../db';
import type { GroupsToBracketTournament, PlayerGroup } from '../types';
import { Format, ScoreMode } from '../types';
import { createTournament, renameTournament } from './tournamentService';
import { recordScore, clearScore, saveMatchChange, HistoryConfirmationRequiredError } from './matchService';
import { createPlayer, updatePlayer, getPlayerProfile } from './playerService';
import {
  createPlayerGroup,
  deletePlayerGroup,
  listPlayerGroups,
  reorderPlayerGroups,
} from './playerGroupService';
import { parseExportFile, importPayload } from '../utils/dataPortability';
import { buildGroupStagePlayoffs } from '../utils/groupStageUtils';
import type { MatchChange } from '../utils/matchChanges';
import { planMatchChange } from '../utils/matchChanges';
import { generateNextRound } from './swissService';
import { canGenerateNextSwissRound, isSwissTournamentComplete } from '../utils/swissUtils';
import { generatePlayoffs, getAdvancers } from './groupStageService';

vi.mock('../db', () => ({ getDatabase: vi.fn() }));
let db: TournadoDatabase;
beforeAll(async () => {
  addRxPlugin(RxDBMigrationSchemaPlugin);
  db = await createRxDatabase<DatabaseCollections>({
    name: 'testcorrections',
    storage: getRxStorageMemory(),
    multiInstance: false,
  });
  await db.addCollections({
    tournaments: { schema: tournamentSchema },
    players: { schema: playerSchema },
    playerGroups: {
      schema: playerGroupSchema,
      migrationStrategies: { 1: (doc: PlayerGroup): PlayerGroup => doc },
    },
  });
  vi.mocked(getDatabase).mockResolvedValue(db);
});
afterAll(async () => {
  await db.remove();
});
const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((name) => ({
  name,
}));

describe('persistent tournament operations', () => {
  it('preserves independent concurrent edits and updates completion', async () => {
    const tournament = await createTournament({
      name: 'Concurrent',
      format: Format.ROUND_ROBIN,
      players: names.slice(0, 3),
    });
    if (tournament.format !== Format.ROUND_ROBIN)
      throw new Error('Wrong fixture format');
    const matches = tournament.schedule.rounds.flatMap((r) => r.matches);
    await Promise.all([
      recordScore(tournament.id, matches[0]!.id, [[3, 0]]),
      recordScore(tournament.id, matches[1]!.id, [[3, 0]]),
      renameTournament(tournament.id, 'Renamed'),
    ]);
    const doc = await db.tournaments.findOne(tournament.id).exec();
    const saved = doc!.toMutableJSON();
    expect(saved.name).toBe('Renamed');
    if (saved.format !== Format.ROUND_ROBIN) throw new Error('Wrong format');
    expect(
      saved.schedule.rounds.flatMap((r) => r.matches).filter((m) => m.winnerId),
    ).toHaveLength(2);
    const completed = await recordScore(tournament.id, matches[2]!.id, [
      [3, 0],
    ]);
    expect(completed.completedAt).toBeTruthy();
    const cleared = await clearScore(tournament.id, matches[2]!.id);
    expect(cleared.completedAt).toBeNull();
  });

  it.each(['legacy', 'balanced'] as const)('preserves %s playoff slots across persistence, imports and group score corrections', async (layout) => {
    let tournament = await createTournament({
      name: 'Seed compatibility', format: Format.GROUPS_TO_BRACKET,
      players: Array.from({ length: 16 }, (_, i) => ({ name: `Seed ${i + 1}` })),
      groupCount: 4, qualifiers: [2, 2, 2, 2],
    });
    if (tournament.format !== Format.GROUPS_TO_BRACKET) throw new Error('Wrong format');
    for (const group of tournament.groupStage.groups) {
      for (const match of group.schedule.rounds.flatMap((round) => round.matches)) {
        // Reverse the initial ranking so playoff seeding must follow earned group placements.
        const firstWins = group.playerIds.indexOf(match.player1Id!) > group.playerIds.indexOf(match.player2Id!);
        await recordScore(tournament.id, match.id, firstWins ? [[3, 0]] : [[0, 3]], false, group.id);
      }
    }
    tournament = await generatePlayoffs(tournament.id);
    if (tournament.format !== Format.GROUPS_TO_BRACKET) throw new Error('Wrong format');
    const bracket = tournament.groupStagePlayoffs!.mainBracket!;
    expect(bracket.seeding).toBe('balanced');
    if (layout === 'legacy') {
      const { mainWithLucky } = await getAdvancers(tournament.id);
      const legacySeeds = [[0, 7], [2, 5], [1, 6], [3, 4]];
      for (const [index, match] of bracket.rounds[0]!.entries()) {
        match.player1Id = mainWithLucky[legacySeeds[index]![0]!]!.id;
        match.player2Id = mainWithLucky[legacySeeds[index]![1]!]!.id;
      }
      delete bracket.seeding;
      await db.tournaments.upsert(tournament);
    }
    const first = bracket.rounds[0]![0]!;
    const played = await recordScore(tournament.id, first.id, [[3, 0]], false, undefined, 'mainBracket');
    await importPayload({ version: 4, exportedAt: '', tournaments: [played], players: [], groups: [] });
    if (played.format !== Format.GROUPS_TO_BRACKET) throw new Error('Wrong format');
    const group = played.groupStage.groups[0]!;
    const match = group.schedule.rounds[0]!.matches[0]!;
    const corrected = await recordScore(played.id, match.id,
      match.winnerId === match.player1Id ? [[3, 1]] : [[1, 3]], false, group.id);
    if (corrected.format !== Format.GROUPS_TO_BRACKET) throw new Error('Wrong format');
    expect(corrected.groupStagePlayoffs).toEqual(played.groupStagePlayoffs);
  });

  it('rechecks confirmation against concurrent score edits before deleting results', async () => {
    let tournament = await createTournament({ name: 'Confirm current history', format: Format.SINGLE_ELIM, players: names.slice(0, 4) });
    if (tournament.format !== Format.SINGLE_ELIM) throw new Error('Wrong format');
    const first = tournament.bracket.rounds[0]![0]!;
    for (const match of tournament.bracket.rounds[0]!) await recordScore(tournament.id, match.id, [[3, 0]]);
    tournament = (await db.tournaments.findOne(tournament.id).exec())!.toMutableJSON();
    if (tournament.format !== Format.SINGLE_ELIM) throw new Error('Wrong format');
    const final = tournament.bracket.rounds[1]![0]!;
    tournament = await recordScore(tournament.id, final.id, [[3, 0]]);
    const change = { type: 'score', matchId: first.id, scores: [[0, 3]], walkover: false } satisfies MatchChange;
    const preview = planMatchChange(tournament, change).impact;
    expect(preview.deletedResults).toHaveLength(1);
    const concurrent = await recordScore(tournament.id, final.id, [[3, 1]]);
    await expect(saveMatchChange(tournament.id, change, preview.token)).rejects.toThrow(HistoryConfirmationRequiredError);
    expect((await db.tournaments.findOne(tournament.id).exec())!.toMutableJSON()).toEqual(concurrent);
    const fresh = planMatchChange(concurrent, change).impact;
    expect(fresh.deletedResults[0]!.match.scores).toEqual([[3, 1]]);
    const saved = await saveMatchChange(tournament.id, change, fresh.token);
    if (saved.format !== Format.SINGLE_ELIM) throw new Error('Wrong format');
    expect(saved.bracket.rounds[0]![0]!.winnerId).toBe(first.player2Id);
    expect(saved.bracket.rounds[1]![0]!.scores).toEqual([]);
    expect(saved.completedAt).toBeNull();
  });

  it('updates group advancers atomically and rejects changes to played playoff slots', async () => {
    let tournament = await createTournament({
      name: 'Atomic groups', format: Format.GROUPS_TO_BRACKET,
      players: names.slice(0, 4), groupCount: 2, qualifiers: [1, 1],
    });
    if (tournament.format !== Format.GROUPS_TO_BRACKET) throw new Error('Wrong format');
    for (const group of tournament.groupStage.groups) {
      for (const match of group.schedule.rounds.flatMap((r) => r.matches)) {
        await recordScore(tournament.id, match.id, [[3, 0]], false, group.id);
      }
    }
    tournament = await generatePlayoffs(tournament.id);
    if (tournament.format !== Format.GROUPS_TO_BRACKET) throw new Error('Wrong format');
    const group = tournament.groupStage.groups[0]!;
    const match = group.schedule.rounds[0]!.matches[0]!;
    tournament = await recordScore(tournament.id, match.id, [[0, 3]], false, group.id);
    if (tournament.format !== Format.GROUPS_TO_BRACKET) throw new Error('Wrong format');
    const final = tournament.groupStagePlayoffs!.mainBracket!.rounds[0]![0]!;
    expect([final.player1Id, final.player2Id]).toContain(match.player2Id);
    expect([final.player1Id, final.player2Id]).not.toContain(match.player1Id);
    await recordScore(tournament.id, final.id, [[3, 0]], false, undefined, 'mainBracket');
    const doc = (await db.tournaments.findOne(tournament.id).exec())!;
    const before = doc.toMutableJSON();
    await expect(recordScore(tournament.id, match.id, [[3, 0]], false, group.id))
      .rejects.toThrow(HistoryConfirmationRequiredError);
    await expect(clearScore(tournament.id, match.id, group.id))
      .rejects.toThrow(HistoryConfirmationRequiredError);
    expect((await db.tournaments.findOne(tournament.id).exec())!.toMutableJSON()).toEqual(before);
    const unchanged = await recordScore(tournament.id, match.id, [[1, 3]], false, group.id);
    const change = { type: 'score', matchId: match.id, scores: [[3, 0]], walkover: false, groupId: group.id } satisfies MatchChange;
    const impact = planMatchChange(unchanged, change).impact;
    const confirmed = await saveMatchChange(tournament.id, change, impact.token);
    if (confirmed.format !== Format.GROUPS_TO_BRACKET) throw new Error('Wrong format');
    const replayedFinal = confirmed.groupStagePlayoffs!.mainBracket!.rounds[0]![0]!;
    expect([replayedFinal.player1Id, replayedFinal.player2Id]).toContain(match.player1Id);
    expect(replayedFinal.winnerId).toBeNull();
  });

  it('removes unplayed playoffs when a group result is cleared', async () => {
    const tournament = await createTournament({
      name: 'Reopen groups', format: Format.GROUPS_TO_BRACKET,
      players: names.slice(0, 4), groupCount: 2, qualifiers: [1, 1],
    });
    if (tournament.format !== Format.GROUPS_TO_BRACKET) throw new Error('Wrong format');
    for (const group of tournament.groupStage.groups) {
      for (const match of group.schedule.rounds.flatMap((r) => r.matches)) {
        await recordScore(tournament.id, match.id, [[3, 0]], false, group.id);
      }
    }
    await generatePlayoffs(tournament.id);
    const group = tournament.groupStage.groups[0]!;
    const cleared = await clearScore(tournament.id, group.schedule.rounds[0]!.matches[0]!.id, group.id);
    if (cleared.format !== Format.GROUPS_TO_BRACKET) throw new Error('Wrong format');
    expect(cleared.groupStagePlayoffs).toBeNull();
    expect(cleared.groupStageBrackets).toBeNull();
    expect(cleared.completedAt).toBeNull();
  });

  it('requires confirmation before discarding later Swiss rounds', async () => {
    let tournament = await createTournament({ name: 'Swiss history', format: Format.SWISS, players: names.slice(0, 4), swissRounds: 3 });
    if (tournament.format !== Format.SWISS) throw new Error('Wrong format');
    const first = tournament.schedule.rounds[0]!.matches[0]!;
    for (let round = 0; round < 3; round++) {
      for (const match of tournament.schedule.rounds[round]!.matches) {
        tournament = await recordScore(tournament.id, match.id, [[3, 0]]);
        if (tournament.format !== Format.SWISS) throw new Error('Wrong format');
      }
      if (round < 2) tournament = await generateNextRound(tournament.id);
      if (tournament.format !== Format.SWISS) throw new Error('Wrong format');
    }
    expect(isSwissTournamentComplete(tournament)).toBe(true);
    const change = { type: 'clear', matchId: first.id } as const;
    const impact = planMatchChange(tournament, change).impact;
    expect(impact.removedRounds).toEqual([2, 3]);
    expect(impact.deletedResults).toHaveLength(4);
    await expect(clearScore(tournament.id, first.id)).rejects.toThrow(HistoryConfirmationRequiredError);
    tournament = await saveMatchChange(tournament.id, change, impact.token);
    if (tournament.format !== Format.SWISS) throw new Error('Wrong format');
    expect(tournament.schedule.rounds).toHaveLength(1);
    expect(isSwissTournamentComplete(tournament)).toBe(false);
    expect(canGenerateNextSwissRound(tournament)).toBe(false);
    expect(tournament.completedAt).toBeNull();
  });

  it('rejects tied scores without changing the tournament', async () => {
    const tournament = await createTournament({
      name: 'Decisive result', format: Format.SINGLE_ELIM, players: names.slice(0, 2),
    });
    if (tournament.format !== Format.SINGLE_ELIM) throw new Error('Wrong format');
    await expect(recordScore(tournament.id, tournament.bracket.rounds[0]![0]!.id, [[0, 0]]))
      .rejects.toThrow('decisive winner');
    expect((await db.tournaments.findOne(tournament.id).exec())!.toMutableJSON()).toEqual(tournament);
  });

  it('respects a points-mode retirement after two lost sets', async () => {
    const tournament = await createTournament({
      name: 'Retirement',
      scoringMode: ScoreMode.POINTS,
      format: Format.SINGLE_ELIM,
      players: names.slice(0, 2),
    });
    if (tournament.format !== Format.SINGLE_ELIM)
      throw new Error('Wrong format');
    const match = tournament.bracket.rounds[0]![0]!;
    const result = await recordScore(tournament.id, match.id, [
      [0, 11],
      [0, 11],
      [111, 0],
    ]);
    expect(result.winnerId).toBe(match.player1Id);
  });

  it('keeps the edited groups and team order on creation', async () => {
    const tournament = await createTournament({
      name: 'Groups',
      format: Format.GROUPS_TO_BRACKET,
      players: names.slice(0, 6),
      teamSize: 2,
      participantPlayerIndexes: [
        [4, 5],
        [0, 1],
        [2, 3],
      ],
      groupCount: 2,
      groupParticipantIndexes: [[0], [1, 2]],
    });
    if (tournament.format !== Format.GROUPS_TO_BRACKET)
      throw new Error('Wrong format');
    expect(tournament.participants![0]!.playerIds).toEqual(
      tournament.players.slice(4).map((p) => p.id),
    );
    expect(tournament.groupStage.groups.map((g) => g.playerIds)).toEqual([
      [tournament.participants![0]!.id],
      tournament.participants!.slice(1).map((p) => p.id),
    ]);
  });

  it('records consolation scores even when old playoff IDs collide', async () => {
    const tournament = await createTournament({
      name: 'Consolation',
      format: Format.GROUPS_TO_BRACKET,
      players: names,
      groupCount: 2,
      qualifiers: [2, 2],
      consolation: true,
    });
    if (tournament.format !== Format.GROUPS_TO_BRACKET)
      throw new Error('Wrong format');
    for (const group of tournament.groupStage.groups)
      for (const match of group.schedule.rounds.flatMap((r) => r.matches)) {
        match.winnerId = match.player1Id;
        match.scores = [[3, 0]];
      }
    tournament.groupStagePlayoffs = buildGroupStagePlayoffs(
      tournament.groupStage,
      tournament.players,
    );
    await db.tournaments.upsert(tournament);
    const match =
      tournament.groupStagePlayoffs.consolationBracket!.rounds[0]![0]!;
    const saved = (await recordScore(
      tournament.id,
      match.id,
      [[3, 0]],
      false,
      undefined,
      'consolationBracket',
    )) as GroupsToBracketTournament;
    expect(
      saved.groupStagePlayoffs!.consolationBracket!.rounds[0]![0]!.winnerId,
    ).toBe(match.player1Id);
    expect(
      saved.groupStagePlayoffs!.mainBracket!.rounds[0]![0]!.winnerId,
    ).toBeNull();
  });

  it('persists group order and removes memberships safely in parallel', async () => {
    const a = await createPlayerGroup('First');
    const b = await createPlayerGroup('Second');
    const player = await createPlayer('Member', 1500, [a.id, b.id]);
    await reorderPlayerGroups([b.id, a.id]);
    const groups = await listPlayerGroups();
    expect(groups.map((g) => g.id)).toEqual([b.id, a.id]);
    await Promise.all([deletePlayerGroup(a.id), deletePlayerGroup(b.id)]);
    const updated = await updatePlayer(player.id, { elo: null });
    expect(updated.groupIds).toEqual([]);
    expect(updated).not.toHaveProperty('elo');
  });

  it('shows a doubles rank on both member profiles', async () => {
    const a = await createPlayer('Doubles A');
    const b = await createPlayer('Doubles B');
    const tournament = await createTournament({
      name: 'Doubles',
      format: Format.SINGLE_ELIM,
      teamSize: 2,
      players: [
        { name: a.name, libraryId: a.id },
        { name: b.name, libraryId: b.id },
        ...names.slice(2, 4),
      ],
    });
    if (tournament.format !== Format.SINGLE_ELIM)
      throw new Error('Wrong format');
    const match = tournament.bracket.rounds[0]![0]!;
    await recordScore(tournament.id, match.id, [[3, 0]]);
    const profileA = await getPlayerProfile(a.id);
    const profileB = await getPlayerProfile(b.id);
    expect(profileA.tournaments[0]!.rankStart).toBe(1);
    expect(profileB.tournaments[0]!.rankStart).toBe(1);
  });

  it('rejects malformed imports before overwriting any entity', async () => {
    expect(parseExportFile('{"version":4}')).toBeNull();
    const tournament = await createTournament({
      name: 'Preserved',
      format: Format.SINGLE_ELIM,
      players: names.slice(0, 2),
    });
    const { bracket: omitted, ...broken } = tournament as Extract<
      typeof tournament,
      { format: Format.SINGLE_ELIM }
    >;
    expect(omitted).toBeDefined();
    const payload = {
      version: 4,
      exportedAt: '',
      tournaments: [broken as typeof tournament],
      players: [],
      groups: [],
    };
    await expect(importPayload(payload)).rejects.toThrow(
      'Invalid import entity',
    );
    expect(
      (await db.tournaments.findOne(tournament.id).exec())!.toJSON().name,
    ).toBe('Preserved');
  });
});

function mockLegacyDatabase(
  stores: Record<string, Record<string, unknown>>,
): void {
  const tx = {
    oncomplete: null as (() => void) | null,
    addEventListener: vi.fn(),
    objectStore: (
      name: string,
    ): {
      getAll: () => { result: unknown[] };
      get: (key: string) => { result: unknown };
    } => ({
      getAll: () => ({ result: Object.values(stores[name] ?? {}) }),
      get: (key) => ({ result: stores[name]?.[key] }),
    }),
  };
  const request = {
    onsuccess: null as (() => void) | null,
    addEventListener: vi.fn(),
    result: {
      objectStoreNames: { contains: (name: string): boolean => name in stores },
      close: vi.fn(),
      transaction: (): typeof tx => {
        queueMicrotask(() => {
          tx.oncomplete?.();
        });
        return tx;
      },
    },
  };
  vi.stubGlobal('indexedDB', {
    open: (): typeof request => {
      queueMicrotask(() => {
        request.onsuccess?.();
      });
      return request;
    },
  });
}

describe('legacy data migration', () => {
  it.each([2, 3, 4, 5])(
    'recovers legacy version %i without overwriting destination records',
    async (version) => {
      localStorage.removeItem('tournado-rxdb-migrated-v2');
      localStorage.setItem('tournado-rxdb-migrated', '1');
      const player = {
        id: `legacy-${version}`,
        name: 'Original',
        groupIds: [],
        ...(version === 5 ? { version: 1 } : {}),
      };
      const existing = await createPlayer('Keep newer edits');
      const sourcePlayers = [
        player,
        { ...existing, name: 'Stale legacy value' },
      ];
      const library = { players: sourcePlayers, groups: [] };
      let stores: Record<string, Record<string, unknown>>;
      if (version === 2) stores = { tournaments: {}, playerLibrary: { main: library } };
      else if (version === 3) stores = { tournaments: {}, playerLibrary: { players: sourcePlayers, groups: [] } };
      else stores = { tournaments: {}, players: Object.fromEntries(sourcePlayers.map((p) => [p.id, p])), groups: {} };
      mockLegacyDatabase(stores);
      try {
        await Promise.all([
          migrateFromOldDatabase(db),
          migrateFromOldDatabase(db),
        ]);
        const migrated = await db.players.findOne(player.id).exec();
        const preserved = await db.players.findOne(existing.id).exec();
        expect(migrated!.toJSON().version).toBe(1);
        expect(preserved!.toJSON().name).toBe(existing.name);
        expect(localStorage.getItem('tournado-rxdb-migrated-v2')).toBe('1');
      } finally {
        vi.unstubAllGlobals();
      }
    },
  );

  it('does not mark invalid legacy data as migrated', async () => {
    localStorage.removeItem('tournado-rxdb-migrated-v2');
    mockLegacyDatabase({
      tournaments: {},
      players: { broken: { id: 'broken' } },
      groups: {},
    });
    try {
      await expect(migrateFromOldDatabase(db)).rejects.toThrow(
        'Invalid import entity',
      );
      expect(localStorage.getItem('tournado-rxdb-migrated-v2')).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
