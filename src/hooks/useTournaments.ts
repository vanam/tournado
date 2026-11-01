import { getTournamentSummary, readTournament } from '../utils/tournamentStatus';
import { useEffect, useState } from 'react';
import { useDatabase } from '../context/databaseContext';
import type { TournamentSummary } from '../services/tournamentService';
import type { Format, Tournament } from '../types';

export function useTournaments(filters?: {
  format?: Format;
  status?: 'active' | 'completed';
}): { tournaments: TournamentSummary[]; isLoading: boolean } {
  const db = useDatabase();
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const format = filters?.format;
  const status = filters?.status;

  useEffect(() => {
    const query = format
      ? db.tournaments.find({ selector: { format } })
      : db.tournaments.find();
    const subscription = query.$.subscribe((docs) => {
      let results = docs.map((d) => getTournamentSummary(d.toMutableJSON()));
      if (status === 'completed') results = results.filter((t) => t.winnerId != null);
      else if (status === 'active') results = results.filter((t) => t.winnerId == null);
      setTournaments(results);
      setIsLoading(false);
    });
    return (): void => { subscription.unsubscribe(); };
  }, [db, format, status]);

  return { tournaments, isLoading };
}

export function useTournamentById(id: string): {
  tournament: Tournament | null;
  isLoading: boolean;
} {
  const db = useDatabase();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const query = db.tournaments.findOne(id);
    const subscription = query.$.subscribe((doc) => {
      const value = doc?.toMutableJSON() ?? null;
      setTournament(value ? readTournament(value) : null);
      setIsLoading(false);
    });
    return (): void => { subscription.unsubscribe(); };
  }, [db, id]);

  return { tournament, isLoading };
}
