import { Format } from '../types';
import type { Tournament } from '../types';
import { getBracketWinner } from './bracketUtils';
import { getDoubleElimWinner } from './doubleElimUtils';
import { computeTournamentProgress } from './progressUtils';
import { getTournamentResults } from './resultsUtils';

/** Keeps the persisted summary consistent when results are recorded or cleared. */
export function updateTournamentStatus(tournament: Tournament): void {
  const progress = computeTournamentProgress(tournament);
  const complete = progress.total > 0 && progress.completed === progress.total;
  let winner: string | null = null;
  if (complete) {
    switch (tournament.format) {
      case Format.SINGLE_ELIM: { winner = getBracketWinner(tournament.bracket); break; }
      case Format.DOUBLE_ELIM: { winner = getDoubleElimWinner(tournament.doubleElim); break; }
      case Format.ROUND_ROBIN:
      case Format.SWISS:
      case Format.GROUPS_TO_BRACKET: { winner = getTournamentResults(tournament)[0]?.playerId ?? null; break; }
    }
  }
  tournament.winnerId = winner;
  tournament.completedAt = winner ? (tournament.completedAt ?? new Date().toISOString()) : null;
}
