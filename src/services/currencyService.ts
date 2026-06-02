import type { SQLiteDatabase } from 'expo-sqlite';
import { getCachedRates, setCachedRates } from '../db/queries/exchange_rates';

const EXCHANGE_RATES_URL =
  'https://wealth-monitor-backend-production.up.railway.app/api/v1/exchange-rates';

type ApiResponse = {
  success: boolean;
  data?: { rates: Record<string, number> };
};

async function fetchLiveRates(): Promise<Record<string, number>> {
  const res = await fetch(EXCHANGE_RATES_URL);
  const json = (await res.json()) as ApiResponse;
  if (!json.success || !json.data?.rates) throw new Error('Invalid response');
  return json.data.rates;
}

/**
 * Returns USD-based exchange rates for the session.
 * If cached rates exist, returns them immediately and refreshes in the background.
 * On first launch (no cache), waits for the live fetch before returning.
 */
export async function loadExchangeRates(db: SQLiteDatabase): Promise<Record<string, number>> {
  const cached = await getCachedRates(db, 'USD');

  if (cached) {
    // Warm cache hit — refresh silently for next session
    fetchLiveRates()
      .then(rates => setCachedRates(db, 'USD', rates))
      .catch(() => {});
    return cached.rates;
  }

  // First launch — wait for live rates
  try {
    const rates = await fetchLiveRates();
    await setCachedRates(db, 'USD', rates);
    return rates;
  } catch {
    return {};
  }
}
