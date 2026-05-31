/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.tsx',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Semantic tokens for wealth-monitor
        'wm-positive': '#16a34a',   // green-600 — gains, positive net worth change
        'wm-negative': '#dc2626',   // red-600 — losses, liabilities
        'wm-neutral': '#6b7280',    // gray-500 — no change
        'wm-liability': '#fca5a5',  // red-300 — liability segment (muted)
      },
    },
  },
  plugins: [],
};
