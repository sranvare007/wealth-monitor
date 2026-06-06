import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createURL } from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from './db/DatabaseContext';
import { AppProvider } from './store/AppContext';
import { ToastProvider } from './store/ToastContext';
import { Navigation } from './navigation';
import { AppOverlays } from './components/common/AppOverlays';
import { BiometricLockScreen } from './components/common/BiometricLockScreen';
import { useAppFonts } from './hooks/useFonts';
import { useTheme } from './hooks/useTheme';
import { useAppState } from './store/AppContext';
import { useBiometricAuth } from './hooks/useBiometricAuth';

SplashScreen.preventAutoHideAsync();

const prefix = createURL('/');

// Inner shell: has access to AppContext via useTheme / useAppState
function AppShell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isDark } = useTheme();
  const { loading, biometricEnabled, onboardingDone } = useAppState();
  const appReady = fontsLoaded && !loading;

  // Only engage the lock when the user has finished onboarding and enabled the feature.
  const lockActive = biometricEnabled && onboardingDone;
  const { biometricState, error, biometricType, authenticate } = useBiometricAuth(lockActive, appReady);

  // Show the lock screen overlay whenever we're in a non-terminal locked state.
  // 'unavailable' is excluded: if hardware is gone we fail open so the user isn't
  // permanently locked out; setBiometricEnabled(false) is called from Settings on discovery.
  const showLock = lockActive && biometricState !== 'unlocked' && biometricState !== 'unavailable';

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
