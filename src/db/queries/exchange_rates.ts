import type { SQLiteDatabase } from 'expo-sqlite';

type RatesRow = { rates_json: string; fetched_at: number };

export async function getCachedRates(
  db: SQLiteDatabase,
  baseCurrency: string,
): Promise<{ rates: Record<string, number>; fetchedAt: number } | null> {
  const row = await db.getFirstAsync<RatesRow>(
    'SELECT rates_json, fetched_at FROM exchange_rates_cache WHERE base_currency = ?',
    [baseCurrency],
  );
  if (!row) return null;
  return { rates: JSON.parse(row.rates_json) as Record<string, number>, fetchedAt: row.fetched_at };
}

export async function setCachedRates(
  db: SQLiteDatabase,
  baseCurrency: string,
  rates: Record<string, number>,
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO exchange_rates_cache (base_currency, rates_json, fetched_at)
     VALUES (?, ?, ?)`,
    [baseCurrency, JSON.stringify(rates), Date.now()],
  );
}
