import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { formatMoney } from '../../utils/currency';
import { PERIODS, fmtDateTime } from '../../utils/date';

const BOTTOM_PAD = 100;

export function HistoryScreen() {
  const { snapshots, baseCurrency, hideBalance } = useAppState();
  const { theme, accent } = useTheme();
  const [period, setPeriod] = useState('6M');

  const now = Date.now();
  const pDef = PERIODS.find(p => p.id === period) ?? PERIODS[3];
  const cutoff = now - pDef.days * 86_400_000;
  const pts = snapshots.filter(s => s.t >= cutoff).length >= 2
    ? snapshots.filter(s => s.t >= cutoff)
    : snapshots.slice(-2);

  const first = pts[0];
  const last  = pts[pts.length - 1];
  const pAbs  = last && first ? last.v - first.v : 0;
  const pPct  = first && first.v ? (pAbs / first.v) * 100 : 0;
  const isPos = pPct > 0;
  const isNeg = pPct < 0;

  const mask = (v: string) => (hideBalance ? '••••••' : v);

  // Table rows (most recent first, with change vs previous)
  const rows = [...snapshots]
    .reverse()
    .map((cur, i, arr) => {
      const prv = arr[i + 1];
      return {
        ...cur,
        change: prv ? cur.v - prv.v : 0,
        pct: prv && prv.v ? ((cur.v - prv.v) / prv.v) * 100 : 0,
        isFirst: !prv,
      };
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BOTTOM_PAD, paddingHorizontal: 16 }}
      >
        {/* Header */}
        <Text style={[styles.title, { color: theme.text }]}>History</Text>

        {/* Summary card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
          <Text style={[styles.periodLabel, { color: theme.sub }]}>
            Net worth · {pDef.label}
          </Text>
          <Text style={[styles.netWorth, { color: theme.text }]}>
            {last ? mask(formatMoney(last.v, baseCurrency)) : '—'}
          </Text>

          {/* Change badge */}
          <View style={[styles.changeBadge, { backgroundColor: (isPos ? theme.pos : isNeg ? theme.neg : theme.sub) + '1A' }]}>
            {isPos && <Text style={{ color: theme.pos, fontSize: 13, fontWeight: '700' }}>▲</Text>}
            {isNeg && <Text style={{ color: theme.neg, fontSize: 13, fontWeight: '700' }}>▼</Text>}
            {!isPos && !isNeg && <Text style={{ color: theme.sub, fontSize: 13 }}>—</Text>}
            <Text style={[styles.changeText, { color: isPos ? theme.pos : isNeg ? theme.neg : theme.sub }]}>
              {isPos ? '+' : ''}{pPct.toFixed(2)}%
            </Text>
            <Text style={[styles.changeText, { color: isPos ? theme.pos : isNeg ? theme.neg : theme.sub }]}>
              {formatMoney(Math.abs(pAbs), baseCurrency, { compact: true })}
            </Text>
          </View>

          {/* Chart placeholder */}
          <View style={[styles.chartPlaceholder, { backgroundColor: theme.chipBg }]}>
            <Text style={{ color: theme.faint, fontSize: 13 }}>📈 Chart coming soon</Text>
          </View>

          {/* Period selector */}
          <View style={[styles.segmented, { backgroundColor: theme.chipBg }]}>
            {PERIODS.map(p => {
              const on = p.id === period;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setPeriod(p.id)}
                  style={[styles.segment, on && [styles.segmentActive, { backgroundColor: theme.cardBg }]]}
                >
                  <Text style={[styles.segmentText, { color: on ? theme.text : theme.sub }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Snapshot log */}
        <Text style={[styles.sectionLabel, { color: theme.sub }]}>SNAPSHOT LOG</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.line, padding: 0, overflow: 'hidden' }]}>
          {/* Table header */}
          <View style={[styles.tableHeader, { backgroundColor: theme.chipBg }]}>
            <Text style={[styles.colHead, { flex: 1, color: theme.sub }]}>DATE</Text>
            <Text style={[styles.colHead, { width: 100, textAlign: 'right', color: theme.sub }]}>NET WORTH</Text>
            <Text style={[styles.colHead, { width: 80, textAlign: 'right', color: theme.sub }]}>CHANGE</Text>
          </View>
          {rows.map((r, i) => {
            const changeColor = r.isFirst ? theme.sub : r.change > 0 ? theme.pos : r.change < 0 ? theme.neg : theme.sub;
            return (
              <View key={r.id} style={[styles.tableRow, { borderTopColor: theme.line }]}>
                <Text style={[styles.rowDate, { flex: 1, color: theme.text }]}>{fmtDateTime(r.t)}</Text>
                <Text style={[styles.rowValue, { width: 100, color: theme.text }]}>
                  {hideBalance ? '••••' : formatMoney(r.v, baseCurrency, { compact: true })}
                </Text>
                <Text style={[styles.rowChange, { width: 80, color: changeColor }]}>
                  {r.isFirst
                    ? 'Start'
                    : (r.change > 0 ? '+' : '') + formatMoney(r.change, baseCurrency, { compact: true })}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 4, marginBottom: 16, marginHorizontal: 4 },

  card:          { borderRadius: 22, padding: 18, borderWidth: 1, marginBottom: 24 },
  periodLabel:   { fontSize: 12.5, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 },
  netWorth:      { fontWeight: '700', fontSize: 32, letterSpacing: -0.6 },

  changeBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start', marginTop: 8, marginBottom: 14 },
  changeText:    { fontSize: 14, fontWeight: '700' },

  chartPlaceholder: { height: 160, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },

  segmented: { flexDirection: 'row', gap: 3, borderRadius: 12, padding: 3 },
  segment: { flex: 1, borderRadius: 9, paddingVertical: 7, alignItems: 'center' },
  segmentActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  segmentText: { fontSize: 13, fontWeight: '700' },

  sectionLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase', marginHorizontal: 4, marginBottom: 10 },

  tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 11 },
  colHead: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  rowDate: { fontSize: 13.5, fontWeight: '600' },
  rowValue: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  rowChange: { fontSize: 12.5, fontWeight: '700', textAlign: 'right' },
});
