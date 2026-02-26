import type { Player, Match, Bracket, SetScore } from '../types';
import { createMatchIdGenerator } from './matchIdGenerator';
import { createMatch } from './matchFactory';

export function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Helper function to check if a match is a dummy match (used in losers bracket)
export function isDummyMatch(match: Match | null | undefined): boolean {
  return match?.dummy ?? false;
}

// Standard seeding positions for a bracket of given size.
// For size 8: seeds play [1v8, 3v6, 2v7, 4v5] in round 1.
export function seedPositions(bracketSize: number): number[] {
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

function autoAdvanceByes(round: Match[]): void {
  for (const match of round) {
    if (match.player1Id && !match.player2Id) {
      match.winnerId = match.player1Id;
    } else if (!match.player1Id && match.player2Id) {
      match.winnerId = match.player2Id;
    }
  }
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
        player1Id: feederA.winnerId ?? null,
        player2Id: feederB.winnerId ?? null,
        position: i / 2,
      });
      feederA.nextMatchId = match.id;
      feederB.nextMatchId = match.id;
      // Auto-advance only when both feeders are fully resolved.
      const feederAResolved = !!feederA.winnerId || (!feederA.player1Id && !feederA.player2Id);
      const feederBResolved = !!feederB.winnerId || (!feederB.player1Id && !feederB.player2Id);
      if (feederAResolved && feederBResolved) {
        if (match.player1Id && !match.player2Id) {
          match.winnerId = match.player1Id;
        } else if (!match.player1Id && match.player2Id) {
          match.winnerId = match.player2Id;
        }
      }
      round.push(match);
    }
    rounds.push(round);
  }
}

function createThirdPlaceMatch(numRounds: number, nextMatchId: () => string): Match | null {
  return numRounds >= 2 ? createMatch(nextMatchId()) : null;
}

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
  autoAdvanceByes(round1);
  rounds.push(round1);
  createSubsequentRounds(rounds, numRounds, nextMatchId);

  const thirdPlaceMatch = createThirdPlaceMatch(numRounds, nextMatchId);
  return { rounds, thirdPlaceMatch };
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

// Pomocná funkce: nastaví výsledek zápasu
function updateMatchResult(match: Match, winnerId: string, scores: SetScore[], walkover: boolean): void {
  match.winnerId = winnerId;
  match.scores = scores;
  match.walkover = walkover;
}

// Pomocná funkce: nastaví poraženého do zápasu o 3. místo
function feedSemifinalLoserToThirdPlace(bracket: Bracket, match: Match, winnerId: string, roundIndex: number): void {
  const semiRoundIndex = bracket.rounds.length - 2;
  if (bracket.thirdPlaceMatch && roundIndex === semiRoundIndex) {
    const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
    if (match.position === 0) {
      bracket.thirdPlaceMatch.player1Id = loserId;
    } else {
      bracket.thirdPlaceMatch.player2Id = loserId;
    }
  }
}

function findNextMatch(
  rounds: Match[][],
  nextMatchId: string | null | undefined
): { match: Match; roundIndex: number } | null {
  if (!nextMatchId) return null;
  for (const [nr, roundNr] of rounds.entries()) {
    const match = roundNr.find((m) => m.id === nextMatchId && !isDummyMatch(m));
    if (match) {
      return { match, roundIndex: nr };
    }
  }
  return null;
}

function getFeedIndex(prevRound: Match[], matchId: string): number {
  const realMatches = prevRound.filter(m => !isDummyMatch(m));
  return realMatches.findIndex((m) => m.id === matchId);
}

function updateNextMatchSlot(nextMatch: Match, feedIndex: number, winnerId: string | null): void {
  if (feedIndex % 2 === 0) {
    nextMatch.player1Id = winnerId;
  } else {
    nextMatch.player2Id = winnerId;
  }
}

function tryAutoAdvance(nextMatch: Match, prevRound: Match[], feedIndex: number): void {
  const realMatches = prevRound.filter(m => !isDummyMatch(m));
  const feederAIdx = Math.floor(feedIndex / 2) * 2;
  const feederA = realMatches[feederAIdx];
  const feederB = realMatches[feederAIdx + 1];
  const feederAResolved = !feederA || !!feederA.winnerId || (!feederA.player1Id && !feederA.player2Id);
  const feederBResolved = !feederB || !!feederB.winnerId || (!feederB.player1Id && !feederB.player2Id);
  if (feederAResolved && feederBResolved) {
    if (nextMatch.player1Id && !nextMatch.player2Id) {
      nextMatch.winnerId = nextMatch.player1Id;
    } else if (!nextMatch.player1Id && nextMatch.player2Id) {
      nextMatch.winnerId = nextMatch.player2Id;
    }
  }
}

function cascadeWinner(bracket: Bracket, match: Match, roundIndex: number): void {
  const rounds = bracket.rounds;
  let currentMatch = match;
  let currentRound = roundIndex;
  while (currentMatch.nextMatchId) {
    const result = findNextMatch(rounds, currentMatch.nextMatchId);
    if (!result || result.roundIndex <= currentRound) break;
    const nextMatch = result.match;
    const nextRound = result.roundIndex;
    const prevRound = rounds[nextRound - 1];
    if (!prevRound) break;
    const feedIndex = getFeedIndex(prevRound, currentMatch.id);
    if (feedIndex === -1) break;
    updateNextMatchSlot(nextMatch, feedIndex, currentMatch.winnerId);
    tryAutoAdvance(nextMatch, prevRound, feedIndex);
    if (!nextMatch.winnerId) break;
    currentMatch = nextMatch;
    currentRound = nextRound;
  }
}

