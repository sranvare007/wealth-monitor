import type { SQLiteDatabase } from 'expo-sqlite';

export type Exchange = {
  code: string;
  title: string;
  name: string;
  country: string;
  timezone: string;
  synced_at: number | null;
};

export async function insertExchanges(
  db: SQLiteDatabase,
  exchanges: Exchange[],
): Promise<void> {
  if (exchanges.length === 0) return;

  await db.withTransactionAsync(async () => {
    for (const ex of exchanges) {
      await db.runAsync(
        `INSERT OR IGNORE INTO exchanges (code, title, name, country, timezone)
         VALUES (?, ?, ?, ?, ?)`,
        [ex.code, ex.title, ex.name, ex.country, ex.timezone],
      );
    }
  });
}

export async function getAllExchanges(db: SQLiteDatabase): Promise<Exchange[]> {
  return db.getAllAsync<Exchange>(
    'SELECT code, title, name, country, timezone, synced_at FROM exchanges ORDER BY code',
  );
}

export async function getUnsyncedExchanges(db: SQLiteDatabase): Promise<Exchange[]> {
  return db.getAllAsync<Exchange>(
    'SELECT code, title, name, country, timezone, synced_at FROM exchanges WHERE synced_at IS NULL ORDER BY code',
  );
}

export async function markExchangeSynced(
  db: SQLiteDatabase,
  code: string,
): Promise<void> {
  await db.runAsync(
    'UPDATE exchanges SET synced_at = ? WHERE code = ? AND synced_at IS NULL',
    [Math.floor(Date.now() / 1000), code],
  );
}
