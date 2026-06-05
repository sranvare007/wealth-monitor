import type { SQLiteDatabase } from 'expo-sqlite';
import { getCryptoCount, bulkInsertCryptos, type CryptoInfoRow } from '../db/queries/crypto_info';

const CRYPTO_API_URL = 'https://wealth-monitor-backend-production.up.railway.app/api/v1/crypto';

type RawQuote = {
  price: number;
  percent_change_24h: number;
  [key: string]: unknown;
};

type RawCrypto = {
  id: number;
  name: string;
  symbol: string;
  quote?: RawQuote[];
  [key: string]: unknown;
};

export async function syncCryptosIfNeeded(db: SQLiteDatabase): Promise<void> {
  const count = await getCryptoCount(db);
  if (count > 0) return;

  const res = await fetch(CRYPTO_API_URL);
  if (!res.ok) throw new Error(`Crypto API HTTP ${res.status}`);

  const json = (await res.json()) as {
    success: boolean;
    data?: RawCrypto[];
  };

  if (!json.success || !Array.isArray(json.data)) return;

  const items: CryptoInfoRow[] = json.data.map(c => ({
    id: c.id,
    symbol: c.symbol,
    name: c.name ?? '',
    price: c.quote?.[0]?.price ?? 0,
    percent_change_24h: c.quote?.[0]?.percent_change_24h ?? 0,
  }));

  await bulkInsertCryptos(db, items);
}
