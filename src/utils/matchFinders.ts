import type { Bracket, Match } from '../types';

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
