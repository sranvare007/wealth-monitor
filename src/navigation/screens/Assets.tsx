import React, { useMemo, useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../../components/common/Icon';
import { CATEGORIES, CAT } from '../../data/categories';
import { computeTotals, assetBaseValue } from '../../utils/networth';
import { formatMoney } from '../../utils/currency';
import { relativeDay } from '../../utils/date';
import { FONTS } from '../../constants/fonts';

export function AssetsScreen() {
  const { assets, baseCurrency, openAddSheet, openEditSheet, setDeleteTarget, customCategories } = useAppState();
  const { theme, accent } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = 86 + Math.max(insets.bottom, 8) + 16;
  const [query, setQuery] = useState('');

  const allCategories = useMemo(
    () => [...CATEGORIES, ...customCategories],
    [customCategories],
  );
  const catLookup = useMemo(
    () => Object.fromEntries(allCategories.map(c => [c.id, c])),
    [allCategories],
  );
  const totals = useMemo(
    () => computeTotals(assets, baseCurrency, customCategories),
    [assets, baseCurrency, customCategories],
  );

  const filtered = query
    ? assets.filter(a =>
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        (catLookup[a.cat]?.label ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : assets;

  const groups = allCategories
    .map(c => ({
      cat: c,
      items: filtered.filter(a => a.cat === c.id),
      total: totals.byCat[c.id] ?? 0,
    }))
    .filter(g => g.items.length > 0);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingHorizontal: 16 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Assets</Text>
          <Text style={[styles.count, { color: theme.sub }]}>{assets.length} items</Text>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
          <Icon name="search" size={18} color={theme.sub} strokeWidth={2.1} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search assets"
            placeholderTextColor={theme.faint}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="close" size={17} color={theme.sub} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Empty search result */}
        {groups.length === 0 && (
          <Text style={[styles.noResult, { color: theme.sub }]}>
            No assets match "{query}"
          </Text>
        )}

        {/* Category groups */}
        {groups.map(g => (
          <View key={g.cat.id} style={{ marginBottom: 22 }}>
            {/* Category header */}
            <View style={styles.catHeader}>
              <View style={[styles.catIcon, { backgroundColor: g.cat.color + '22' }]}>
                <Icon name={g.cat.icon as any} size={16} color={g.cat.color} strokeWidth={2.1} />
              </View>
              <Text style={[styles.catLabel, { color: theme.text }]}>{g.cat.label}</Text>
              <View style={[styles.catCount, { backgroundColor: theme.chipBg }]}>
                <Text style={[styles.catCountText, { color: theme.sub }]}>{g.items.length}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <Text style={[styles.catTotal, { color: g.cat.liability ? theme.neg : theme.text }]}>
                {g.cat.liability ? '−' : ''}
                {formatMoney(g.total, baseCurrency, { compact: true })}
              </Text>
            </View>

            {/* Asset rows */}
            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
              {g.items.map((a, i) => {
                const baseVal = assetBaseValue(a, baseCurrency);
                const diffCur = a.currency !== baseCurrency;
                return (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => openEditSheet(a)}
                    style={[
                      styles.assetRow,
                      { borderBottomColor: theme.line },
                      i === g.items.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.assetName, { color: theme.text }]} numberOfLines={1}>
                        {a.name}
                      </Text>
                      <Text style={[styles.assetMeta, { color: theme.sub }]}>
                        Updated {relativeDay(a.updated)}{a.note ? ` · ${a.note}` : ''}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.assetValue, { color: g.cat.liability ? theme.neg : theme.text }]}>
                        {g.cat.liability ? '−' : ''}
                        {formatMoney(baseVal, baseCurrency, { compact: true })}
                      </Text>
                      {diffCur && (
                        <Text style={[styles.assetOrig, { color: theme.sub }]}>
                          {formatMoney(a.value, a.currency, { compact: true })}
                        </Text>
                      )}
                    </View>
                    <Icon name="chevR" size={16} color={theme.faint} strokeWidth={2.2} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Add button */}
        <TouchableOpacity
          onPress={openAddSheet}
          style={[styles.addBtn, { borderColor: theme.line }]}
        >
          <Icon name="plus" size={19} color={accent.solid} strokeWidth={2.4} />
          <Text style={[styles.addBtnText, { color: accent.solid }]}>Add new asset</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4, marginBottom: 16, marginHorizontal: 4 },
  title:  { fontSize: 28, letterSpacing: -0.6, fontFamily: FONTS.jakartaExtraBold },
  count:  { fontSize: 13, fontFamily: FONTS.jakartaBold },

  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 18 },
  searchInput: { flex: 1, fontSize: 15.5, padding: 0, fontFamily: FONTS.jakarta },
  noResult:    { textAlign: 'center', fontSize: 14, paddingVertical: 40, fontFamily: FONTS.jakarta },

  catHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 4, marginBottom: 9 },
  catIcon:       { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  catLabel:      { fontSize: 14.5, fontFamily: FONTS.jakartaExtraBold },
  catCount:      { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  catCountText:  { fontSize: 12.5, fontFamily: FONTS.jakartaBold },
  catTotal:      { fontSize: 14, fontFamily: FONTS.groteskBold },

  card:     { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  assetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  assetName:  { fontSize: 15.5, fontFamily: FONTS.jakartaBold },
  assetMeta:  { fontSize: 12.5, marginTop: 2, fontFamily: FONTS.jakarta },
  assetValue: { fontSize: 15.5, fontFamily: FONTS.groteskBold },
  assetOrig:  { fontSize: 12, marginTop: 1, fontFamily: FONTS.grotesk },

  addBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 16, padding: 15 },
  addBtnText: { fontSize: 15, fontFamily: FONTS.jakartaBold },
});
