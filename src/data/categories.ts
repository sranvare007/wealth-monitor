import type { Category } from '../types';
import type { IconName } from '../components/common/Icon';

export const CATEGORIES: Category[] = [
  { id: 'bank',       label: 'Bank Deposit',          short: 'Bank',     color: '#10B981', icon: 'bank' },
  { id: 'fd',         label: 'Fixed Deposit (FD)',    short: 'FD',       color: '#14B8A6', icon: 'shield' },
  { id: 'rd',         label: 'Recurring Deposit (RD)',short: 'RD',       color: '#06B6D4', icon: 'wallet' },
  { id: 'stocks',     label: 'Stocks & Funds',        short: 'Stocks',   color: '#6366F1', icon: 'trending' },
  { id: 'realestate', label: 'Real Estate',           short: 'Property', color: '#F97316', icon: 'home' },
  { id: 'crypto',     label: 'Crypto',                short: 'Crypto',   color: '#A855F7', icon: 'coin' },
  { id: 'gold',       label: 'Gold & Commodities',    short: 'Gold',     color: '#EAB308', icon: 'gem' },
  { id: 'mf',         label: 'Mutual Funds',           short: 'MF',       color: '#3B82F6', icon: 'briefcase' },
  { id: 'custom',     label: 'Other Assets',          short: 'Other',    color: '#0EA5E9', icon: 'grid' },
  { id: 'loans',      label: 'Loans & Liabilities',   short: 'Loans',    color: '#F43F5E', icon: 'minus', liability: true },
];

export const CAT = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c]),
) as Record<string, Category>;

// Color palette shown in the category form color picker (16 swatches, 8 per row)
export const CATEGORY_COLOR_PALETTE = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#3B82F6',
  '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
  '#F43F5E', '#64748B', '#7C3AED', '#0EA5E9',
];

// Default color used when cycling (kept for backward compat with DB)
export const CUSTOM_CAT_COLORS = CATEGORY_COLOR_PALETTE;

// Icons available in the custom category icon picker (5-column grid)
export const CATEGORY_PICKER_ICONS: IconName[] = [
  'wallet', 'bank',       'coin',       'trending',  'gem',
  'home',   'list',       'car',        'plane',     'globe',
  'briefcase','graduation','grid',      'laptop',    'phone',
  'watch',  'camera',     'music',      'palette',   'gift',
  'cart',   'tag',        'tv',         'coffee',    'heart',
  'shield', 'umbrella',   'key',        'leaf',      'plus',
  'crown',  'flame',      'bolt',       'star',      'sparkle',
];
