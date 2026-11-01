import { getDatabase } from '../db';
import { computeStandings } from '../utils/roundRobinUtils';
import {
  getGroupAdvancers,
  buildGroupStagePlayoffs,
  getGroupPlayers,
  isGroupStageComplete,
} from '../utils/groupStageUtils';
import {
  ensureParticipants,
  getParticipantPlayers,
} from '../utils/participantUtils';
import {
  getBracketParticipantAtSeed,
  hasPlayerPlayedBracketMatch,
} from '../utils/bracketUtils';
import { hasPlayerPlayedDoubleElimMatch } from '../utils/doubleElimUtils';
import { Format } from '../types';
import type {
  Match,
  BracketType,
  Bracket,
  DoubleElim,
  GroupStagePlayoffs,
  Tournament,
  StandingsRow,
  GroupAdvancersResult,
  GroupsToBracketTournament,
} from '../types';

export async function getGroupStandings(
  tournamentId: string,
  groupId: string,
): Promise<StandingsRow[]> {
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

  const storedParticipants = ensureParticipants(
    tournament.players,
    tournament.participants,
  );
  const participantPlayers = getParticipantPlayers(
    tournament.players,
    storedParticipants,
  );
  const groupPlayers = getGroupPlayers(group, participantPlayers);
  const standings = computeStandings(group.schedule, groupPlayers, {
    scoringMode: tournament.scoringMode,
    maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
  });

  return standings;
}

export async function getAdvancers(
  tournamentId: string,
): Promise<GroupAdvancersResult> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  if (tournament.format !== Format.GROUPS_TO_BRACKET) {
    throw new Error('Tournament is not a Groups to Bracket format');
  }

  const storedParticipants = ensureParticipants(
    tournament.players,
    tournament.participants,
  );
  const participantPlayers = getParticipantPlayers(
    tournament.players,
    storedParticipants,
  );
  const advancers = getGroupAdvancers(
    tournament.groupStage,
    participantPlayers,
    {
      scoringMode: tournament.scoringMode,
      maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
    },
  );

  return advancers;
}

export async function generatePlayoffs(
  tournamentId: string,
): Promise<Tournament> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const saved = await doc.incrementalModify((tournament) => {
    if (tournament.format !== Format.GROUPS_TO_BRACKET) {
      throw new Error('Tournament is not a Groups to Bracket format');
    }

    const storedParticipants = ensureParticipants(
      tournament.players,
      tournament.participants,
    );
    const participantPlayers = getParticipantPlayers(
      tournament.players,
      storedParticipants,
    );
    const playoffs = buildGroupStagePlayoffs(
      tournament.groupStage,
      participantPlayers,
      {
        scoringMode: tournament.scoringMode,
        maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
      },
    );

    tournament.groupStagePlayoffs = playoffs;

    return tournament;
  });
  return saved.toMutableJSON();
}

export interface SyncBracketResult {
  updated: boolean;
  blocked: boolean;
  blockedPlayers: string[];
}

type BracketTarget =
  'main' | 'mainDoubleElim' | 'consolation' | 'consolationDoubleElim';
type SwapEntry = { oldId: string; newId: string; target: BracketTarget };

