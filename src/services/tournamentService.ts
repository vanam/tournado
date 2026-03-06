import { getDatabase } from '../db';
import { generateBracket } from '../utils/bracketUtils';
import { generateDoubleElim } from '../utils/doubleElimUtils';
import { generateSchedule } from '../utils/roundRobinUtils';
import { generateSwissInitialSchedule, computeMinTotalRounds } from '../utils/swissUtils';
import { createGroupStage } from '../utils/groupStageUtils';
import { buildParticipants, getParticipantPlayers } from '../utils/participantUtils';
import { computeTournamentProgress } from '../utils/progressUtils';
import { getTournamentResults } from '../utils/resultsUtils';
import { TOURNAMENT_VERSION } from '../utils/dataPortability';
import { Format } from '../types';
import type {
  Player, Tournament,
  SingleElimTournament, DoubleElimTournament, RoundRobinTournament,
  SwissTournament, GroupsToBracketTournament,
  ScoreMode, BracketType, RankedResult,
} from '../types';

export interface TournamentSummary {
  id: string;
  name: string;
  format: Format;
  createdAt: string;
  completedAt: string | null | undefined;
  winnerId: string | null | undefined;
  playerCount: number;
  teamSize: number;
}

export interface CreateTournamentRequest {
  name: string;
  format: Format;
  players: Array<{ name: string; seed?: number; elo?: number; libraryId?: string }>;
  teamSize?: number;
  scoringMode?: ScoreMode;
  maxSets?: number;
  groupStageMaxSets?: number;
  bracketMaxSets?: number;
  groupCount?: number;
  qualifiers?: number[];
  consolation?: boolean;
  bracketType?: BracketType;
  swissRounds?: number;
}

function toSummary(t: Tournament): TournamentSummary {
  return {
    id: t.id,
    name: t.name,
    format: t.format,
    createdAt: t.createdAt,
    completedAt: t.completedAt ?? null,
    winnerId: t.winnerId ?? null,
    playerCount: t.players.length,
    teamSize: t.teamSize ?? 1,
  };
}

export async function listTournaments(filters?: { format?: Format; status?: 'active' | 'completed' }): Promise<TournamentSummary[]> {
  const db = await getDatabase();
  const docs = await db.tournaments.find().exec();
  let tournaments = docs.map(d => d.toMutableJSON());

  if (filters?.format) {
    tournaments = tournaments.filter(t => t.format === filters.format);
  }
  if (filters?.status === 'completed') {
    tournaments = tournaments.filter(t => t.completedAt != null);
  } else if (filters?.status === 'active') {
    tournaments = tournaments.filter(t => t.completedAt == null);
  }

  return tournaments.map((t) => toSummary(t));
}

