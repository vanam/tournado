import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactElement, type ReactNode } from 'react';
import type { Tournament, GroupsToBracketTournament } from '../types';
import { persistence } from '../services/persistence';
import { Format } from '../types';

interface TournamentContextValue {
  tournament: Tournament | null;
  updateTournament: (updater: (prev: Tournament) => Tournament) => void;
  isLoading: boolean;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

interface TournamentProviderProps {
  readonly tournamentId: string;
  readonly children: ReactNode;
}

export const TournamentProvider = ({ tournamentId, children }: TournamentProviderProps): ReactElement => {
  const [tournament, setTournament] = useState<Tournament | null>(() => persistence.load(tournamentId));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const currentId = tournament?.id;
    void Promise.resolve().then(() => {
      const loaded = persistence.load(tournamentId);
      if (loaded?.id !== currentId) {
        setTournament(loaded);
        setIsLoading(false);
      }
    });
  }, [tournamentId, tournament?.id]);

  useEffect(() => {
    function handleStorage(event: StorageEvent): void {
      if (event.storageArea !== localStorage) return;
      if (event.key && event.key !== 'tournado') return;
      void Promise.resolve().then(() => {
        setTournament(persistence.load(tournamentId));
      });
    }
    window.addEventListener('storage', handleStorage);
    return (): void => { window.removeEventListener('storage', handleStorage); };
  }, [tournamentId]);

  const updateTournament = useCallback((updater: (prev: Tournament) => Tournament) => {
    setTournament((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      persistence.save(updated);
      return updated;
    });
  }, []);

  const contextValue = useMemo(() => ({
    tournament,
    updateTournament,
    isLoading,
  }), [tournament, updateTournament, isLoading]);

  return (
    <TournamentContext.Provider value={contextValue}>
      {children}
    </TournamentContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useTournament(): TournamentContextValue {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within TournamentProvider');
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
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

// eslint-disable-next-line react-refresh/only-export-components
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
