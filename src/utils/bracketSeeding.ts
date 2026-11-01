import type { Bracket } from '../types';

/** Maps each zero-based seed to a slot, separating the top 2, 4, 8, ... seeds recursively. */
export function seedPositions(bracketSize: number): number[] {
  if (bracketSize < 1 || !Number.isInteger(Math.log2(bracketSize))) {
    throw new Error('Bracket size must be a positive power of two');
  }
  let seeds = [1];
  for (let size = 2; size <= bracketSize; size *= 2) {
    seeds = seeds.flatMap((seed) => [seed, size + 1 - seed]);
  }
  const positions: number[] = Array.from({ length: bracketSize });
  for (const [slot, seed] of seeds.entries()) positions[seed - 1] = slot;
  return positions;
}

// Unmarked saved brackets retain their original slot mapping during participant synchronization.
function legacySeedPositions(bracketSize: number): number[] {
  if (bracketSize === 1) return [0];
  const positions: number[] = Array.from({ length: bracketSize });
  const half = bracketSize / 2;
  const pairOrder: number[] = [];
  for (let i = 1; i <= half; i += 2) pairOrder.push(i);
  for (let i = 2; i <= half; i += 2) pairOrder.push(i);

  for (const [pairSlot, pairIndex] of pairOrder.entries()) {
    const topSeed = pairIndex - 1;
    const bottomSeed = bracketSize - pairIndex;
    positions[topSeed] = pairSlot * 2;
    positions[bottomSeed] = pairSlot * 2 + 1;
  }

  return positions;
}

/**
 * Maps zero-based seeds to first-round slots using the saved layout.
 * Unmarked brackets keep their legacy mapping.
 */
export function getBracketSeedPositions(bracket: Bracket): number[] {
  const size = (bracket.rounds[0]?.length ?? 0) * 2;
  if (!size) return [];
  return bracket.seeding === 'balanced' ? seedPositions(size) : legacySeedPositions(size);
}

export function getBracketParticipantAtSeed(bracket: Bracket, seed: number): string | null {
  const round0 = bracket.rounds[0];
  if (!round0 || round0.length === 0) return null;
  const positions = getBracketSeedPositions(bracket);
  const slotIdx = positions[seed];
  if (slotIdx === undefined) return null;
  const matchIdx = Math.floor(slotIdx / 2);
  const isPlayer2 = slotIdx % 2 === 1;
  const match = round0[matchIdx];
  if (!match) return null;
  return isPlayer2 ? (match.player2Id ?? null) : (match.player1Id ?? null);
}

