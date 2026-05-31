@AGENTS.md

# Wealth Monitor — Development Guidelines

React Native · Expo 55 · TypeScript 5.9 · React Navigation 7

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| Runtime | Expo (managed → bare workflow) | 55.x |
| Framework | React Native | 0.83.x |
| Language | TypeScript | 5.9.x (strict mode) |
| Navigation | React Navigation (static API) | 7.x |
| Local DB | expo-sqlite | latest for Expo 55 |
| Charts | react-native-gifted-charts | TBD — validate with UX |
| Styling | NativeWind v4 + Tailwind CSS v3 | 4.2.x / 3.4.x |
| State | React Context + useReducer (no external lib unless justified) | — |

Always check https://docs.expo.dev/versions/v55.0.0/ before using any Expo API.

---

## Styling — NativeWind v4

NativeWind v4 is the primary styling system. **Prefer `className` over `StyleSheet.create` everywhere possible.**

### Setup files (do not remove or rename)

| File | Purpose |
|---|---|
| `tailwind.config.js` | Content paths + `nativewind/preset` + custom tokens |
| `global.css` | Tailwind directives — imported once in `index.tsx` |
| `babel.config.js` | `babel-preset-expo` with `jsxImportSource: 'nativewind'` + `nativewind/babel` preset |
| `metro.config.js` | `withNativeWind(config, { input: './global.css' })` wrapper |
| `nativewind-env.d.ts` | `/// <reference types="nativewind/types" />` — enables `className` prop in TS |

### Rules

1. **`className` first** — use Tailwind utilities for all layout, spacing, colour, typography, and border work.
2. **Custom design tokens live in `tailwind.config.js`** under `theme.extend`. Never hardcode hex values inline.
3. **Semantic colour tokens** (defined in `tailwind.config.js`):
   - `wm-positive` — green, gains / positive change
   - `wm-negative` — red, losses / liabilities
   - `wm-neutral` — grey, no change
   - `wm-liability` — muted red, liability donut segment
4. **`StyleSheet.create` is a last resort** — only for values that Tailwind cannot express (e.g. arbitrary chart dimensions, `react-native-reanimated` animated style objects).
5. **No inline `style` prop** for values that Tailwind can cover. Never `style={{ color: '#dc2626' }}` when `className="text-wm-negative"` works.
6. **Dark mode** — use the `dark:` variant (`dark:bg-gray-900`). Dark mode is driven by `useColorScheme()` already wired in `App.tsx`.
7. **Conditional classes** — use template literals or a helper like `clsx`/`cn`; never build class strings with string concatenation:

   ```tsx
   // correct
   import clsx from 'clsx';
   <Text className={clsx('text-base font-semibold', isPositive ? 'text-wm-positive' : 'text-wm-negative')} />

   // wrong — Tailwind's JIT cannot detect dynamically concatenated strings
   <Text className={`text-${isPositive ? 'green' : 'red'}-600`} />
   ```

8. **Arbitrary values** — use `[]` syntax sparingly and only for one-off values that genuinely don't belong in the theme: `w-[44px]` for a touch-target minimum.
9. **Accessibility pairing** — colour utility classes must always be accompanied by an icon or label (WCAG: colour alone is insufficient). `className="text-wm-negative"` must coexist with a down-arrow icon or "Loss" label.
10. **NativeWind does not support all Tailwind plugins** — avoid `@tailwindcss/forms`, `@tailwindcss/typography`, and CSS-only plugins. Stick to core utilities.

### Approved patterns

```tsx
// Screen root
<SafeAreaView className="flex-1 bg-white dark:bg-gray-950">

// Card
<View className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">

// Net-worth headline
<Text className="text-3xl font-bold text-gray-900 dark:text-white">

// Positive / negative delta — always pair colour with icon
<Text className="text-sm font-medium text-wm-positive">↑ ₹12,500 (3.2%)</Text>
<Text className="text-sm font-medium text-wm-negative">↓ ₹4,000 (1.1%)</Text>

// Disabled button
<TouchableOpacity
  disabled={!isValid}
  className={clsx('rounded-xl px-6 py-3', isValid ? 'bg-indigo-600' : 'bg-gray-300')}
>

// Minimum 44 pt touch target
<TouchableOpacity className="min-h-[44px] min-w-[44px] items-center justify-center">
```

### When `StyleSheet.create` is still acceptable

- Animated style objects driven by `useAnimatedStyle` (react-native-reanimated requires plain objects).
- Chart library props that accept a numeric dimension, not a style string.
- One-off pixel values that would be an arbitrary value used only once and are not semantic.

---

## Project Structure

```
src/
  assets/            # Static images, fonts
  components/        # Shared, reusable UI components
    charts/
    common/
  db/                # SQLite setup, migrations, table queries
    migrations/
    queries/
  hooks/             # Custom React hooks
  navigation/        # Navigator definitions and screen registration
    screens/         # One file per screen
  services/          # Side-effect logic: currency API, snapshot service
  store/             # Context providers and reducers
  types/             # Shared TypeScript types and enums
  utils/             # Pure functions: formatting, currency math
```

