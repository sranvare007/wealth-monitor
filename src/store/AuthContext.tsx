import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginAccount, registerAccount, type PublicUser } from '../services/authApi';

const TOKEN_KEY = 'WM_AUTH_TOKEN';
const USER_KEY = 'WM_AUTH_USER';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

// Bumped on every auth transition so the sync manager can react to a fresh event
// (and tell signup — which should push local data up — apart from login/restore,
// which should pull the cloud copy down).
export type AuthEvent = {
  kind: 'restored' | 'login' | 'signup' | 'logout';
  seq: number;
};

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  user: PublicUser | null;
  event: AuthEvent | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [event, setEvent] = useState<AuthEvent | null>(null);
  const seqRef = useRef(0);

  function emit(kind: AuthEvent['kind']) {
    setEvent({ kind, seq: ++seqRef.current });
  }

  async function persist(nextToken: string, nextUser: PublicUser): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, nextToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser)),
    ]);
  }

  // Restore a persisted session on launch.
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as PublicUser);
          setStatus('authenticated');
          emit('restored');
          return;
        }
      } catch {
        // fall through to unauthenticated
      }
      setStatus('unauthenticated');
    })();
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const res = await loginAccount(email, password);
    await persist(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
    setStatus('authenticated');
    emit('login');
  }

  async function signup(email: string, password: string): Promise<void> {
    const res = await registerAccount(email, password);
    await persist(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
    setStatus('authenticated');
    emit('signup');
  }

  async function logout(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]).catch(() => {});
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
    emit('logout');
  }

  return (
    <AuthContext.Provider value={{ status, token, user, event, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
