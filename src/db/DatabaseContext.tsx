import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { openAndMigrateDb } from './database';
import { syncCryptosIfNeeded } from '../services/cryptoSyncService';

const DbContext = createContext<SQLiteDatabase | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  useEffect(() => {
    openAndMigrateDb().then(readyDb => {
      setDb(readyDb);
      syncCryptosIfNeeded(readyDb).catch(() => {});
    });
  }, []);

  // Block children until the database is ready and migrated
  if (!db) return null;

  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

export function useDatabase(): SQLiteDatabase {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDatabase must be used within <DatabaseProvider>');
  return db;
}
