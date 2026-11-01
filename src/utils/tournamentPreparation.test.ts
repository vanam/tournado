import { describe, expect, it } from 'vitest';
import { BracketType, Format } from '../types';
import type { GroupsToBracketTournament, Player } from '../types';
import { buildParticipants } from './participantUtils';
import {
  changePreparationGroups,
  changePreparationPlayers,
  changePreparationTeamSize,
  createTournamentPreparation,
  getPreparationGroups,
  restoreTournamentMembership,
  serializeTournamentPreparation,
} from './tournamentPreparation';

function makeSource(teamSize: number): GroupsToBracketTournament {
  const players = Array.from({ length: 6 }, (_, index) => ({ id: `p${index}`, name: `Player ${index}` }));
  return {
    id: 'source', name: 'Source', version: 1, createdAt: '2026-01-01T00:00:00.000Z',
    format: Format.GROUPS_TO_BRACKET, teamSize, players, participants: buildParticipants(players, teamSize, []),
    groupStage: { groups: [], settings: { groupCount: 2, qualifiers: [1, 1], consolation: false, bracketType: BracketType.SINGLE_ELIM } },
  };
}

describe('tournament preparation', () => {
  it('keeps copied singles through a group move and membership round trip', () => {
    const source = makeSource(1);
    const draft = createTournamentPreparation(source);
    expect(draft.players.every((p) => !source.players.some((original) => original.id === p.id))).toBe(true);
    expect(draft.participants.map((p) => p.id)).toEqual(draft.participants.map((p) => p.playerIds[0]));
    const groups = getPreparationGroups(draft, Format.GROUPS_TO_BRACKET, 2)!;
    const moved = groups[0]!.playerIds[0]!;
    const edited = changePreparationGroups(draft, [
      { ...groups[0]!, playerIds: groups[0]!.playerIds.slice(1) },
      { ...groups[1]!, playerIds: [...groups[1]!.playerIds, moved] },
    ], 2);
    const membership = serializeTournamentPreparation(edited, Format.GROUPS_TO_BRACKET, 2);
    const restored = restoreTournamentMembership(edited.players, { ...membership, groupCount: 2 });
    expect(edited.players).toHaveLength(source.players.length);
    expect(edited.players.map((p) => p.name).toSorted((a, b) => a.localeCompare(b)))
      .toEqual(source.players.map((p) => p.name).toSorted((a, b) => a.localeCompare(b)));
    expect(restored.customGroups).toEqual(getPreparationGroups(edited, Format.GROUPS_TO_BRACKET, 2));
    expect(restored.participants).toEqual(edited.participants);
  });

  it('preserves explicit team order and membership when submitting edited groups', () => {
    const draft = createTournamentPreparation(makeSource(2));
    const groups = getPreparationGroups(draft, Format.GROUPS_TO_BRACKET, 2)!;
    const [first, second, third] = draft.participants;
    const edited = changePreparationGroups(draft, [
      { ...groups[0]!, playerIds: [third!.id] },
      { ...groups[1]!, playerIds: [second!.id, first!.id] },
    ], 2);
    const membership = serializeTournamentPreparation(edited, Format.GROUPS_TO_BRACKET, 2);
    expect(membership.participantPlayerIndexes).toEqual([[4, 5], [2, 3], [0, 1]]);
    expect(membership.groupParticipantIndexes).toEqual([[0], [1, 2]]);
    const restored = restoreTournamentMembership(edited.players, { ...membership, groupCount: 2 });
    expect(restored.participants.map((p) => p.playerIds)).toEqual(edited.participants.map((p) => p.playerIds));
    expect(restored.customGroups?.map((g) => g.playerIds)).toEqual([
      [restored.participants[0]!.id], restored.participants.slice(1).map((p) => p.id),
    ]);

    const added: Player = { id: 'new-player', name: 'New player' };
    const extended = changePreparationPlayers(edited, [...edited.players, added]);
    expect(extended.participants.slice(0, 3).map((p) => p.id)).toEqual(edited.participants.map((p) => p.id));
    expect(extended.customGroups).toBeNull();
    expect(() => serializeTournamentPreparation(extended, Format.GROUPS_TO_BRACKET, 2)).toThrow('complete participant');
  });

  it('invalidates edited groups atomically with player or team size changes', () => {
    const draft = createTournamentPreparation(makeSource(2));
    const edited = changePreparationGroups(draft, getPreparationGroups(draft, Format.GROUPS_TO_BRACKET, 2)!, 2);
    const players = edited.players.toReversed();
    const participants = buildParticipants(players, 2, edited.participants);
    const reordered = changePreparationPlayers(edited, players, participants);
    expect(reordered.participants).toEqual(participants);
    expect(reordered.customGroups).toBeNull();
    const generated = getPreparationGroups(reordered, Format.GROUPS_TO_BRACKET, 2)!;
    const serialized = serializeTournamentPreparation(reordered, Format.GROUPS_TO_BRACKET, 2);
    const restored = restoreTournamentMembership(reordered.players, { ...serialized, groupCount: 2 });
    expect(generated.map((g) => g.playerIds.map((id) => reordered.participants.findIndex((p) => p.id === id))))
      .toEqual(serialized.groupParticipantIndexes);
    expect(restored.customGroups?.map((g) => g.playerIds.length)).toEqual(generated.map((g) => g.playerIds.length));
    expect(changePreparationTeamSize(1)).toEqual({ players: [], participants: [], teamSize: 1, customGroups: null });
  });

  it.each([
    [[0, 1], [1, 3]],
    [[0, 1], [2]],
    [[0, 1], [2, 99]],
  ])('rejects invalid team membership %j', (...participantPlayerIndexes) => {
    const players = makeSource(2).players.slice(0, 4);
    expect(() => restoreTournamentMembership(players, { teamSize: 2, participantPlayerIndexes })).toThrow('complete participant');
  });

  it('rejects missing, duplicate and unknown group entrants at the same seam', () => {
    const players = makeSource(1).players.slice(0, 4);
    for (const groupParticipantIndexes of [[[0], [1, 2]], [[0, 1], [1, 2]], [[0, 1], [2, 99]]]) {
      expect(() => restoreTournamentMembership(players, { groupCount: 2, groupParticipantIndexes })).toThrow('exactly one group');
    }
  });

  it.each([0, -1, 1.5])('rejects invalid team size %s before building membership', (teamSize) => {
    expect(() => restoreTournamentMembership(makeSource(1).players, { teamSize })).toThrow('complete participant');
  });
});
