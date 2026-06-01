import type { SQLiteDatabase } from 'expo-sqlite';
import type { Asset, Snapshot } from '../types';
import { upsertAsset } from '../db/queries/assets';
import { insertSnapshot } from '../db/queries/snapshots';
import { computeTotals } from '../utils/networth';
import { generateId } from '../utils/uuid';
import { advanceByFrequency } from '../utils/date';

export type RCApplication = {
  asset: Asset;
  amountChanged: number;  // absolute value of the change (always positive)
  periods: number;
  isLiability: boolean;   // true → balance was reduced; false → value was increased
};

export type ContributionResult = {
  applications: RCApplication[];
  newSnapshots: Snapshot[];
};

export async function applyDueContributions(
  db: SQLiteDatabase,
  assets: Asset[],
  baseCurrency: string,
  liabilityCategoryIds: Set<string>,
): Promise<ContributionResult> {
  const now = Date.now();
  const due = assets.filter(
    a =>
      a.recurringContributionEnabled === 1 &&
      a.recurringContributionAmount != null && a.recurringContributionAmount > 0 &&
      a.recurringContributionFrequency != null &&
      a.recurringContributionNextDue != null && a.recurringContributionNextDue <= now,
  );

  if (due.length === 0) return { applications: [], newSnapshots: [] };

  const applications: RCApplication[] = [];

  for (const asset of due) {
    let periods = 0;
    let nextDue = asset.recurringContributionNextDue!;
    // Advance until nextDue is in the future — handles catch-up across multiple periods
    while (nextDue <= now) {
      periods++;
      nextDue = advanceByFrequency(nextDue, asset.recurringContributionFrequency!);
    }

    const isLiability = liabilityCategoryIds.has(asset.cat);
    const totalScheduled = asset.recurringContributionAmount! * periods;

    // Liabilities: reduce outstanding balance, capped at 0 (can't go negative)
    // Assets: increase value
    const newValue = isLiability
      ? Math.max(0, asset.value - totalScheduled)
      : asset.value + totalScheduled;
    const amountChanged = Math.abs(newValue - asset.value);

    applications.push({
      asset: {
        ...asset,
        value: newValue,
        updated: now,
        recurringContributionLastApplied: now,
        recurringContributionNextDue: nextDue,
      },
      amountChanged,
      periods,
      isLiability,
    });
  }

  const updatedMap = new Map(applications.map(a => [a.asset.id, a.asset]));
  const allAssets = assets.map(a => updatedMap.get(a.id) ?? a);
  const nw = computeTotals(allAssets, baseCurrency).netWorth;
  const snap: Snapshot = {
    id: generateId(),
    t: now,
    v: Math.round(nw),
    trigger: 'CONTRIBUTION_APPLIED',
  };

  await db.withTransactionAsync(async () => {
    for (const { asset } of applications) await upsertAsset(db, asset);
    await insertSnapshot(db, snap);
  });

  return { applications, newSnapshots: [snap] };
}
