// ─── Market data layer for live-tracked assets (stocks, crypto, gold) ────────
// Placeholder price book — static seed data so the app works offline.
// Gold rates are fetched live; see goldPriceService.ts.

import { getLiveGoldRates } from './goldPriceService';

export type StockInfo = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  instrument_key: string;
};

export type CryptoInfo = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  chains: string[];
};

export type GoldRates = {
  currency: string;
  perGram24k: number;
  perGram22k: number;
  changePct: number;
};


// ── Crypto catalog ─────────────────────────────────────────────────────────────
const CRYPTO_CATALOG: CryptoInfo[] = [
  { symbol: 'BTC',  name: 'Bitcoin',   price: 67250.00, changePct:  1.90, chains: ['Bitcoin', 'Lightning'] },
  { symbol: 'ETH',  name: 'Ethereum',  price: 3145.00,  changePct:  0.80, chains: ['Ethereum', 'Arbitrum', 'Optimism', 'Base'] },
  { symbol: 'USDT', name: 'Tether',    price: 1.00,     changePct:  0.01, chains: ['Ethereum', 'BSC', 'Polygon', 'Tron', 'Solana'] },
  { symbol: 'USDC', name: 'USD Coin',  price: 1.00,     changePct:  0.00, chains: ['Ethereum', 'Base', 'Polygon', 'Solana'] },
  { symbol: 'BNB',  name: 'BNB',       price: 592.00,   changePct:  0.40, chains: ['BSC', 'Ethereum'] },
  { symbol: 'SOL',  name: 'Solana',    price: 168.40,   changePct:  3.10, chains: ['Solana'] },
  { symbol: 'XRP',  name: 'XRP',       price: 0.6100,   changePct: -0.60, chains: ['XRP Ledger'] },
  { symbol: 'ADA',  name: 'Cardano',   price: 0.4500,   changePct:  0.90, chains: ['Cardano'] },
  { symbol: 'DOGE', name: 'Dogecoin',  price: 0.1230,   changePct:  5.20, chains: ['Dogecoin'] },
  { symbol: 'AVAX', name: 'Avalanche', price: 28.70,    changePct:  1.30, chains: ['Avalanche'] },
  { symbol: 'MATIC',name: 'Polygon',   price: 0.5200,   changePct: -0.80, chains: ['Polygon', 'Ethereum'] },
  { symbol: 'DOT',  name: 'Polkadot',  price: 6.10,     changePct:  0.50, chains: ['Polkadot'] },
  { symbol: 'LINK', name: 'Chainlink', price: 14.20,    changePct:  2.00, chains: ['Ethereum', 'Arbitrum'] },
  { symbol: 'TRX',  name: 'TRON',      price: 0.1600,   changePct:  0.30, chains: ['Tron'] },
  { symbol: 'LTC',  name: 'Litecoin',  price: 72.50,    changePct: -0.40, chains: ['Litecoin'] },
  { symbol: 'TON',  name: 'Toncoin',   price: 5.30,     changePct:  1.10, chains: ['TON'] },
];

// ── Gold rates — fallback used when live data is not yet loaded ────────────────
const GOLD_RATES_FALLBACK: GoldRates = {
  currency: 'INR',
  perGram24k: 7320,
  perGram22k: 6710,
  changePct: 0,
};

// ── Lookup maps ───────────────────────────────────────────────────────────────
const CRYPTO_BY_SYMBOL = Object.fromEntries(CRYPTO_CATALOG.map(c => [c.symbol, c]));

// ── Search helpers ────────────────────────────────────────────────────────────

export function searchCryptos(query: string): CryptoInfo[] {
  const t = query.trim().toLowerCase();
  if (!t) return CRYPTO_CATALOG;
  return CRYPTO_CATALOG.filter(
    c => c.symbol.toLowerCase().includes(t) || c.name.toLowerCase().includes(t),
  );
}

export function getCryptoChains(symbol: string): string[] {
  return CRYPTO_BY_SYMBOL[symbol]?.chains ?? [];
}

export function getGoldRates(): GoldRates {
  const live = getLiveGoldRates();
  if (live) {
    return {
      currency: live.currency,
      perGram24k: live.priceGram24k,
      perGram22k: live.priceGram22k,
      changePct: 0,
    };
  }
  return GOLD_RATES_FALLBACK;
}

export function getCryptoQuote(symbol: string): { price: number; changePct: number; currency: 'USD' } | null {
  const c = CRYPTO_BY_SYMBOL[symbol];
  return c ? { price: c.price, changePct: c.changePct, currency: 'USD' } : null;
}

// ── Stock APIs ────────────────────────────────────────────────────────────────

const INSTRUMENTS_BASE = 'https://wealth-monitor-backend-production.up.railway.app/api/v1/instruments';

type LTPQuote = {
  instrumentKey: string;
  lastPrice: number;
  closePrice: number;
  [key: string]: unknown;
};

export async function getStockLTPAPI(instrumentKey: string): Promise<{ price: number; changePct: number } | null> {
  const url = `${INSTRUMENTS_BASE}/ltp?instrument_key=${encodeURIComponent(instrumentKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { success: boolean; data?: { quotes?: LTPQuote[] } };
  const quote = json.data?.quotes?.[0];
  if (!quote) return null;
  const changePct = quote.closePrice > 0
    ? ((quote.lastPrice - quote.closePrice) / quote.closePrice) * 100
    : 0;
  return { price: quote.lastPrice, changePct };
}

type InstrumentItem = {
  trading_symbol: string;
  name: string;
  exchange: string;
  instrument_key: string;
  [key: string]: unknown;
};

export async function searchStocksAPI(query: string, limit = 20): Promise<StockInfo[]> {
  const url = `${INSTRUMENTS_BASE}/search?query=${encodeURIComponent(query)}&segments=EQ&page_number=1&records=${limit}&atm_offset=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { success: boolean; data?: { instruments?: InstrumentItem[] } };
  if (!json.success || !json.data?.instruments) return [];
  return json.data.instruments.map(item => ({
    symbol: item.trading_symbol,
    name: item.name,
    exchange: item.exchange,
    currency: ['NSE', 'BSE'].includes(item.exchange) ? 'INR' : 'USD',
    instrument_key: item.instrument_key,
  }));
}


export const TRACKED_CATS = ['stocks', 'crypto', 'gold', 'mf'] as const;
export type TrackedCat = (typeof TRACKED_CATS)[number];

export function isTrackedCat(cat: string): cat is TrackedCat {
  return (TRACKED_CATS as readonly string[]).includes(cat);
}
