import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { Icon } from '../../components/common/Icon';
import { ApiError } from '../../services/api';
import { FONTS } from '../../constants/fonts';

type Mode = 'login' | 'signup';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthScreen() {
  const navigation = useNavigation();
  const { theme, accent } = useTheme();
  const insets = useSafeAreaInsets();
  const { login, signup } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 8;
  const canSubmit = emailValid && passwordValid && !submitting;

  const isSignup = mode === 'signup';

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      if (isSignup) {
        await signup(email.trim(), password);
        toast('Account created — backing up your data', 'success');
      } else {
        await login(email.trim(), password);
        toast('Signed in — syncing your data', 'success');
      }
      navigation.goBack();
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldMsg = err.errors?.[0]?.message;
        setError(fieldMsg ?? err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.cardBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: theme.line }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.ghostBtn}>
            <Text style={[styles.ghostBtnText, { color: theme.sub }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>
            {isSignup ? 'Create account' : 'Sign in'}
          </Text>
          <View style={styles.ghostBtn} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) + 28 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Intro */}
          <View style={[styles.iconBadge, { backgroundColor: accent.solid + '1A' }]}>
            <Icon name="globe" size={26} color={accent.solid} strokeWidth={2.1} />
          </View>
          <Text style={[styles.heading, { color: theme.text }]}>
            {isSignup ? 'Back up to the cloud' : 'Welcome back'}
          </Text>
          <Text style={[styles.subheading, { color: theme.sub }]}>
            {isSignup
              ? 'Create an account to securely back up your assets and sync across devices.'
              : 'Sign in to restore and sync your wealth data.'}
          </Text>

          {/* Email */}
          <Text style={[styles.fieldLabel, { color: theme.sub }]}>EMAIL</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.chipBg, borderColor: 'transparent' }]}>
            <TextInput
              value={email}
              onChangeText={(t) => { setEmail(t); setError(null); }}
              placeholder="you@example.com"
              placeholderTextColor={theme.faint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!submitting}
              style={[styles.input, { color: theme.text }]}
            />
          </View>

          {/* Password */}
          <Text style={[styles.fieldLabel, { color: theme.sub }]}>PASSWORD</Text>
          <View style={[styles.inputBox, styles.passwordRow, { backgroundColor: theme.chipBg, borderColor: 'transparent' }]}>
            <TextInput
              value={password}
              onChangeText={(t) => { setPassword(t); setError(null); }}
              placeholder="At least 8 characters"
              placeholderTextColor={theme.faint}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              textContentType={isSignup ? 'newPassword' : 'password'}
              editable={!submitting}
              onSubmitEditing={submit}
              returnKeyType="go"
              style={[styles.input, { color: theme.text, flex: 1 }]}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={styles.eyeBtn}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon name={showPassword ? 'shield' : 'key'} size={18} color={theme.sub} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorRow}>
              <Icon name="info" size={15} color={theme.neg} strokeWidth={2.2} />
              <Text style={[styles.errorText, { color: theme.neg }]}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={submit}
            disabled={!canSubmit}
            style={[styles.submitBtn, { backgroundColor: canSubmit ? accent.solid : theme.line }]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            accessibilityLabel={isSignup ? 'Create account' : 'Sign in'}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.submitText, { color: canSubmit ? '#fff' : theme.faint }]}>
                {isSignup ? 'Create account' : 'Sign in'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch mode */}
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: theme.sub }]}>
              {isSignup ? 'Already have an account?' : 'New to Wealth Monitor?'}
            </Text>
            <TouchableOpacity onPress={() => switchMode(isSignup ? 'login' : 'signup')}>
              <Text style={[styles.switchLink, { color: accent.solid }]}>
                {isSignup ? 'Sign in' : 'Create one'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Privacy note */}
          <View style={styles.noteRow}>
            <Icon name="lock" size={15} color={theme.faint} strokeWidth={2} />
            <Text style={[styles.noteText, { color: theme.faint }]}>
              Your data is encrypted in transit. An account is only needed for cloud backup — the app works fully offline without one.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ghostBtn: { minWidth: 64, paddingVertical: 6, paddingHorizontal: 6 },
  ghostBtnText: { fontSize: 15.5, fontFamily: FONTS.jakartaSemiBold },
  title: { fontSize: 16.5, fontFamily: FONTS.jakartaBold },

  body: { paddingHorizontal: 20, paddingTop: 12 },

  iconBadge: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heading: { fontSize: 24, letterSpacing: -0.4, fontFamily: FONTS.jakartaExtraBold, marginBottom: 6 },
  subheading: { fontSize: 14, lineHeight: 20, fontFamily: FONTS.jakarta, marginBottom: 24 },

  fieldLabel: {
    fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase',
    fontFamily: FONTS.jakartaBold, marginBottom: 8, marginTop: 4,
  },
  inputBox: {
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4, marginBottom: 16, minHeight: 52,
    justifyContent: 'center',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 },
  input: { fontSize: 16, fontFamily: FONTS.jakartaSemiBold, paddingVertical: Platform.OS === 'ios' ? 0 : 10 },
  eyeBtn: { paddingHorizontal: 6, paddingVertical: 10, marginLeft: 4 },

  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 14, marginTop: -4 },
  errorText: { flex: 1, fontSize: 13.5, lineHeight: 19, fontFamily: FONTS.jakartaSemiBold },

  submitBtn: {
    height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 6,
  },
  submitText: { fontSize: 16.5, fontFamily: FONTS.jakartaBold },

  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 22 },
  switchText: { fontSize: 14, fontFamily: FONTS.jakarta },
  switchLink: { fontSize: 14, fontFamily: FONTS.jakartaBold },

  noteRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginTop: 28, paddingHorizontal: 2 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: FONTS.jakarta },
});