export async function createTournament(body: CreateTournamentRequest): Promise<Tournament> {
  const { name, format, players: playerInputs, teamSize = 1 } = body;

  if (!name || !Array.isArray(playerInputs) || playerInputs.length < 2) {
    throw new Error('Name, format, and at least 2 players are required');
  }

  const players: Player[] = playerInputs.map((p) => {
    const player: Player = {
      id: crypto.randomUUID(),
      name: p.name,
    };
    if (p.seed !== undefined) player.seed = p.seed;
    if (p.elo !== undefined) player.elo = p.elo;
    if (p.libraryId !== undefined) player.libraryId = p.libraryId;
    return player;
  });

  const participants = buildParticipants(players, teamSize, []);
  const participantPlayers = getParticipantPlayers(players, participants);

  function applyOptionalFields<T extends Tournament>(t: T): T {
    if (body.scoringMode !== undefined) t.scoringMode = body.scoringMode;
    if (body.maxSets !== undefined) t.maxSets = body.maxSets;
    if (body.groupStageMaxSets !== undefined) t.groupStageMaxSets = body.groupStageMaxSets;
    if (body.bracketMaxSets !== undefined) t.bracketMaxSets = body.bracketMaxSets;
    return t;
  }

  const shared = {
    id: crypto.randomUUID(),
    name,
    version: TOURNAMENT_VERSION,
    players,
    teamSize,
    participants,
    createdAt: new Date().toISOString(),
    completedAt: null,
    winnerId: null,
  } satisfies Omit<SingleElimTournament, 'format' | 'bracket'>;

  let tournament: Tournament;

  switch (format) {
    case Format.SINGLE_ELIM: {
      const bracket = generateBracket(participantPlayers);
      tournament = applyOptionalFields({ ...shared, format: Format.SINGLE_ELIM, bracket } satisfies SingleElimTournament);
      break;
    }
    case Format.DOUBLE_ELIM: {
      const doubleElim = generateDoubleElim(participantPlayers);
      tournament = applyOptionalFields({ ...shared, format: Format.DOUBLE_ELIM, doubleElim } satisfies DoubleElimTournament);
      break;
    }
    case Format.ROUND_ROBIN: {
      const schedule = generateSchedule(participantPlayers);
      tournament = applyOptionalFields({ ...shared, format: Format.ROUND_ROBIN, schedule } satisfies RoundRobinTournament);
      break;
    }
    case Format.SWISS: {
      const schedule = generateSwissInitialSchedule(participantPlayers);
      const totalRounds = body.swissRounds ?? computeMinTotalRounds(participantPlayers.length);
      tournament = applyOptionalFields({ ...shared, format: Format.SWISS, schedule, totalRounds } satisfies SwissTournament);
      break;
    }
    case Format.GROUPS_TO_BRACKET: {
      const groupCount = body.groupCount ?? 2;
      const groupStage = createGroupStage(participantPlayers, {
        groupCount,
        qualifiers: body.qualifiers,
        consolation: body.consolation,
        bracketType: body.bracketType,
      });
      tournament = applyOptionalFields({ ...shared, format: Format.GROUPS_TO_BRACKET, groupStage } satisfies GroupsToBracketTournament);
      break;
    }
  }

  const db = await getDatabase();
  await db.tournaments.insert(tournament);
  return tournament;
}

export async function getTournament(id: string): Promise<Tournament> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(id).exec();
  if (!doc) throw new Error(`Tournament ${id} not found`);
  return doc.toMutableJSON();
}

export async function deleteTournament(id: string): Promise<void> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(id).exec();
  if (doc) await doc.remove();
}

export async function deleteAllTournaments(): Promise<void> {
  const db = await getDatabase();
  const docs = await db.tournaments.find().exec();
  await Promise.all(docs.map(d => d.remove()));
}

export async function duplicateTournament(id: string): Promise<Tournament> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(id).exec();
  if (!doc) throw new Error(`Tournament ${id} not found`);

  const original = doc.toMutableJSON();
  const cloned: Tournament = structuredClone(original);
  cloned.id = crypto.randomUUID();
  cloned.name = `${original.name} (copy)`;
  cloned.createdAt = new Date().toISOString();
  cloned.completedAt = null;
  cloned.winnerId = null;

  await db.tournaments.insert(cloned);
  return cloned;
}

export async function getTournamentProgress(id: string): Promise<{ completed: number; total: number }> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(id).exec();
  if (!doc) throw new Error(`Tournament ${id} not found`);
  const tournament = doc.toMutableJSON();
  return computeTournamentProgress(tournament);
}

export async function getTournamentResultsById(id: string): Promise<RankedResult[]> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(id).exec();
  if (!doc) throw new Error(`Tournament ${id} not found`);
  const tournament = doc.toMutableJSON();
  return getTournamentResults(tournament);
}

export async function renameTournamentPlayer(tournamentId: string, playerId: string, name: string): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Name is required');

  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  const player = tournament.players.find((p) => p.id === playerId);
  if (player === undefined) throw new Error(`Player ${playerId} not found`);

  player.name = trimmedName;
  await doc.incrementalModify(() => tournament);
}
