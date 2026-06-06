import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useAppState } from '../../store/AppContext';
import { Icon } from './Icon';
import { FONTS } from '../../constants/fonts';
import type { BiometricState, BiometricError, BiometricType } from '../../hooks/useBiometricAuth';

type Props = {
  state: BiometricState;
  error: BiometricError;
  biometricType: BiometricType;
  onAuthenticate: () => void;
};

function unlockLabel(type: BiometricType): string {
  switch (type) {
    case 'face': return 'Unlock with Face ID';
    case 'iris': return 'Unlock with Iris';
    case 'fingerprint': return 'Unlock with Fingerprint';
    default: return 'Unlock';
  }
}

function errorMessage(error: BiometricError): string {
  switch (error) {
    case 'user_cancel':
      return 'Authentication cancelled. Tap below to try again.';
    case 'lockout':
      return 'Too many failed attempts. Use your device passcode to unlock.';
    case 'not_enrolled':
      return 'No biometrics enrolled on this device. Disable App Lock in Settings.';
    case 'not_available':
      return 'Biometric authentication is not available on this device.';
    case 'unknown':
      return 'Authentication failed. Please try again.';
    default:
      return '';
  }
}

export function BiometricLockScreen({ state, error, biometricType, onAuthenticate }: Props) {
  const { theme, accent } = useTheme();
  const { accentKey } = useAppState();
  const insets = useSafeAreaInsets();

  const isLoading = state === 'checking' || state === 'authenticating';
  const showButton = state === 'locked';
  const msg = errorMessage(error);

  // Lockout: system handles the passcode fallback natively via disableDeviceFallback: false.
  // The button is still shown so the user can re-open the native auth dialog.
  const isLockout = error === 'lockout';

  return (
    <View
      style={[styles.overlay, { backgroundColor: theme.bg }]}
      // Prevent any touches reaching the navigation behind this screen.
      pointerEvents="box-none"
    >
      <View
        style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        pointerEvents="auto"
        accessibilityViewIsModal
      >
        {/* ── App identity ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={[styles.iconWrapper, { backgroundColor: accent.solid + '18' }]}>
            <Icon name="wallet" size={36} color={accent.solid} strokeWidth={1.8} />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>Wealth Monitor</Text>
          <Text style={[styles.subtitle, { color: theme.sub }]}>Your financial data is locked</Text>
        </View>

        {/* ── Lock icon / spinner ───────────────────────────────────────── */}
        <View style={styles.lockArea}>
          {isLoading ? (
            <ActivityIndicator size="large" color={accent.solid} />
          ) : (
            <View style={[styles.lockCircle, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
              <Icon
                name={error ? 'lock' : 'lock'}
                size={44}
                color={error ? theme.neg : accent.solid}
                strokeWidth={1.6}
              />
            </View>
          )}
        </View>

        {/* ── Error / status message ────────────────────────────────────── */}
        {msg ? (
          <View style={[styles.errorBubble, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
            <Icon
              name={isLockout ? 'info' : 'info'}
              size={16}
              color={isLockout ? theme.neg : theme.sub}
              strokeWidth={2}
            />
            <Text
              style={[styles.errorText, { color: isLockout ? theme.neg : theme.sub }]}
              accessibilityRole="alert"
            >
              {msg}
            </Text>
          </View>
        ) : null}

        {/* ── Auth button ───────────────────────────────────────────────── */}
        {showButton && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onAuthenticate}
              style={[styles.button, { backgroundColor: accent.solid }]}
              accessibilityRole="button"
              accessibilityLabel={unlockLabel(biometricType)}
              activeOpacity={0.82}
            >
              <Icon name="lock" size={18} color="#fff" strokeWidth={2.2} />
              <Text style={styles.buttonText}>{unlockLabel(biometricType)}</Text>
            </TouchableOpacity>

            {/* Passcode fallback hint — the system handles this natively via the auth dialog,
                but we surface the hint in case the dialog was dismissed. */}
            <Text style={[styles.hint, { color: theme.faint }]}>
              You can also use your device passcode
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 28,
  },
  header: {
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 26,
    letterSpacing: -0.5,
    fontFamily: FONTS.jakartaExtraBold,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FONTS.jakarta,
  },
  lockArea: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 320,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.jakarta,
  },
  actions: {
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    minHeight: 56,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: FONTS.jakartaBold,
    color: '#fff',
    letterSpacing: 0.2,
  },
  hint: {
    fontSize: 13,
    fontFamily: FONTS.jakarta,
    textAlign: 'center',
  },
});
