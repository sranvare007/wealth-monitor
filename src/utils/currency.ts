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

/** Convert `amount` from `from` currency to `to` currency via INR. */
export function convert(amount: number, from: string, to: string): number {
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
      else if (abs >= 1e5) body = (abs / 1e5).toFixed(abs >= 1e6 ? 0 : 1).replace(/\.?0+$/, '') + 'L';
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
