import type { Asset, AssetCategory, Snapshot } from '../types';

export function seedAssets(): Asset[] {
  const now = Date.now();
  const day = 86_400_000;
  const a = (
    id: string, cat: AssetCategory, name: string,
    value: number, currency: string, daysAgo: number, note = '',
  ): Asset => ({ id, cat, name, value, currency, updated: now - daysAgo * day, note });

  return [
    a('a1',  'bank',       'HDFC Savings',           452_000,  'INR', 2),
    a('a2',  'fd',         'Emergency Fund FD',       200_000,  'INR', 12),
    a('a3',  'stocks',     'Nifty 50 Index Fund',   1_240_000,  'INR', 5),
    a('a4',  'stocks',     'US Tech Portfolio',        18_500,  'USD', 3, 'Vested RSUs + brokerage'),
    a('a5',  'stocks',     'Parag Parikh Flexi Cap',  680_000,  'INR', 5),
    a('a6',  'realestate', 'Pune Apartment',        8_500_000,  'INR', 60, '2BHK, Baner'),
    a('a7',  'crypto',     'Bitcoin',                 320_000,  'INR', 1),
    a('a8',  'crypto',     'Ethereum',                110_000,  'INR', 1),
    a('a9',  'gold',       'Sovereign Gold Bonds',    560_000,  'INR', 30),
    a('a10', 'gold',       'Physical Gold',           240_000,  'INR', 90),
    a('a11', 'custom',     'EPF + PPF',               890_000,  'INR', 45, 'Retirement corpus'),
    a('a12', 'loans',      'Home Loan',             4_200_000,  'INR', 30, 'Outstanding principal'),
    a('a13', 'loans',      'Car Loan',                480_000,  'INR', 30),
  ];
}

export function seedSnapshots(current: number): Snapshot[] {
  const now = Date.now();
  const day = 86_400_000;
  const pts: Snapshot[] = [];

  const months = 14;
  let val = current * 0.58;
  const monthlyGrowth = Math.pow((current * 0.9) / val, 1 / (months - 1));
  for (let i = months - 1; i >= 2; i--) {
    const noise = 1 + Math.sin(i * 1.7) * 0.03;
    pts.push({ id: `sm_${i}`, t: now - i * 30 * day, v: Math.round(val * noise) });
    val *= monthlyGrowth;
  }

  const weeks = 6;
  let wv = val;
  const weeklyGrowth = Math.pow(current / wv, 1 / weeks);
  for (let i = weeks; i >= 1; i--) {
    const noise = 1 + Math.sin(i * 2.3) * 0.012;
    pts.push({ id: `sw_${i}`, t: now - i * 7 * day, v: Math.round(wv * noise) });
    wv *= weeklyGrowth;
  }

  pts.push({ id: 's_now', t: now, v: Math.round(current) });
  return pts.sort((a, b) => a.t - b.t);
}
