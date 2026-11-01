import { Format } from '../types';
import type { GroupStagePlayoffs, GroupsToBracketTournament, Tournament } from '../types';

/** The historical Playoff field remains readable until a document is normalized. */
export function getTournamentPlayoffs(
  tournament: Pick<GroupsToBracketTournament, 'groupStagePlayoffs' | 'groupStageBrackets'>,
): GroupStagePlayoffs | null {
  return tournament.groupStagePlayoffs ?? tournament.groupStageBrackets ?? null;
}

export function normalizeTournament(tournament: GroupsToBracketTournament): GroupsToBracketTournament;
export function normalizeTournament(tournament: Tournament): Tournament;
/** Promotes legacy Playoff without changing the source or retaining a stale fallback. */
export function normalizeTournament(tournament: Tournament): Tournament {
  if (tournament.format !== Format.GROUPS_TO_BRACKET || tournament.groupStageBrackets == null) return tournament;
  return {
    ...tournament,
    groupStagePlayoffs: getTournamentPlayoffs(tournament),
    groupStageBrackets: null,
  };
}

/** Replacing or clearing Playoff must also retire any historical draw. */
export function setTournamentPlayoffs(tournament: GroupsToBracketTournament, playoffs: GroupStagePlayoffs | null): void {
  tournament.groupStagePlayoffs = playoffs;
  tournament.groupStageBrackets = null;
}
