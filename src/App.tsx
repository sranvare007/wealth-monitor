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
import { useAppFonts } from './hooks/useFonts';
import { useTheme } from './hooks/useTheme';
import { useAppState } from './store/AppContext';

SplashScreen.preventAutoHideAsync();

const prefix = createURL('/');

// Inner shell: has access to AppContext via useTheme / useAppState
function AppShell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isDark } = useTheme();
  const { loading } = useAppState();

  if (!fontsLoaded || loading) return null;

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
