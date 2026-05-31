/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.tsx',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Plus Jakarta Sans — all UI text (headings, labels, body)
        'jakarta':           ['PlusJakartaSans_400Regular', 'system-ui', 'sans-serif'],
        'jakarta-light':     ['PlusJakartaSans_300Light',    'system-ui', 'sans-serif'],
        'jakarta-medium':    ['PlusJakartaSans_500Medium',   'system-ui', 'sans-serif'],
        'jakarta-semibold':  ['PlusJakartaSans_600SemiBold', 'system-ui', 'sans-serif'],
        'jakarta-bold':      ['PlusJakartaSans_700Bold',     'system-ui', 'sans-serif'],
        'jakarta-extrabold': ['PlusJakartaSans_800ExtraBold','system-ui', 'sans-serif'],
        // Space Grotesk — numeric values (net worth, asset figures, percentages)
        'grotesk':           ['SpaceGrotesk_400Regular',    'system-ui', 'sans-serif'],
        'grotesk-light':     ['SpaceGrotesk_300Light',      'system-ui', 'sans-serif'],
        'grotesk-medium':    ['SpaceGrotesk_500Medium',     'system-ui', 'sans-serif'],
        'grotesk-semibold':  ['SpaceGrotesk_600SemiBold',   'system-ui', 'sans-serif'],
        'grotesk-bold':      ['SpaceGrotesk_700Bold',       'system-ui', 'sans-serif'],
      },
      colors: {
        // Semantic: net-worth change indicators (always pair with icon/label)
        'wm-positive': '#10B981',
        'wm-negative': '#EF4444',
        'wm-neutral':  '#6B7280',
        'wm-liability':'#F43F5E',

        // Dark-mode positive/negative (brighter on dark backgrounds)
        'wm-pos-dark': '#34D399',
        'wm-neg-dark': '#FB7185',

        // Asset category colours — used for icons, chart segments, badges
        'cat-cash':       '#10B981',
        'cat-stocks':     '#6366F1',
        'cat-realestate': '#F97316',
        'cat-crypto':     '#A855F7',
        'cat-gold':       '#EAB308',
        'cat-custom':     '#0EA5E9',
        'cat-loans':      '#F43F5E',

        // Accent palette (user-selectable; solid colours only — gradients via expo-linear-gradient)
        'accent-indigo':  '#6366F1',
        'accent-violet':  '#8B5CF6',
        'accent-emerald': '#10B981',
        'accent-ocean':   '#0EA5E9',
        'accent-sunset':  '#F97316',

        // App surface tokens (light)
        'wm-bg':    '#F4F5F7',
        'wm-card':  '#FFFFFF',
        'wm-chip':  '#F1F4F8',
        'wm-line':  '#E8EBEF',
        'wm-sub':   '#64748B',
        'wm-faint': '#94A3B8',

        // App surface tokens (dark) — referenced with dark: prefix
        'wm-bg-dark':    '#0B0E14',
        'wm-card-dark':  '#151A23',
        'wm-chip-dark':  'rgba(255,255,255,0.06)',
        'wm-line-dark':  'rgba(255,255,255,0.08)',
        'wm-sub-dark':   '#94A3B8',
        'wm-faint-dark': '#5B6678',
      },
    },
  },
  plugins: [],
};
