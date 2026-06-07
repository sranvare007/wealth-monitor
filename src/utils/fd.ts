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

// ── RD (Recurring Deposit) calculations ──────────────────────────────────────

function rdPeriodDays(frequency: string | null | undefined): number {
  switch (frequency) {
    case 'DAILY':     return 1;
    case 'WEEKLY':    return 7;
    case 'QUARTERLY': return 91.3125;
    case 'YEARLY':    return 365;
    default:          return 30.4375; // MONTHLY
  }
}

// Total cash deposited so far: initial amount + contributions made each period.
export function calcRdTotalInvested(asset: Asset, now = Date.now()): number {
  const { value: initial, fdStartDate, recurringContributionAmount, recurringContributionFrequency } = asset;
  if (!fdStartDate) return initial;
  const elapsedDays = (now - fdStartDate) / 86_400_000;
  if (elapsedDays <= 0) return initial;
  const periodDays = rdPeriodDays(recurringContributionFrequency);
  const periodsElapsed = Math.floor(elapsedDays / periodDays);
  return initial + periodsElapsed * (recurringContributionAmount ?? 0);
}

// Simple interest earned: initial deposit's interest + each instalment's interest
// (each instalment earns from its deposit date to now).
export function calcRdInterest(asset: Asset, now = Date.now()): number {
  const { value: initial, fdStartDate, fdInterestRate, recurringContributionAmount, recurringContributionFrequency } = asset;
  if (!fdStartDate || !fdInterestRate) return 0;
  const elapsedDays = (now - fdStartDate) / 86_400_000;
  if (elapsedDays <= 0) return 0;

  const rate = fdInterestRate;
  const instalment = recurringContributionAmount ?? 0;
  const periodDays = rdPeriodDays(recurringContributionFrequency);
  const periodsElapsed = Math.floor(elapsedDays / periodDays);

  const initialInterest = initial * (rate / 100) * (elapsedDays / 365);

  // instalment k (1-indexed) deposited at day (k-1)×periodDays after start
  let rcInterest = 0;
  for (let k = 1; k <= periodsElapsed; k++) {
    rcInterest += instalment * (rate / 100) * ((elapsedDays - (k - 1) * periodDays) / 365);
  }

  return initialInterest + rcInterest;
}

export function calcRdCurrentValue(asset: Asset, now = Date.now()): number {
  return calcRdTotalInvested(asset, now) + calcRdInterest(asset, now);
}
