import React, {
  createContext, useContext, useState, useEffect,
} from 'react';
import type { Asset, Snapshot, AccentKey } from '../types';
import { seedAssets, seedSnapshots } from '../data/seed';
import { computeTotals } from '../utils/networth';
import { useDatabase } from '../db/DatabaseContext';
import { getAllAssets, upsertAsset, deleteAsset as dbDeleteAsset, clearAssets } from '../db/queries/assets';
import { getAllSnapshots, insertSnapshot, clearSnapshots } from '../db/queries/snapshots';
import { getSetting, setSetting } from '../db/queries/settings';
import { generateId } from '../utils/uuid';

// ─── Context shape ────────────────────────────────────────────────────────────

type AppContextValue = {
  // Async load state — true while reading initial data from DB
  loading: boolean;

  // ── Data ──────────────────────────────────────────────────────────────────
  assets: Asset[];
  snapshots: Snapshot[];
  baseCurrency: string;
  hideBalance: boolean;
  onboardingDone: boolean;
  accentKey: AccentKey;
  darkMode: boolean;

  // ── Data mutations ────────────────────────────────────────────────────────
  saveAsset: (asset: Omit<Asset, 'id' | 'updated'> & { id?: string }) => void;
  removeAsset: (assetId: string) => void;
  setBaseCurrency: (code: string) => void;
  setHideBalance: (hide: boolean) => void;
  completeOnboarding: (currency: string) => void;
  replayOnboarding: () => void;
  setAccentKey: (key: AccentKey) => void;
  setDarkMode: (dark: boolean) => void;
  resetDemo: () => void;
  clearAll: () => void;

  // ── Sheet / overlay UI state ──────────────────────────────────────────────
  addEditOpen: boolean;
  editingAsset: Asset | null;
  deleteTarget: Asset | null;
  currencyPickerOpen: boolean;
  openAddSheet: () => void;
  openEditSheet: (asset: Asset) => void;
  closeSheet: () => void;
  setDeleteTarget: (asset: Asset | null) => void;
  confirmDelete: () => void;
  openCurrencyPicker: () => void;
  closeCurrencyPicker: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const db = useDatabase(); // non-null: DatabaseProvider blocks until ready

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [baseCurrency, setBaseCurrencyState] = useState('INR');
  const [hideBalance, setHideBalanceState] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [accentKey, setAccentKeyState] = useState<AccentKey>('indigo');
  const [darkMode, setDarkModeState] = useState(false);

  // Sheet state
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);

  // ── Load from DB on mount ─────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const [
        dbAssets, dbSnapshots,
        baseCurrencySetting, hideBalanceSetting,
        onboardingDoneSetting, accentKeySetting, darkModeSetting,
      ] = await Promise.all([
        getAllAssets(db),
        getAllSnapshots(db),
        getSetting(db, 'BASE_CURRENCY'),
        getSetting(db, 'HIDE_BALANCE'),
        getSetting(db, 'ONBOARDING_DONE'),
        getSetting(db, 'ACCENT_KEY'),
        getSetting(db, 'DARK_MODE'),
      ]);

      setAssets(dbAssets);
      setSnapshots(dbSnapshots);
      if (baseCurrencySetting) setBaseCurrencyState(baseCurrencySetting);
      setHideBalanceState(hideBalanceSetting === 'true');
      setOnboardingDone(onboardingDoneSetting === 'true');
      if (accentKeySetting) setAccentKeyState(accentKeySetting as AccentKey);
      setDarkModeState(darkModeSetting === 'true');
      setLoading(false);
    }
    load();
  }, [db]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function buildSnapshot(nextAssets: Asset[], base: string, current: Snapshot[]): Snapshot | null {
    const nw = computeTotals(nextAssets, base).netWorth;
    const last = current[current.length - 1];
    // Deduplicate: skip if net worth barely changed within the last minute
    if (last && Math.abs(last.v - nw) < 0.5 && Date.now() - last.t < 60_000) return null;
    return {
      id: generateId(),
      t: Date.now(),
      v: Math.round(nw),
    };
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
    setAddEditOpen(false);
    setEditingAsset(null);

    db.withTransactionAsync(async () => {
      await upsertAsset(db, saved);
      if (snap) await insertSnapshot(db, snap);
    }).catch(console.error);
  }

  function removeAsset(assetId: string) {
    const next = assets.filter(a => a.id !== assetId);
    const snap = buildSnapshot(next, baseCurrency, snapshots);

    setAssets(next);
    if (snap) setSnapshots(prev => [...prev, snap]);
    setDeleteTarget(null);
    setAddEditOpen(false);
    setEditingAsset(null);

    db.withTransactionAsync(async () => {
      await dbDeleteAsset(db, assetId);
      if (snap) await insertSnapshot(db, snap);
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

  function resetDemo() {
    const a = seedAssets();
    const nw = computeTotals(a, 'INR').netWorth;
    const snaps = seedSnapshots(nw);

    setAssets(a);
    setSnapshots(snaps);
    setBaseCurrencyState('INR');
    setHideBalanceState(false);
    setAddEditOpen(false);
    setEditingAsset(null);
    setDeleteTarget(null);

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

    db.withTransactionAsync(async () => {
      await clearAssets(db);
      await clearSnapshots(db);
      await insertSnapshot(db, snap);
    }).catch(console.error);
  }

  // ── Sheet actions ─────────────────────────────────────────────────────────

  function openAddSheet() { setEditingAsset(null); setAddEditOpen(true); }
  function openEditSheet(asset: Asset) { setEditingAsset(asset); setAddEditOpen(true); }
  function closeSheet() { setAddEditOpen(false); setEditingAsset(null); }
  function confirmDelete() { if (deleteTarget) removeAsset(deleteTarget.id); }
  function openCurrencyPicker() { setCurrencyPickerOpen(true); }
  function closeCurrencyPicker() { setCurrencyPickerOpen(false); }

  return (
    <AppContext.Provider value={{
      loading,
      assets, snapshots, baseCurrency, hideBalance, onboardingDone, accentKey, darkMode,
      saveAsset, removeAsset, setBaseCurrency, setHideBalance,
      completeOnboarding, replayOnboarding, setAccentKey, setDarkMode, resetDemo, clearAll,
      addEditOpen, editingAsset, deleteTarget, currencyPickerOpen,
      openAddSheet, openEditSheet, closeSheet, setDeleteTarget, confirmDelete,
      openCurrencyPicker, closeCurrencyPicker,
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
