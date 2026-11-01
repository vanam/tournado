import { Format } from '../types';
import type { Participant, Player, Tournament } from '../types';
import { distributePlayersToGroups, indexToGroupLabel } from './groupStageUtils';
import type { BaseGroup } from './groupStageUtils';
import { buildParticipants, getMemberIndexes, getParticipantPlayers } from './participantUtils';

export interface TournamentPreparation {
  players: Player[];
  participants: Participant[];
  teamSize: number;
  customGroups: { groups: BaseGroup[]; groupCount: number } | null;
}

interface MembershipOptions {
  teamSize?: number;
  participantPlayerIndexes?: number[][];
  groupCount?: number;
  groupParticipantIndexes?: number[][];
}

function assertPartition(members: string[][], ids: string[], message: string): void {
  const flattened = members.flat();
  const knownIds = new Set(ids);
  if (flattened.length !== ids.length || new Set(flattened).size !== ids.length ||
    flattened.some((id) => !knownIds.has(id))) throw new Error(message);
}

function validateParticipants(players: Player[], participants: Participant[], teamSize: number): void {
  const message = 'Each player must belong to exactly one complete participant';
  if (!Number.isInteger(teamSize) || teamSize < 1 || participants.some((p) => p.playerIds.length !== teamSize)) {
    throw new Error(message);
  }
  assertPartition(participants.map((p) => p.playerIds), players.map((p) => p.id), message);
}

function validateGroups(groups: BaseGroup[], participants: Participant[], groupCount: number): void {
  const message = 'Each participant must belong to exactly one group';
  if (!Number.isInteger(groupCount) || groupCount < 1 || groups.length !== groupCount) throw new Error(message);
  assertPartition(groups.map((g) => g.playerIds), participants.map((p) => p.id), message);
}

/** Copies entrants without carrying recorded matches or depending on their old identities. */
export function createTournamentPreparation(source: Tournament | null = null): TournamentPreparation {
  const players = source?.players.map((player, index) => ({ ...player, id: crypto.randomUUID(), seed: index + 1 })) ?? [];
  const teamSize = source?.teamSize ?? 1;
  const idMap = new Map(source?.players.map((player, index) => [player.id, players[index]?.id ?? '']));
  const participants = source?.participants?.map((participant, index) => {
    const playerIds = participant.playerIds.map((id) => idMap.get(id) ?? '');
    return { id: teamSize === 1 ? (playerIds[0] ?? '') : crypto.randomUUID(), playerIds, seed: index + 1 };
  }) ?? buildParticipants(players, teamSize, []);
  return { players, participants, teamSize, customGroups: null };
}

/** Entrant edits invalidate custom groups and rebuild teams while retaining stable team identities. */
export function changePreparationPlayers(draft: TournamentPreparation, players: Player[], participants?: Participant[]): TournamentPreparation {
  let updated = participants ?? buildParticipants(players, draft.teamSize, draft.participants);
  if (!participants && draft.players.every((player, index) => players[index]?.id === player.id)) {
    // Adding a player must not undo an independent ordering of existing teams.
    const previousOrder = new Map(draft.participants.map((participant, index) => [participant.id, index]));
    updated = updated.toSorted((a, b) => (previousOrder.get(a.id) ?? Number.POSITIVE_INFINITY) -
      (previousOrder.get(b.id) ?? Number.POSITIVE_INFINITY)).map((participant, index) => ({ ...participant, seed: index + 1 }));
  }
  return { ...draft, players, participants: updated, customGroups: null };
}

export function changePreparationTeamSize(teamSize: number): TournamentPreparation {
  return { players: [], participants: [], teamSize, customGroups: null };
}

/** The preview and submission use exactly the same assignment. */
export function getPreparationGroups(draft: TournamentPreparation, format: Format, groupCount: number): BaseGroup[] | null {
  if (format !== Format.GROUPS_TO_BRACKET) return null;
  if (draft.customGroups?.groupCount === groupCount) return draft.customGroups.groups;
  return distributePlayersToGroups(getParticipantPlayers(draft.players, draft.participants), groupCount);
}

export function changePreparationGroups(draft: TournamentPreparation, groups: BaseGroup[], groupCount: number): TournamentPreparation {
  validateGroups(groups, draft.participants, groupCount);
  const byId = new Map(draft.participants.map((participant) => [participant.id, participant]));
  const participants = groups.flatMap((group) => group.playerIds).map((id, index) => {
    const participant = byId.get(id);
    if (!participant) throw new Error(`Unknown participant ${id}`);
    return { ...participant, seed: index + 1 };
  });
  const playersById = new Map(draft.players.map((player) => [player.id, player]));
  const players = draft.teamSize === 1 ? participants.map((participant, index) => {
    const player = playersById.get(participant.playerIds[0] ?? '');
    if (!player) throw new Error('Unknown participant member');
    return { ...player, seed: index + 1 };
  }) : draft.players;
  return { ...draft, players, participants, customGroups: { groups, groupCount } };
}

/** Serializes validated membership, independent of temporary draft identities. */
export function serializeTournamentPreparation(draft: TournamentPreparation, format: Format, groupCount: number): {
  teamSize: number; participantPlayerIndexes: number[][]; groupParticipantIndexes?: number[][];
} {
  validateParticipants(draft.players, draft.participants, draft.teamSize);
  const groups = getPreparationGroups(draft, format, groupCount);
  if (groups) validateGroups(groups, draft.participants, groupCount);
  return {
    teamSize: draft.teamSize,
    participantPlayerIndexes: getMemberIndexes(draft.participants, draft.players.map((p) => p.id)),
    ...(groups && { groupParticipantIndexes: getMemberIndexes(groups, draft.participants.map((p) => p.id)) }),
  };
}

/** Restores request membership with the same invariants used when submitting a draft. */
export function restoreTournamentMembership(players: Player[], options: MembershipOptions): {
  participants: Participant[]; customGroups: BaseGroup[] | undefined;
} {
  const { teamSize = 1, groupCount = 2 } = options;
  if (!Number.isInteger(teamSize) || teamSize < 1) throw new Error('Each player must belong to exactly one complete participant');
  const participants = options.participantPlayerIndexes?.map((indexes, index) => ({
    id: teamSize === 1 ? (players[indexes[0] ?? -1]?.id ?? '') : crypto.randomUUID(),
    playerIds: indexes.map((i) => players[i]?.id ?? ''),
    seed: index + 1,
  })) ?? buildParticipants(players, teamSize, []);
  validateParticipants(players, participants, teamSize);
  const customGroups = options.groupParticipantIndexes?.map((indexes, index) => ({
    id: `g${index + 1}`,
    name: `Group ${indexToGroupLabel(index)}`,
    playerIds: indexes.map((i) => participants[i]?.id ?? ''),
  }));
  if (customGroups) validateGroups(customGroups, participants, groupCount);
  return { participants, customGroups };
}
