import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createURL } from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { useState, useRef } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from './db/DatabaseContext';
import { AppProvider } from './store/AppContext';
import { ToastProvider } from './store/ToastContext';
import { Navigation } from './navigation';
import { AppOverlays } from './components/common/AppOverlays';
import { BiometricLockScreen } from './components/common/BiometricLockScreen';
import { SplashAnimation } from './components/common/SplashAnimation';
import { useAppFonts } from './hooks/useFonts';
import { useTheme } from './hooks/useTheme';
import { useAppState } from './store/AppContext';
import { useBiometricAuth } from './hooks/useBiometricAuth';

SplashScreen.preventAutoHideAsync();

const prefix = createURL('/');

// Inner shell: has access to AppContext via useTheme / useAppState
function AppShell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isDark } = useTheme();
  const { loading, biometricEnabled, onboardingDone, startAnimationEnabled } = useAppState();
  const appReady = fontsLoaded && !loading;

  // Only engage the lock when the user has finished onboarding and enabled the feature.
  const lockActive = biometricEnabled && onboardingDone;
  const { biometricState, error, biometricType, authenticate } = useBiometricAuth(lockActive, appReady);

  // Show the lock screen overlay whenever we're in a non-terminal locked state.
  // 'unavailable' is excluded: if hardware is gone we fail open so the user isn't
  // permanently locked out; setBiometricEnabled(false) is called from Settings on discovery.
  const showLock = lockActive && biometricState !== 'unlocked' && biometricState !== 'unavailable';

  // splashDone tracks whether the startup animation has already played this session.
  // It's local state so it resets every app launch but persists across background/foreground cycles.
  const [splashDone, setSplashDone] = useState(false);

  // Guards against the one-render race window where lockActive becomes true (DB just loaded)
  // but biometricState still holds the stale 'unlocked' value from when lockActive was false.
  // We only allow the splash through once showLock has actually been true at least once,
  // confirming that biometricState has settled past its initial value.
  const hasShownLockRef = useRef(false);
  if (showLock) hasShownLockRef.current = true;

  // lockCleared is true when there is nothing blocking the splash:
  //   - lock was never required (!lockActive), OR
  //   - lock hardware is unavailable (fails open), OR
  //   - lock was shown and the user authenticated (hasShownLockRef + unlocked)
  const lockCleared = !showLock
    && (!lockActive || biometricState === 'unavailable' || hasShownLockRef.current);

  const showSplash = appReady && lockCleared && startAnimationEnabled && !splashDone;

  if (!appReady) return null;

  return (
    <View style={{ flex: 1 }}>
      <Navigation
        theme={isDark ? DarkTheme : DefaultTheme}
        linking={{
          enabled: 'auto',
          prefixes: [prefix],
        }}
        onReady={() => {
          SplashScreen.hideAsync();
        }}
      />
      <AppOverlays />

      {showLock && (
        <BiometricLockScreen
          state={biometricState}
          error={error}
          biometricType={biometricType}
          onAuthenticate={authenticate}
        />
      )}

      {showSplash && (
        <SplashAnimation onDone={() => setSplashDone(true)} />
      )}
    </View>
  );
}

export function App() {
  const [fontsLoaded] = useAppFonts();

  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <AppProvider>
          <ToastProvider>
            <AppShell fontsLoaded={fontsLoaded} />
          </ToastProvider>
        </AppProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
