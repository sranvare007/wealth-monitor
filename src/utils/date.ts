import type { RecurringContributionFrequency } from '../types';

export type Period = { id: string; label: string; days: number };

export const PERIODS: Period[] = [
  { id: '1W',  label: '1W',  days: 7 },
  { id: '1M',  label: '1M',  days: 30 },
  { id: '3M',  label: '3M',  days: 91 },
  { id: '6M',  label: '6M',  days: 182 },
  { id: '1Y',  label: '1Y',  days: 365 },
  { id: 'ALL', label: 'All', days: 100_000 },
];

export function fmtDate(t: number, opts: { full?: boolean } = {}): string {
  const d = new Date(t);
  if (opts.full) return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function fmtDateTime(t: number): string {
  const d = new Date(t);
  return (
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) +
    ' · ' +
    d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  );
}

export function relativeDay(t: number): string {
  const diff = Math.floor((Date.now() - t) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)   return `${diff}d ago`;
  if (diff < 30)  return `${Math.floor(diff / 7)}w ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}y ago`;
}

export function advanceByFrequency(ts: number, frequency: RecurringContributionFrequency): number {
  const d = new Date(ts);
  switch (frequency) {
    case 'DAILY':     d.setDate(d.getDate() + 1); break;
    case 'WEEKLY':    d.setDate(d.getDate() + 7); break;
    case 'MONTHLY':   d.setMonth(d.getMonth() + 1); break;
    case 'QUARTERLY': d.setMonth(d.getMonth() + 3); break;
    case 'YEARLY':    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.getTime();
}
