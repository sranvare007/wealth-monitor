import type { SQLiteDatabase } from 'expo-sqlite';
import type { GoldPriceData } from '../../services/goldPriceService';

type GoldPriceRow = { data_json: string; fetched_at: number };

export async function getCachedGoldPrice(
  db: SQLiteDatabase,
  currency: string,
): Promise<{ data: GoldPriceData; fetchedAt: number } | null> {
  const row = await db.getFirstAsync<GoldPriceRow>(
    'SELECT data_json, fetched_at FROM gold_price_cache WHERE currency = ?',
    [currency],
  );
  if (!row) return null;
  return { data: JSON.parse(row.data_json) as GoldPriceData, fetchedAt: row.fetched_at };
}

export async function setCachedGoldPrice(
  db: SQLiteDatabase,
  currency: string,
  data: GoldPriceData,
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO gold_price_cache (currency, data_json, fetched_at)
     VALUES (?, ?, ?)`,
    [currency, JSON.stringify(data), Date.now()],
  );
}
