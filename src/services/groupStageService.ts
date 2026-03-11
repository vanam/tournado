import { getDatabase } from '../db';
import { computeStandings } from '../utils/roundRobinUtils';
import { getGroupAdvancers, buildGroupStagePlayoffs, getGroupPlayers } from '../utils/groupStageUtils';
import { ensureParticipants, getParticipantPlayers } from '../utils/participantUtils';
import {
  getBracketParticipantAtSeed,
  hasPlayerPlayedBracketMatch,
  swapBracketParticipant,
} from '../utils/bracketUtils';
import {
  hasPlayerPlayedDoubleElimMatch,
  swapDoubleElimParticipant,
} from '../utils/doubleElimUtils';
import { Format } from '../types';
import type { BracketType, Bracket, DoubleElim, GroupStagePlayoffs, Tournament, StandingsRow, GroupAdvancersResult } from '../types';

export async function getGroupStandings(tournamentId: string, groupId: string): Promise<StandingsRow[]> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  if (tournament.format !== Format.GROUPS_TO_BRACKET) {
    throw new Error('Tournament is not a Groups to Bracket format');
  }

  const group = tournament.groupStage.groups.find((g) => g.id === groupId);
  if (group === undefined) {
    throw new Error(`Group ${groupId} not found`);
  }

  const storedParticipants = ensureParticipants(tournament.players, tournament.participants);
  const participantPlayers = getParticipantPlayers(tournament.players, storedParticipants);
  const groupPlayers = getGroupPlayers(group, participantPlayers);
  const standings = computeStandings(group.schedule, groupPlayers, {
    scoringMode: tournament.scoringMode,
    maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
  });

  return standings;
}

export async function getAdvancers(tournamentId: string): Promise<GroupAdvancersResult> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  if (tournament.format !== Format.GROUPS_TO_BRACKET) {
    throw new Error('Tournament is not a Groups to Bracket format');
  }

  const storedParticipants = ensureParticipants(tournament.players, tournament.participants);
  const participantPlayers = getParticipantPlayers(tournament.players, storedParticipants);
  const advancers = getGroupAdvancers(tournament.groupStage, participantPlayers, {
    scoringMode: tournament.scoringMode,
    maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
  });

  return advancers;
}

export async function generatePlayoffs(tournamentId: string): Promise<Tournament> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  if (tournament.format !== Format.GROUPS_TO_BRACKET) {
    throw new Error('Tournament is not a Groups to Bracket format');
  }

  const storedParticipants = ensureParticipants(tournament.players, tournament.participants);
  const participantPlayers = getParticipantPlayers(tournament.players, storedParticipants);
  const playoffs = buildGroupStagePlayoffs(tournament.groupStage, participantPlayers, {
    scoringMode: tournament.scoringMode,
    maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
  });

  tournament.groupStagePlayoffs = playoffs;

  await doc.incrementalModify(() => tournament);
  return tournament;
}

export interface SyncBracketResult {
  updated: boolean;
  blocked: boolean;
  blockedPlayers: string[];
}

type BracketTarget = 'main' | 'mainDoubleElim' | 'consolation' | 'consolationDoubleElim';
type SwapEntry = { oldId: string; newId: string; target: BracketTarget };

function collectBracketSwaps(
  bracket: Bracket,
  newAdvancerIds: string[],
  target: Extract<BracketTarget, 'main' | 'consolation'>,
  swaps: SwapEntry[],
  blockedPlayers: string[]
): void {
  const round0 = bracket.rounds[0];
  if (!round0) return;
  const bracketSize = round0.length * 2;
  const limit = Math.min(newAdvancerIds.length, bracketSize);
  for (let i = 0; i < limit; i++) {
    const newId = newAdvancerIds[i];
    if (!newId) continue;
    const oldId = getBracketParticipantAtSeed(bracket, i);
    if (!oldId || oldId === newId) continue;
    if (hasPlayerPlayedBracketMatch(bracket, oldId)) {
      blockedPlayers.push(oldId);
    } else {
      swaps.push({ oldId, newId, target });
    }
  }
}

function collectDoubleElimSwaps(
  doubleElim: DoubleElim,
  newAdvancerIds: string[],
  target: Extract<BracketTarget, 'mainDoubleElim' | 'consolationDoubleElim'>,
  swaps: SwapEntry[],
  blockedPlayers: string[]
): void {
  const round0 = doubleElim.winners.rounds[0];
  if (!round0) return;
  const bracketSize = round0.length * 2;
  const limit = Math.min(newAdvancerIds.length, bracketSize);
  for (let i = 0; i < limit; i++) {
    const newId = newAdvancerIds[i];
    if (!newId) continue;
    const oldId = getBracketParticipantAtSeed(doubleElim.winners, i);
    if (!oldId || oldId === newId) continue;
    if (hasPlayerPlayedDoubleElimMatch(doubleElim, oldId)) {
      blockedPlayers.push(oldId);
    } else {
      swaps.push({ oldId, newId, target });
    }
  }
}

