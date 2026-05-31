import { useColorScheme } from 'react-native';
import { makeTheme, ACCENTS, type ThemeColors, type AccentDef } from '../constants/theme';
import { useAppState } from '../store/AppContext';

type UseThemeResult = {
  theme: ThemeColors;
  accent: AccentDef;
  isDark: boolean;
};

export function useTheme(): UseThemeResult {
  const colorScheme = useColorScheme();
  const { accentKey } = useAppState();
  const isDark = colorScheme === 'dark';
  return {
    theme: makeTheme(isDark),
    accent: ACCENTS[accentKey],
    isDark,
  };
}
