import type { SQLiteDatabase } from 'expo-sqlite';
import { getSetting, setSetting } from '../db/queries/settings';
import { bulkInsertStocks } from '../db/queries/stocks_info';
import type { StockInfo } from '../db/queries/stocks_info';
import {
  getAllExchanges,
  insertExchanges,
  getUnsyncedExchanges,
  markExchangeSynced,
} from '../db/queries/exchanges';
import type { Exchange } from '../db/queries/exchanges';

const API_KEY = 'demo';
const EXCHANGES_URL = `https://api.twelvedata.com/exchanges?apikey=${API_KEY}`;
const STOCKS_URL = `https://api.twelvedata.com/stocks`;
const SETTING_KEY = 'STOCKS_INITIAL_SYNC_DONE';

// ─── Types ────────────────────────────────────────────────────────────────────

type RawExchange = {
  title: string;
  name: string;
  code: string;
  country: string;
  timezone: string;
  [key: string]: unknown;
};

type RawStock = {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  mic_code: string;
  country: string;
  type: string;
  figi_code: string;
  cfi_code: string;
  [key: string]: unknown;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapExchange(raw: RawExchange): Exchange {
  return {
    code:      raw.code     ?? '',
    title:     raw.title    ?? '',
    name:      raw.name     ?? '',
    country:   raw.country  ?? '',
    timezone:  raw.timezone ?? '',
    synced_at: null,
  };
}

function mapStock(raw: RawStock): StockInfo {
  return {
    symbol:    raw.symbol    ?? '',
    name:      raw.name      ?? '',
    currency:  raw.currency  ?? '',
    exchange:  raw.exchange  ?? '',
    mic_code:  raw.mic_code  ?? '',
    country:   raw.country   ?? '',
    type:      raw.type      ?? '',
    figi_code: raw.figi_code ?? '',
    cfi_code:  raw.cfi_code  ?? '',
  };
}

async function safeFetchJson<T>(label: string, url: string): Promise<T> {
  console.log(`[StocksSync] ${label} → fetching`, url);

  let response: Response;
  try {
    response = await fetch(url);
  } catch (networkErr) {
    console.error(`[StocksSync] ${label} → network error:`, networkErr);
    throw networkErr;
  }

  console.log(`[StocksSync] ${label} → status ${response.status} ${response.statusText}`);

  let rawText: string;
  try {
    rawText = await response.text();
  } catch (readErr) {
    console.error(`[StocksSync] ${label} → failed to read body:`, readErr);
    throw readErr;
  }

  console.log(`[StocksSync] ${label} → body length: ${rawText.length} chars | preview: ${rawText.slice(0, 200)}`);

  if (!response.ok) {
    console.error(`[StocksSync] ${label} → non-OK full body:`, rawText);
    throw new Error(`${label} responded with ${response.status}`);
  }

  try {
    return JSON.parse(rawText) as T;
  } catch (parseErr) {
    console.error(`[StocksSync] ${label} → JSON parse failed:`, parseErr);
    throw parseErr;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

// Resumable: each exchange is marked synced_at as soon as its stocks are
// inserted, so a killed/crashed run picks up from the first unsynced exchange.
export async function syncStocksIfNeeded(db: SQLiteDatabase): Promise<void> {
  console.log('[StocksSync] checking if initial sync is needed');

  const alreadyDone = await getSetting(db, SETTING_KEY);
  console.log('[StocksSync] STOCKS_INITIAL_SYNC_DONE =', alreadyDone);
  if (alreadyDone === 'true') {
    console.log('[StocksSync] already synced, skipping');
    return;
  }

  // ── Step 1: load or fetch exchanges ─────────────────────────────────────────

  let allExchanges = await getAllExchanges(db);
  console.log(`[StocksSync] exchanges in DB: ${allExchanges.length}`);

  if (allExchanges.length === 0) {
    console.log('[StocksSync] no exchanges in DB — fetching from API');
    const resp = await safeFetchJson<{ data: RawExchange[]; status?: string }>(
      'exchanges',
      EXCHANGES_URL,
    );

    if (!Array.isArray(resp?.data)) {
      console.error('[StocksSync] exchanges response has no data array:', resp);
      throw new Error('Unexpected exchanges API response shape');
    }

    allExchanges = resp.data.map(mapExchange);
    console.log(`[StocksSync] ${allExchanges.length} exchanges received | codes: ${allExchanges.map(e => e.code).join(', ')}`);

    await insertExchanges(db, allExchanges);
    console.log('[StocksSync] exchanges stored in DB');
  }

  // ── Step 2: sync stocks for each unsynced exchange ───────────────────────

  const unsynced = await getUnsyncedExchanges(db);
  console.log(`[StocksSync] ${unsynced.length} of ${allExchanges.length} exchanges still need stocks`);

  let totalInserted = 0;
  const failed: string[] = [];

  for (let i = 0; i < unsynced.length; i++) {
    const ex = unsynced[i];
    const label = `stocks [${i + 1}/${unsynced.length}] exchange=${ex.code}`;
    const url = `${STOCKS_URL}?exchange=${ex.code}&apikey=${API_KEY}`;

    let stocksResp: { data: RawStock[]; status?: string };
    try {
      stocksResp = await safeFetchJson<{ data: RawStock[]; status?: string }>(label, url);
    } catch (err) {
      console.error(`[StocksSync] ${label} → fetch failed, skipping:`, err);
      failed.push(ex.code);
      continue;
    }

    if (!Array.isArray(stocksResp?.data)) {
      console.warn(`[StocksSync] ${label} → no data array, skipping. Keys:`, Object.keys(stocksResp ?? {}));
      failed.push(ex.code);
      continue;
    }

    console.log(`[StocksSync] ${label} → ${stocksResp.data.length} stocks`);

    if (stocksResp.data.length > 0) {
      const stocks = stocksResp.data.map(mapStock);
      try {
        await bulkInsertStocks(db, stocks);
        totalInserted += stocks.length;
        console.log(`[StocksSync] ${label} → inserted ${stocks.length} (running total: ${totalInserted})`);
      } catch (dbErr) {
        console.error(`[StocksSync] ${label} → DB insert failed:`, dbErr);
        failed.push(ex.code);
        continue;
      }
    }

    // Mark this exchange done before moving to the next so progress is saved
    // even if the app is killed mid-loop.
    await markExchangeSynced(db, ex.code);
  }

  // ── Step 3: finalise ────────────────────────────────────────────────────────

  if (failed.length > 0) {
    console.warn(
      `[StocksSync] ${failed.length} exchange(s) failed: ${failed.join(', ')} — ` +
      'sync flag NOT set; background task will retry on next run',
    );
    return;
  }

  await setSetting(db, SETTING_KEY, 'true');
  console.log(`[StocksSync] done — ${totalInserted} total stocks across ${allExchanges.length} exchanges`);
}
