import type { SQLiteDatabase } from 'expo-sqlite';
import { fetchWithRetry } from '../utils/fetchWithRetry';
import { getCachedGoldPrice, setCachedGoldPrice } from '../db/queries/gold_price';

const GOLD_URL = 'https://wealth-monitor-backend-production.up.railway.app/api/v1/gold/INR';
const CURRENCY = 'INR';
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export type GoldPriceData = {
  currency: string;
  priceGram24k: number;
  priceGram22k: number;
  priceGram21k: number;
  priceGram20k: number;
  priceGram18k: number;
  priceGram16k: number;
  priceGram14k: number;
  priceGram10k: number;
};

type ApiResponse = {
  success: boolean;
  data?: GoldPriceData;
};

// Module-level cache so callers get synchronous access after initial load
let _liveRates: GoldPriceData | null = null;

export function getLiveGoldRates(): GoldPriceData | null {
  return _liveRates;
}

async function fetchLiveGoldPrice(): Promise<GoldPriceData> {
  console.log('[GoldPrice] fetching →', GOLD_URL);
  const res = await fetchWithRetry(GOLD_URL);
  console.log('[GoldPrice] response status', res.status);
  const json = (await res.json()) as ApiResponse;
  if (!json.success || !json.data) throw new Error('Invalid gold price response');
  console.log('[GoldPrice] fetched — 24K:', json.data.priceGram24k, '22K:', json.data.priceGram22k);
  return json.data;
}

/**
 * Loads gold prices at app open.
 * Returns cached data immediately if within the 6-hour TTL, refreshing silently in background.
 * On first launch (no cache), waits for the live fetch before returning.
 */
export async function loadGoldPrices(db: SQLiteDatabase): Promise<GoldPriceData | null> {
  const cached = await getCachedGoldPrice(db, CURRENCY);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < TTL_MS) {
    const ageMin = Math.round((now - cached.fetchedAt) / 60_000);
    console.log(`[GoldPrice] cache hit (age ${ageMin}m) — 24K: ${cached.data.priceGram24k}, 22K: ${cached.data.priceGram22k}`);
    _liveRates = cached.data;
    return cached.data;
  }

  if (cached) {
    console.log('[GoldPrice] cache stale — serving old data, refreshing in background');
    _liveRates = cached.data;
    fetchLiveGoldPrice()
      .then(data => {
        _liveRates = data;
        console.log('[GoldPrice] background refresh stored to DB');
        return setCachedGoldPrice(db, CURRENCY, data);
      })
      .catch(err => console.warn('[GoldPrice] background refresh failed:', err));
    return cached.data;
  }

  console.log('[GoldPrice] no cache — fetching for the first time');
  try {
    const data = await fetchLiveGoldPrice();
    _liveRates = data;
    await setCachedGoldPrice(db, CURRENCY, data);
    console.log('[GoldPrice] stored to DB');
    return data;
  } catch (err) {
    console.warn('[GoldPrice] fetch failed, using fallback:', err);
    return null;
  }
}
