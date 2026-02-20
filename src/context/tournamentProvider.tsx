import { useCallback, useMemo, useSyncExternalStore, type ReactElement, type ReactNode } from 'react';
import type { Tournament } from '../types';
import { persistence } from '../services/persistence';
import { TournamentContext } from './tournamentContext';

interface TournamentProviderProps {
  readonly tournamentId: string;
  readonly children: ReactNode;
}

export const TournamentProvider = ({ tournamentId, children }: TournamentProviderProps): ReactElement => {
  const tournament = useSyncExternalStore(
    persistence.subscribe,
    useCallback(() => persistence.load(tournamentId), [tournamentId])
  );

  const updateTournament = useCallback((updater: (prev: Tournament) => Tournament) => {
    const current = persistence.load(tournamentId);
    if (!current) return;
    persistence.save(updater(current));
  }, [tournamentId]);

  const contextValue = useMemo(() => ({
    tournament,
    updateTournament,
    isLoading: false,
  }), [tournament, updateTournament]);

  return (
    <TournamentContext.Provider value={contextValue}>
      {children}
    </TournamentContext.Provider>
  );
};
