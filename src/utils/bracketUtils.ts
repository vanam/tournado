import type { Player, Match, Bracket, SetScore } from '../types';
import { createMatchIdGenerator } from './matchIdGenerator';
import { createMatch } from './matchFactory';
import { seedPositions } from './bracketSeeding';
import { replayElimination } from './replayElimination';
import { findBracketMatch } from './matchFinders';
export { seedPositions, getBracketSeedPositions, getBracketParticipantAtSeed } from './bracketSeeding';

export function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Helper function to check if a match is a dummy match (used in losers bracket)
export function isDummyMatch(match: Match | null | undefined): boolean {
  return match?.dummy ?? false;
}

const matchIdGenerator = createMatchIdGenerator();

function assignPlayersToSlots(players: Player[], bracketSize: number, positions: number[]): (string | null)[] {
  const slots: (string | null)[] = Array.from({ length: bracketSize }, () => null);
  for (let seed = 0; seed < bracketSize; seed++) {
    const pos = positions[seed];
    if (pos === undefined) continue;
    if (seed < players.length) {
      const player = players[seed];
      if (player) slots[pos] = player.id;
    }
    // else remains null (BYE)
  }
  return slots;
}

function createFirstRound(slots: (string | null)[], nextMatchId: () => string): Match[] {
  const round1: Match[] = [];
  for (let i = 0; i < slots.length; i += 2) {
    const s1 = slots[i] ?? null;
    const s2 = slots[i + 1] ?? null;
    round1.push(
      createMatch(nextMatchId(), {
        player1Id: s1,
        player2Id: s2,
        position: i / 2,
      })
    );
  }
  return round1;
}

function createSubsequentRounds(rounds: Match[][], numRounds: number, nextMatchId: () => string): void {
  for (let r = 1; r < numRounds; r++) {
    const prevRound = rounds[r - 1];
    if (!prevRound) continue;
    const round: Match[] = [];
    for (let i = 0; i < prevRound.length; i += 2) {
      const feederA = prevRound[i];
      const feederB = prevRound[i + 1];
      if (!feederA || !feederB) continue;
      const match: Match = createMatch(nextMatchId(), {
        position: i / 2,
      });
      feederA.nextMatchId = match.id;
      feederB.nextMatchId = match.id;
      round.push(match);
    }
    rounds.push(round);
  }
}

function createThirdPlaceMatch(numRounds: number, nextMatchId: () => string): Match | null {
  return numRounds >= 2 ? createMatch(nextMatchId()) : null;
}

/** Input order defines seeding, including earned group placements rather than original player seeds. */
export function generateBracket(players: Player[]): Bracket {
  matchIdGenerator.reset();
  const n = players.length;
  const bracketSize = nextPowerOf2(n);
  const numRounds = Math.log2(bracketSize);
  const positions = seedPositions(bracketSize);
  const nextMatchId = (): string => matchIdGenerator.nextId('m');

  const slots = assignPlayersToSlots(players, bracketSize, positions);
  const rounds: Match[][] = [];
  const round1 = createFirstRound(slots, nextMatchId);
  rounds.push(round1);
  createSubsequentRounds(rounds, numRounds, nextMatchId);

  const thirdPlaceMatch = createThirdPlaceMatch(numRounds, nextMatchId);
  const bracket: Bracket = { rounds, thirdPlaceMatch, seeding: 'balanced' };
  replayElimination(bracket);
  return bracket;
}

// Pomocná funkce: najde zápas v pavouku a vrátí { match, roundIndex }
function findMatchInBracket(rounds: Match[][], matchId: string): { match: Match | null, roundIndex: number } {
  let roundIndex = 0;
  for (const round of rounds) {
    const match = round.find((m) => m.id === matchId) ?? null;
    if (match) return { match, roundIndex };
    roundIndex++;
  }
  return { match: null, roundIndex: -1 };
}

/** Records a result and reconciles all dependent winner and loser slots. */
export function advanceWinner(bracket: Bracket, matchId: string, winnerId: string, scores: SetScore[], walkover = false): Bracket {
  if (findBracketMatch(bracket, matchId)) replayElimination(bracket, { matchId, winnerId, scores, walkover });
  return bracket;
}

export function hasPlayedDownstreamMatch(bracket: Bracket, matchId: string): boolean {
  // 3rd place match is terminal — no downstream
  if (matchId === bracket.thirdPlaceMatch?.id) {
    return false;
  }

  const { match, roundIndex } = findMatchInBracket(bracket.rounds, matchId);
  if (!match) return false;

  // Check if next match in bracket has been played
  if (match.nextMatchId) {
    for (let nr = roundIndex + 1; nr < bracket.rounds.length; nr++) {
      const roundNr = bracket.rounds[nr];
      if (!roundNr) continue;
      const nextMatch = roundNr.find((m) => m.id === match.nextMatchId);
      if (nextMatch) {
        if (nextMatch.winnerId) return true;
        break;
      }
    }
  }

  // Semifinal → also check 3rd place match
  const semiRoundIndex = bracket.rounds.length - 2;
  if (roundIndex === semiRoundIndex && bracket.thirdPlaceMatch?.winnerId) {
    return true;
  }

  return false;
}

export function canEditMatch(bracket: Bracket, matchId: string): boolean {
  if (matchId === bracket.thirdPlaceMatch?.id) {
    return !!(bracket.thirdPlaceMatch.player1Id && bracket.thirdPlaceMatch.player2Id);
  }
  const { match } = findMatchInBracket(bracket.rounds, matchId);
  if (!match) return false;
  return !!(match.player1Id && match.player2Id);
}

/**
 * Returns true if `playerId` has participated in a real bracket match
 * (both players present + result recorded). BYE auto-advances are not counted.
 */
export function hasPlayerPlayedBracketMatch(bracket: Bracket, playerId: string): boolean {
  const allMatches = [...bracket.rounds.flat(), bracket.thirdPlaceMatch];
  for (const match of allMatches) {
    if (!match) continue;
    const involved = match.player1Id === playerId || match.player2Id === playerId;
    const realMatch = match.player1Id !== null && match.player2Id !== null;
    if (involved && realMatch && match.winnerId !== null) return true;
  }
  return false;
}

/**
 * Replaces all occurrences of `oldPlayerId` with `newPlayerId` in the bracket
 * (player1Id, player2Id, winnerId across all rounds and thirdPlaceMatch).
 */
export function swapBracketParticipant(bracket: Bracket, oldPlayerId: string, newPlayerId: string): void {
  const allMatches = [...bracket.rounds.flat(), bracket.thirdPlaceMatch];
  for (const match of allMatches) {
    if (!match) continue;
    if (match.player1Id === oldPlayerId) match.player1Id = newPlayerId;
    if (match.player2Id === oldPlayerId) match.player2Id = newPlayerId;
    if (match.winnerId === oldPlayerId) match.winnerId = newPlayerId;
  }
}

export function getBracketWinner(bracket: Bracket): string | null {
  const finalRound = bracket.rounds.at(-1);
  if (!finalRound) return null;
  if (finalRound.length === 1) {
    const finalMatch = finalRound[0];
    if (!finalMatch) return null;
    if (finalMatch.winnerId) return finalMatch.winnerId;
  }
  return null;
}

export function clearMatchResult(bracket: Bracket, matchId: string): Bracket {
  if (findBracketMatch(bracket, matchId)) replayElimination(bracket, { matchId, winnerId: null, scores: [], walkover: false });
  return bracket;
}
