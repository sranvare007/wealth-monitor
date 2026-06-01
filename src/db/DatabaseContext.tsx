import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { openAndMigrateDb } from './database';
import { syncStocksIfNeeded } from '../services/stocksSyncService';
import { getSetting } from './queries/settings';
import {
  registerStocksSyncTask,
  unregisterStocksSyncTask,
} from '../services/backgroundTaskService';

const DbContext = createContext<SQLiteDatabase | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  useEffect(() => {
    openAndMigrateDb().then(async readyDb => {
      setDb(readyDb);

      const alreadyDone = await getSetting(readyDb, 'STOCKS_INITIAL_SYNC_DONE');
      if (alreadyDone === 'true') {
        console.log('[DatabaseProvider] stocks already synced, no background task needed');
        return;
      }

      // Register the OS background task first so it can take over if the app
      // is killed before the foreground sync below finishes.
      await registerStocksSyncTask();

      // Also attempt the sync immediately while the app is in the foreground.
      // The sync is resumable: each exchange is marked done before moving to
      // the next, so whichever runner (foreground or background task) finishes
      // last will simply find nothing left to do.
      syncStocksIfNeeded(readyDb)
        .then(() => unregisterStocksSyncTask())
        .catch(err => {
          console.error('[DatabaseProvider] foreground stocks sync failed:', err);
        });
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
