import { useEffect, useState, type ReactNode, type ReactElement } from 'react';
import type { TournadoDatabase } from '../db';
import { getDatabase } from '../db';
import { migrateFromOldDatabase } from '../db/migration';
import { DatabaseContext } from './databaseContext';

interface DatabaseProviderProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

export const DatabaseProvider = ({ children, fallback }: DatabaseProviderProps): ReactElement => {
  const [db, setDb] = useState<TournadoDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void (async (): Promise<void> => {
      try {
        const database = await getDatabase();
        await migrateFromOldDatabase(database);
        if (!controller.signal.aborted) setDb(database);
      } catch (error_: unknown) {
        if (!controller.signal.aborted) {
          setError(error_ instanceof Error ? error_ : new Error(String(error_)));
        }
      }
    })();

    return (): void => { controller.abort(); };
  }, []);

  if (error) {
    return <div>Database error: {error.message}</div>;
  }
  if (db === null) {
    return (fallback ?? null) as ReactElement;
  }

  return (
    <DatabaseContext.Provider value={{ db }}>
      {children}
    </DatabaseContext.Provider>
  );
};
