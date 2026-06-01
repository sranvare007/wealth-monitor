import React, { useMemo } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../../components/common/Icon';
import { DonutChart } from '../../components/charts/DonutChart';
import { AreaChart } from '../../components/charts/AreaChart';
import { Sparkline } from '../../components/charts/Sparkline';
import { computeTotals, getDistribution } from '../../utils/networth';
import { formatMoney } from '../../utils/currency';
import { FONTS } from '../../constants/fonts';

export function DashboardScreen() {
  const {
    assets, snapshots, baseCurrency, hideBalance, setHideBalance, customCategories,
  } = useAppState();
  const { theme, accent } = useTheme();
  const insets = useSafeAreaInsets();
  // 62 (tab height) + 24 (FAB overhang) + insets.bottom (nav pill) + 16 (breathing room)
  // Match tab bar height (86) + its nav-pill padding (Math.max(insets.bottom,8)) + breathing room (16)
  const bottomPad = 86 + Math.max(insets.bottom, 8) + 16;
  const navigation = useNavigation<any>(); // typed loosely so root-stack screens are reachable

  const totals = useMemo(
    () => computeTotals(assets, baseCurrency, customCategories),
    [assets, baseCurrency, customCategories],
  );
  const dist = useMemo(
    () => getDistribution(assets, baseCurrency, customCategories),
    [assets, baseCurrency, customCategories],
  );

  const last      = snapshots[snapshots.length - 1];
  const prev      = snapshots[snapshots.length - 2];
  const changeAbs = last && prev ? last.v - prev.v : 0;
  const changePct = last && prev && prev.v !== 0 ? (changeAbs / prev.v) * 100 : 0;
  const isPos     = changePct > 0.0001;
  const isNeg     = changePct < -0.0001;

  const mask = (v: string) => (hideBalance ? '••••••' : v);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingHorizontal: 16 }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.sub }]}>{greeting}</Text>
            <Text style={[styles.title, { color: theme.text }]}>Your Wealth</Text>
          </View>
          <TouchableOpacity
            onPress={() => setHideBalance(!hideBalance)}
            style={[styles.eyeBtn, { backgroundColor: theme.cardBg, borderColor: theme.line }]}
            accessibilityRole="button"
            accessibilityLabel={hideBalance ? 'Show balance' : 'Hide balance'}
          >
            <Icon name={hideBalance ? 'lock' : 'wallet'} size={20} color={theme.sub} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* ── Net Worth Hero Card ─────────────────────────────────────────── */}
        <LinearGradient
          colors={[accent.from, accent.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroCircle} />

          <View style={styles.heroRow}>
            <Text style={styles.heroLabel}>TOTAL NET WORTH</Text>
            <Text style={styles.heroCurrency}>{baseCurrency}</Text>
          </View>

          <Text style={styles.heroAmount}>
            {mask(formatMoney(totals.netWorth, baseCurrency))}
          </Text>

          {/* Change badge */}
          <View style={styles.changeBadgeRow}>
            <View style={styles.changeBadge}>
              {isPos && <Icon name="arrowUp" size={15} color="#fff" strokeWidth={2.6} />}
              {isNeg && <Icon name="arrowDn" size={15} color="#fff" strokeWidth={2.6} />}
              {!isPos && !isNeg && <View style={styles.dash} />}
              <Text style={styles.changePct}>
                {isPos ? '+' : ''}{changePct.toFixed(2)}%
              </Text>
              <Text style={styles.changeAbs}>
                {formatMoney(Math.abs(changeAbs), baseCurrency, { compact: true })}
              </Text>
            </View>
            <Text style={styles.changeCaption}>since last update</Text>
          </View>

          <View style={styles.heroDivider} />

          {/* Assets / Liabilities split + sparkline */}
          <View style={styles.heroBottom}>
            <View style={styles.heroSplit}>
              <View>
                <Text style={styles.splitLabel}>Assets</Text>
                <Text style={styles.splitValue}>
                  {mask(formatMoney(totals.assetsTotal, baseCurrency, { compact: true }))}
                </Text>
              </View>
              <View>
                <Text style={styles.splitLabel}>Liabilities</Text>
                <Text style={styles.splitValue}>
                  {mask(formatMoney(totals.liabTotal, baseCurrency, { compact: true }))}
                </Text>
              </View>
            </View>
            <Sparkline points={snapshots.slice(-12)} width={120} height={34} />
          </View>
        </LinearGradient>

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {assets.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
            <View style={[styles.emptyIcon, { backgroundColor: accent.solid + '22' }]}>
              <Icon name="sparkle" size={34} color={accent.solid} strokeWidth={1.8} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Track your first asset</Text>
            <Text style={[styles.emptyBody, { color: theme.sub }]}>
              Add what you own to see your net worth, distribution and growth over time.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddEdit')}
              style={[styles.emptyBtn, { backgroundColor: accent.solid }]}
              accessibilityRole="button"
            >
              <Icon name="plus" size={19} color="#fff" strokeWidth={2.3} />
              <Text style={styles.emptyBtnText}>Add Asset</Text>
            </TouchableOpacity>
          </View>
        )}

        {assets.length > 0 && (
          <>
            {/* ── Wealth Distribution ───────────────────────────────────── */}
            <View style={{ marginTop: 24 }}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: theme.sub }]}>WEALTH DISTRIBUTION</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Assets')}>
                  <Text style={[styles.sectionLink, { color: accent.solid }]}>View all</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
                <View style={{ alignItems: 'center', marginBottom: 6 }}>
                  <DonutChart segments={dist} base={baseCurrency} theme={theme} size={200} />
                </View>
                {dist.map(seg => {
                  const total = dist.reduce((s, d) => s + d.value, 0) || 1;
                  const pct = (seg.value / total) * 100;
                  return (
                    <View key={seg.id} style={styles.distRow}>
                      <View style={[styles.distDot, { backgroundColor: seg.color }]} />
                      <Text style={[styles.distLabel, { color: theme.text }]} numberOfLines={1}>
                        {seg.label}
                        {seg.liability && (
                          <Text style={{ color: theme.neg, fontSize: 11 }}> DEBT</Text>
                        )}
                      </Text>
                      <Text style={[styles.distValue, { color: theme.text }]}>
                        {hideBalance ? '••••' : formatMoney(seg.value, baseCurrency, { compact: true })}
                      </Text>
                      <Text style={[styles.distPct, { color: theme.sub }]}>
                        {pct.toFixed(1)}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ── Net Worth Trend ──────────────────────────────────────── */}
            <View style={{ marginTop: 24 }}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: theme.sub }]}>NET WORTH TREND</Text>
                <TouchableOpacity onPress={() => navigation.navigate('History')}>
                  <Text style={[styles.sectionLink, { color: accent.solid }]}>Full history</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.line, padding: 16 }]}>
                <AreaChart
                  points={snapshots.slice(-8)}
                  base={baseCurrency}
                  theme={theme}
                  accent={accent.solid}
                  height={150}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 4, marginBottom: 16, marginHorizontal: 4,
  },
  greeting: { fontSize: 13, fontFamily: FONTS.jakartaSemiBold },
  title:    { fontSize: 22, letterSpacing: -0.4, fontFamily: FONTS.jakartaExtraBold },
  eyeBtn:   { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  heroCard:   { borderRadius: 26, padding: 22, overflow: 'hidden' },
  heroCircle: { position: 'absolute', top: -40, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.10)' },
  heroRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel:  { fontSize: 12, letterSpacing: 0.5, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontFamily: FONTS.jakartaBold },
  heroCurrency: { fontSize: 11.5, color: 'rgba(255,255,255,0.7)', fontFamily: FONTS.jakartaSemiBold },
  heroAmount:   { fontSize: 42, lineHeight: 48, marginTop: 8, letterSpacing: -1, color: '#fff', fontFamily: FONTS.groteskBold },

  changeBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 },
  changeBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)' },
  dash:           { width: 7, height: 2, backgroundColor: '#fff', borderRadius: 2 },
  changePct:      { fontSize: 14, color: '#fff', fontFamily: FONTS.groteskBold },
  changeAbs:      { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: FONTS.groteskSemiBold },
  changeCaption:  { fontSize: 12.5, color: 'rgba(255,255,255,0.75)', fontFamily: FONTS.jakarta },

  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 14 },
  heroBottom:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  heroSplit:   { flexDirection: 'row', gap: 22 },
  splitLabel:  { fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginBottom: 3, fontFamily: FONTS.jakartaSemiBold },
  splitValue:  { fontSize: 17, color: '#fff', fontFamily: FONTS.groteskBold },

  emptyCard:  { borderRadius: 22, padding: 38, alignItems: 'center', marginTop: 24, borderWidth: 1 },
  emptyIcon:  { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: FONTS.jakartaExtraBold },
  emptyBody:  { fontSize: 14, marginTop: 6, lineHeight: 21, textAlign: 'center', fontFamily: FONTS.jakarta },
  emptyBtn:   { marginTop: 20, borderRadius: 15, paddingVertical: 15, paddingHorizontal: 18, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyBtnText: { fontSize: 16, color: '#fff', fontFamily: FONTS.jakartaBold },

  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginHorizontal: 4, marginBottom: 10 },
  sectionLabel:  { fontSize: 13, letterSpacing: 0.3, textTransform: 'uppercase', fontFamily: FONTS.jakartaBold },
  sectionLink:   { fontSize: 13.5, fontFamily: FONTS.jakartaBold },
  card:          { borderRadius: 22, padding: 18, borderWidth: 1 },

  distRow:   { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9, paddingHorizontal: 8 },
  distDot:   { width: 11, height: 11, borderRadius: 4, flexShrink: 0 },
  distLabel: { flex: 1, fontSize: 14.5, fontFamily: FONTS.jakartaSemiBold },
  distValue: { fontSize: 14, fontFamily: FONTS.groteskBold },
  distPct:   { fontSize: 12.5, width: 42, textAlign: 'right', fontFamily: FONTS.groteskBold },
});
