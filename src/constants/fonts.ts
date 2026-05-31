// Use these constants with StyleSheet.create, chart props, or Reanimated animated styles.
// For className-based styling prefer the Tailwind font-* utilities defined in tailwind.config.js.
export const FONTS = {
  // Plus Jakarta Sans — UI text
  jakartaLight:      'PlusJakartaSans_300Light',
  jakarta:           'PlusJakartaSans_400Regular',
  jakartaMedium:     'PlusJakartaSans_500Medium',
  jakartaSemiBold:   'PlusJakartaSans_600SemiBold',
  jakartaBold:       'PlusJakartaSans_700Bold',
  jakartaExtraBold:  'PlusJakartaSans_800ExtraBold',

  // Space Grotesk — numeric values (net worth, asset figures, percentages)
  groteskLight:      'SpaceGrotesk_300Light',
  grotesk:           'SpaceGrotesk_400Regular',
  groteskMedium:     'SpaceGrotesk_500Medium',
  groteskSemiBold:   'SpaceGrotesk_600SemiBold',
  groteskBold:       'SpaceGrotesk_700Bold',
} as const;

export type FontKey = keyof typeof FONTS;
