import type {
  Bracket,
  DoubleElim,
  DoubleElimFinals,
  DoubleElimMatch,
  LoserLink,
  Match,
  Player,
  SetScore,
} from '../types';
import {createMatchIdGenerator} from './matchIdGenerator';
import {createMatch} from './matchFactory';
import {
  advanceWinner,
  canEditMatch,
  clearMatchResult,
  generateBracket,
  getBracketWinner,
  isDummyMatch,
} from './bracketUtils';

const matchIdGenerator = createMatchIdGenerator();

function nextMatchId(prefix: string): string {
  return matchIdGenerator.nextId(prefix);
}

function prefixBracketIds(bracket: Bracket, prefix: string): void {
  const idMap = new Map<string, string>();
  for (const round of bracket.rounds) {
    for (const match of round) {
      const newId = `${prefix}${match.id}`;
      idMap.set(match.id, newId);
      match.id = newId;
    }
  }
  for (const round of bracket.rounds) {
    for (const match of round) {
      if (match.nextMatchId) {
        match.nextMatchId = idMap.get(match.nextMatchId) ?? match.nextMatchId;
      }
    }
  }
}

type MatchUnion =
    | Match
    | DoubleElimMatch
    | null;

function findMatchInRounds(rounds: Match[][], matchId: string): Match | null;
function findMatchInRounds(
  rounds: Match[][] | DoubleElimMatch[][],
  matchId: string
): MatchUnion {
  for (const round of rounds) {
    const match = round.find((m) => m.id === matchId && !isDummyMatch(m));
    if (match) return match;
  }
  return null;
}

// Type alias for findMatchInDoubleElim return value
type FindMatchInDoubleElimResult =
  | { section: 'winners'; match: Match }
  | { section: 'losers'; match: DoubleElimMatch }
  | { section: 'finals'; match: Match }
  | null;

function findMatchInDoubleElim(
  doubleElim: DoubleElim,
  matchId: string
): FindMatchInDoubleElimResult {
  const winnersMatch = findMatchInRounds(doubleElim.winners.rounds, matchId);
  if (winnersMatch) {
    return { section: 'winners', match: winnersMatch };
  }
  const losersMatch = findMatchInRounds(doubleElim.losers.rounds, matchId);
  if (losersMatch) {
    return { section: 'losers', match: losersMatch };
  }
  if (doubleElim.finals.grandFinal.id === matchId) {
    return { section: 'finals', match: doubleElim.finals.grandFinal };
  }
  if (doubleElim.finals.resetFinal.id === matchId) {
    return { section: 'finals', match: doubleElim.finals.resetFinal };
  }
  return null;
}

function getFinalMatch(bracket: Bracket): Match | null {
  const finalRound = bracket.rounds.at(-1);
  return finalRound?.[0] ?? null;
}

function getMatchLoserId(match: MatchUnion): string | null {
  if (!match?.winnerId) return null;
  if (match.player1Id && match.player2Id) {
    return match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
  }
  return null;
}

function isMatchResolved(match: MatchUnion): boolean {
  if (!match || isDummyMatch(match)) return false;
  if (match.winnerId) return true;
  return !match.player1Id && !match.player2Id;
}

function hasMatchResult(match: MatchUnion): boolean {
  if (!match || isDummyMatch(match)) return false;
  return !!match.winnerId || match.walkover || match.scores.length > 0;
}

function buildFirstLosersRound(winnersRounds: Bracket["rounds"]): {
  firstRound: DoubleElimMatch[];
  loserLinks: Record<string, LoserLink>;
} {
  const firstRound: DoubleElimMatch[] = [];
  const loserLinks: Record<string, LoserLink> = {};
  const wr0 = winnersRounds[0];
  if (!wr0) return { firstRound, loserLinks };
  for (let i = 0; i < wr0.length; i += 2) {
    const wm0 = wr0[i];
    const wm1 = wr0[i + 1];
    if (!wm0 || !wm1) continue;
    const match: DoubleElimMatch = {
      ...createMatch(nextMatchId('l-'), { position: i / 2 }),
      winnersSources: [wm0.id, wm1.id],
    };
    firstRound.push(match);
    loserLinks[wm0.id] = { matchId: match.id, slot: 'player1Id' };
    loserLinks[wm1.id] = { matchId: match.id, slot: 'player2Id' };

    // Add dummy matches for missing pairs to keep the bracket structure consistent
    firstRound.push({
      id: '',
      player1Id: null,
      player2Id: null,
      winnersSources: [],
      scores: [],
      winnerId: null,
      walkover: false,
      position: firstRound.length,
      dummy: true,
    });
  }
  return { firstRound, loserLinks };
}