export function advanceWinner(bracket: Bracket, matchId: string, winnerId: string, scores: SetScore[], walkover = false): Bracket {
  // Zápas o 3. místo: pouze aktualizace
  if (matchId === bracket.thirdPlaceMatch?.id) {
    updateMatchResult(bracket.thirdPlaceMatch, winnerId, scores, walkover);
    return bracket;
  }
  const { match, roundIndex } = findMatchInBracket(bracket.rounds, matchId);
  if (!match) return bracket;
  updateMatchResult(match, winnerId, scores, walkover);
  feedSemifinalLoserToThirdPlace(bracket, match, winnerId, roundIndex);
  cascadeWinner(bracket, match, roundIndex);
  return bracket;
}

export function canEditMatch(bracket: Bracket, matchId: string): boolean {
  // 3rd place match is terminal — always editable if it has both players
  if (matchId === bracket.thirdPlaceMatch?.id) {
    return !!(bracket.thirdPlaceMatch.player1Id && bracket.thirdPlaceMatch.player2Id);
  }

  for (let r = 0; r < bracket.rounds.length; r++) {
    const roundR = bracket.rounds[r];
    if (!roundR) continue;
    const match = roundR.find((m) => m.id === matchId);
    if (!match) continue;

    // Can edit if the next match hasn't been played yet
    if (!match.nextMatchId) return true;
    for (let nr = r + 1; nr < bracket.rounds.length; nr++) {
      const roundNr = bracket.rounds[nr];
      if (!roundNr) continue;
      const nextMatch = roundNr.find(
        (m) => m.id === match.nextMatchId
      );
      if (nextMatch) {
        return !nextMatch.winnerId;
      }
    }
    return true;
  }
  return false;
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

// Pomocná funkce: vyhledá zápas a jeho kolo v pavouku
function findMatchAndRound(bracket: Bracket, matchId: string): { match: Match | null, roundIndex: number } {
  for (const [r, roundR] of bracket.rounds.entries()) {
    if (!Array.isArray(roundR) || roundR.length === 0) continue;
    const idx = roundR.findIndex((m) => m.id === matchId);
    if (idx !== -1) {
      return { match: roundR[idx] ?? null, roundIndex: r };
    }
  }
  return { match: null, roundIndex: -1 };
}

// Pomocná funkce: vymaže výsledek zápasu
function resetMatchResult(match: Match): void {
  match.winnerId = null;
  match.scores = [];
  match.walkover = false;
}

// Pomocná funkce: kaskádově vymaže navazující zápasy
function cascadeClearMatches(bracket: Bracket, startMatch: Match, startRound: number): void {
  let currentMatch = startMatch;
  let currentRound = startRound;
  while (currentMatch.nextMatchId) {
    let nextMatch: Match | null = null;
    let nextRound = -1;
    for (let nr = currentRound + 1; nr < bracket.rounds.length; nr++) {
      const roundNr = bracket.rounds[nr];
      if (!roundNr) continue;
      const idx = roundNr.findIndex((m) => m.id === currentMatch.nextMatchId && !isDummyMatch(m));
      if (idx !== -1) {
        nextMatch = roundNr[idx] ?? null;
        nextRound = nr;
        break;
      }
    }
    if (!nextMatch) break;
    const prevRound = bracket.rounds[nextRound - 1];
    if (!prevRound) break;
    // Filter out dummy matches when finding feed index
    const realMatches = prevRound.filter(m => !isDummyMatch(m));
    const feedIndex = realMatches.findIndex((m) => m.id === currentMatch.id);
    if (feedIndex !== -1) {
      if (feedIndex % 2 === 0) {
        nextMatch.player1Id = null;
      } else {
        nextMatch.player2Id = null;
      }
    }
    resetMatchResult(nextMatch);
    currentMatch = nextMatch;
    currentRound = nextRound;
  }
}

export function clearMatchResult(bracket: Bracket, matchId: string): Bracket {
  // Zápas o 3. místo
  if (matchId === bracket.thirdPlaceMatch?.id) {
    resetMatchResult(bracket.thirdPlaceMatch);
    return bracket;
  }

  const { match: currentMatch, roundIndex: currentRound } = findMatchAndRound(bracket, matchId);
  if (!currentMatch) return bracket;

  resetMatchResult(currentMatch);

  // Pokud čistíme semifinále, vymažeme hráče ze zápasu o 3. místo a jeho výsledek
  const semiRoundIndex = bracket.rounds.length - 2;
  if (bracket.thirdPlaceMatch && currentRound === semiRoundIndex) {
    if (currentMatch.position === 0) {
      bracket.thirdPlaceMatch.player1Id = null;
    } else {
      bracket.thirdPlaceMatch.player2Id = null;
    }
    resetMatchResult(bracket.thirdPlaceMatch);
  }

  cascadeClearMatches(bracket, currentMatch, currentRound);
  return bracket;
}
