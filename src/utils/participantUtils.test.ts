import { describe, it, expect } from 'vitest';
import type { Player, Participant } from '../types';
import { buildParticipants, allParticipantsComplete, getParticipantPlayers } from './participantUtils';

function makePlayer(id: string, name: string): Player {
  return { id, name };
}

function makeParticipant(id: string, playerIds: string[]): Participant {
  return { id, playerIds };
}

describe('buildParticipants', () => {
  it('creates one participant per player when teamSize is 1', () => {
    const players = [makePlayer('p1', 'Alice'), makePlayer('p2', 'Bob')];
    const participants = buildParticipants(players, 1, []);
    expect(participants).toHaveLength(2);
    expect(participants[0]!.id).toBe('p1');
    expect(participants[0]!.playerIds).toEqual(['p1']);
    expect(participants[1]!.id).toBe('p2');
    expect(participants[1]!.playerIds).toEqual(['p2']);
  });

  it('creates complete participants when player count is divisible by teamSize', () => {
    const players = [makePlayer('p1', 'Alice'), makePlayer('p2', 'Bob'), makePlayer('p3', 'Carol'), makePlayer('p4', 'Dave')];
    const participants = buildParticipants(players, 2, []);
    expect(participants).toHaveLength(2);
    expect(participants[0]!.playerIds).toHaveLength(2);
    expect(participants[1]!.playerIds).toHaveLength(2);
  });

  it('reproduces bug: creates incomplete participant when player count is not divisible by teamSize', () => {
    // Bug: with 3 players and teamSize=2, buildParticipants creates a participant with only 1 player.
    const players = [makePlayer('p1', 'Alice'), makePlayer('p2', 'Bob'), makePlayer('p3', 'Carol')];
    const participants = buildParticipants(players, 2, []);
    expect(participants).toHaveLength(2);
    const incomplete = participants.find((p) => p.playerIds.length < 2);
    expect(incomplete).toBeDefined(); // bug: incomplete participant exists
  });

  it('preserves existing participant ids for stable identity', () => {
    const players = [makePlayer('p1', 'Alice'), makePlayer('p2', 'Bob')];
    const existing = makeParticipant('part-abc', ['p1', 'p2']);
    const participants = buildParticipants(players, 2, [existing]);
    expect(participants[0]!.id).toBe('part-abc');
  });

  it('assigns sequential seeds', () => {
    const players = [makePlayer('p1', 'A'), makePlayer('p2', 'B'), makePlayer('p3', 'C'), makePlayer('p4', 'D')];
    const participants = buildParticipants(players, 2, []);
    expect(participants[0]!.seed).toBe(1);
    expect(participants[1]!.seed).toBe(2);
  });
});

describe('allParticipantsComplete', () => {
  it('returns true when all participants have exactly teamSize players', () => {
    const participants = [makeParticipant('t1', ['p1', 'p2']), makeParticipant('t2', ['p3', 'p4'])];
    expect(allParticipantsComplete(participants, 2)).toBe(true);
  });

  it('returns false when a participant has fewer players than teamSize', () => {
    const participants = [makeParticipant('t1', ['p1', 'p2']), makeParticipant('t2', ['p3'])];
    expect(allParticipantsComplete(participants, 2)).toBe(false);
  });

  it('returns true for empty participants array', () => {
    expect(allParticipantsComplete([], 2)).toBe(true);
  });

  it('returns true for singles (teamSize 1)', () => {
    const participants = [makeParticipant('t1', ['p1']), makeParticipant('t2', ['p2'])];
    expect(allParticipantsComplete(participants, 1)).toBe(true);
  });
});

describe('getParticipantPlayers', () => {
  it('maps participants to player-like objects', () => {
    const players = [makePlayer('p1', 'Alice'), makePlayer('p2', 'Bob')];
    const participants = [makeParticipant('t1', ['p1', 'p2'])];
    const result = getParticipantPlayers(players, participants);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('t1');
    expect(result[0]!.name).toBe('Alice/Bob');
  });

  it('maps single-player participants correctly', () => {
    const players = [makePlayer('p1', 'Alice'), makePlayer('p2', 'Bob')];
    const participants = [makeParticipant('p1', ['p1']), makeParticipant('p2', ['p2'])];
    const result = getParticipantPlayers(players, participants);
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe('p1');
    expect(result[0]!.name).toBe('Alice');
    expect(result[1]!.id).toBe('p2');
    expect(result[1]!.name).toBe('Bob');
  });
});
