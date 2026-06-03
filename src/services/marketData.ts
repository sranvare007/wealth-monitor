// ─── Market data layer for live-tracked assets (stocks, crypto, gold) ────────
// Placeholder price book — static seed data so the app works offline.
// Gold rates are fetched live; see goldPriceService.ts.

import { getLiveGoldRates } from './goldPriceService';

export type StockInfo = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  changePct: number;
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

// ── Stock catalog ──────────────────────────────────────────────────────────────
const STOCK_CATALOG: StockInfo[] = [
  // NSE — INR
  { symbol: 'RELIANCE',   name: 'Reliance Industries',       exchange: 'NSE',    currency: 'INR', price: 2945.50,  changePct:  0.82 },
  { symbol: 'TCS',        name: 'Tata Consultancy Services', exchange: 'NSE',    currency: 'INR', price: 4120.00,  changePct: -0.34 },
  { symbol: 'HDFCBANK',   name: 'HDFC Bank',                 exchange: 'NSE',    currency: 'INR', price: 1685.30,  changePct:  1.12 },
  { symbol: 'INFY',       name: 'Infosys',                   exchange: 'NSE',    currency: 'INR', price: 1842.75,  changePct:  0.56 },
  { symbol: 'ICICIBANK',  name: 'ICICI Bank',                exchange: 'NSE',    currency: 'INR', price: 1248.60,  changePct:  0.91 },
  { symbol: 'SBIN',       name: 'State Bank of India',       exchange: 'NSE',    currency: 'INR', price: 842.15,   changePct: -0.22 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel',             exchange: 'NSE',    currency: 'INR', price: 1576.40,  changePct:  1.45 },
  { symbol: 'ITC',        name: 'ITC Limited',               exchange: 'NSE',    currency: 'INR', price: 478.90,   changePct:  0.18 },
  { symbol: 'LT',         name: 'Larsen & Toubro',           exchange: 'NSE',    currency: 'INR', price: 3680.25,  changePct:  0.67 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever',        exchange: 'NSE',    currency: 'INR', price: 2402.10,  changePct: -0.41 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance',             exchange: 'NSE',    currency: 'INR', price: 7185.00,  changePct:  2.03 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors',               exchange: 'NSE',    currency: 'INR', price: 985.20,   changePct:  1.88 },
  { symbol: 'WIPRO',      name: 'Wipro',                     exchange: 'NSE',    currency: 'INR', price: 562.45,   changePct:  0.34 },
  // BSE — INR
  { symbol: 'TITAN',      name: 'Titan Company',             exchange: 'BSE',    currency: 'INR', price: 3450.00,  changePct:  0.72 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints',              exchange: 'BSE',    currency: 'INR', price: 2890.50,  changePct: -0.38 },
  { symbol: 'NESTLEIND',  name: 'Nestlé India',              exchange: 'BSE',    currency: 'INR', price: 2510.00,  changePct:  0.21 },
  { symbol: 'MARUTI',     name: 'Maruti Suzuki',             exchange: 'BSE',    currency: 'INR', price: 12880.00, changePct: -0.55 },
  // NASDAQ / NYSE — USD
  { symbol: 'AAPL',  name: 'Apple Inc.',        exchange: 'NASDAQ', currency: 'USD', price: 229.87, changePct:  0.64 },
  { symbol: 'MSFT',  name: 'Microsoft',         exchange: 'NASDAQ', currency: 'USD', price: 424.30, changePct:  0.41 },
  { symbol: 'GOOGL', name: 'Alphabet (Google)', exchange: 'NASDAQ', currency: 'USD', price: 167.55, changePct:  1.02 },
  { symbol: 'AMZN',  name: 'Amazon',            exchange: 'NASDAQ', currency: 'USD', price: 186.40, changePct: -0.33 },
  { symbol: 'NVDA',  name: 'NVIDIA',            exchange: 'NASDAQ', currency: 'USD', price: 131.26, changePct:  2.85 },
  { symbol: 'TSLA',  name: 'Tesla',             exchange: 'NASDAQ', currency: 'USD', price: 248.50, changePct: -1.42 },
  { symbol: 'META',  name: 'Meta Platforms',    exchange: 'NASDAQ', currency: 'USD', price: 563.27, changePct:  0.88 },
  { symbol: 'NFLX',  name: 'Netflix',           exchange: 'NASDAQ', currency: 'USD', price: 697.05, changePct:  0.51 },
  { symbol: 'JPM',   name: 'JPMorgan Chase',    exchange: 'NYSE',   currency: 'USD', price: 212.80, changePct:  0.29 },
  { symbol: 'KO',    name: 'Coca-Cola',         exchange: 'NYSE',   currency: 'USD', price: 62.45,  changePct: -0.12 },
];

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
const STOCK_BY_SYMBOL = Object.fromEntries(STOCK_CATALOG.map(s => [s.symbol, s]));
const CRYPTO_BY_SYMBOL = Object.fromEntries(CRYPTO_CATALOG.map(c => [c.symbol, c]));

// ── Search helpers ────────────────────────────────────────────────────────────

export function searchStocks(query: string): StockInfo[] {
  const t = query.trim().toLowerCase();
  const list = t
    ? STOCK_CATALOG.filter(s =>
        s.symbol.toLowerCase().includes(t) || s.name.toLowerCase().includes(t),
      )
    : STOCK_CATALOG;
  return list.slice().sort((a, b) => {
    const ai = a.symbol.toLowerCase().indexOf(t);
    const bi = b.symbol.toLowerCase().indexOf(t);
    return (ai === 0 ? -1 : 0) - (bi === 0 ? -1 : 0);
  });
}

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

export function getStockQuote(symbol: string): Pick<StockInfo, 'price' | 'changePct' | 'currency'> | null {
  const s = STOCK_BY_SYMBOL[symbol];
  return s ? { price: s.price, changePct: s.changePct, currency: s.currency } : null;
}

export function getCryptoQuote(symbol: string): { price: number; changePct: number; currency: 'USD' } | null {
  const c = CRYPTO_BY_SYMBOL[symbol];
  return c ? { price: c.price, changePct: c.changePct, currency: 'USD' } : null;
}

// ── Stock quote API ───────────────────────────────────────────────────────────

const API_BASE = 'https://wealth-monitor-backend-production.up.railway.app/api/v1/stocks';

export type StockQuoteResult = {
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;
};

// Returns null when the backend cannot provide a quote for the symbol
// (e.g. exchange-suffixed symbols like RELIANCE.NS).
export async function getStockQuoteAPI(symbol: string): Promise<StockQuoteResult | null> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(symbol)}/quote`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { success: boolean; data?: StockQuoteResult };
  return json.success && json.data ? json.data : null;
}


export const TRACKED_CATS = ['stocks', 'crypto', 'gold'] as const;
export type TrackedCat = (typeof TRACKED_CATS)[number];

export function isTrackedCat(cat: string): cat is TrackedCat {
  return (TRACKED_CATS as readonly string[]).includes(cat);
}
