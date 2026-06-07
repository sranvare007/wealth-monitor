import React, { useMemo, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../../components/common/Icon';
import { trackedSubtitle } from '../../components/common/TrackedEntry';
import { CATEGORIES, CAT } from '../../data/categories';
import { computeTotals, assetBaseValue } from '../../utils/networth';
import { formatMoney, convert } from '../../utils/currency';
import { relativeDay, fmtDate } from '../../utils/date';
import { calcFdCurrentValue, fdMaturityDateMs, isFdMatured } from '../../utils/fd';
import { FONTS } from '../../constants/fonts';
import { fetchStockPrices, type StockLTP } from '../../services/stockPriceService';
import { fetchCryptoPrices, type CryptoLTP } from '../../services/cryptoPriceService';
import { getCryptoIdsBySymbols } from '../../db/queries/crypto_info';
import { useDatabase } from '../../db/DatabaseContext';
import { useAppForeground } from '../../hooks/useAppForeground';
import { useToast } from '../../store/ToastContext';

export function AssetsScreen() {
  const { assets, baseCurrency, setDeleteTarget, customCategories } = useAppState();
  const db = useDatabase();
  const toast = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const { theme, accent } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = 86 + Math.max(insets.bottom, 8) + 16;
  const [query, setQuery] = useState('');
  const [livePrices, setLivePrices] = useState<Record<string, StockLTP>>({});
  const [liveCryptoPrices, setLiveCryptoPrices] = useState<Record<number, CryptoLTP>>({});
  // symbol-keyed fallback for crypto assets saved before cryptoId was added
  const [liveCryptoPricesBySymbol, setLiveCryptoPricesBySymbol] = useState<Record<string, CryptoLTP>>({});
  const [refreshing, setRefreshing] = useState(false);

  const stockInstrumentKeys = useMemo(
    () => [
      ...new Set(
        assets
          .filter(a => a.track?.kind === 'stock' && a.track.instrumentKey)
          .map(a => (a.track as Extract<typeof a.track, { kind: 'stock' }>).instrumentKey),
      ),
    ],
    [assets],
  );

  const cryptoAssets = useMemo(
    () => assets.filter(a => a.track?.kind === 'crypto') as (typeof assets[0] & { track: Extract<NonNullable<typeof assets[0]['track']>, { kind: 'crypto' }> })[],
    [assets],
  );

  const loadLivePrices = useCallback(async (force = false) => {
    if (stockInstrumentKeys.length === 0 && cryptoAssets.length === 0) return;
    try {
      // Resolve crypto IDs: use stored cryptoId when available, fallback to DB symbol lookup
      let resolvedCryptoIds: number[] = [];
      let symbolToId = new Map<string, number>();
      if (cryptoAssets.length > 0) {
        const withId    = cryptoAssets.filter(a => a.track.cryptoId > 0).map(a => a.track.cryptoId);
        const noIdSymbs = [...new Set(cryptoAssets.filter(a => !(a.track.cryptoId > 0)).map(a => a.track.symbol))];
        if (noIdSymbs.length > 0) {
          symbolToId = await getCryptoIdsBySymbols(db, noIdSymbs);
        }
        resolvedCryptoIds = [...new Set([...withId, ...[...symbolToId.values()]])];
      }

      const [stockPrices, cryptoPrices] = await Promise.all([
        stockInstrumentKeys.length > 0 ? fetchStockPrices(stockInstrumentKeys, force) : Promise.resolve({} as Record<string, StockLTP>),
        resolvedCryptoIds.length > 0 ? fetchCryptoPrices(resolvedCryptoIds, force) : Promise.resolve({} as Record<number, CryptoLTP>),
      ]);
      if (Object.keys(stockPrices).length > 0) setLivePrices(prev => ({ ...prev, ...stockPrices }));
      if (Object.keys(cryptoPrices).length > 0) {
        setLiveCryptoPrices(prev => ({ ...prev, ...cryptoPrices }));
        // Build symbol-keyed map for legacy assets (cryptoId not stored)
        if (symbolToId.size > 0) {
          const bySymbol: Record<string, CryptoLTP> = {};
          symbolToId.forEach((id, sym) => { if (cryptoPrices[id]) bySymbol[sym] = cryptoPrices[id]; });
          if (Object.keys(bySymbol).length > 0) setLiveCryptoPricesBySymbol(prev => ({ ...prev, ...bySymbol }));
        }
      }
    } catch {
      toast('Price fetch could not be completed. Try again later.', 'error');
    }
  }, [stockInstrumentKeys, cryptoAssets, db, toast]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLivePrices(true);
    setRefreshing(false);
  }, [loadLivePrices]);

  useFocusEffect(useCallback(() => { loadLivePrices(); }, [loadLivePrices]));
  useAppForeground(loadLivePrices);

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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

        {/* Empty states */}
        {groups.length === 0 && query.length > 0 && (
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
                const diffCur = !a.track && a.currency !== baseCurrency;

                const stockTrack  = a.track?.kind === 'stock'  ? a.track : undefined;
                const cryptoTrack = a.track?.kind === 'crypto' ? a.track : undefined;

                const stockLive  = stockTrack?.instrumentKey ? livePrices[stockTrack.instrumentKey] : undefined;
                const cryptoLive = cryptoTrack
                  ? (cryptoTrack.cryptoId > 0 ? liveCryptoPrices[cryptoTrack.cryptoId] : undefined) ?? liveCryptoPricesBySymbol[cryptoTrack.symbol]
                  : undefined;
                const activeLive = stockLive ?? cryptoLive;

                const displayValue = activeLive
                  ? convert(
                      (stockTrack ? stockTrack.qty : cryptoTrack ? cryptoTrack.qty : 0) * activeLive.price,
                      a.currency,
                      baseCurrency,
                    )
                  : baseVal;
                const displayChangePct = activeLive ? activeLive.changePct : a.track?.changePct;

                // FD breakdown values
                const isFd = a.cat === 'fd' && a.fdInterestRate != null && a.fdStartDate != null;
                const fdPrincipal = isFd ? a.value : 0;
                const fdTotal = isFd ? calcFdCurrentValue(a) : 0;
                const fdInterestAmt = isFd ? fdTotal - fdPrincipal : 0;
                const fdMatured = isFd && isFdMatured(a);
                const fdMaturityMs = isFd ? fdMaturityDateMs(a) : null;

                return (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => navigation.navigate('AddEdit', { assetId: a.id })}
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
                      {isFd ? (
                        <>
                          <Text style={[styles.assetMeta, { color: theme.sub }]} numberOfLines={1}>
                            {a.fdInterestRate}% p.a.
                            {fdMaturityMs ? (fdMatured ? ' · Matured' : ` · Matures ${fmtDate(fdMaturityMs, { full: true })}`) : ''}
                          </Text>
                          <View style={styles.fdBreakdownRow}>
                            <Text style={[styles.fdBreakdownItem, { color: theme.sub }]}>
                              {'P: '}{formatMoney(convert(fdPrincipal, a.currency, baseCurrency), baseCurrency, { compact: true })}
                            </Text>
                            <Text style={[styles.fdBreakdownSep, { color: theme.faint }]}>·</Text>
                            <Text style={[styles.fdBreakdownItem, { color: theme.pos }]}>
                              {'+' + formatMoney(convert(fdInterestAmt, a.currency, baseCurrency), baseCurrency, { compact: false })}
                            </Text>
                          </View>
                        </>
                      ) : (
                        <Text style={[styles.assetMeta, { color: theme.sub }]} numberOfLines={1}>
                          {a.track
                            ? trackedSubtitle(a.track)
                            : `Updated ${relativeDay(a.updated)}${a.note ? ` · ${a.note}` : ''}`}
                        </Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {isFd ? (
                        <>
                          <Text style={[styles.assetValue, { color: theme.text }]}>
                            {formatMoney(convert(fdTotal, a.currency, baseCurrency), baseCurrency, { compact: true })}
                          </Text>
                          <Text style={[styles.assetChange, { color: fdMatured ? theme.sub : theme.pos }]}>
                            {fdMatured ? 'Matured' : `+${((fdInterestAmt / fdPrincipal) * 100).toFixed(2)}%`}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.assetValue, { color: g.cat.liability ? theme.neg : theme.text }]}>
                            {g.cat.liability ? '−' : ''}
                            {formatMoney(displayValue, baseCurrency, { compact: true })}
                          </Text>
                          {(stockTrack ?? cryptoTrack) ? (
                            <Text style={[styles.assetChange, {
                              color: (displayChangePct ?? 0) > 0 ? theme.pos : (displayChangePct ?? 0) < 0 ? theme.neg : theme.sub,
                            }]}>
                              {formatMoney(
                                activeLive?.price ?? (stockTrack ? stockTrack.price : cryptoTrack ? cryptoTrack.price : 0),
                                a.currency,
                                { compact: false, decimals: 2 },
                              )}
                              {' '}({(displayChangePct ?? 0) > 0 ? '+' : ''}{(displayChangePct ?? 0).toFixed(2)}%)
                            </Text>
                          ) : a.track && displayChangePct !== undefined ? (
                            <Text style={[styles.assetChange, {
                              color: displayChangePct > 0 ? theme.pos : displayChangePct < 0 ? theme.neg : theme.sub,
                            }]}>
                              {displayChangePct > 0 ? '+' : ''}{displayChangePct.toFixed(2)}%
                            </Text>
                          ) : diffCur ? (
                            <Text style={[styles.assetOrig, { color: theme.sub }]}>
                              {formatMoney(a.value, a.currency, { compact: true })}
                            </Text>
                          ) : null}
                        </>
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
          onPress={() => navigation.navigate('AddEdit')}
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
  assetValue:  { fontSize: 15.5, fontFamily: FONTS.groteskBold },
  assetOrig:   { fontSize: 12, marginTop: 1, fontFamily: FONTS.grotesk },
  assetChange: { fontSize: 12, marginTop: 1, fontFamily: FONTS.groteskBold },

  addBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 16, padding: 15 },
  addBtnText: { fontSize: 15, fontFamily: FONTS.jakartaBold },

  fdBreakdownRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  fdBreakdownItem: { fontSize: 11.5, fontFamily: FONTS.jakartaBold },
  fdBreakdownSep:  { fontSize: 11, fontFamily: FONTS.jakarta },
});
