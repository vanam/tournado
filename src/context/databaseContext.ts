import { createContext, useContext } from 'react';
import type { TournadoDatabase } from '../db';

interface DatabaseContextValue {
  db: TournadoDatabase;
}

export const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export const useDatabase = (): TournadoDatabase => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx.db;
};
