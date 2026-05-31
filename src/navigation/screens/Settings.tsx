import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../../components/common/Icon';
import { ACCENTS } from '../../constants/theme';
import { computeTotals } from '../../utils/networth';
import { formatMoney } from '../../utils/currency';
import type { AccentKey } from '../../types';

const BOTTOM_PAD = 100;

const ACCENT_NAMES: Record<AccentKey, string> = {
  indigo: 'Indigo', violet: 'Violet', emerald: 'Emerald', ocean: 'Ocean', sunset: 'Sunset',
};

export function SettingsScreen() {
  const {
    assets, baseCurrency, accentKey, setAccentKey,
    resetDemo, clearAll,
  } = useAppState();
  const { theme, accent } = useTheme();

  const totals = computeTotals(assets, baseCurrency);

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

  function Row({ label, detail, onPress, danger = false, last = false }: {
    label: string; detail?: string; onPress?: () => void; danger?: boolean; last?: boolean;
  }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line }]}
        accessibilityRole={onPress ? 'button' : 'none'}
      >
        <Text style={[styles.rowLabel, { color: danger ? theme.neg : theme.text }]}>{label}</Text>
        {detail && <Text style={[styles.rowDetail, { color: theme.sub }]}>{detail}</Text>}
        {onPress && !danger && <Icon name="chevR" size={16} color={theme.faint} strokeWidth={2.2} />}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BOTTOM_PAD, paddingHorizontal: 16 }}
      >
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        {/* ── Appearance ────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.sub }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
          <View style={{ padding: 16 }}>
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
                      on && { borderWidth: 3, borderColor: theme.text },
                    ]}
                  >
                    {on && <Icon name="check" size={20} color="#fff" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Preferences ───────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.sub }]}>PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
          <Row label="Base currency" detail={baseCurrency} last />
        </View>

        {/* ── Your data ─────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.sub }]}>YOUR DATA</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
          <Row label="Assets tracked" detail={String(assets.length)} />
          <Row label="Net worth" detail={formatMoney(totals.netWorth, baseCurrency, { compact: true })} last />
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
          <Row label="Reset demo data" onPress={handleResetDemo} />
          <Row label="Clear all data" onPress={handleClearAll} danger last />
        </View>

        {/* Privacy note */}
        <View style={styles.privacyRow}>
          <Icon name="lock" size={17} color={theme.sub} strokeWidth={2} />
          <Text style={[styles.privacyText, { color: theme.sub }]}>
            All data is stored only on this device. Nothing is uploaded — no account, no cloud, no tracking.
          </Text>
        </View>
        <Text style={[styles.version, { color: theme.faint }]}>WealthMonitor · v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title:        { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 4, marginBottom: 18, marginHorizontal: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase', marginHorizontal: 4, marginBottom: 8 },
  card:         { borderRadius: 22, borderWidth: 1, overflow: 'hidden', marginBottom: 22 },

  row:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 15 },
  rowLabel:  { flex: 1, fontSize: 15.5, fontWeight: '600' },
  rowDetail: { fontSize: 15, fontWeight: '600' },

  themeRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  accentName: { fontSize: 14, fontWeight: '700' },
  accents:    { flexDirection: 'row', gap: 12 },
  swatch:     { flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  privacyRow:  { flexDirection: 'row', gap: 10, paddingHorizontal: 6, alignItems: 'flex-start', marginBottom: 8 },
  privacyText: { flex: 1, fontSize: 12.5, lineHeight: 19 },
  version:     { textAlign: 'center', fontSize: 12, marginBottom: 8 },
});
