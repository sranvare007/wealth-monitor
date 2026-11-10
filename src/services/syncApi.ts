import { apiRequest } from './api';
import type { Asset, Snapshot, Category } from '../types';

// ── Wire shapes (must match the backend's SyncPayload) ──────────────────────────

export type SyncAsset = {
  id: string;
  name: string;
  cat: string;
  value: number;
  currency: string;
  note: string;
  updated: number;
  track?: unknown;
  recurringContributionEnabled?: number | null;
  recurringContributionAmount?: number | null;
  recurringContributionFrequency?: string | null;
  recurringContributionNextDue?: number | null;
  recurringContributionLastApplied?: number | null;
  fdInterestRate?: number | null;
  fdDurationYears?: number | null;
  fdDurationMonths?: number | null;
  fdDurationDays?: number | null;
  fdStartDate?: number | null;
};

export type SyncSnapshot = {
  id: string;
  t: number;
  v: number;
  trigger?: string | null;
  assetId?: string | null;
};

export type SyncCategory = {
  id: string;
  label: string;
  icon: string;
  color: string;
  liability?: boolean;
  created?: number;
};

export type SyncPayload = {
  assets: SyncAsset[];
  snapshots: SyncSnapshot[];
  categories: SyncCategory[];
  settings: Record<string, string>;
};

export type SyncPushResult = {
  assetsCount: number;
  snapshotsCount: number;
  categoriesCount: number;
  settingsCount: number;
  syncedAt: string;
};

// ── Mapping between app domain types and wire shapes ────────────────────────────

function assetToWire(a: Asset): SyncAsset {
  return {
    id: a.id,
    name: a.name,
    cat: a.cat,
    value: a.value,
    currency: a.currency,
    note: a.note,
    updated: a.updated,
    track: a.track ?? null,
    recurringContributionEnabled: a.recurringContributionEnabled ?? 0,
    recurringContributionAmount: a.recurringContributionAmount ?? null,
    recurringContributionFrequency: a.recurringContributionFrequency ?? null,
    recurringContributionNextDue: a.recurringContributionNextDue ?? null,
    recurringContributionLastApplied: a.recurringContributionLastApplied ?? null,
    fdInterestRate: a.fdInterestRate ?? null,
    fdDurationYears: a.fdDurationYears ?? null,
    fdDurationMonths: a.fdDurationMonths ?? null,
    fdDurationDays: a.fdDurationDays ?? null,
    fdStartDate: a.fdStartDate ?? null,
  };
}

function assetFromWire(a: SyncAsset): Asset {
  return {
    id: a.id,
    name: a.name,
    cat: a.cat,
    value: a.value,
    currency: a.currency,
    note: a.note ?? '',
    updated: a.updated,
    track: (a.track as Asset['track']) ?? null,
    recurringContributionEnabled: a.recurringContributionEnabled ?? 0,
    recurringContributionAmount: a.recurringContributionAmount ?? null,
    recurringContributionFrequency:
      (a.recurringContributionFrequency as Asset['recurringContributionFrequency']) ?? null,
    recurringContributionNextDue: a.recurringContributionNextDue ?? null,
    recurringContributionLastApplied: a.recurringContributionLastApplied ?? null,
    fdInterestRate: a.fdInterestRate ?? null,
    fdDurationYears: a.fdDurationYears ?? null,
    fdDurationMonths: a.fdDurationMonths ?? null,
    fdDurationDays: a.fdDurationDays ?? null,
    fdStartDate: a.fdStartDate ?? null,
  };
}

function snapshotToWire(s: Snapshot): SyncSnapshot {
  return { id: s.id, t: s.t, v: s.v, trigger: s.trigger ?? null, assetId: s.assetId ?? null };
}

function snapshotFromWire(s: SyncSnapshot): Snapshot {
  return {
    id: s.id,
    t: s.t,
    v: s.v,
    trigger: (s.trigger as Snapshot['trigger']) ?? undefined,
    assetId: s.assetId ?? undefined,
  };
}

function categoryToWire(c: Category): SyncCategory {
  return { id: c.id, label: c.label, icon: c.icon, color: c.color, liability: !!c.liability };
}

function categoryFromWire(c: SyncCategory): Category {
  const words = c.label.trim().split(/\s+/);
  const short = words[0].length <= 7 ? words[0] : words[0].substring(0, 7);
  return {
    id: c.id,
    label: c.label,
    short,
    color: c.color,
    icon: c.icon,
    liability: !!c.liability,
  };
}

export type LocalSnapshotInput = {
  assets: Asset[];
  snapshots: Snapshot[];
  categories: Category[];
  settings: Record<string, string>;
};

export type LocalDataset = {
  assets: Asset[];
  snapshots: Snapshot[];
  categories: Category[];
  settings: Record<string, string>;
};

export function buildPayload(input: LocalSnapshotInput): SyncPayload {
  return {
    assets: input.assets.map(assetToWire),
    snapshots: input.snapshots.map(snapshotToWire),
    categories: input.categories.map(categoryToWire),
    settings: input.settings,
  };
}

export function payloadToLocal(payload: SyncPayload): LocalDataset {
  return {
    assets: payload.assets.map(assetFromWire),
    snapshots: payload.snapshots.map(snapshotFromWire),
    categories: payload.categories.map(categoryFromWire),
    settings: payload.settings ?? {},
  };
}

// ── Network calls ───────────────────────────────────────────────────────────────

export async function pushData(token: string, input: LocalSnapshotInput): Promise<SyncPushResult> {
  return apiRequest<SyncPushResult>('/sync', {
    method: 'POST',
    body: buildPayload(input),
    token,
  });
}

export async function pullData(token: string): Promise<LocalDataset> {
  const payload = await apiRequest<SyncPayload>('/sync', { token });
  return payloadToLocal(payload);
}
