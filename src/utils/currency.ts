import type { Currency, Asset } from '../types';

export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',      rate: 1 },
  { code: 'USD', symbol: '$',   name: 'US Dollar',         rate: 83.2 },
  { code: 'EUR', symbol: '€',   name: 'Euro',              rate: 90.1 },
  { code: 'GBP', symbol: '£',   name: 'British Pound',     rate: 105.5 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',        rate: 22.6 },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar',  rate: 61.4 },
];

export const CUR: Record<string, Currency> = Object.fromEntries(
  CURRENCIES.map(c => [c.code, c]),
);

// USD-based rates loaded from API at startup (units of currency per 1 USD).
// Empty until setExchangeRates() is called; convert() falls back to hardcoded rates.
let _usdRates: Record<string, number> = {};

export function setExchangeRates(rates: Record<string, number>): void {
  _usdRates = rates;
}

/**
 * Convert `amount` from `from` currency to `to` currency.
 * Uses live USD-based rates when available, falls back to hardcoded INR-pivot.
 */
export function convert(amount: number, from: string, to: string): number {
  if (Object.keys(_usdRates).length > 0) {
    return (amount / (_usdRates[from] ?? 1)) * (_usdRates[to] ?? 1);
  }
  // Fallback: hardcoded rates are INR-pivoted (rate = X INR per 1 unit)
  const inr = amount * (CUR[from]?.rate ?? 1);
  return inr / (CUR[to]?.rate ?? 1);
}

function groupIndian(intStr: string): string {
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3);
  const rest = intStr.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return rest + ',' + last3;
}

type FormatMoneyOpts = {
  compact?: boolean;
  sign?: boolean;
  decimals?: number;
};

export function formatMoney(amount: number, code = 'INR', opts: FormatMoneyOpts = {}): string {
  const { compact = false, sign = false, decimals } = opts;
  const cur = CUR[code] ?? CUR['INR'];
  const neg = amount < 0;
  const abs = Math.abs(amount);
  let body: string;

  if (compact) {
    if (code === 'INR') {
      if (abs >= 1e7)      body = (abs / 1e7).toFixed(abs >= 1e8 ? 0 : 2).replace(/\.?0+$/, '') + 'Cr';
      else if (abs >= 1e5) body = (abs >= 1e6
        ? Math.floor(abs / 1e5).toString()
        : (Math.floor(abs / 1e3) / 100).toFixed(2).replace(/\.?0+$/, '')) + 'L';
      else if (abs >= 1e3) body = (abs / 1e3).toFixed(0) + 'K';
      else                 body = abs.toFixed(0);
    } else {
      if (abs >= 1e9)      body = (abs / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
      else if (abs >= 1e6) body = (abs / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
      else if (abs >= 1e3) body = (abs / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
      else                 body = abs.toFixed(0);
    }
  } else {
    const dec = decimals != null ? decimals : 0;
    const fixed = abs.toFixed(dec);
    const [intPart, decPart] = fixed.split('.');
    const grouped = code === 'INR'
      ? groupIndian(intPart)
      : intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    body = grouped + (decPart ? '.' + decPart : '');
  }

  const prefix = neg ? '−' : sign ? '+' : '';
  return prefix + cur.symbol + body;
}

export function assetBaseValue(asset: Asset, base: string): number {
  return convert(asset.value, asset.currency, base);
}
