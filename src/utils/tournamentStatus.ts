import { getTournamentPlayoffs, normalizeTournament } from './tournamentCompatibility';
import { BracketType, Format } from '../types';
import type { Tournament } from '../types';
import { getBracketWinner } from './bracketUtils';
import { getDoubleElimWinner } from './doubleElimUtils';
import { computeTournamentProgress } from './progressUtils';
import { getTournamentResults } from './resultsUtils';

/** Evaluates current results without changing the tournament or inventing historical timestamps. */
export function evaluateTournament(tournament: Tournament): {
  progress: { completed: number; total: number };
  results: ReturnType<typeof getTournamentResults>;
  winnerId: string | null;
  playoffWinnerId: string | null;
  completedAt: string | null;
} {
  const progress = computeTournamentProgress(tournament);
  const results = getTournamentResults(tournament);
  const complete = progress.total > 0 && progress.completed === progress.total;
  let drawWinner: string | null = null;
  switch (tournament.format) {
    case Format.SINGLE_ELIM: { drawWinner = getBracketWinner(tournament.bracket); break; }
    case Format.DOUBLE_ELIM: { drawWinner = getDoubleElimWinner(tournament.doubleElim); break; }
    case Format.GROUPS_TO_BRACKET: {
      const playoffs = getTournamentPlayoffs(tournament);
      if (playoffs?.bracketType === BracketType.DOUBLE_ELIM && playoffs.mainDoubleElim) {
        drawWinner = getDoubleElimWinner(playoffs.mainDoubleElim);
      } else if (playoffs?.mainBracket) drawWinner = getBracketWinner(playoffs.mainBracket);
      break;
    }
    case Format.ROUND_ROBIN:
    case Format.SWISS: { drawWinner = results[0]?.playerId ?? null; break; }
  }
  const rankedWinner = tournament.format === Format.GROUPS_TO_BRACKET ? (results[0]?.playerId ?? null) : drawWinner;
  const winnerId = complete ? rankedWinner : null;
  return { progress, results, winnerId,
    playoffWinnerId: tournament.format === Format.GROUPS_TO_BRACKET ? drawWinner : null,
    completedAt: winnerId ? (tournament.completedAt ?? null) : null };
}

export function getTournamentSummary(tournament: Tournament): {
  id: string; name: string; format: Format; createdAt: string;
  completedAt: string | null; winnerId: string | null; playerCount: number; teamSize: number;
} {
  const { winnerId, completedAt } = evaluateTournament(tournament);
  return { id: tournament.id, name: tournament.name, format: tournament.format,
    createdAt: tournament.createdAt, completedAt, winnerId,
    playerCount: tournament.players.length, teamSize: tournament.teamSize ?? 1 };
}

/** Read projection: derive status while retaining the recorded completion time. */
export function readTournament(tournament: Tournament): Tournament {
  const normalized = normalizeTournament(tournament);
  const { winnerId, completedAt } = evaluateTournament(normalized);
  return { ...normalized, winnerId, completedAt };
}

/** Only recording results can establish a previously unknown completion time. */
export function updateTournamentStatus(tournament: Tournament): void {
  const { winnerId, completedAt } = evaluateTournament(tournament);
  tournament.winnerId = winnerId;
  tournament.completedAt = winnerId ? (completedAt ?? new Date().toISOString()) : null;
}
