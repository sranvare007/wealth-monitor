import React from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../../components/common/Icon';
import { ACCENTS } from '../../constants/theme';
import { computeTotals } from '../../utils/networth';
import { formatMoney } from '../../utils/currency';
import type { AccentKey } from '../../types';
import { FONTS } from '../../constants/fonts';

const ACCENT_NAMES: Record<AccentKey, string> = {
  indigo: 'Indigo', violet: 'Violet', emerald: 'Emerald', ocean: 'Ocean', sunset: 'Sunset',
};

export function SettingsScreen() {
  const {
    assets, baseCurrency, accentKey, setAccentKey,
    darkMode, setDarkMode,
    resetDemo, clearAll,
    openCurrencyPicker,
    replayOnboarding,
    customCategories, openCategoriesSheet,
  } = useAppState();
  const { theme, accent } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = 86 + Math.max(insets.bottom, 8) + 16;

  const totals = computeTotals(assets, baseCurrency, customCategories);

  function handleClearAll() {
    Alert.alert(
      'Clear all data?',
      'This will permanently remove all assets and history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearAll },
      ],
    );
  }

  function handleResetDemo() {
    Alert.alert(
      'Reset demo data?',
      'This replaces all assets with sample data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetDemo },
      ],
    );
  }

  function handleReplayOnboarding() {
    Alert.alert(
      'Replay onboarding?',
      'This will show the onboarding flow again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: replayOnboarding },
      ],
    );
  }

  function Row({
    label, detail, onPress, danger = false, last = false,
  }: {
    label: string; detail?: string; onPress?: () => void; danger?: boolean; last?: boolean;
  }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        style={[
          styles.row,
          !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line },
        ]}
        accessibilityRole={onPress ? 'button' : 'none'}
      >
        <Text style={[styles.rowLabel, { color: danger ? theme.neg : theme.text }]}>{label}</Text>
        {detail && <Text style={[styles.rowDetail, { color: theme.sub }]}>{detail}</Text>}
        {onPress && !danger && <Icon name="chevR" size={16} color={theme.faint} strokeWidth={2.2} />}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingHorizontal: 16 }}
      >
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        {/* ── Appearance ────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.sub }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
          {/* Theme colour */}
          <View style={{ padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line }}>
            <View style={styles.themeRow}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Theme colour</Text>
              <Text style={[styles.accentName, { color: accent.solid }]}>{ACCENT_NAMES[accentKey]}</Text>
            </View>
            <View style={styles.accents}>
              {(Object.keys(ACCENTS) as AccentKey[]).map(key => {
                const a = ACCENTS[key];
                const on = key === accentKey;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setAccentKey(key)}
                    accessibilityLabel={ACCENT_NAMES[key]}
                    style={[
                      styles.swatch,
                      { backgroundColor: a.solid },
                      on && {
                        borderWidth: 3,
                        borderColor: theme.text,
                        shadowColor: a.solid,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 6,
                        elevation: 4,
                      },
                    ]}
                  >
                    {on && <Icon name="check" size={20} color="#fff" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Dark mode toggle */}
          <TouchableOpacity
            onPress={() => setDarkMode(!darkMode)}
            style={[styles.row, { borderBottomWidth: 0 }]}
            accessibilityRole="switch"
            accessibilityState={{ checked: darkMode }}
            accessibilityLabel="Dark mode"
          >
            <Text style={[styles.rowLabel, { color: theme.text }]}>Dark mode</Text>
            {/* Toggle switch */}
            <View style={[
              styles.toggle,
              { backgroundColor: darkMode ? accent.solid : theme.line },
            ]}>
              <View style={[
                styles.toggleThumb,
                { marginLeft: darkMode ? 20 : 2 },
              ]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Preferences ───────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.sub }]}>PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
          <Row label="Base currency" detail={baseCurrency} onPress={openCurrencyPicker} />
          <Row
            label="Categories"
            detail={customCategories.length > 0 ? `${customCategories.length} custom` : 'Add your own'}
            onPress={openCategoriesSheet}
            last
          />
        </View>

        {/* ── Your data ─────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.sub }]}>YOUR DATA</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
          <Row label="Assets tracked" detail={String(assets.length)} />
          <Row
            label="Net worth"
            detail={formatMoney(totals.netWorth, baseCurrency, { compact: true })}
            last
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
          <Row label="Replay onboarding" onPress={handleReplayOnboarding} />
          <Row label="Reset demo data" onPress={handleResetDemo} />
          <Row label="Clear all data" onPress={handleClearAll} danger last />
        </View>

        {/* Privacy note */}
        <View style={styles.privacyRow}>
          <Icon name="lock" size={17} color={theme.sub} strokeWidth={2} />
          <Text style={[styles.privacyText, { color: theme.sub }]}>
            All data is stored only on this device. Nothing is uploaded — no account, no cloud, no tracking. Values are updated manually by you.
          </Text>
        </View>
        <Text style={[styles.version, { color: theme.faint }]}>WealthMonitor · v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title:        { fontSize: 28, letterSpacing: -0.6, marginTop: 4, marginBottom: 18, marginHorizontal: 4, fontFamily: FONTS.jakartaExtraBold },
  sectionLabel: { fontSize: 13, letterSpacing: 0.3, textTransform: 'uppercase', marginHorizontal: 4, marginBottom: 8, fontFamily: FONTS.jakartaBold },
  card:         { borderRadius: 22, borderWidth: 1, overflow: 'hidden', marginBottom: 22 },

  row:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 15 },
  rowLabel:  { flex: 1, fontSize: 15.5, fontFamily: FONTS.jakartaSemiBold },
  rowDetail: { fontSize: 15, fontFamily: FONTS.groteskSemiBold },

  themeRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  accentName: { fontSize: 14, fontFamily: FONTS.jakartaBold },
  accents:    { flexDirection: 'row', gap: 12 },
  swatch:     { flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  toggle: {
    width: 50, height: 30, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 3,
  },
  toggleThumb: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },

  privacyRow:  { flexDirection: 'row', gap: 10, paddingHorizontal: 6, alignItems: 'flex-start', marginBottom: 8 },
  privacyText: { flex: 1, fontSize: 12.5, lineHeight: 19, fontFamily: FONTS.jakarta },
  version:     { textAlign: 'center', fontSize: 12, marginBottom: 8, fontFamily: FONTS.jakarta },
});
