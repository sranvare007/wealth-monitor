import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricState =
  | 'checking'       // determining hardware capability
  | 'unavailable'    // no hardware or not enrolled
  | 'locked'         // ready, needs authentication
  | 'authenticating' // auth dialog in progress
  | 'unlocked';      // authenticated successfully

export type BiometricError =
  | 'user_cancel'
  | 'lockout'
  | 'not_enrolled'
  | 'not_available'
  | 'unknown'
  | null;

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'none';

export type BiometricCapability = {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
};

export type UseBiometricAuthResult = {
  biometricState: BiometricState;
  error: BiometricError;
  biometricType: BiometricType;
  authenticate: () => Promise<void>;
};

// Grace period: if app was in background for less than this, don't re-lock.
const BACKGROUND_LOCK_MS = 30_000;

export async function checkBiometricCapability(): Promise<BiometricCapability> {
  const [hasHardware, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  let biometricType: BiometricType = 'none';
  if (hasHardware && isEnrolled) {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'face';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = 'iris';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'fingerprint';
    }
  }

  return { hasHardware, isEnrolled, biometricType };
}

export function useBiometricAuth(enabled: boolean, appReady: boolean): UseBiometricAuthResult {
  const [biometricState, setBiometricState] = useState<BiometricState>('checking');
  const [error, setError] = useState<BiometricError>(null);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');

  const isAuthInFlight = useRef(false);
  const hasAutoTriggered = useRef(false);
  const backgroundedAt = useRef<number | null>(null);

  // Determine hardware capability and set initial lock state
  useEffect(() => {
    if (!enabled) {
      setBiometricState('unlocked');
      return;
    }

    setBiometricState('checking');
    setError(null);

    checkBiometricCapability()
      .then(({ hasHardware, isEnrolled, biometricType: type }) => {
        if (!hasHardware) {
          setBiometricState('unavailable');
          setError('not_available');
          return;
        }
        if (!isEnrolled) {
          setBiometricState('unavailable');
          setError('not_enrolled');
          return;
        }
        setBiometricType(type);
        setBiometricState('locked');
        setError(null);
      })
      .catch(() => {
        setBiometricState('unavailable');
        setError('unknown');
      });
  }, [enabled]);

  const authenticate = useCallback(async () => {
    if (isAuthInFlight.current) return;
    isAuthInFlight.current = true;
    setBiometricState('authenticating');
    setError(null);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Wealth Monitor',
        fallbackLabel: 'Use Passcode',
        // Allow device PIN / password as fallback so the user is never locked out.
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        setBiometricState('unlocked');
        setError(null);
      } else {
        setBiometricState('locked');
        switch (result.error) {
          case 'user_cancel':
          case 'system_cancel':
            setError('user_cancel');
            break;
          case 'lockout':
            setError('lockout');
            break;
          case 'not_enrolled':
            setBiometricState('unavailable');
            setError('not_enrolled');
            break;
          case 'not_available':
            setBiometricState('unavailable');
            setError('not_available');
            break;
          default:
            setError('unknown');
        }
      }
    } catch {
      setBiometricState('locked');
      setError('unknown');
    } finally {
      isAuthInFlight.current = false;
    }
  }, []);

  // Automatically trigger auth once when the app becomes ready and is in the locked state.
  // hasAutoTriggered prevents re-triggering on every render; it resets on background re-lock.
  useEffect(() => {
    if (!appReady || !enabled || biometricState !== 'locked' || hasAutoTriggered.current) return;
    hasAutoTriggered.current = true;
    authenticate();
  }, [appReady, enabled, biometricState, authenticate]);

  // Re-lock when app returns from background after the grace period.
  useEffect(() => {
    if (!enabled) return;

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (nextState === 'active') {
        const bg = backgroundedAt.current;
        backgroundedAt.current = null;
        if (bg !== null && Date.now() - bg >= BACKGROUND_LOCK_MS) {
          hasAutoTriggered.current = false;
          setBiometricState('locked');
          setError(null);
        }
      }
    });

    return () => sub.remove();
  }, [enabled]);

  return { biometricState, error, biometricType, authenticate };
}
