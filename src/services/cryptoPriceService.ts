const CRYPTO_PRICE_URL = 'https://wealth-monitor-backend-production.up.railway.app/api/v1/crypto/price';

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { price: number; changePct: number; fetchedAt: number };
type RawPriceItem = { id: number; price: number; percent_change_24h: number };

const cache = new Map<number, CacheEntry>();

export type CryptoLTP = { price: number; changePct: number };

export async function fetchCryptoPrices(
  ids: number[],
  force = false,
): Promise<Record<number, CryptoLTP>> {
  if (ids.length === 0) return {};

  const result: Record<number, CryptoLTP> = {};
  const toFetch: number[] = [];
  const now = Date.now();

  for (const id of ids) {
    const cached = cache.get(id);
    if (!force && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      result[id] = { price: cached.price, changePct: cached.changePct };
    } else {
      toFetch.push(id);
    }
  }

  if (toFetch.length === 0) return result;

  const url = `${CRYPTO_PRICE_URL}?ids=${encodeURIComponent(toFetch.join(','))}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) throw new Error(`Crypto price API HTTP ${res.status}`);

  const json = (await res.json()) as {
    success: boolean;
    data?: RawPriceItem[];
  };

  if (json.success && Array.isArray(json.data)) {
    const fetchedAt = Date.now();
    for (const item of json.data) {
      const entry: CacheEntry = { price: item.price, changePct: item.percent_change_24h, fetchedAt };
      cache.set(item.id, entry);
      result[item.id] = { price: item.price, changePct: item.percent_change_24h };
    }
  }

  return result;
}
