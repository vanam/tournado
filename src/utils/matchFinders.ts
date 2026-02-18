import type { Bracket, DoubleElim, GroupStage, Match } from '../types';

export function findGroupMatch(
  groupStage: GroupStage,
  groupId: string,
  matchId: string
): Match | null {
  const group = groupStage.groups.find((g) => g.id === groupId);
  if (!group) return null;
  for (const round of group.schedule.rounds) {
    const match = round.matches.find((m) => m.id === matchId);
    if (match) return match;
  }
  return null;
}

export function findBracketMatch(
  bracket: Bracket | null | undefined,
  matchId: string
): Match | null {
  if (!bracket) return null;
  if (bracket.thirdPlaceMatch?.id === matchId) {
    return bracket.thirdPlaceMatch;
  }
  for (const round of bracket.rounds) {
    const match = round.find((m) => m.id === matchId);
    if (match) return match;
  }
  return null;
}

export function findDoubleElimMatch(
  doubleElim: DoubleElim | null | undefined,
  matchId: string
): Match | null {
  if (!doubleElim) return null;
  for (const round of doubleElim.winners.rounds) {
    const match = round.find((m) => m.id === matchId);
    if (match) return match;
  }
  for (const round of doubleElim.losers.rounds) {
    const match = round.find((m) => m.id === matchId);
    if (match) return match;
  }
  if (doubleElim.finals.grandFinal.id === matchId) {
    return doubleElim.finals.grandFinal;
  }
  if (doubleElim.finals.resetFinal.id === matchId) {
    return doubleElim.finals.resetFinal;
  }
  return null;
}
