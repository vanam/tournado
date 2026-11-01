import type { Bracket, DoubleElim, Match, SetScore } from '../types';
import { getBracketSeedPositions } from './bracketUtils';

export interface MatchResultChange {
  matchId: string;
  winnerId: string | null;
  scores: SetScore[];
  walkover: boolean;
}

type Source = { kind: 'entrant'; id: string | null } | { kind: 'winner' | 'loser'; matchId: string };
interface Node { match: Match; sources: Source[]; resetFrom?: Match }
interface Outcome { winner: string | null; loser: string | null; resolved: boolean }

function addRounds(nodes: Node[], bracket: Bracket, entrants?: string[]): void {
  const slots = bracket.rounds[0]?.flatMap((match) => [match.player1Id, match.player2Id]) ?? [];
  if (entrants) {
    for (const [seed, slot] of getBracketSeedPositions(bracket).entries()) slots[slot] = entrants[seed] ?? null;
  }
  for (const [roundIndex, round] of bracket.rounds.entries()) {
    for (const [index, match] of round.entries()) {
      if (match.dummy) continue;
      const sources: Source[] = roundIndex === 0
        ? [{ kind: 'entrant', id: slots[index * 2] ?? null }, { kind: 'entrant', id: slots[index * 2 + 1] ?? null }]
        : (bracket.rounds[roundIndex - 1] ?? []).filter((feeder) => feeder.nextMatchId === match.id && !feeder.dummy)
          .map((feeder) => ({ kind: 'winner', matchId: feeder.id }));
      nodes.push({ match, sources });
    }
  }
}

function addDoubleElimNodes(nodes: Node[], bracket: DoubleElim, entrants?: string[]): void {

  addRounds(nodes, bracket.winners, entrants);
    for (const [roundIndex, round] of bracket.losers.rounds.entries()) {
      for (const match of round) {
        if (match.dummy) continue;
        const sources: Source[] = (match.winnersSources ?? []).map((id) => ({ kind: 'loser', matchId: id }));
        const feeders = bracket.losers.rounds[roundIndex - 1] ?? [];
        const feederSources: Source[] = feeders.filter((feeder) => feeder.nextMatchId === match.id && !feeder.dummy)
          .map((feeder) => ({ kind: 'winner', matchId: feeder.id }));
        if (match.loserSlotFromWinners === 'player2Id') sources.unshift(...feederSources);
        else sources.push(...feederSources);
        nodes.push({ match, sources });
      }
    }
    const winnersFinal = bracket.winners.rounds.at(-1)?.[0];
    const losersFinal = bracket.losers.rounds.at(-1)?.find((match) => !match.dummy);
    const finalSources: Source[] = [];
    if (winnersFinal) finalSources.push({ kind: 'winner', matchId: winnersFinal.id });
    if (losersFinal) finalSources.push({ kind: 'winner', matchId: losersFinal.id });
    else if (winnersFinal) finalSources.push({ kind: 'loser', matchId: winnersFinal.id });
    nodes.push(
      { match: bracket.finals.grandFinal, sources: finalSources },
      { match: bracket.finals.resetFinal, sources: finalSources, resetFrom: bracket.finals.grandFinal },
    );
}

/** Rebuilds slot dependencies, preserving results only for identical participants and valid sources. */
export function replayElimination(bracket: Bracket | DoubleElim, change?: MatchResultChange, entrants?: string[]): void {
  const nodes: Node[] = [];
  if ('winners' in bracket) addDoubleElimNodes(nodes, bracket, entrants);
  else {
    addRounds(nodes, bracket, entrants);
    if (bracket.thirdPlaceMatch) {
      nodes.push({ match: bracket.thirdPlaceMatch, sources: (bracket.rounds.at(-2) ?? [])
        .map((match) => ({ kind: 'loser', matchId: match.id })) });
    }
  }
  replayNodes(nodes, change);
}

function replayNodes(nodes: Node[], change?: MatchResultChange): void {
  const outcomes = new Map<string, Outcome>();
  const invalid = new Set<string>();
  for (const { match, sources, resetFrom } of nodes) {
    const resolvedSources = sources.map((source) => {
      if (source.kind === 'entrant') return { id: source.id, resolved: true };
      const outcome = outcomes.get(source.matchId);
      return { id: outcome?.[source.kind] ?? null, resolved: outcome?.resolved ?? false };
    });
    const active = !resetFrom || (!!resetFrom.winnerId && resetFrom.winnerId === resetFrom.player2Id);
    const ready = active && resolvedSources.every((source) => source.resolved);
    const p1 = active ? resolvedSources[0]?.id ?? null : null;
    const p2 = active ? resolvedSources[1]?.id ?? null : null;
    const changed = p1 !== match.player1Id || p2 !== match.player2Id;
    const dependsOnChange = sources.some((source) => source.kind !== 'entrant' && invalid.has(source.matchId))
      || !!(resetFrom && invalid.has(resetFrom.id));
    const edited = change?.matchId === match.id;
    if (changed || dependsOnChange || edited) invalid.add(match.id);
    if (changed || dependsOnChange || !active) {
      match.winnerId = null;
      match.scores = [];
      match.walkover = false;
    }
    match.player1Id = p1;
    match.player2Id = p2;
    if (edited) {
      match.winnerId = change.winnerId;
      match.scores = change.scores;
      match.walkover = change.walkover;
    }
    if (ready && (!p1 || !p2)) match.winnerId = p1 ?? p2;
    const winner = match.winnerId;
    const loser = winner === p1 ? p2 : p1;
    outcomes.set(match.id, { winner, loser: winner && p1 && p2 ? loser : null,
      resolved: ready && (!!winner || (!p1 && !p2)) });
  }
}
