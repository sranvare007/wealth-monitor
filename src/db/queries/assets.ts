import type { SQLiteDatabase } from 'expo-sqlite';
import type { Asset, AssetTrack, RecurringContributionFrequency } from '../../types';

type AssetRow = {
  id: string;
  name: string;
  cat: string;
  value: number;
  currency: string;
  note: string;
  updated: number;
  rc_enabled: number;
  rc_amount: number | null;
  rc_frequency: string | null;
  rc_next_due: number | null;
  rc_last_applied: number | null;
  track_json: string | null;
  fd_interest_rate: number | null;
  fd_duration_years: number | null;
  fd_duration_months: number | null;
  fd_duration_days: number | null;
  fd_start_date: number | null;
};

export async function getAllAssets(db: SQLiteDatabase): Promise<Asset[]> {
  const rows = await db.getAllAsync<AssetRow>(
    'SELECT * FROM assets ORDER BY updated DESC',
  );
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    cat: r.cat as Asset['cat'],
    value: r.value,
    currency: r.currency,
    note: r.note,
    updated: r.updated,
    track: r.track_json ? (JSON.parse(r.track_json) as AssetTrack) : null,
    recurringContributionEnabled: r.rc_enabled,
    recurringContributionAmount: r.rc_amount,
    recurringContributionFrequency: r.rc_frequency as RecurringContributionFrequency | null,
    recurringContributionNextDue: r.rc_next_due,
    recurringContributionLastApplied: r.rc_last_applied,
    fdInterestRate: r.fd_interest_rate,
    fdDurationYears: r.fd_duration_years,
    fdDurationMonths: r.fd_duration_months,
    fdDurationDays: r.fd_duration_days,
    fdStartDate: r.fd_start_date,
  }));
}

export async function upsertAsset(db: SQLiteDatabase, asset: Asset): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO assets
     (id, name, cat, value, currency, note, updated,
      rc_enabled, rc_amount, rc_frequency, rc_next_due, rc_last_applied, track_json,
      fd_interest_rate, fd_duration_years, fd_duration_months, fd_duration_days, fd_start_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      asset.id, asset.name, asset.cat, asset.value,
      asset.currency, asset.note, asset.updated,
      asset.recurringContributionEnabled ?? 0,
      asset.recurringContributionAmount ?? null,
      asset.recurringContributionFrequency ?? null,
      asset.recurringContributionNextDue ?? null,
      asset.recurringContributionLastApplied ?? null,
      asset.track ? JSON.stringify(asset.track) : null,
      asset.fdInterestRate ?? null,
      asset.fdDurationYears ?? null,
      asset.fdDurationMonths ?? null,
      asset.fdDurationDays ?? null,
      asset.fdStartDate ?? null,
    ],
  );
}

export async function deleteAsset(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM assets WHERE id = ?', [id]);
}

export async function clearAssets(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM assets');
}
