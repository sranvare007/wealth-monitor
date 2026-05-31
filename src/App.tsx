import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createURL } from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './store/AppContext';
import { Navigation } from './navigation';
import { AppOverlays } from './components/common/AppOverlays';
import { useAppFonts } from './hooks/useFonts';
import { useTheme } from './hooks/useTheme';

SplashScreen.preventAutoHideAsync();

const prefix = createURL('/');

// Inner shell: has access to AppContext via useTheme
function AppShell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isDark } = useTheme();

  if (!fontsLoaded) return null;

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
      <AppProvider>
        <AppShell fontsLoaded={fontsLoaded} />
      </AppProvider>
    </SafeAreaProvider>
  );
}
