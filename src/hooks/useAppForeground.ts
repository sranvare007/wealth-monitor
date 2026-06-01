import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

// Calls `callback` each time the app transitions to the active (foreground) state.
// Uses a ref internally so the listener never goes stale even if the callback identity changes.
export function useAppForeground(callback: () => void): void {
  const ref = useRef(callback);
  ref.current = callback;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') ref.current();
    });
    return () => sub.remove();
  }, []);
}