function applySwaps(playoffs: GroupStagePlayoffs, swaps: SwapEntry[]): void {
  for (const swap of swaps) {
    if (swap.target === 'main' && playoffs.mainBracket) {
      swapBracketParticipant(playoffs.mainBracket, swap.oldId, swap.newId);
    } else if (swap.target === 'mainDoubleElim' && playoffs.mainDoubleElim) {
      swapDoubleElimParticipant(playoffs.mainDoubleElim, swap.oldId, swap.newId);
    } else if (swap.target === 'consolation' && playoffs.consolationBracket) {
      swapBracketParticipant(playoffs.consolationBracket, swap.oldId, swap.newId);
    } else if (swap.target === 'consolationDoubleElim' && playoffs.consolationDoubleElim) {
      swapDoubleElimParticipant(playoffs.consolationDoubleElim, swap.oldId, swap.newId);
    }
  }
}

/**
 * After a group match result has changed, recalculates advancers and syncs
 * bracket participants for all brackets that have not yet played the affected slots.
 *
 * - If ALL changed advancer positions are safe (old advancer hasn't played any
 *   real bracket match), all swaps are applied and the tournament is saved.
 * - If ANY changed position is unsafe, no swaps are applied and `blocked` is returned.
 */
export async function syncBracketParticipants(tournamentId: string): Promise<SyncBracketResult> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  if (tournament.format !== Format.GROUPS_TO_BRACKET) {
    return { updated: false, blocked: false, blockedPlayers: [] };
  }

  const playoffs = tournament.groupStagePlayoffs ?? tournament.groupStageBrackets;
  if (!playoffs) {
    return { updated: false, blocked: false, blockedPlayers: [] };
  }

  const storedParticipants = ensureParticipants(tournament.players, tournament.participants);
  const participantPlayers = getParticipantPlayers(tournament.players, storedParticipants);
  const newAdvancers = getGroupAdvancers(tournament.groupStage, participantPlayers, {
    scoringMode: tournament.scoringMode,
    maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
  });

  const swaps: SwapEntry[] = [];
  const blockedPlayers: string[] = [];

  const mainIds = newAdvancers.mainWithLucky.map((e) => e.id);
  const consolationIds = newAdvancers.consolation.map((e) => e.id);

  if (playoffs.mainBracket) {
    collectBracketSwaps(playoffs.mainBracket, mainIds, 'main', swaps, blockedPlayers);
  }
  if (playoffs.mainDoubleElim) {
    collectDoubleElimSwaps(playoffs.mainDoubleElim, mainIds, 'mainDoubleElim', swaps, blockedPlayers);
  }
  if (playoffs.consolationBracket) {
    collectBracketSwaps(playoffs.consolationBracket, consolationIds, 'consolation', swaps, blockedPlayers);
  }
  if (playoffs.consolationDoubleElim) {
    collectDoubleElimSwaps(playoffs.consolationDoubleElim, consolationIds, 'consolationDoubleElim', swaps, blockedPlayers);
  }

  if (blockedPlayers.length > 0) {
    return { updated: false, blocked: true, blockedPlayers };
  }
  if (swaps.length === 0) {
    return { updated: false, blocked: false, blockedPlayers: [] };
  }

  applySwaps(playoffs, swaps);
  tournament.groupStagePlayoffs = playoffs;
  await doc.incrementalModify(() => tournament);
  return { updated: true, blocked: false, blockedPlayers: [] };
}

export interface UpdateGroupStageSettingsParams {
  qualifiers: number[];
  bracketType: BracketType;
}

export async function updateGroupStageSettings(
  tournamentId: string,
  params: UpdateGroupStageSettingsParams,
): Promise<void> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (doc === null) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  if (tournament.format !== Format.GROUPS_TO_BRACKET) {
    throw new Error('Tournament is not a Groups to Bracket format');
  }

  tournament.groupStage.settings.qualifiers = params.qualifiers;
  tournament.groupStage.settings.bracketType = params.bracketType;
  tournament.groupStagePlayoffs = null;

  await doc.incrementalModify(() => tournament);
}
