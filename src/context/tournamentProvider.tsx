import { useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import type { Tournament } from '../types';
import { getTournament } from '../api/client';
import { TournamentContext } from './tournamentContext';

interface TournamentProviderProps {
  readonly tournamentId: string;
  readonly children: ReactNode;
}

export const TournamentProvider = ({ tournamentId, children }: TournamentProviderProps): ReactElement => {
  const [state, setState] = useState<{ tournament: Tournament | null; isLoading: boolean }>({
    tournament: null,
    isLoading: true,
  });

  const reloadTournament = useCallback(async (): Promise<void> => {
    const t = await getTournament(tournamentId);
    setState((prev) => ({ ...prev, tournament: t }));
  }, [tournamentId]);

  useEffect(() => {
    let active = true;
    void getTournament(tournamentId).then((t) => {
      if (active) {
        setState({ tournament: t, isLoading: false });
      }
    });
    return (): void => { active = false; };
  }, [tournamentId]);

  const contextValue = useMemo(() => ({
    tournament: state.tournament,
    reloadTournament,
    isLoading: state.isLoading,
  }), [state.tournament, state.isLoading, reloadTournament]);

  return (
    <TournamentContext.Provider value={contextValue}>
      {children}
    </TournamentContext.Provider>
  );
};
