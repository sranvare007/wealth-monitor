const UPSTOX_LTP_URL = 'https://api.upstox.com/v3/market-quote/ltp';

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { price: number; changePct: number; fetchedAt: number };
type UpstoxQuote = { last_price: number; cp: number; instrument_token: string };

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

  const url = `${UPSTOX_LTP_URL}?instrument_key=${encodeURIComponent(toFetch.join(','))}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) throw new Error(`Upstox LTP HTTP ${res.status}`);

  const json = (await res.json()) as {
    status: string;
    data?: Record<string, UpstoxQuote>;
  };

  if (json.status === 'success' && json.data) {
    const fetchedAt = Date.now();
    for (const quote of Object.values(json.data)) {
      const key = quote.instrument_token;
      const changePct =
        quote.cp > 0 ? ((quote.last_price - quote.cp) / quote.cp) * 100 : 0;
      cache.set(key, { price: quote.last_price, changePct, fetchedAt });
      result[key] = { price: quote.last_price, changePct };
    }
  }

  return result;
}
