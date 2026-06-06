import React, {
  createContext, useContext, useState, useEffect, useRef,
} from 'react';
import type { Asset, Snapshot, AccentKey, Category } from '../types';
import { seedAssets, seedSnapshots } from '../data/seed';
import { computeTotals } from '../utils/networth';
import { useDatabase } from '../db/DatabaseContext';
import { getAllAssets, upsertAsset, deleteAsset as dbDeleteAsset, clearAssets } from '../db/queries/assets';
import { getAllSnapshots, insertSnapshot, clearSnapshots } from '../db/queries/snapshots';
import { getSetting, setSetting } from '../db/queries/settings';
import {
  getAllCustomCategories,
  insertCustomCategory,
  updateCustomCategory as dbUpdateCustomCategory,
  deleteCustomCategory as dbDeleteCustomCategory,
} from '../db/queries/custom_categories';
import { generateId } from '../utils/uuid';
import { CATEGORIES } from '../data/categories';
import { applyDueContributions } from '../services/recurringContributionService';
import {
  initNotifications,
  scheduleContributionReminder,
  cancelContributionReminder,
  cancelAllContributionReminders,
  notifyContributionApplied,
} from '../services/notificationService';
import { useAppForeground } from '../hooks/useAppForeground';
import { loadExchangeRates } from '../services/currencyService';
import { setExchangeRates } from '../utils/currency';
import { loadGoldPrices } from '../services/goldPriceService';

// ─── Context shape ────────────────────────────────────────────────────────────

