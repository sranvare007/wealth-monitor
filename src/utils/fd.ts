import type { Asset } from '../types';

export function fdTotalDurationDays(years: number, months: number, days: number): number {
  return years * 365 + months * 30 + days;
}

export function calcFdInterest(
  principal: number,
  annualRatePct: number,
  startDateMs: number,
  totalDurationDays: number,
  now = Date.now(),
): number {
  const elapsedMs = now - startDateMs;
  if (elapsedMs <= 0) return 0;
  const elapsedDays = Math.min(elapsedMs / 86_400_000, totalDurationDays);
  return principal * (annualRatePct / 100) * (elapsedDays / 365);
}

export function calcFdCurrentValue(asset: Asset, now = Date.now()): number {
  const { value, fdInterestRate, fdStartDate, fdDurationYears, fdDurationMonths, fdDurationDays } = asset;
  if (!fdInterestRate || !fdStartDate) return value;
  const durDays = fdTotalDurationDays(fdDurationYears ?? 0, fdDurationMonths ?? 0, fdDurationDays ?? 0);
  if (durDays <= 0) return value;
  return value + calcFdInterest(value, fdInterestRate, fdStartDate, durDays, now);
}

export function fdMaturityDateMs(asset: Asset): number | null {
  if (!asset.fdStartDate) return null;
  const durDays = fdTotalDurationDays(
    asset.fdDurationYears ?? 0,
    asset.fdDurationMonths ?? 0,
    asset.fdDurationDays ?? 0,
  );
  if (durDays <= 0) return null;
  return asset.fdStartDate + durDays * 86_400_000;
}

export function isFdMatured(asset: Asset): boolean {
  const mat = fdMaturityDateMs(asset);
  return mat !== null && Date.now() >= mat;
}
