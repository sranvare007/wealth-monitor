// ─── Domain types ────────────────────────────────────────────────────────────

export type AssetCategory = string;

export type SnapshotTrigger = 'ASSET_ADDED' | 'ASSET_UPDATED' | 'ASSET_DELETED' | 'CONTRIBUTION_APPLIED';

export type RecurringContributionFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type AccentKey = 'indigo' | 'violet' | 'emerald' | 'ocean' | 'sunset';

export type AssetTrack =
  | { kind: 'stock'; symbol: string; exchange: string; instrumentKey: string; qty: number; price: number; changePct: number; name: string; currency: string }
  | { kind: 'crypto'; cryptoId: number; symbol: string; qty: number; price: number; changePct: number; name: string }
  | { kind: 'gold'; purity: '24K' | '22K'; weight: number; perGram: number; changePct: number };

export type Asset = {
  id: string;
  name: string;
  cat: AssetCategory;
  value: number;    // always a positive number; liability sign applied at compute time
  currency: string; // ISO 4217
  note: string;
  updated: number;  // Unix ms timestamp
  track?: AssetTrack | null;
  // Recurring Contribution — optional; absent/0 means disabled
  recurringContributionEnabled?: number;
  recurringContributionAmount?: number | null;
  recurringContributionFrequency?: RecurringContributionFrequency | null;
  recurringContributionNextDue?: number | null;      // Unix ms timestamp
  recurringContributionLastApplied?: number | null;  // Unix ms timestamp
};

export type Snapshot = {
  id: string;
  t: number;         // Unix ms timestamp
  v: number;         // net worth in base currency at this moment
  trigger?: SnapshotTrigger;
  assetId?: string;
};

export type Currency = {
  code: string;
  symbol: string;
  name: string;
  rate: number; // INR value per 1 unit of this currency
};

export type Category = {
  id: AssetCategory;
  label: string;
  short: string;
  color: string;
  icon: string; // IconName from Icon.tsx
  liability?: boolean;
};

export type Totals = {
  assetsTotal: number;
  liabTotal: number;
  netWorth: number;
  byCat: Record<string, number>;
};

export type DistributionSegment = Category & { value: number };
