import type { SQLiteDatabase } from 'expo-sqlite';

export type StockInfo = {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  mic_code: string;
  country: string;
  type: string;
  figi_code: string;
  cfi_code: string;
};

export async function getStocksCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) AS cnt FROM stocks_info',
  );
  return row?.cnt ?? 0;
}

// Inserts records in chunks inside a single transaction to stay well under
// SQLite's variable limit and keep wall-time under 100 ms on mid-range devices.
export async function bulkInsertStocks(
  db: SQLiteDatabase,
  stocks: StockInfo[],
): Promise<void> {
  if (stocks.length === 0) return;

  const CHUNK = 500;

  await db.withTransactionAsync(async () => {
    for (let i = 0; i < stocks.length; i += CHUNK) {
      const chunk = stocks.slice(i, i + CHUNK);
      const placeholders = chunk.map(() => '(?,?,?,?,?,?,?,?,?)').join(',');
      const values = chunk.flatMap(s => [
        s.symbol,
        s.name,
        s.currency,
        s.exchange,
        s.mic_code,
        s.country,
        s.type,
        s.figi_code,
        s.cfi_code,
      ]);
      await db.runAsync(
        `INSERT OR IGNORE INTO stocks_info
           (symbol, name, currency, exchange, mic_code, country, type, figi_code, cfi_code)
         VALUES ${placeholders}`,
        values,
      );
    }
  });
}

export async function searchStocks(
  db: SQLiteDatabase,
  query: string,
  limit = 50,
): Promise<StockInfo[]> {
  const pattern = `%${query}%`;
  return db.getAllAsync<StockInfo>(
    `SELECT symbol, name, currency, exchange, mic_code, country, type, figi_code, cfi_code
       FROM stocks_info
      WHERE symbol LIKE ? OR name LIKE ?
      LIMIT ?`,
    [pattern, pattern, limit],
  );
}
