import type { Player, Participant } from '../types';

export function computeParticipantElo(playerIds: string[], players: Player[]): number | undefined {
  const elos = playerIds
    .map((id) => players.find((p) => p.id === id)?.elo)
    .filter((elo): elo is number => elo !== undefined);
  if (elos.length === 0) return undefined;
  return Math.round(elos.reduce((a, b) => a + b, 0) / elos.length);
}

export function getParticipantName(playerIds: string[], players: Player[]): string {
  return playerIds
    .map((id) => players.find((p) => p.id === id)?.name ?? '?')
    .join('/');
}

export function getParticipantMembers(participantId: string, players: Player[], participants: Participant[]): Player[] {
  const participant = participants.find((p) => p.id === participantId);
  if (participant === undefined) return [];
  return participant.playerIds
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);
}

export function allParticipantsComplete(participants: Participant[], teamSize: number): boolean {
  return participants.every((p) => p.playerIds.length === teamSize);
}

export function buildParticipants(players: Player[], teamSize: number, existingParticipants: Participant[]): Participant[] {
  if (teamSize <= 1) {
    return players.map((player, i) => ({
      id: player.id,
      playerIds: [player.id],
      seed: i + 1,
    }));
  }

  // Build a map from sorted playerIds key -> existing participant id for stable identity
  const existingMap = new Map<string, string>();
  for (const p of existingParticipants) {
    const key = p.playerIds.toSorted((a, b) => a.localeCompare(b)).join(',');
    existingMap.set(key, p.id);
  }

  const result: Participant[] = [];
  for (let i = 0; i < players.length; i += teamSize) {
    const slice = players.slice(i, i + teamSize);
    const playerIds = slice.map((p) => p.id);
    const key = playerIds.toSorted((a, b) => a.localeCompare(b)).join(',');
    const id = existingMap.get(key) ?? crypto.randomUUID();
    result.push({ id, playerIds, seed: result.length + 1 });
  }
  return result;
}

export function getParticipantPlayers(players: Player[], participants: Participant[]): Player[] {
  return participants.map((p) => {
    const participant: Player = {
      id: p.id,
      name: getParticipantName(p.playerIds, players),
    };
    const elo = computeParticipantElo(p.playerIds, players);
    if (elo !== undefined) participant.elo = elo;
    if (p.seed !== undefined) participant.seed = p.seed;
    return participant;
  });
}

export function ensureParticipants(players: Player[], participants: Participant[] | undefined): Participant[] {
  if (participants !== undefined && participants.length > 0) return participants;
  return buildParticipants(players, 1, []);
}
