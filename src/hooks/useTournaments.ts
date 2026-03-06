import { useEffect, useState } from 'react';
import { useDatabase } from '../context/databaseContext';
import type { TournamentSummary } from '../services/tournamentService';
import type { Format, Tournament } from '../types';

function toSummary(t: Tournament): TournamentSummary {
  return {
    id: t.id,
    name: t.name,
    format: t.format,
    createdAt: t.createdAt,
    completedAt: t.completedAt ?? null,
    winnerId: t.winnerId ?? null,
    playerCount: t.players.length,
    teamSize: t.teamSize ?? 1,
  };
}

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
      let results = docs.map((d) => d.toMutableJSON());
      if (status === 'completed') results = results.filter((t) => t.completedAt != null);
      else if (status === 'active') results = results.filter((t) => t.completedAt == null);
      setTournaments(results.map((t) => toSummary(t)));
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
      setTournament(doc ? doc.toMutableJSON() : null);
      setIsLoading(false);
    });
    return (): void => { subscription.unsubscribe(); };
  }, [db, id]);

  return { tournament, isLoading };
}