function buildSubsequentLosersRounds(
  winnersRounds: Bracket["rounds"],
  startRound: number,
  loserLinks: Record<string, LoserLink>
): DoubleElimMatch[][] {
  const rounds: DoubleElimMatch[][] = [];
  for (let r = startRound; r <= winnersRounds.length; r += 1) {
    const wRoundIndex = r - 1;
    const wRound = winnersRounds[wRoundIndex];
    if (!wRound) continue;
    const matchCount = wRound.length;
    const entryMatches: DoubleElimMatch[] = [];
    for (let i = 0; i < matchCount; i += 1) {
      const feedSlot = i % 2 === 0 ? 'player1Id' : 'player2Id';
      const loserSlotFromWinners = feedSlot === 'player1Id' ? 'player2Id' : 'player1Id';
      const wMatch = wRound[i];
      if (!wMatch) continue;
      const match: DoubleElimMatch = {
        ...createMatch(nextMatchId('l-'), { position: i }),
        winnersSources: [wMatch.id],
        loserSlotFromWinners,
      };
      entryMatches.push(match);
      loserLinks[wMatch.id] = {
        matchId: match.id,
        slot: loserSlotFromWinners,
      };
    }
    rounds.push(entryMatches);
    if (r < winnersRounds.length) {
      const consolMatches: DoubleElimMatch[] = [];
      for (let i = 0; i < entryMatches.length; i += 2) {
        consolMatches.push({
          ...createMatch(nextMatchId('l-'), { position: i / 2 }),
        });
      }
      rounds.push(consolMatches);
    }
  }
  return rounds;
}

function linkLosersRounds(rounds: DoubleElimMatch[][]): void {
  for (let r = 0; r < rounds.length - 1; r += 1) {
    const nextRound = rounds[r + 1];
    if (!Array.isArray(nextRound) || nextRound.length === 0) continue;
    const currentRound = rounds[r];
    if (!Array.isArray(currentRound) || currentRound.length === 0) continue;
    const nextIsOdd = (r + 1) % 2 === 1;
    // Filter out dummy matches to get the real match indices
    const realCurrentMatches = currentRound.filter(m => !isDummyMatch(m));
    const realNextMatches = nextRound.filter(m => !isDummyMatch(m));
    for (const [realIndex, match] of realCurrentMatches.entries()) {
      const nextIndex = nextIsOdd ? realIndex : Math.floor(realIndex / 2);
      match.nextMatchId = realNextMatches[nextIndex]?.id ?? null;
    }
  }
}

function buildLosersBracket(winners: Bracket): {
  rounds: DoubleElimMatch[][];
  loserLinks: Record<string, LoserLink>;
} {
  const rounds: DoubleElimMatch[][] = [];
  const winnersRounds = winners.rounds;
  if (winnersRounds.length <= 1) {
    return { rounds, loserLinks: {} };
  }
  const { firstRound, loserLinks } = buildFirstLosersRound(winnersRounds);
  if (firstRound.length > 0) rounds.push(firstRound);
  const subsequentRounds = buildSubsequentLosersRounds(winnersRounds, 2, loserLinks);
  for (const round of subsequentRounds) rounds.push(round);
  linkLosersRounds(rounds);
  return { rounds, loserLinks };
}

function clearFinalMatch(match: Match | null): void {
  if (!match) return;
  match.winnerId = null;
  match.scores = [];
  match.walkover = false;
}

function canAutoAdvanceEntryMatch(
  match: DoubleElimMatch,
  prevRound: DoubleElimMatch[] | undefined,
  winnersRounds: Match[][]
): boolean {
  if (isDummyMatch(match)) return false;
  if (match.winnerId) return false;
  if (!match.winnersSources || match.winnersSources.length === 0) return false;
  if (match.player1Id && match.player2Id) return false;
  if (!match.player1Id && !match.player2Id) return false;

  const allWinnersResolved = match.winnersSources.every(wsId => {
    const source = findMatchInRounds(winnersRounds, wsId);
    return isMatchResolved(source);
  });
  if (!allWinnersResolved) return false;

  if (prevRound) {
    const feeder = prevRound.find(m => m.nextMatchId === match.id && !isDummyMatch(m));
    if (feeder && !isMatchResolved(feeder)) return false;
  }
  return true;
}

