import { useCallback, useMemo, type ReactElement, type ReactNode } from 'react';
import { useTournamentById } from '../hooks/useTournaments';
import { TournamentContext } from './tournamentContext';

interface TournamentProviderProps {
  readonly tournamentId: string;
  readonly children: ReactNode;
}

export const TournamentProvider = ({ tournamentId, children }: TournamentProviderProps): ReactElement => {
  const { tournament, isLoading } = useTournamentById(tournamentId);

  // No-op: RxDB subscriptions handle reactivity automatically
  const reloadTournament = useCallback(async (): Promise<void> => {}, []);

  const contextValue = useMemo(() => ({
    tournament,
    reloadTournament,
    isLoading,
  }), [tournament, isLoading, reloadTournament]);

  return (
    <TournamentContext.Provider value={contextValue}>
      {children}
    </TournamentContext.Provider>
  );
};
