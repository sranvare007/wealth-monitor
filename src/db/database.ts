import * as SQLite from 'expo-sqlite';
import { sql_001 } from './migrations/001_initial';
import { sql_002_stmts } from './migrations/002_recurring_contributions';
import { sql_003 } from './migrations/003_custom_categories';

const DB_NAME = 'wealth-monitor.db';

export async function openAndMigrateDb(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // WAL mode for better concurrent read performance
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const vRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = vRow?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(sql_001);
    await db.execAsync('PRAGMA user_version = 1;');
  }

  if (version < 2) {
    for (const stmt of sql_002_stmts) {
      await db.runAsync(stmt);
    }
    await db.execAsync('PRAGMA user_version = 2;');
  }

  if (version < 3) {
    await db.execAsync(sql_003);
    await db.execAsync('PRAGMA user_version = 3;');
  }

  return db;
}
