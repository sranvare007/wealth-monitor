import type { AccentKey } from '../types';

export type AccentDef = {
  solid: string;
  from: string;
  to: string;
};

export const ACCENTS: Record<AccentKey, AccentDef> = {
  indigo:  { solid: '#6366F1', from: '#4F46E5', to: '#7C3AED' },
  violet:  { solid: '#8B5CF6', from: '#7C3AED', to: '#DB2777' },
  emerald: { solid: '#10B981', from: '#059669', to: '#14B8A6' },
  ocean:   { solid: '#0EA5E9', from: '#0284C7', to: '#06B6D4' },
  sunset:  { solid: '#F97316', from: '#EA580C', to: '#F43F5E' },
};

export type ThemeColors = {
  dark: boolean;
  bg: string;
  cardBg: string;
  text: string;
  sub: string;
  faint: string;
  line: string;
  faintLine: string;
  chipBg: string;
  pos: string;
  neg: string;
};

export function makeTheme(dark: boolean): ThemeColors {
  if (dark) {
    return {
      dark: true,
      bg: '#0B0E14',
      cardBg: '#151A23',
      text: '#F1F5F9',
      sub: '#94A3B8',
      faint: '#5B6678',
      line: 'rgba(255,255,255,0.08)',
      faintLine: 'rgba(255,255,255,0.07)',
      chipBg: 'rgba(255,255,255,0.06)',
      pos: '#34D399',
      neg: '#FB7185',
    };
  }
  return {
    dark: false,
    bg: '#F4F5F7',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    sub: '#64748B',
    faint: '#94A3B8',
    line: '#E8EBEF',
    faintLine: '#EFF1F4',
    chipBg: '#F1F4F8',
    pos: '#10B981',
    neg: '#EF4444',
  };
}
