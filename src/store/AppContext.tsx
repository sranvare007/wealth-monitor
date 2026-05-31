import React, {
  createContext, useContext, useState, useMemo,
} from 'react';
import type { Asset, Snapshot, AccentKey } from '../types';
import { seedAssets, seedSnapshots } from '../data/seed';
import { computeTotals } from '../utils/networth';

// ─── Context shape ────────────────────────────────────────────────────────────

type AppContextValue = {
  // ── Data ──────────────────────────────────────────────────────────────────
  assets: Asset[];
  snapshots: Snapshot[];
  baseCurrency: string;
  hideBalance: boolean;
  onboardingDone: boolean;
  accentKey: AccentKey;

  // ── Data mutations ────────────────────────────────────────────────────────
  saveAsset: (asset: Omit<Asset, 'id' | 'updated'> & { id?: string }) => void;
  removeAsset: (assetId: string) => void;
  setBaseCurrency: (code: string) => void;
  setHideBalance: (hide: boolean) => void;
  completeOnboarding: (currency: string) => void;
  setAccentKey: (key: AccentKey) => void;
  resetDemo: () => void;
  clearAll: () => void;

  // ── Sheet / overlay UI state ──────────────────────────────────────────────
  addEditOpen: boolean;
  editingAsset: Asset | null;
  deleteTarget: Asset | null;
  openAddSheet: () => void;
  openEditSheet: (asset: Asset) => void;
  closeSheet: () => void;
  setDeleteTarget: (asset: Asset | null) => void;
  confirmDelete: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialAssets = useMemo(() => seedAssets(), []);

  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => {
    const nw = computeTotals(initialAssets, 'INR').netWorth;
    return seedSnapshots(nw);
  });
  const [baseCurrency, setBaseCurrencyState] = useState('INR');
  const [hideBalance, setHideBalance] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [accentKey, setAccentKey] = useState<AccentKey>('indigo');

  // Sheet state
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function recordSnapshot(nextAssets: Asset[], base: string) {
    const nw = computeTotals(nextAssets, base).netWorth;
    setSnapshots(prev => {
      const last = prev[prev.length - 1];
      // Deduplicate: skip if net worth unchanged within last minute
      if (last && Math.abs(last.v - nw) < 0.5 && Date.now() - last.t < 60_000) return prev;
      return [...prev, { id: `s_${Date.now()}`, t: Date.now(), v: Math.round(nw) }];
    });
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  function saveAsset(asset: Omit<Asset, 'id' | 'updated'> & { id?: string }) {
    let next: Asset[];
    if (asset.id) {
      next = assets.map(a =>
        a.id === asset.id ? { ...a, ...asset, updated: Date.now() } as Asset : a,
      );
    } else {
      const newAsset: Asset = { ...asset, id: `a_${Date.now()}`, updated: Date.now() } as Asset;
      next = [...assets, newAsset];
    }
    setAssets(next);
    recordSnapshot(next, baseCurrency);
    setAddEditOpen(false);
    setEditingAsset(null);
  }

  function removeAsset(assetId: string) {
    const next = assets.filter(a => a.id !== assetId);
    setAssets(next);
    recordSnapshot(next, baseCurrency);
    setDeleteTarget(null);
    setAddEditOpen(false);
    setEditingAsset(null);
  }

  function setBaseCurrency(code: string) {
    setBaseCurrencyState(code);
  }

  function completeOnboarding(currency: string) {
    setBaseCurrencyState(currency);
    setOnboardingDone(true);
  }

  function resetDemo() {
    const a = seedAssets();
    setAssets(a);
    setSnapshots(seedSnapshots(computeTotals(a, baseCurrency).netWorth));
  }

  function clearAll() {
    setAssets([]);
    setSnapshots([{ id: 's_clear', t: Date.now(), v: 0 }]);
  }

  // ── Sheet actions ─────────────────────────────────────────────────────────

  function openAddSheet() { setEditingAsset(null); setAddEditOpen(true); }
  function openEditSheet(asset: Asset) { setEditingAsset(asset); setAddEditOpen(true); }
  function closeSheet() { setAddEditOpen(false); setEditingAsset(null); }

  function confirmDelete() {
    if (deleteTarget) removeAsset(deleteTarget.id);
  }

  return (
    <AppContext.Provider value={{
      assets, snapshots, baseCurrency, hideBalance, onboardingDone, accentKey,
      saveAsset, removeAsset, setBaseCurrency, setHideBalance, completeOnboarding,
      setAccentKey, resetDemo, clearAll,
      addEditOpen, editingAsset, deleteTarget,
      openAddSheet, openEditSheet, closeSheet, setDeleteTarget, confirmDelete,
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
