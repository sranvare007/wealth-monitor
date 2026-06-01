import type { SQLiteDatabase } from 'expo-sqlite';
import type { Snapshot } from '../../types';

type SnapshotRow = {
  id: string;
  t: number;
  v: number;
  trigger: string | null;
  asset_id: string | null;
};

export async function getAllSnapshots(db: SQLiteDatabase): Promise<Snapshot[]> {
  const rows = await db.getAllAsync<SnapshotRow>(
    'SELECT * FROM net_worth_snapshots ORDER BY t ASC',
  );
  return rows.map(r => ({
    id: r.id,
    t: r.t,
    v: r.v,
    trigger: (r.trigger as Snapshot['trigger']) ?? undefined,
    assetId: r.asset_id ?? undefined,
  }));
}

export async function insertSnapshot(db: SQLiteDatabase, snap: Snapshot): Promise<void> {
  await db.runAsync(
    `INSERT INTO net_worth_snapshots (id, t, v, trigger, asset_id) VALUES (?, ?, ?, ?, ?)`,
    [snap.id, snap.t, snap.v, snap.trigger ?? null, snap.assetId ?? null],
  );
}

export async function clearSnapshots(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM net_worth_snapshots');
}