- One screen per file inside `navigation/screens/`.
- Components, hooks, and utils are co-located by feature when they are not reused elsewhere.
- No barrel `index.ts` re-exports inside `db/` or `services/` — import the file directly to keep the dependency graph readable.

---

## TypeScript

- `strict: true` is already set in `tsconfig.json`. Never relax it.
- All props and return types must be explicitly typed — no implicit `any`.
- Use `type` for object shapes and union types; use `interface` only when extending is the intent.
- Enums for fixed domain values (asset categories, snapshot triggers, setting keys):

```ts
// src/types/asset.ts
export type AssetCategory =
  | 'CASH'
  | 'STOCKS'
  | 'REAL_ESTATE'
  | 'CRYPTO'
  | 'GOLD'
  | 'LIABILITY'
  | 'CUSTOM';

export type SnapshotTrigger = 'ASSET_ADDED' | 'ASSET_UPDATED' | 'ASSET_DELETED';
```

- Prefer narrowing over casting. Never use `as any` or `// @ts-ignore`.
- All database row types must match the schema in section 6 of the PRD exactly.

---

## Data Model

Implement these four tables in SQLite exactly as specified in the PRD (section 6):

| Table | Primary Key Type | Notes |
|---|---|---|
| `assets` | UUID (TEXT) | `value` always positive; category is a string enum |
| `net_worth_snapshots` | UUID (TEXT) | Immutable once written; `net_worth` stored in base currency at snapshot time |
| `settings` | TEXT (key) | `BASE_CURRENCY`, `LAST_RATE_FETCH` |
| `exchange_rates_cache` | `base_currency` | `rates_json` is a JSON string |

Rules:
- Generate UUIDs with `crypto.randomUUID()` (available in Hermes / RN 0.73+).
- All timestamps are Unix seconds (`Math.floor(Date.now() / 1000)`).
- `LIABILITY` assets are stored as positive numbers; the sign is applied only at calculation time.
- Historical snapshots are **immutable** — never update `net_worth_snapshots` rows. Exchange rates must not be retroactively applied to past snapshots.
- Run all schema changes through versioned migrations (`db/migrations/`). Bump the `user_version` pragma on each migration.

---

## Database Layer (`src/db/`)

- Open a single SQLite connection at app startup and share it via a React context.
- Wrap multi-step operations (add asset + write snapshot) in a transaction.
- Queries go in `db/queries/<table>.ts`; no raw SQL strings outside of that folder.
- Target: DB writes < 100 ms on a mid-range Android device (PRD §7.1).

```ts
// Example pattern — not a complete implementation
export async function addAsset(db: SQLiteDatabase, asset: NewAsset): Promise<void> {
  await db.withTransactionAsync(async () => {
    await insertAsset(db, asset);
    await insertSnapshot(db, buildSnapshot(asset, 'ASSET_ADDED'));
  });
}
```

---

## Navigation

The project uses React Navigation 7's **static API** (`createStaticNavigation` + typed `RootNavigator`). Keep this pattern.

- Bottom tab navigator with four tabs: **Dashboard**, **Assets**, **History**, **Settings**.
- Add Asset opens as a modal stack screen, accessible from Dashboard and Assets tabs.
- Screen names must match the route names declared in the `RootNavigator` augmentation so `useNavigation` is fully typed without casting.
- Deep links: define `linking.path` for each screen in the static config — the PRD requires the schema to support future cloud sync without structural changes.

```ts
// Extend the navigator type declaration in src/navigation/index.tsx
declare module '@react-navigation/core' {
  interface RootNavigator extends typeof RootStack {}
}
```

---

## State Management

- Use React Context + `useReducer` for app-wide state (assets list, base currency, exchange rates).
- Keep each context focused: `AssetContext`, `CurrencyContext`, `SnapshotContext`.
- Derive computed values (total net worth, category totals) inside selector-style hooks (`useNetWorth`, `useCategoryBreakdown`) rather than storing them in state.
- No Redux or Zustand unless Context + useReducer demonstrably becomes a bottleneck.

---

## Multi-Currency

- The base currency is stored in the `settings` table and loaded at startup.
- Fetch exchange rates from a free public API (e.g. ExchangeRate-API) at app launch when online; cache the result in `exchange_rates_cache`.
- If offline, use the last cached rates and display the banner: `"Using rates from [date]. Connect to internet to refresh."` (PRD §5).
- All net worth calculations must go through a single utility: `convertToBase(value, fromCurrency, rates, baseCurrency): number`.
- Never apply updated rates retroactively to stored snapshots.

---

## Business Logic Rules

