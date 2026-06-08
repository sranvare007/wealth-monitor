// ─── Domain types ────────────────────────────────────────────────────────────

export type AssetCategory = string;

export type SnapshotTrigger = 'ASSET_ADDED' | 'ASSET_UPDATED' | 'ASSET_DELETED' | 'CONTRIBUTION_APPLIED';

export type RecurringContributionFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type AccentKey = 'indigo' | 'violet' | 'emerald' | 'ocean' | 'sunset';

export type ThemeMode = 'light' | 'dark' | 'system';

export type AssetTrack =
  | { kind: 'stock'; symbol: string; exchange: string; instrumentKey: string; qty: number; price: number; changePct: number; name: string; currency: string }
  | { kind: 'crypto'; cryptoId: number; symbol: string; qty: number; price: number; changePct: number; name: string }
  | { kind: 'gold'; purity: '24K' | '22K'; weight: number; perGram: number; changePct: number }
  | { kind: 'mutual_fund'; schemeCode: number; schemeName: string; units: number; nav: number; navDate: string };

export type Asset = {
  id: string;
  name: string;
  cat: AssetCategory;
  // For FD assets: value stores the principal (invested amount).
  // Current value (principal + accrued interest) is computed on-the-fly via assetBaseValue().
  value: number;
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
  // Fixed Deposit fields — only set when cat === 'fd'
  fdInterestRate?: number | null;      // annual simple interest rate (%)
  fdDurationYears?: number | null;
  fdDurationMonths?: number | null;
  fdDurationDays?: number | null;
  fdStartDate?: number | null;         // Unix ms timestamp (investment date)
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
