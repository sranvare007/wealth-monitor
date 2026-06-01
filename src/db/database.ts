import * as SQLite from 'expo-sqlite';
import { sql_001 } from './migrations/001_initial';
import { sql_002_stmts } from './migrations/002_recurring_contributions';
import { sql_003 } from './migrations/003_custom_categories';
import { sql_004_stmts } from './migrations/004_tracked_assets';
import { sql_005 } from './migrations/005_stocks_info';
import { sql_006 } from './migrations/006_exchanges';
import { sql_007 } from './migrations/007_exchanges_sync_tracking';

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

  // Migration 4 — add track_json to assets.
  // We check the actual schema (not just user_version) so a broken prior run
  // that set user_version = 4 without creating the column is recovered automatically.
  const trackJsonExists = await db.getFirstAsync<{ name: string }>(
    `SELECT name FROM pragma_table_info('assets') WHERE name = 'track_json'`,
  );
  if (!trackJsonExists) {
    await db.runAsync(sql_004_stmts[0]);
  }
  if (version < 4) {
    await db.execAsync('PRAGMA user_version = 4;');
  }

  if (version < 5) {
    await db.execAsync(sql_005);
    await db.execAsync('PRAGMA user_version = 5;');
  }

  if (version < 6) {
    await db.execAsync(sql_006);
    await db.execAsync('PRAGMA user_version = 6;');
  }

  if (version < 7) {
    await db.execAsync(sql_007);
    await db.execAsync('PRAGMA user_version = 7;');
  }

  return db;
}
