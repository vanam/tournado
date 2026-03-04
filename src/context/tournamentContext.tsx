import { createContext, useContext } from 'react';
import type { Tournament, GroupsToBracketTournament } from '../types';
import { Format } from '../types';

export interface TournamentContextValue {
  tournament: Tournament | null;
  reloadTournament: () => Promise<void>;
  isLoading: boolean;
}

export const TournamentContext = createContext<TournamentContextValue | null>(null);

export function useTournament(): TournamentContextValue {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within TournamentProvider');
  }
  return context;
}

export function useTypedTournament<T extends Tournament>(
  format: T['format']
): { tournament: T | null; reloadTournament: () => Promise<void>; isLoading: boolean } {
  const { tournament, reloadTournament, isLoading } = useTournament();
  const typedTournament = tournament?.format === format ? (tournament as T) : null;
  return { tournament: typedTournament, reloadTournament, isLoading };
}

export function useGroupsToBracketTournament(): {
  tournament: GroupsToBracketTournament | null;
  reloadTournament: () => Promise<void>;
  isLoading: boolean;
} {
  const { tournament, reloadTournament, isLoading } = useTournament();
  const typedTournament = tournament?.format === Format.GROUPS_TO_BRACKET ? tournament : null;
  return { tournament: typedTournament, reloadTournament, isLoading };
}
