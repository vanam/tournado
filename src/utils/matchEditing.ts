import type { GroupsToBracketTournament, Match, Participant, Player } from '../types';
import { getGroupPlayers } from './groupStageUtils';
import { findTournamentMatch, getMatchScoring } from './matchChanges';
import type { PlayoffSection } from './matchChanges';
import { ensureParticipants, getParticipantPlayers } from './participantUtils';

export type GroupMatchTarget = { matchId: string } & (
  | { groupId: string; section?: never }
  | { section: PlayoffSection; groupId?: never }
);

type MatchEditingContext = ReturnType<typeof getMatchScoring> & {
  match: Match;
  players: Player[];
  participants: Participant[];
  history: GroupMatchTarget & { tournament: GroupsToBracketTournament };
};

/** Derives a consistent editor from the current tournament and a scoped match target. */
export function getMatchEditingContext(tournament: GroupsToBracketTournament, target: GroupMatchTarget): MatchEditingContext | null {
  const located = findTournamentMatch(tournament, target);
  if (!located) return null;

  const participants = ensureParticipants(tournament.players, tournament.participants);
  const players = getParticipantPlayers(tournament.players, participants);
  const group = tournament.groupStage.groups.find((entry) => entry.id === located.groupId);
  return {
    match: located.match,
    players: group ? getGroupPlayers(group, players) : players,
    participants,
    ...getMatchScoring(tournament, located),
    history: { tournament, ...target },
  };
}
