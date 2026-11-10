import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { useAuth } from './AuthContext';
import { useAppState } from './AppContext';
import { buildPayload, pushData, pullData, type LocalSnapshotInput } from '../services/syncApi';

const PUSH_DEBOUNCE_MS = 1500;

export type SyncState = 'idle' | 'syncing' | 'error';

type SyncContextValue = {
  syncState: SyncState;
  lastSyncedAt: number | null;
  syncNow: () => void;
  restoreNow: () => void;
};

const SyncContext = createContext<SyncContextValue | null>(null);

// Settings mirrored to the cloud. Device-specific prefs (e.g. App Lock) are left out.
function collectSettings(s: {
  baseCurrency: string;
  hideBalance: boolean;
  accentKey: string;
  themeMode: string;
  startAnimationEnabled: boolean;
}): Record<string, string> {
  return {
    BASE_CURRENCY: s.baseCurrency,
    HIDE_BALANCE: String(s.hideBalance),
    ACCENT_KEY: s.accentKey,
    DARK_MODE: s.themeMode,
    START_ANIMATION: String(s.startAnimationEnabled),
  };
}

function signature(input: LocalSnapshotInput): string {
  return JSON.stringify(buildPayload(input));
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { token, event } = useAuth();
  const {
    assets, snapshots, customCategories,
    baseCurrency, hideBalance, accentKey, themeMode, startAnimationEnabled,
    hydrateFromCloud,
  } = useAppState();

  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  // Latest values mirrored into refs so the stable doPush/doPull/buildInput
  // callbacks always read fresh data without being recreated every render.
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const hydrateRef = useRef(hydrateFromCloud);
  hydrateRef.current = hydrateFromCloud;
  const stateRef = useRef({
    assets, snapshots, customCategories,
    baseCurrency, hideBalance, accentKey, themeMode, startAnimationEnabled,
  });
  stateRef.current = {
    assets, snapshots, customCategories,
    baseCurrency, hideBalance, accentKey, themeMode, startAnimationEnabled,
  };

  const handledSeqRef = useRef(0);
  const pushEnabledRef = useRef(false);    // only push after the initial sync settles
  const lastSyncedSigRef = useRef('');     // signature already known to the server
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildInput = useCallback((): LocalSnapshotInput => {
    const s = stateRef.current;
    return {
      assets: s.assets,
      snapshots: s.snapshots,
      categories: s.customCategories,
      settings: collectSettings(s),
    };
  }, []);

  const doPush = useCallback(async (input: LocalSnapshotInput) => {
    const t = tokenRef.current;
    if (!t) return;
    setSyncState('syncing');
    try {
      await pushData(t, input);
      lastSyncedSigRef.current = signature(input);
      setLastSyncedAt(Date.now());
      setSyncState('idle');
    } catch {
      setSyncState('error');
    } finally {
      pushEnabledRef.current = true;
    }
  }, []);

  const doPull = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return;
    setSyncState('syncing');
    try {
      const dataset = await pullData(t);
      await hydrateRef.current(dataset);
      setLastSyncedAt(Date.now());
      setSyncState('idle');
    } catch {
      setSyncState('error');
    } finally {
      // Enable push so any subsequent local edits are uploaded. The hydration
      // itself may trigger one idempotent echo push, after which signatures match.
      pushEnabledRef.current = true;
    }
  }, []);

  // React to auth transitions: signup uploads local data; login/restore download.
  useEffect(() => {
    if (!event || event.seq === handledSeqRef.current) return;
    handledSeqRef.current = event.seq;

    if (event.kind === 'logout') {
      pushEnabledRef.current = false;
      lastSyncedSigRef.current = '';
      setLastSyncedAt(null);
      setSyncState('idle');
      return;
    }
    if (event.kind === 'signup') {
      doPush(buildInput());
    } else {
      doPull();
    }
  }, [event, doPush, doPull, buildInput]);

  // Auto-push (debounced) whenever the synced dataset changes.
  useEffect(() => {
    if (!token || !pushEnabledRef.current) return;
    const input = buildInput();
    if (signature(input) === lastSyncedSigRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doPush(input), PUSH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    token, assets, snapshots, customCategories,
    baseCurrency, hideBalance, accentKey, themeMode, startAnimationEnabled,
    buildInput, doPush,
  ]);

  const syncNow = useCallback(() => {
    if (!tokenRef.current) return;
    doPush(buildInput());
  }, [doPush, buildInput]);

  const restoreNow = useCallback(() => {
    if (!tokenRef.current) return;
    doPull();
  }, [doPull]);

  return (
    <SyncContext.Provider value={{ syncState, lastSyncedAt, syncNow, restoreNow }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within <SyncProvider>');
  return ctx;
}
