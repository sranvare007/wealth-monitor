const LTP_URL = 'https://wealth-monitor-backend-production.up.railway.app/api/v1/instruments/ltp';

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { price: number; changePct: number; fetchedAt: number };
type LTPQuote = { instrumentKey: string; lastPrice: number; closePrice: number };

const cache = new Map<string, CacheEntry>();

export type StockLTP = { price: number; changePct: number };

export async function fetchStockPrices(
  instrumentKeys: string[],
  force = false,
): Promise<Record<string, StockLTP>> {
  if (instrumentKeys.length === 0) return {};

  const result: Record<string, StockLTP> = {};
  const toFetch: string[] = [];
  const now = Date.now();

  for (const key of instrumentKeys) {
    const cached = cache.get(key);
    if (!force && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      result[key] = { price: cached.price, changePct: cached.changePct };
    } else {
      toFetch.push(key);
    }
  }

  if (toFetch.length === 0) return result;

  const url = `${LTP_URL}?instrument_key=${encodeURIComponent(toFetch.join(','))}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) throw new Error(`Instruments LTP HTTP ${res.status}`);

  const json = (await res.json()) as {
    success: boolean;
    data?: { quotes?: LTPQuote[] };
  };

  if (json.success && Array.isArray(json.data?.quotes)) {
    const fetchedAt = Date.now();
    for (const quote of json.data.quotes) {
      const changePct = quote.closePrice > 0
        ? ((quote.lastPrice - quote.closePrice) / quote.closePrice) * 100
        : 0;
      cache.set(quote.instrumentKey, { price: quote.lastPrice, changePct, fetchedAt });
      result[quote.instrumentKey] = { price: quote.lastPrice, changePct };
    }
  }

  return result;
}
