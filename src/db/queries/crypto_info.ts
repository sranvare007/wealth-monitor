import type { SQLiteDatabase } from 'expo-sqlite';

export type CryptoInfoRow = {
  id: number;
  symbol: string;
  name: string;
  price: number;
  percent_change_24h: number;
};

export async function searchCryptosDB(
  db: SQLiteDatabase,
  query: string,
  limit = 20,
): Promise<CryptoInfoRow[]> {
  const pattern = `%${query}%`;
  return db.getAllAsync<CryptoInfoRow>(
    `SELECT id, symbol, name, price, percent_change_24h FROM crypto_info
      WHERE symbol LIKE ? OR name LIKE ?
      LIMIT ?`,
    [pattern, pattern, limit],
  );
}

export async function getCryptoCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM crypto_info');
  return row?.cnt ?? 0;
}

const CHUNK = 500;

export async function bulkInsertCryptos(
  db: SQLiteDatabase,
  items: CryptoInfoRow[],
): Promise<void> {
  if (items.length === 0) return;

  await db.withTransactionAsync(async () => {
    for (let i = 0; i < items.length; i += CHUNK) {
      const chunk = items.slice(i, i + CHUNK);
      const placeholders = chunk.map(() => '(?,?,?,?,?)').join(',');
      const values = chunk.flatMap(c => [c.id, c.symbol, c.name, c.price, c.percent_change_24h]);
      await db.runAsync(
        `INSERT OR IGNORE INTO crypto_info (id, symbol, name, price, percent_change_24h) VALUES ${placeholders}`,
        values,
      );
    }
  });
}
