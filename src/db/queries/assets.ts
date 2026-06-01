import type { SQLiteDatabase } from 'expo-sqlite';
import type { Asset, RecurringContributionFrequency } from '../../types';

// AssetRow mirrors SQLite column names (snake_case); mapped to camelCase Asset below
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
    recurringContributionEnabled: r.rc_enabled,
    recurringContributionAmount: r.rc_amount,
    recurringContributionFrequency: r.rc_frequency as RecurringContributionFrequency | null,
    recurringContributionNextDue: r.rc_next_due,
    recurringContributionLastApplied: r.rc_last_applied,
  }));
}

export async function upsertAsset(db: SQLiteDatabase, asset: Asset): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO assets
     (id, name, cat, value, currency, note, updated,
      rc_enabled, rc_amount, rc_frequency, rc_next_due, rc_last_applied)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      asset.id, asset.name, asset.cat, asset.value,
      asset.currency, asset.note, asset.updated,
      asset.recurringContributionEnabled ?? 0,
      asset.recurringContributionAmount ?? null,
      asset.recurringContributionFrequency ?? null,
      asset.recurringContributionNextDue ?? null,
      asset.recurringContributionLastApplied ?? null,
    ],
  );
}

export async function deleteAsset(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM assets WHERE id = ?', [id]);
}

export async function clearAssets(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM assets');
}
