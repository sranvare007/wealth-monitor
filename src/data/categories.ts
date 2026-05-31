import type { AssetCategory, Category } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'cash',       label: 'Cash & Bank',          short: 'Cash',     color: '#10B981', icon: 'bank' },
  { id: 'stocks',     label: 'Stocks & Funds',        short: 'Stocks',   color: '#6366F1', icon: 'trending' },
  { id: 'realestate', label: 'Real Estate',           short: 'Property', color: '#F97316', icon: 'home' },
  { id: 'crypto',     label: 'Crypto',                short: 'Crypto',   color: '#A855F7', icon: 'coin' },
  { id: 'gold',       label: 'Gold & Commodities',    short: 'Gold',     color: '#EAB308', icon: 'gem' },
  { id: 'custom',     label: 'Other Assets',          short: 'Other',    color: '#0EA5E9', icon: 'grid' },
  { id: 'loans',      label: 'Loans & Liabilities',   short: 'Loans',    color: '#F43F5E', icon: 'minus', liability: true },
];

export const CAT = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c]),
) as Record<AssetCategory, Category>;
