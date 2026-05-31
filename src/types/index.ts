// ─── Domain types ────────────────────────────────────────────────────────────

export type AssetCategory =
  | 'cash'
  | 'stocks'
  | 'realestate'
  | 'crypto'
  | 'gold'
  | 'custom'
  | 'loans';

export type SnapshotTrigger = 'ASSET_ADDED' | 'ASSET_UPDATED' | 'ASSET_DELETED';

export type AccentKey = 'indigo' | 'violet' | 'emerald' | 'ocean' | 'sunset';

export type Asset = {
  id: string;
  name: string;
  cat: AssetCategory;
  value: number;    // always a positive number; liability sign applied at compute time
  currency: string; // ISO 4217
  note: string;
  updated: number;  // Unix ms timestamp
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
  byCat: Record<AssetCategory, number>;
};

export type DistributionSegment = Category & { value: number };