function collectBracketSwaps(
  bracket: Bracket,
  newAdvancerIds: string[],
  target: Extract<BracketTarget, 'main' | 'consolation'>,
  swaps: SwapEntry[],
  blockedPlayers: string[],
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
  blockedPlayers: string[],
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

export function applySwaps(
  playoffs: GroupStagePlayoffs,
  swaps: SwapEntry[],
): void {
  const replaceMatches = (
    target: BracketTarget,
    matches: (Match | null | undefined)[],
  ): void => {
    const replacements = new Map(
      swaps
        .filter((swap) => swap.target === target)
        .map((swap) => [swap.oldId, swap.newId]),
    );
    for (const match of matches) {
      if (!match) continue;
      for (const key of ['player1Id', 'player2Id', 'winnerId'] as const) {
        const id = match[key];
        if (id !== null) match[key] = replacements.get(id) ?? id;
      }
    }
  };
  for (const target of ['main', 'consolation'] as const) {
    const bracket =
      target === 'main' ? playoffs.mainBracket : playoffs.consolationBracket;
    if (bracket)
      replaceMatches(target, [
        ...bracket.rounds.flat(),
        bracket.thirdPlaceMatch,
      ]);
  }
  for (const target of ['mainDoubleElim', 'consolationDoubleElim'] as const) {
    const bracket = playoffs[target];
    if (bracket)
      replaceMatches(target, [
        ...bracket.winners.rounds.flat(),
        ...bracket.losers.rounds.flat(),
        bracket.finals.grandFinal,
        bracket.finals.resetFinal,
      ]);
  }
}

/** Updates playoff participants inside the same transaction as a group result change. */
export function syncGroupStageParticipants(tournament: GroupsToBracketTournament): SyncBracketResult {
  const playoffs =
    tournament.groupStagePlayoffs ?? tournament.groupStageBrackets;
  if (!playoffs) {
    return { updated: false, blocked: false, blockedPlayers: [] };
  }

  if (!isGroupStageComplete(tournament.groupStage)) {
    const played = [playoffs.mainBracket, playoffs.consolationBracket].some(
      (bracket) => bracket && [...bracket.rounds.flat(), bracket.thirdPlaceMatch].some(
        (match) => match?.player1Id && match.player2Id && match.winnerId,
      ),
    ) || [playoffs.mainDoubleElim, playoffs.consolationDoubleElim].some(
      (bracket) => bracket && [
        ...bracket.winners.rounds.flat(), ...bracket.losers.rounds.flat(),
        bracket.finals.grandFinal, bracket.finals.resetFinal,
      ].some((match) => match.player1Id && match.player2Id && match.winnerId),
    );
    if (played) return { updated: false, blocked: true, blockedPlayers: [] };
    tournament.groupStagePlayoffs = null;
    tournament.groupStageBrackets = null;
    return { updated: true, blocked: false, blockedPlayers: [] };
  }

  const storedParticipants = ensureParticipants(
    tournament.players,
    tournament.participants,
  );
  const participantPlayers = getParticipantPlayers(
    tournament.players,
    storedParticipants,
  );
  const newAdvancers = getGroupAdvancers(
    tournament.groupStage,
    participantPlayers,
    {
      scoringMode: tournament.scoringMode,
      maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
    },
  );

  const swaps: SwapEntry[] = [];
  const blockedPlayers: string[] = [];

  const mainIds = newAdvancers.mainWithLucky.map((e) => e.id);
  const consolationIds = newAdvancers.consolation.map((e) => e.id);

  if (playoffs.mainBracket) {
    collectBracketSwaps(
      playoffs.mainBracket,
      mainIds,
      'main',
      swaps,
      blockedPlayers,
    );
  }
  if (playoffs.mainDoubleElim) {
    collectDoubleElimSwaps(
      playoffs.mainDoubleElim,
      mainIds,
      'mainDoubleElim',
      swaps,
      blockedPlayers,
    );
  }
  if (playoffs.consolationBracket) {
    collectBracketSwaps(
      playoffs.consolationBracket,
      consolationIds,
      'consolation',
      swaps,
      blockedPlayers,
    );
  }
  if (playoffs.consolationDoubleElim) {
    collectDoubleElimSwaps(
      playoffs.consolationDoubleElim,
      consolationIds,
      'consolationDoubleElim',
      swaps,
      blockedPlayers,
    );
  }

  if (blockedPlayers.length > 0) {
    return { updated: false, blocked: true, blockedPlayers };
  }
  if (swaps.length === 0) {
    return { updated: false, blocked: false, blockedPlayers: [] };
  }

  applySwaps(playoffs, swaps);
  tournament.groupStagePlayoffs = playoffs;
  return { updated: true, blocked: false, blockedPlayers: [] };
}

export class GroupStageSyncBlockedError extends Error {
  constructor() {
    super('Group result cannot change participants in a played playoff');
    this.name = 'GroupStageSyncBlockedError';
  }
}

/** Reconciles existing playoff participants without changing any group scores. */
export async function syncBracketParticipants(tournamentId: string): Promise<SyncBracketResult> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);
  let result: SyncBracketResult = { updated: false, blocked: false, blockedPlayers: [] };
  await doc.incrementalModify((tournament) => {
    if (tournament.format === Format.GROUPS_TO_BRACKET) {
      result = syncGroupStageParticipants(tournament);
    }
    return tournament;
  });
  return result;
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

  await doc.incrementalModify((tournament) => {
    if (tournament.format !== Format.GROUPS_TO_BRACKET) {
      throw new Error('Tournament is not a Groups to Bracket format');
    }

    tournament.groupStage.settings.qualifiers = params.qualifiers;
    tournament.groupStage.settings.bracketType = params.bracketType;
    tournament.groupStagePlayoffs = null;

    return tournament;
  });
}