- **Net worth** = sum of all non-LIABILITY assets (converted to base currency) − sum of LIABILITY assets (converted to base currency).
- Snapshots are written on every CRUD operation (add, update, delete) — not on a timer.
- The Dashboard must show: total net worth, separate assets total and liabilities total, and the change (absolute + %) since the previous snapshot.
- Change indicator: green + up-arrow (positive), red + down-arrow (negative), grey dash (no change). Colour alone must never be the sole indicator — always pair with icon/label (PRD §8.1).

---

## UI & Component Patterns

- **Use NativeWind `className` prop as the primary styling method.** Reach for `StyleSheet.create` only when a style cannot be expressed with Tailwind utilities (e.g. complex transforms, chart-specific layout values).
- Never mix `className` and `style` on the same element for the same property — pick one owner per property.
- Use `react-native-safe-area-context` `SafeAreaView` as the root of every screen.
- All monetary values on screen are formatted through a single utility: `formatCurrency(value, currency, locale): string`. Support abbreviated Indian notation (₹12.5L, ₹1.2Cr) as well as international (PRD §8.3, Q7).
- Charts provide text alternatives — all chart data must also be visible in a table (PRD §7.4).
- Dashboard must render in < 1 second; avoid synchronous DB reads on the main thread.

### Donut / Pie Chart
- Use a donut chart (preferred) from the chosen chart library.
- Show liabilities as a separate muted-red segment (PRD §4.1.2).
- Interactive: tapping a segment shows category name, value, and percentage.

### Line Chart (History)
- Time-period chips: `1W | 1M | 3M | 6M | 1Y | All`.
- Data points are individual snapshots (one per CRUD action). Do not aggregate unless UX team decides otherwise.
- Tapping a point shows a tooltip: date, net worth, change vs previous snapshot.

---

## Performance

| Requirement | Target | How to enforce |
|---|---|---|
| Dashboard render | < 1 s | Memoize derived values; avoid blocking reads |
| DB writes | < 100 ms | Use transactions; no N+1 inserts |
| Chart render (≤ 1,000 pts) | < 500 ms | Lazy-render history chart on tab focus |

- Wrap expensive computations in `useMemo`. Wrap callbacks passed as props in `useCallback`.
- Use `React.memo` on list row components.
- Prefer `FlatList` over `ScrollView` for any list that can exceed ~20 items.

---

## Offline-First

- All core features (add/edit/delete assets, Dashboard, History) must work with no network (PRD §7.2).
- Currency fetch is the only network-dependent feature and degrades gracefully.
- Use `@react-native-community/netinfo` to detect connectivity. Show a banner when offline and stale rates are in use.

---

## Accessibility (WCAG 2.1 AA)

- Every interactive element needs an `accessibilityLabel` and `accessibilityRole`.
- Do not rely on colour alone to convey meaning — pair with icon or text (PRD §8.1).
- Support Dynamic Type (iOS) and font scaling (Android): use relative units (`sp`) and avoid fixed-height containers for text.
- Test VoiceOver (iOS) and TalkBack (Android) for the core flows: Dashboard, Add Asset, History.
- Minimum touch target: 44 × 44 pt.

---

## Data Privacy & Security

- No data leaves the device in v1.0 (PRD §7.3).
- Do not include any analytics SDK that collects financial data.
- Do not log asset names or monetary values to the console in production builds.
- Use `expo-secure-store` if any sensitive preference needs to be stored beyond the SQLite DB.

---

## Error Handling

- Validate at the boundary: user inputs on the Add/Edit screen (name not empty, value is a positive number, max lengths respected).
- DB errors and network errors should be caught and surfaced as user-visible messages — never silently swallowed.
- The Save button must remain disabled until all required fields pass validation (PRD §4.3).
- Delete requires a confirmation dialog with the exact copy: `"Delete [Asset Name]? This cannot be undone."` (PRD §3.4).

---

## Code Style

- Functional components only — no class components.
- One component per file; filename matches the exported component name.
- Extract a custom hook when a component contains more than one `useEffect` or the effect has non-trivial logic.
- Do not add comments that describe *what* the code does — only add a comment when the *why* is non-obvious (a workaround, a hidden constraint, a subtle invariant).
- No `console.log` left in committed code.

---

## Testing

- Unit tests for all pure utility functions in `src/utils/` (currency math, formatting, net worth calculation).
- Integration tests for DB query functions using an in-memory SQLite instance.
- Do not mock the database in integration tests — use a real SQLite connection with an in-memory database or a test file.
- UI smoke tests for the critical paths: add asset → Dashboard updates, delete asset → confirmation → Dashboard updates.

---

## Running the App

```bash
# Start Metro bundler
npm start

# Run on Android (requires connected device or emulator)
npm run android

# Run on iOS (requires macOS + Xcode)
npm run ios
```

Read Expo 55 docs for SDK-specific APIs: https://docs.expo.dev/versions/v55.0.0/
