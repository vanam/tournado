import { useEffect, useState } from 'react';
import { useDatabase } from '../context/databaseContext';
import type { PlayerLibraryEntry, PlayerGroup } from '../types';

export function usePlayers(groupId?: string): {
  players: PlayerLibraryEntry[];
  isLoading: boolean;
} {
  const db = useDatabase();
  const [players, setPlayers] = useState<PlayerLibraryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const query = db.players.find();
    const subscription = query.$.subscribe((docs) => {
      let result = docs.map((d) => d.toJSON() as PlayerLibraryEntry);
      if (groupId) result = result.filter((p) => p.groupIds.includes(groupId));
      setPlayers(result);
      setIsLoading(false);
    });
    return (): void => { subscription.unsubscribe(); };
  }, [db, groupId]);

  return { players, isLoading };
}

export function usePlayerGroups(): {
  groups: PlayerGroup[];
  isLoading: boolean;
} {
  const db = useDatabase();
  const [groups, setGroups] = useState<PlayerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const query = db.playerGroups.find();
    const subscription = query.$.subscribe((docs) => {
      setGroups(docs.map((d) => d.toJSON() as PlayerGroup));
      setIsLoading(false);
    });
    return (): void => { subscription.unsubscribe(); };
  }, [db]);

  return { groups, isLoading };
}