type AppContextValue = {
  loading: boolean;
  assets: Asset[];
  snapshots: Snapshot[];
  baseCurrency: string;
  hideBalance: boolean;
  onboardingDone: boolean;
  accentKey: AccentKey;
  darkMode: boolean;
  biometricEnabled: boolean;
  startAnimationEnabled: boolean;
  customCategories: Category[];
  saveAsset: (asset: Omit<Asset, 'id' | 'updated'> & { id?: string }) => void;
  removeAsset: (assetId: string) => void;
  setBaseCurrency: (code: string) => void;
  setHideBalance: (hide: boolean) => void;
  completeOnboarding: (currency: string) => void;
  replayOnboarding: () => void;
  setAccentKey: (key: AccentKey) => void;
  setDarkMode: (dark: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setStartAnimationEnabled: (enabled: boolean) => void;
  resetDemo: () => void;
  clearAll: () => void;
  saveCustomCategory: (data: { id?: string; label: string; icon: string; color: string; liability: boolean }) => void;
  removeCustomCategory: (catId: string) => void;
  deleteTarget: Asset | null;
  currencyPickerOpen: boolean;
  categoriesSheetOpen: boolean;
  categoriesSheetForCreate: boolean;
  setDeleteTarget: (asset: Asset | null) => void;
  confirmDelete: () => void;
  openCurrencyPicker: () => void;
  closeCurrencyPicker: () => void;
  openCategoriesSheet: () => void;
  openCategoriesSheetForCreate: () => void;
  closeCategoriesSheet: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [baseCurrency, setBaseCurrencyState] = useState('INR');
  const [hideBalance, setHideBalanceState] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [accentKey, setAccentKeyState] = useState<AccentKey>('indigo');
  const [darkMode, setDarkModeState] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [startAnimationEnabled, setStartAnimationEnabledState] = useState(true);

  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [categoriesSheetOpen, setCategoriesSheetOpen] = useState(false);
  const [categoriesSheetForCreate, setCategoriesSheetForCreate] = useState(false);

  // Refs so the foreground callback always sees current state without re-registering
  const assetsRef = useRef(assets);
  assetsRef.current = assets;
  const baseCurrencyRef = useRef(baseCurrency);
  baseCurrencyRef.current = baseCurrency;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const customCategoriesRef = useRef(customCategories);
  customCategoriesRef.current = customCategories;

  // ── Load from DB on mount ─────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const [
        dbAssets, dbSnapshots,
        baseCurrencySetting, hideBalanceSetting,
        onboardingDoneSetting, accentKeySetting, darkModeSetting,
        biometricEnabledSetting, startAnimationSetting,
        dbCustomCats,
        exchangeRates,
      ] = await Promise.all([
        getAllAssets(db),
        getAllSnapshots(db),
        getSetting(db, 'BASE_CURRENCY'),
        getSetting(db, 'HIDE_BALANCE'),
        getSetting(db, 'ONBOARDING_DONE'),
        getSetting(db, 'ACCENT_KEY'),
        getSetting(db, 'DARK_MODE'),
        getSetting(db, 'BIOMETRIC_ENABLED'),
        getSetting(db, 'START_ANIMATION'),
        getAllCustomCategories(db),
        loadExchangeRates(db),
        // Gold prices are loaded here so _liveRates is populated before the
        // loading screen clears and the user can reach the AddEdit gold form.
        loadGoldPrices(db),
      ]);

      setExchangeRates(exchangeRates);

      // Only ask permission on open for existing users who have already onboarded.
      // New users get asked at the end of the onboarding flow instead.
      if (onboardingDoneSetting === 'true') {
        await initNotifications().catch(() => {});
      }

      const base = baseCurrencySetting ?? 'INR';

      // Apply any overdue contributions before setting initial state
      const liabilityCategoryIds = buildLiabilityCategoryIds(dbCustomCats);
      const rcResult = await applyDueContributions(db, dbAssets, base, liabilityCategoryIds).catch(
        () => ({ applications: [], newSnapshots: [] }),
      );

      const finalAssets =
        rcResult.applications.length > 0
          ? dbAssets.map(a => {
              const app = rcResult.applications.find(ap => ap.asset.id === a.id);
              return app ? app.asset : a;
            })
          : dbAssets;

      setAssets(finalAssets);
      setSnapshots([...dbSnapshots, ...rcResult.newSnapshots]);
      if (baseCurrencySetting) setBaseCurrencyState(baseCurrencySetting);
      setHideBalanceState(hideBalanceSetting === 'true');
      setOnboardingDone(onboardingDoneSetting === 'true');
      if (accentKeySetting) setAccentKeyState(accentKeySetting as AccentKey);
      setDarkModeState(darkModeSetting === 'true');
      setBiometricEnabledState(biometricEnabledSetting === 'true');
      // Default true when setting not yet written (first install)
      setStartAnimationEnabledState(startAnimationSetting !== 'false');
      setCustomCategories(dbCustomCats);
      setLoading(false);

      for (const app of rcResult.applications) {
        notifyContributionApplied(app.asset, app.amountChanged, app.periods, app.isLiability).catch(() => {});
        scheduleContributionReminder(app.asset, app.isLiability).catch(() => {});
      }
    }
    load();
  }, [db]);

  // ── Apply contributions when app comes to foreground ──────────────────────

  useAppForeground(() => {
    if (loadingRef.current) return;
    const currentAssets = assetsRef.current;
    const currentBase = baseCurrencyRef.current;

    const liabilityCategoryIds = buildLiabilityCategoryIds(customCategoriesRef.current);
    applyDueContributions(db, currentAssets, currentBase, liabilityCategoryIds)
      .then(result => {
        if (result.applications.length === 0) return;
        setAssets(prev =>
          prev.map(a => {
            const app = result.applications.find(ap => ap.asset.id === a.id);
            return app ? app.asset : a;
          }),
        );
        setSnapshots(prev => [...prev, ...result.newSnapshots]);
        for (const app of result.applications) {
          notifyContributionApplied(app.asset, app.amountChanged, app.periods, app.isLiability).catch(() => {});
          scheduleContributionReminder(app.asset, app.isLiability).catch(() => {});
        }
      })
      .catch(() => {});
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  function buildLiabilityCategoryIds(customCats: Category[]): Set<string> {
    const ids = new Set(CATEGORIES.filter(c => c.liability).map(c => c.id));
    for (const c of customCats) { if (c.liability) ids.add(c.id); }
    return ids;
  }

  function isCategoryLiability(cat: string): boolean {
    return buildLiabilityCategoryIds(customCategories).has(cat);
  }

  function buildSnapshot(nextAssets: Asset[], base: string, current: Snapshot[]): Snapshot | null {
    const nw = computeTotals(nextAssets, base).netWorth;
    const last = current[current.length - 1];
    if (last && Math.abs(last.v - nw) < 0.5 && Date.now() - last.t < 60_000) return null;
    return { id: generateId(), t: Date.now(), v: Math.round(nw) };
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  function saveAsset(asset: Omit<Asset, 'id' | 'updated'> & { id?: string }) {
    let next: Asset[];
    let saved: Asset;

    if (asset.id) {
      saved = { ...asset, id: asset.id, updated: Date.now() } as Asset;
      next = assets.map(a => (a.id === asset.id ? saved : a));
    } else {
      saved = { ...asset, id: generateId(), updated: Date.now() } as Asset;
      next = [...assets, saved];
    }

    const snap = buildSnapshot(next, baseCurrency, snapshots);
    setAssets(next);
    if (snap) setSnapshots(prev => [...prev, snap]);

    db.withTransactionAsync(async () => {
      await upsertAsset(db, saved);
      if (snap) await insertSnapshot(db, snap);
    }).then(() => {
      if (saved.recurringContributionEnabled === 1 && saved.recurringContributionNextDue) {
        scheduleContributionReminder(saved, isCategoryLiability(saved.cat)).catch(() => {});
      } else {
        cancelContributionReminder(saved.id).catch(() => {});
      }
    }).catch(console.error);
  }

  function removeAsset(assetId: string) {
    const next = assets.filter(a => a.id !== assetId);
    const snap = buildSnapshot(next, baseCurrency, snapshots);

    setAssets(next);
    if (snap) setSnapshots(prev => [...prev, snap]);
    setDeleteTarget(null);

    db.withTransactionAsync(async () => {
      await dbDeleteAsset(db, assetId);
      if (snap) await insertSnapshot(db, snap);
    }).then(() => {
      cancelContributionReminder(assetId).catch(() => {});
    }).catch(console.error);
  }

  function setBaseCurrency(code: string) {
    setBaseCurrencyState(code);
    setSetting(db, 'BASE_CURRENCY', code).catch(console.error);
  }

  function setHideBalance(hide: boolean) {
    setHideBalanceState(hide);
    setSetting(db, 'HIDE_BALANCE', String(hide)).catch(console.error);
  }

  function completeOnboarding(currency: string) {
    setBaseCurrencyState(currency);
    setOnboardingDone(true);
    initNotifications().catch(() => {});
    Promise.all([
      setSetting(db, 'BASE_CURRENCY', currency),
      setSetting(db, 'ONBOARDING_DONE', 'true'),
    ]).catch(console.error);
  }

  function replayOnboarding() {
    setOnboardingDone(false);
    setSetting(db, 'ONBOARDING_DONE', 'false').catch(console.error);
  }

  function setAccentKey(key: AccentKey) {
    setAccentKeyState(key);
    setSetting(db, 'ACCENT_KEY', key).catch(console.error);
  }

  function setDarkMode(dark: boolean) {
    setDarkModeState(dark);
    setSetting(db, 'DARK_MODE', String(dark)).catch(console.error);
  }

  function setBiometricEnabled(enabled: boolean) {
    setBiometricEnabledState(enabled);
    setSetting(db, 'BIOMETRIC_ENABLED', String(enabled)).catch(console.error);
  }

  function setStartAnimationEnabled(enabled: boolean) {
    setStartAnimationEnabledState(enabled);
    setSetting(db, 'START_ANIMATION', String(enabled)).catch(console.error);
  }

  function resetDemo() {
    const a = seedAssets();
    const nw = computeTotals(a, 'INR').netWorth;
    const snaps = seedSnapshots(nw);

    setAssets(a);
    setSnapshots(snaps);
    setBaseCurrencyState('INR');
    setHideBalanceState(false);
    setDeleteTarget(null);

    cancelAllContributionReminders().catch(() => {});

    db.withTransactionAsync(async () => {
      await clearAssets(db);
      await clearSnapshots(db);
      for (const asset of a) await upsertAsset(db, asset);
      for (const snap of snaps) await insertSnapshot(db, snap);
      await setSetting(db, 'BASE_CURRENCY', 'INR');
      await setSetting(db, 'HIDE_BALANCE', 'false');
    }).catch(console.error);
  }

  function clearAll() {
    const snap: Snapshot = { id: generateId(), t: Date.now(), v: 0 };
    setAssets([]);
    setSnapshots([snap]);

    cancelAllContributionReminders().catch(() => {});

    db.withTransactionAsync(async () => {
      await clearAssets(db);
      await clearSnapshots(db);
      await insertSnapshot(db, snap);
    }).catch(console.error);
  }

  // ── Custom categories ─────────────────────────────────────────────────────

  function saveCustomCategory(data: { id?: string; label: string; icon: string; color: string; liability: boolean }) {
    const trimmedLabel = data.label.trim();
    const words = trimmedLabel.split(/\s+/);
    const short = words[0].length <= 7 ? words[0] : words[0].substring(0, 7);
    const cat: Category = {
      id: data.id ?? generateId(),
      label: trimmedLabel,
      short,
      color: data.color,
      icon: data.icon,
      liability: data.liability,
    };
    if (data.id) {
      setCustomCategories(prev => prev.map(c => (c.id === data.id ? cat : c)));
      dbUpdateCustomCategory(db, cat).catch(console.error);
    } else {
      setCustomCategories(prev => [...prev, cat]);
      insertCustomCategory(db, cat, Date.now()).catch(console.error);
    }
  }

  function removeCustomCategory(catId: string) {
    setCustomCategories(prev => prev.filter(c => c.id !== catId));
    dbDeleteCustomCategory(db, catId).catch(console.error);
  }

  // ── Sheet actions ─────────────────────────────────────────────────────────

  function confirmDelete() { if (deleteTarget) removeAsset(deleteTarget.id); }
  function openCurrencyPicker() { setCurrencyPickerOpen(true); }
  function closeCurrencyPicker() { setCurrencyPickerOpen(false); }
  function openCategoriesSheet() { setCategoriesSheetForCreate(false); setCategoriesSheetOpen(true); }
  function openCategoriesSheetForCreate() { setCategoriesSheetForCreate(true); setCategoriesSheetOpen(true); }
  function closeCategoriesSheet() { setCategoriesSheetOpen(false); setCategoriesSheetForCreate(false); }

  return (
    <AppContext.Provider value={{
      loading,
      assets, snapshots, baseCurrency, hideBalance, onboardingDone, accentKey, darkMode,
      biometricEnabled, startAnimationEnabled,
      customCategories,
      saveAsset, removeAsset, setBaseCurrency, setHideBalance,
      completeOnboarding, replayOnboarding, setAccentKey, setDarkMode,
      setBiometricEnabled, setStartAnimationEnabled,
      resetDemo, clearAll,
      saveCustomCategory, removeCustomCategory,
      deleteTarget, currencyPickerOpen,
      categoriesSheetOpen, categoriesSheetForCreate,
      setDeleteTarget, confirmDelete,
      openCurrencyPicker, closeCurrencyPicker,
      openCategoriesSheet, openCategoriesSheetForCreate, closeCategoriesSheet,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within <AppProvider>');
  return ctx;
}
