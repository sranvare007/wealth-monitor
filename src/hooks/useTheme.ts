import { makeTheme, ACCENTS, type ThemeColors, type AccentDef } from '../constants/theme';
import { useAppState } from '../store/AppContext';

type UseThemeResult = {
  theme: ThemeColors;
  accent: AccentDef;
  isDark: boolean;
};

export function useTheme(): UseThemeResult {
  const { accentKey, darkMode } = useAppState();
  return {
    theme: makeTheme(darkMode),
    accent: ACCENTS[accentKey],
    isDark: darkMode,
  };
}
