import { getTournamentPlayoffs, setTournamentPlayoffs } from './tournamentCompatibility';
import type { BracketType, GroupStagePlayoffs, GroupsToBracketTournament } from '../types';
import { getBracketParticipantAtSeed } from './bracketUtils';
import { buildGroupStagePlayoffs, getGroupAdvancers, isGroupStageComplete } from './groupStageUtils';
import { ensureParticipants, getParticipantPlayers } from './participantUtils';
import { replayElimination } from './replayElimination';

export const playoffSections = ['mainBracket', 'consolationBracket', 'mainDoubleElim', 'consolationDoubleElim'] as const;

export class PlayoffSettingsLockedError extends Error {
  constructor() {
    super('Playoff settings cannot change after a playoff match has been played');
    this.name = 'PlayoffSettingsLockedError';
  }
}

export interface PlayoffSettings { qualifiers: number[]; bracketType: BracketType }

/** Shared lifecycle decisions for rendering and transactional writes, including legacy draws. */
export function getPlayoffState(tournament: GroupsToBracketTournament): {
  playoffs: GroupStagePlayoffs | null; ready: boolean; locked: boolean; needsGeneration: boolean;
} {
  const playoffs = getTournamentPlayoffs(tournament);
  const ready = isGroupStageComplete(tournament.groupStage);
  const locked = playoffs !== null && playoffSections.some((section) => {
    const bracket = playoffs[section];
    if (!bracket) return false;
    const matches = 'winners' in bracket
      ? [...bracket.winners.rounds.flat(), ...bracket.losers.rounds.flat(), bracket.finals.grandFinal, bracket.finals.resetFinal]
      : [...bracket.rounds.flat(), bracket.thirdPlaceMatch];
    return matches.some((match) => match && !match.dummy && match.player1Id && match.player2Id && match.winnerId);
  });
  return { playoffs, ready, locked, needsGeneration: ready && !playoffs };
}

function buildPlayoffs(tournament: GroupsToBracketTournament): GroupStagePlayoffs {
  const players = getParticipantPlayers(tournament.players, ensureParticipants(tournament.players, tournament.participants));
  return buildGroupStagePlayoffs(tournament.groupStage, players, {
    scoringMode: tournament.scoringMode, maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
  });
}

/** Initial generation never replaces an existing draw, even after a delayed request. */
export function ensurePlayoffs(tournament: GroupsToBracketTournament): void {
  if (getPlayoffState(tournament).needsGeneration) setTournamentPlayoffs(tournament, buildPlayoffs(tournament));
}

export function changePlayoffSettings(tournament: GroupsToBracketTournament, settings: PlayoffSettings): void {
  if (getPlayoffState(tournament).locked) throw new PlayoffSettingsLockedError();
  tournament.groupStage.settings.qualifiers = settings.qualifiers;
  tournament.groupStage.settings.bracketType = settings.bracketType;
  setTournamentPlayoffs(tournament, null);
}

function getAdvancers(tournament: GroupsToBracketTournament): { main: string[]; consolation: string[] } {
  const players = getParticipantPlayers(tournament.players, ensureParticipants(tournament.players, tournament.participants));
  const result = getGroupAdvancers(tournament.groupStage, players, {
    scoringMode: tournament.scoringMode, maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
  });
  return { main: result.mainWithLucky.map((player) => player.id), consolation: result.consolation.map((player) => player.id) };
}

export function hasPlayoffMismatch(tournament: GroupsToBracketTournament): boolean {
  const playoffs = getPlayoffState(tournament).playoffs;
  if (!playoffs || !isGroupStageComplete(tournament.groupStage)) return false;
  const expected = getAdvancers(tournament);
  return playoffSections.some((section) => {
    const value = playoffs[section];
    if (!value) return false;
    const bracket = 'winners' in value ? value.winners : value;
    const ids = section.startsWith('main') ? expected.main : expected.consolation;
    return ids.some((id, index) => getBracketParticipantAtSeed(bracket, index) !== id);
  });
}

export function reseedPlayoffs(tournament: GroupsToBracketTournament): void {
  const playoffs = getPlayoffState(tournament).playoffs;
  if (!playoffs) return;
  if (!isGroupStageComplete(tournament.groupStage)) {
    setTournamentPlayoffs(tournament, null);
    return;
  }
  const expected = getAdvancers(tournament);
  const replacement = buildPlayoffs(tournament);
  for (const section of playoffSections) {
    const bracket = playoffs[section];
    const ids = section.startsWith('main') ? expected.main : expected.consolation;
    if (bracket) replayElimination(bracket, undefined, ids);
    else if (replacement[section]) Object.assign(playoffs, { [section]: replacement[section] });
  }
  setTournamentPlayoffs(tournament, playoffs);
}

