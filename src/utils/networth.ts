import type { Asset, Category, Totals, DistributionSegment } from '../types';
import { CATEGORIES, CAT } from '../data/categories';
import { convert } from './currency';
import { calcFdCurrentValue } from './fd';

export function assetBaseValue(asset: Asset, base: string): number {
  const v = asset.cat === 'fd' && asset.fdInterestRate != null && asset.fdStartDate != null
    ? calcFdCurrentValue(asset)
    : asset.value;
  return convert(v, asset.currency, base);
}

export function computeTotals(
  assets: Asset[],
  base: string,
  customCategories: Category[] = [],
): Totals {
  let assetsTotal = 0;
  let liabTotal = 0;
  const byCat: Record<string, number> = Object.fromEntries(
    [...CATEGORIES, ...customCategories].map(c => [c.id, 0]),
  );

  const customCatMap = Object.fromEntries(customCategories.map(c => [c.id, c]));

  for (const asset of assets) {
    const v = assetBaseValue(asset, base);
    byCat[asset.cat] = (byCat[asset.cat] ?? 0) + v;
    const isLiability = CAT[asset.cat]?.liability ?? customCatMap[asset.cat]?.liability ?? false;
    if (isLiability) liabTotal += v;
    else assetsTotal += v;
  }

  return { assetsTotal, liabTotal, netWorth: assetsTotal - liabTotal, byCat };
}

export function getDistribution(
  assets: Asset[],
  base: string,
  customCategories: Category[] = [],
): DistributionSegment[] {
  const { byCat } = computeTotals(assets, base, customCategories);
  return [...CATEGORIES, ...customCategories]
    .map(c => ({ ...c, value: byCat[c.id] ?? 0 }))
    .filter(c => c.value > 0.5);
}
