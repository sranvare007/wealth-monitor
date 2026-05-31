import type { Asset, AssetCategory, Totals, DistributionSegment } from '../types';
import { CATEGORIES, CAT } from '../data/categories';
import { convert } from './currency';

export function assetBaseValue(asset: Asset, base: string): number {
  return convert(asset.value, asset.currency, base);
}

export function computeTotals(assets: Asset[], base: string): Totals {
  let assetsTotal = 0;
  let liabTotal = 0;
  const byCat = Object.fromEntries(
    CATEGORIES.map(c => [c.id, 0]),
  ) as Record<AssetCategory, number>;

  for (const asset of assets) {
    const v = assetBaseValue(asset, base);
    byCat[asset.cat] = (byCat[asset.cat] ?? 0) + v;
    if (CAT[asset.cat]?.liability) liabTotal += v;
    else assetsTotal += v;
  }

  return { assetsTotal, liabTotal, netWorth: assetsTotal - liabTotal, byCat };
}

export function getDistribution(assets: Asset[], base: string): DistributionSegment[] {
  const { byCat } = computeTotals(assets, base);
  return CATEGORIES
    .map(c => ({ ...c, value: byCat[c.id] ?? 0 }))
    .filter(c => c.value > 0.5);
}
