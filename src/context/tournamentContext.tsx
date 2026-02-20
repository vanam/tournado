import { createContext, useContext, useCallback } from 'react';
import type { Tournament, GroupsToBracketTournament } from '../types';
import { Format } from '../types';

export interface TournamentContextValue {
  tournament: Tournament | null;
  updateTournament: (updater: (prev: Tournament) => Tournament) => void;
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
): { tournament: T | null; updateTournament: (updater: (prev: T) => T) => void; isLoading: boolean } {
  const { tournament, updateTournament, isLoading } = useTournament();

  const typedTournament = tournament?.format === format ? (tournament as T) : null;

  const typedUpdateTournament = useCallback(
    (updater: (prev: T) => T) => {
      updateTournament((prev) => {
        if (prev.format !== format) return prev;
        return updater(prev as T);
      });
    },
    [updateTournament, format]
  );

  return { tournament: typedTournament, updateTournament: typedUpdateTournament, isLoading };
}

export function useGroupsToBracketTournament(): {
  tournament: GroupsToBracketTournament | null;
  updateTournament: (
    updater:
      | GroupsToBracketTournament
      | ((prev: GroupsToBracketTournament) => GroupsToBracketTournament)
  ) => void;
  isLoading: boolean;
} {
  const { tournament, updateTournament, isLoading } = useTournament();

  const typedTournament =
    tournament?.format === Format.GROUPS_TO_BRACKET
      ? tournament
      : null;

  const typedUpdateTournament = useCallback(
    (
      updater:
        | GroupsToBracketTournament
        | ((prev: GroupsToBracketTournament) => GroupsToBracketTournament)
    ) => {
      updateTournament((prev) => {
        if (prev.format !== Format.GROUPS_TO_BRACKET) return prev;
        if (typeof updater === 'function') {
          return updater(prev);
        }
        return updater;
      });
    },
    [updateTournament]
  );

  return { tournament: typedTournament, updateTournament: typedUpdateTournament, isLoading };
}
