import type { SQLiteDatabase } from 'expo-sqlite';
import type { Asset } from '../../types';

type AssetRow = {
  id: string;
  name: string;
  cat: string;
  value: number;
  currency: string;
  note: string;
  updated: number;
};

export async function getAllAssets(db: SQLiteDatabase): Promise<Asset[]> {
  const rows = await db.getAllAsync<AssetRow>(
    'SELECT * FROM assets ORDER BY updated DESC',
  );
  return rows as Asset[];
}

export async function upsertAsset(db: SQLiteDatabase, asset: Asset): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO assets (id, name, cat, value, currency, note, updated)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [asset.id, asset.name, asset.cat, asset.value, asset.currency, asset.note, asset.updated],
  );
}

export async function deleteAsset(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM assets WHERE id = ?', [id]);
}

export async function clearAssets(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM assets');
}