function autoAdvanceLosersEntryMatches(
  winners: Bracket,
  losers: { rounds: DoubleElimMatch[][] }
): void {
  for (let r = 1; r < losers.rounds.length; r++) {
    const round = losers.rounds[r];
    if (!round) continue;
    for (const match of round) {
      if (isDummyMatch(match)) continue;
      if (!canAutoAdvanceEntryMatch(match, losers.rounds[r - 1], winners.rounds)) continue;
      const playerId = match.player1Id ?? match.player2Id;
      if (playerId) {
        advanceWinner(losers, match.id, playerId, []);
      }
    }
  }
}

function syncLosersFromWinners(doubleElim: DoubleElim): void {
  const { winners, losers, loserLinks } = doubleElim;
  syncLoserSlots(winners, losers, loserLinks);
  autoAdvanceLosersFirstRound(winners, losers);
  autoAdvanceLosersEntryMatches(winners, losers);
}

function syncFinals(doubleElim: DoubleElim): void {
  const { winners, losers, finals } = doubleElim;
  const winnersChampion = getBracketWinner(winners);
  const winnersFinal = getFinalMatch(winners);
  const losersChampion =
    losers.rounds.length > 0 ? getBracketWinner(losers) : getMatchLoserId(winnersFinal);

  const grandFinal = finals.grandFinal;
  const resetFinal = finals.resetFinal;

  const nextGrandP1 = winnersChampion ?? null;
  const nextGrandP2 = losersChampion ?? null;
  const grandChanged =
    nextGrandP1 !== grandFinal.player1Id || nextGrandP2 !== grandFinal.player2Id;

  if (grandChanged) {
    clearFinalMatch(grandFinal);
    clearFinalMatch(resetFinal);
    grandFinal.player1Id = nextGrandP1;
    grandFinal.player2Id = nextGrandP2;
  }

  const resetNeeded =
    !!grandFinal.winnerId && !!winnersChampion && grandFinal.winnerId !== winnersChampion;

  if (resetNeeded) {
    const resetChanged =
      resetFinal.player1Id !== grandFinal.player1Id || resetFinal.player2Id !== grandFinal.player2Id;
    if (resetChanged) {
      clearFinalMatch(resetFinal);
      resetFinal.player1Id = grandFinal.player1Id;
      resetFinal.player2Id = grandFinal.player2Id;
    }
  } else if (resetFinal.player1Id || resetFinal.player2Id || hasMatchResult(resetFinal)) {
    clearFinalMatch(resetFinal);
    resetFinal.player1Id = null;
    resetFinal.player2Id = null;
  }
}

export function syncDoubleElim(doubleElim: DoubleElim): DoubleElim {
  syncLosersFromWinners(doubleElim);
  syncFinals(doubleElim);
  return doubleElim;
}

export function generateDoubleElim(players: Player[]): DoubleElim {
  matchIdGenerator.reset();
  const winners = generateBracket(players);
  prefixBracketIds(winners, 'w-');

  const { rounds: losersRounds, loserLinks } = buildLosersBracket(winners);
  const losers: { rounds: DoubleElimMatch[][] } = { rounds: losersRounds };

  const finals: DoubleElimFinals = {
    grandFinal: createMatch(nextMatchId('f-'), { position: 0 }),
    resetFinal: createMatch(nextMatchId('f-'), { position: 1 }),
  };

  const doubleElim: DoubleElim = {
    winners,
    losers,
    finals,
    loserLinks,
  };

  syncDoubleElim(doubleElim);

  return doubleElim;
}

export function advanceDoubleElim(
  doubleElim: DoubleElim,
  matchId: string,
  winnerId: string,
  scores: SetScore[],
  walkover: boolean = false
): DoubleElim {
  const found = findMatchInDoubleElim(doubleElim, matchId);
  if (!found) return doubleElim;

  if (found.section === 'winners') {
    advanceWinner(doubleElim.winners, matchId, winnerId, scores, walkover);
  } else if (found.section === 'losers') {
    advanceWinner(doubleElim.losers, matchId, winnerId, scores, walkover);
  } else {
    if (matchId === doubleElim.finals.grandFinal.id) {
      clearFinalMatch(doubleElim.finals.resetFinal);
      doubleElim.finals.resetFinal.player1Id = null;
      doubleElim.finals.resetFinal.player2Id = null;
    }
    found.match.winnerId = winnerId;
    found.match.scores = scores;
    found.match.walkover = walkover;
  }

  syncDoubleElim(doubleElim);
  return doubleElim;
}

export function clearDoubleElimMatch(doubleElim: DoubleElim, matchId: string): DoubleElim {
  const found = findMatchInDoubleElim(doubleElim, matchId);
  if (!found) return doubleElim;

  if (found.section === 'winners') {
    clearMatchResult(doubleElim.winners, matchId);
  } else if (found.section === 'losers') {
    clearMatchResult(doubleElim.losers, matchId);
  } else {
    clearFinalMatch(found.match);
    if (doubleElim.finals.grandFinal.id === matchId) {
      clearFinalMatch(doubleElim.finals.resetFinal);
      doubleElim.finals.resetFinal.player1Id = null;
      doubleElim.finals.resetFinal.player2Id = null;
    }
  }

  syncDoubleElim(doubleElim);
  return doubleElim;
}

export function getDoubleElimWinner(doubleElim: DoubleElim): string | null {
  const resetFinal = doubleElim.finals.resetFinal;
  const grandFinal = doubleElim.finals.grandFinal;
  const winnersChampion = getBracketWinner(doubleElim.winners);

  if (resetFinal.winnerId) return resetFinal.winnerId;
  if (grandFinal.winnerId && winnersChampion && grandFinal.winnerId === winnersChampion) {
    return grandFinal.winnerId;
  }
  return null;
}

export function canEditDoubleElimMatch(doubleElim: DoubleElim, matchId: string): boolean {
  const finalWinner =
    doubleElim.finals.resetFinal.winnerId ?? doubleElim.finals.grandFinal.winnerId;
  const found = findMatchInDoubleElim(doubleElim, matchId);
  if (!found) return false;

  if (found.section === 'finals') {
    return true;
  }

  if (finalWinner) return false;

  if (found.section === 'losers') {
    return canEditMatch(doubleElim.losers, matchId);
  }

  // OPRAVA: Zápasy ve winners bracketu musí být editovatelné, pokud není znám vítěz finále
  return canEditMatch(doubleElim.winners, matchId);
}

function syncLoserSlots(
  winners: Bracket,
  losers: { rounds: DoubleElimMatch[][] },
  loserLinks: Record<string, LoserLink>
): void {
  for (const [winnerMatchId, link] of Object.entries(loserLinks)) {
    const winnerMatch = findMatchInRounds(winners.rounds, winnerMatchId);
    const loserMatch = findMatchInRounds(losers.rounds, link.matchId);
    if (!winnerMatch || !loserMatch || isDummyMatch(loserMatch)) continue;

    const expectedLoser = getMatchLoserId(winnerMatch);
    const currentLoser = link.slot === 'player1Id' ? loserMatch.player1Id : loserMatch.player2Id;

    if (expectedLoser !== currentLoser) {
      if (hasMatchResult(loserMatch)) {
        clearMatchResult(losers, loserMatch.id);
      }
      if (link.slot === 'player1Id') {
        loserMatch.player1Id = expectedLoser ?? null;
      } else {
        loserMatch.player2Id = expectedLoser ?? null;
      }
    }
  }
}

function autoAdvanceLosersFirstRound(
  winners: Bracket,
  losers: { rounds: DoubleElimMatch[][] }
): void {
  const firstRound = losers.rounds[0] ?? [];
  for (const match of firstRound) {
    if (isDummyMatch(match)) continue;
    if (match.winnersSources?.length !== 2) continue;
    const wsId0 = match.winnersSources[0];
    const wsId1 = match.winnersSources[1];
    if (!wsId0 || !wsId1) continue;
    const sourceA = findMatchInRounds(winners.rounds, wsId0);
    const sourceB = findMatchInRounds(winners.rounds, wsId1);
    if (!isMatchResolved(sourceA) || !isMatchResolved(sourceB)) continue;

    if (!match.winnerId && match.player1Id && !match.player2Id) {
      advanceWinner(losers, match.id, match.player1Id, []);
    } else if (!match.winnerId && !match.player1Id && match.player2Id) {
      advanceWinner(losers, match.id, match.player2Id, []);
    }
  }
}
