import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator,
  Dimensions,
} from 'react-native';

const SCREEN_H = Dimensions.get('window').height;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import {
  searchStocksAPI, getStockQuoteAPI,
  searchCryptos, getCryptoChains, getGoldRates,
  type StockSearchResult, type CryptoInfo,
} from '../../services/marketData';
import { formatMoney, convert } from '../../utils/currency';
import { CAT } from '../../data/categories';
import type { ThemeColors, AccentDef } from '../../constants/theme';
import { FONTS } from '../../constants/fonts';

// ─── Shared field types passed down from AddEditScreen ───────────────────────

export type TrackedFormFields = {
  symbol: string;
  exchange: string;
  chain: string;
  purity: '24K' | '22K';
  qty: string;
  weight: string;
  price: number;
  changePct: number;
  name: string;
  currency: string;
};

export type TrackedErrors = {
  symbol?: boolean;
  qty?: boolean;
  weight?: boolean;
};

type Props = {
  cat: string;
  fields: TrackedFormFields;
  setField: (key: keyof TrackedFormFields, value: any) => void;
  setMany: (updates: Partial<TrackedFormFields>) => void;
  theme: ThemeColors;
  accent: AccentDef;
  base: string;
  errors: TrackedErrors;
};

// ─── TickerBadge ─────────────────────────────────────────────────────────────

function TickerBadge({ symbol, color, size = 40 }: { symbol: string; color: string; size?: number }) {
  return (
    <View style={[badgeS.wrap, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: color + '1F' }]}>
      <Text style={[badgeS.text, { fontSize: size * 0.34, color }]}>{symbol.slice(0, 4)}</Text>
    </View>
  );
}
const badgeS = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: FONTS.groteskBold, letterSpacing: -0.5 },
});

// ─── ExchangeTag ─────────────────────────────────────────────────────────────

function ExchangeTag({ label, theme }: { label: string; theme: ThemeColors }) {
  return (
    <View style={[tagS.wrap, { backgroundColor: theme.chipBg }]}>
      <Text style={[tagS.text, { color: theme.sub }]}>{label}</Text>
    </View>
  );
}
const tagS = StyleSheet.create({
  wrap: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  text: { fontSize: 10.5, fontFamily: FONTS.groteskBold, letterSpacing: 0.3, textTransform: 'uppercase' },
});

// ─── SearchResultRow ─────────────────────────────────────────────────────────
// Search API returns metadata only (no price), so price is not shown here.

type ResultRowProps = {
  symbol: string;
  name: string;
  exchange?: string;
  color: string;
  theme: ThemeColors;
  isLast: boolean;
  onPress: () => void;
};

function SearchResultRow({ symbol, name, exchange, color, theme, isLast, onPress }: ResultRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[resultS.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line }]}
    >
      <TickerBadge symbol={symbol} color={color} size={38} />
      <View style={resultS.info}>
        <View style={resultS.titleRow}>
          <Text style={[resultS.symbol, { color: theme.text }]}>{symbol}</Text>
          {exchange ? <ExchangeTag label={exchange} theme={theme} /> : null}
        </View>
        <Text style={[resultS.name, { color: theme.sub }]} numberOfLines={1}>{name}</Text>
      </View>
      <Icon name="chevR" size={16} color={theme.faint} strokeWidth={2.2} />
    </TouchableOpacity>
  );
}
const resultS = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  info:     { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  symbol:   { fontSize: 14.5, fontFamily: FONTS.jakartaBold },
  name:     { fontSize: 12.5, marginTop: 1, fontFamily: FONTS.jakarta },
});

// ─── SelectedCard ─────────────────────────────────────────────────────────────

type SelectedCardProps = {
  symbol: string;
  name: string;
  exchange?: string;
  price: number;
  changePct: number;
  currency: string;
  color: string;
  theme: ThemeColors;
  accent: AccentDef;
  onChangePress: () => void;
  quoteFetching?: boolean;
  priceUnavailable?: boolean;
};

function SelectedCard({ symbol, name, exchange, price, changePct, currency, color, theme, accent, onChangePress, quoteFetching, priceUnavailable }: SelectedCardProps) {
  const formattedPrice = formatMoney(price, currency, { decimals: price >= 1 ? 2 : 4 });
  const changeTint = changePct > 0 ? theme.pos : changePct < 0 ? theme.neg : theme.sub;

  const priceRow = quoteFetching ? (
    <View style={selectedS.priceRow}>
      <ActivityIndicator size="small" color={accent.solid} />
      <Text style={[selectedS.fetchingText, { color: theme.sub }]}>Fetching price…</Text>
    </View>
  ) : priceUnavailable ? (
    <Text style={[selectedS.unavailableText, { color: theme.sub }]}>Price unavailable</Text>
  ) : (
    <View style={selectedS.priceRow}>
      <Text style={[selectedS.price, { color: theme.text }]}>{formattedPrice}</Text>
      <View style={[selectedS.badge, { backgroundColor: changeTint + '22' }]}>
        <Text style={[selectedS.badgeText, { color: changeTint }]}>
          {changePct > 0 ? '+' : ''}{changePct.toFixed(2)}%
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[selectedS.card, { backgroundColor: theme.chipBg }]}>
      <TickerBadge symbol={symbol} color={color} size={44} />
      <View style={selectedS.info}>
        <View style={selectedS.titleRow}>
          <Text style={[selectedS.symbol, { color: theme.text }]} numberOfLines={1}>{symbol}</Text>
          {exchange ? <ExchangeTag label={exchange} theme={theme} /> : null}
        </View>
        {priceRow}
      </View>
      <TouchableOpacity onPress={onChangePress} accessibilityLabel="Change instrument">
        <Text style={[selectedS.changeBtn, { color: accent.solid }]}>Change</Text>
      </TouchableOpacity>
    </View>
  );
}
const selectedS = StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, marginBottom: 20 },
  info:      { flex: 1, minWidth: 0 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  symbol:    { fontSize: 15.5, fontFamily: FONTS.jakartaExtraBold },
  priceRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  price:     { fontSize: 13.5, fontFamily: FONTS.groteskBold },
  badge:            { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:        { fontSize: 12, fontFamily: FONTS.groteskBold },
  changeBtn:        { fontSize: 13.5, fontFamily: FONTS.jakartaBold },
  fetchingText:     { fontSize: 12.5, fontFamily: FONTS.jakarta, marginLeft: 6 },
  unavailableText:  { fontSize: 12.5, fontFamily: FONTS.jakarta, marginTop: 3 },
});

// ─── ValueReadout ─────────────────────────────────────────────────────────────

function ValueReadout({ value, currency, base, theme, accent, formulaLine }: {
  value: number; currency: string; base: string;
  theme: ThemeColors; accent: AccentDef; formulaLine: string;
}) {
  const converted = currency !== base ? convert(value, currency, base) : null;
  return (
    <View style={[readoutS.wrap, { backgroundColor: accent.solid + '0E', borderColor: accent.solid + '22' }]}>
      <Text style={[readoutS.label, { color: theme.sub }]}>POSITION VALUE</Text>
      <Text style={[readoutS.amount, { color: theme.text }]}>{formatMoney(value, currency)}</Text>
      {converted != null && (
        <Text style={[readoutS.converted, { color: theme.sub }]}>
          ≈ {formatMoney(converted, base)} in {base}
        </Text>
      )}
      <Text style={[readoutS.formula, { color: theme.sub }]}>{formulaLine}</Text>
    </View>
  );
}
const readoutS = StyleSheet.create({
  wrap:      { borderRadius: 16, padding: 16, marginBottom: 22, borderWidth: 1 },
  label:     { fontSize: 12, fontFamily: FONTS.jakartaBold, letterSpacing: 0.3, textTransform: 'uppercase' },
  amount:    { fontSize: 30, fontFamily: FONTS.groteskBold, letterSpacing: -0.6, marginTop: 4 },
  converted: { fontSize: 13.5, fontFamily: FONTS.grotesk, marginTop: 2 },
  formula:   { fontSize: 12.5, fontFamily: FONTS.jakarta, marginTop: 10, opacity: 0.8 },
});

// ─── EntryLabel / QtyField ────────────────────────────────────────────────────

function EntryLabel({ text, theme }: { text: string; theme: ThemeColors }) {
  return <Text style={[labelS.text, { color: theme.sub }]}>{text}</Text>;
}
const labelS = StyleSheet.create({
  text: { fontSize: 12.5, fontFamily: FONTS.jakartaBold, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8, marginLeft: 2 },
});

function QtyField({ value, onChangeText, placeholder, hasError, theme }: {
  value: string; onChangeText: (v: string) => void; placeholder: string;
  hasError?: boolean; theme: ThemeColors;
}) {
  return (
    <View style={[qtyS.wrap, { backgroundColor: theme.chipBg, borderColor: hasError ? theme.neg : 'transparent' }]}>
      <TextInput
        value={value}
        onChangeText={v => onChangeText(v.replace(/[^0-9.]/g, ''))}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={theme.faint}
        style={[qtyS.input, { color: theme.text }]}
      />
    </View>
  );
}
const qtyS = StyleSheet.create({
  wrap:  { borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 22 },
  input: { fontSize: 24, fontFamily: FONTS.groteskBold, paddingVertical: 12 },
});

// ─── SearchPickerModal ────────────────────────────────────────────────────────
// A bottom-sheet style overlay with a search bar + scrollable results.
// Using a Modal avoids any clipping or keyboard-position issues with
// the parent ScrollView.

type SearchPickerProps = {
  visible: boolean;
  query: string;
  onChangeQuery: (q: string) => void;
  onClose: () => void;
  placeholder: string;
  theme: ThemeColors;
  accent: AccentDef;
  children: React.ReactNode; // the result rows
};

function SearchPickerModal({
  visible, query, onChangeQuery, onClose, placeholder, theme, accent, children,
}: SearchPickerProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={[pickerS.backdrop]}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Panel — slides up from bottom */}
        <View style={[pickerS.panel, { backgroundColor: theme.cardBg, paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Drag handle */}
          <View style={pickerS.handleRow}>
            <View style={[pickerS.handle, { backgroundColor: theme.line }]} />
          </View>

          {/* Search bar */}
          <View style={[pickerS.searchWrap, { backgroundColor: theme.chipBg, borderColor: accent.solid }]}>
            <Icon name="search" size={18} color={accent.solid} strokeWidth={2.1} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={onChangeQuery}
              placeholder={placeholder}
              placeholderTextColor={theme.faint}
              style={[pickerS.searchInput, { color: theme.text }]}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {!!query && (
              <TouchableOpacity onPress={() => onChangeQuery('')}>
                <Icon name="close" size={16} color={theme.sub} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {/* Scrollable results */}
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            style={pickerS.resultsList}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const pickerS = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(8,10,15,0.45)' },
  panel:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', minHeight: SCREEN_H * 0.5, maxHeight: SCREEN_H * 0.85, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 16 },
  handleRow:   { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle:      { width: 40, height: 5, borderRadius: 5 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 16, marginBottom: 8, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 15.5, padding: 0, fontFamily: FONTS.jakarta },
  resultsList: { flex: 1 },
});

// ─── SearchTrigger ────────────────────────────────────────────────────────────
// Visually identical to the search bar but acts as a tap target to open the picker.

function SearchTrigger({ placeholder, hasError, theme, onPress }: {
  placeholder: string; hasError?: boolean; theme: ThemeColors; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[triggerS.wrap, { backgroundColor: theme.chipBg, borderColor: hasError ? theme.neg : 'transparent' }]}
      accessibilityRole="button"
    >
      <Icon name="search" size={18} color={theme.sub} strokeWidth={2.1} />
      <Text style={[triggerS.text, { color: theme.faint }]} numberOfLines={1}>{placeholder}</Text>
    </TouchableOpacity>
  );
}
const triggerS = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 22 },
  text: { flex: 1, fontSize: 15.5, fontFamily: FONTS.jakarta },
});

// ─── StockEntry ───────────────────────────────────────────────────────────────

function StockEntry({ fields, setField, setMany, theme, accent, base, errors }: Omit<Props, 'cat'>) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [quoteFetching, setQuoteFetching] = useState(false);
  const [priceUnavailable, setPriceUnavailable] = useState(false);
  const color = CAT['stocks']?.color ?? accent.solid;

  // Debounced API search — fires 350 ms after the user stops typing
  useEffect(() => {
    if (!pickerOpen) return;
    if (!query.trim()) {
      setResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    setSearchError(null);
    const timer = setTimeout(async () => {
      try {
        const data = await searchStocksAPI(query);
        setResults(data);
      } catch {
        setSearchError('Search failed. Check your connection.');
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, pickerOpen]);

  const pick = useCallback(async (s: StockSearchResult) => {
    // Close picker immediately, set basic metadata (price = 0 until quote arrives)
    setPickerOpen(false);
    setQuery('');
    setResults([]);
    setPriceUnavailable(false);
    setMany({ symbol: s.symbol, exchange: s.exchange, price: 0, changePct: 0, currency: s.currency, name: s.name });

    // Fetch real-time quote
    setQuoteFetching(true);
    try {
      const quote = await getStockQuoteAPI(s.symbol);
      if (quote) {
        setMany({ price: quote.price, changePct: quote.changePercentage, currency: s.currency });
      } else {
        setPriceUnavailable(true);
      }
    } catch {
      setPriceUnavailable(true);
    } finally {
      setQuoteFetching(false);
    }
  }, [setMany]);

  const openPicker  = () => { setQuery(''); setResults([]); setSearchError(null); setPickerOpen(true); };
  const closePicker = () => { setPickerOpen(false); setQuery(''); setResults([]); setSearchError(null); };

  if (!fields.symbol) {
    return (
      <View>
        <EntryLabel text="Find a stock" theme={theme} />

        <SearchTrigger
          placeholder="Search by name or symbol (e.g. TCS, Apple)"
          hasError={errors.symbol}
          theme={theme}
          onPress={openPicker}
        />

        <SearchPickerModal
          visible={pickerOpen}
          query={query}
          onChangeQuery={setQuery}
          onClose={closePicker}
          placeholder="Search by name or symbol (e.g. TCS, Apple)"
          theme={theme}
          accent={accent}
        >
          {searching ? (
            <View style={emptyS.wrap}>
              <ActivityIndicator color={accent.solid} />
            </View>
          ) : searchError ? (
            <View style={emptyS.wrap}>
              <Text style={[emptyS.text, { color: theme.neg }]}>{searchError}</Text>
            </View>
          ) : results.length === 0 ? (
            <View style={emptyS.wrap}>
              <Text style={[emptyS.text, { color: theme.sub }]}>
                {query.trim() ? `No results for "${query}"` : 'Type to search stocks…'}
              </Text>
            </View>
          ) : (
            results.map((s, i) => (
              <SearchResultRow
                key={s.symbol + s.exchange}
                symbol={s.symbol}
                name={s.name}
                exchange={s.exchange}
                color={color}
                theme={theme}
                isLast={i === results.length - 1}
                onPress={() => pick(s)}
              />
            ))
          )}
        </SearchPickerModal>
      </View>
    );
  }

  const qty   = parseFloat(fields.qty) || 0;
  const value = qty * fields.price;

  return (
    <View>
      <EntryLabel text="Stock" theme={theme} />
      <SelectedCard
        symbol={fields.symbol}
        name={fields.name}
        exchange={fields.exchange}
        price={fields.price}
        changePct={fields.changePct}
        currency={fields.currency}
        color={color}
        theme={theme}
        accent={accent}
        onChangePress={() => { setMany({ symbol: '', qty: '' }); setPriceUnavailable(false); }}
        quoteFetching={quoteFetching}
        priceUnavailable={priceUnavailable}
      />
      <EntryLabel text="Quantity (shares)" theme={theme} />
      <QtyField value={fields.qty} onChangeText={v => setField('qty', v)} placeholder="0" hasError={errors.qty} theme={theme} />
      {qty > 0 && fields.price > 0 && !quoteFetching && (
        <ValueReadout
          value={value}
          currency={fields.currency}
          base={base}
          theme={theme}
          accent={accent}
          formulaLine={`${qty} sh × ${formatMoney(fields.price, fields.currency, { decimals: fields.price >= 1 ? 2 : 4 })} · today ${fields.changePct > 0 ? '+' : ''}${fields.changePct.toFixed(2)}%`}
        />
      )}
    </View>
  );
}

// ─── CryptoEntry ──────────────────────────────────────────────────────────────

function CryptoEntry({ fields, setField, setMany, theme, accent, base, errors }: Omit<Props, 'cat'>) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const color = CAT['crypto']?.color ?? accent.solid;
  const chains = fields.symbol ? getCryptoChains(fields.symbol) : [];

  const results = searchCryptos(query).slice(0, 12);

  const pick = useCallback((c: CryptoInfo) => {
    setMany({ symbol: c.symbol, price: c.price, changePct: c.changePct, currency: 'USD', name: c.name, chain: c.chains[0] ?? '' });
    setPickerOpen(false);
    setQuery('');
  }, [setMany]);

  const openPicker = () => { setQuery(''); setPickerOpen(true); };
  const closePicker = () => { setPickerOpen(false); setQuery(''); };

  if (!fields.symbol) {
    return (
      <View>
        <EntryLabel text="Find a coin" theme={theme} />

        <SearchTrigger
          placeholder="Search by name or symbol (e.g. BTC, Solana)"
          hasError={errors.symbol}
          theme={theme}
          onPress={openPicker}
        />

        <SearchPickerModal
          visible={pickerOpen}
          query={query}
          onChangeQuery={setQuery}
          onClose={closePicker}
          placeholder="Search by name or symbol (e.g. BTC, Solana)"
          theme={theme}
          accent={accent}
        >
          {results.length === 0 ? (
            <View style={emptyS.wrap}>
              <Text style={[emptyS.text, { color: theme.sub }]}>
                {query ? `No match for "${query}"` : 'Type to search coins…'}
              </Text>
            </View>
          ) : (
            results.map((c: CryptoInfo, i: number) => (
              <SearchResultRow
                key={c.symbol}
                symbol={c.symbol}
                name={c.name}
                color={color}
                theme={theme}
                isLast={i === results.length - 1}
                onPress={() => pick(c)}
              />
            ))
          )}
        </SearchPickerModal>
      </View>
    );
  }

  const qty = parseFloat(fields.qty) || 0;
  const value = qty * fields.price;

  return (
    <View>
      <EntryLabel text="Coin" theme={theme} />
      <SelectedCard
        symbol={fields.symbol}
        name={fields.name}
        price={fields.price}
        changePct={fields.changePct}
        currency="USD"
        color={color}
        theme={theme}
        accent={accent}
        onChangePress={() => setMany({ symbol: '', qty: '', chain: '' })}
      />

      {chains.length > 0 && (
        <>
          <EntryLabel text="Network / chain" theme={theme} />
          <View style={chainS.row}>
            {chains.map(ch => {
              const on = fields.chain === ch;
              return (
                <TouchableOpacity
                  key={ch}
                  onPress={() => setField('chain', ch)}
                  style={[chainS.chip, { borderColor: on ? color : theme.line, backgroundColor: on ? color + '14' : theme.cardBg }]}
                >
                  <Text style={[chainS.chipText, { color: on ? color : theme.sub }]}>{ch}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      <EntryLabel text={`Amount (${fields.symbol})`} theme={theme} />
      <QtyField value={fields.qty} onChangeText={v => setField('qty', v)} placeholder="0.00" hasError={errors.qty} theme={theme} />
      {qty > 0 && (
        <ValueReadout
          value={value}
          currency="USD"
          base={base}
          theme={theme}
          accent={accent}
          formulaLine={`${qty} ${fields.symbol} × ${formatMoney(fields.price, 'USD', { decimals: fields.price >= 1 ? 2 : 4 })} · today ${fields.changePct > 0 ? '+' : ''}${fields.changePct.toFixed(2)}%`}
        />
      )}
    </View>
  );
}
const chainS = StyleSheet.create({
  row:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  chip:     { borderWidth: 1.5, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 8 },
  chipText: { fontSize: 13.5, fontFamily: FONTS.jakartaBold },
});

// ─── GoldEntry ────────────────────────────────────────────────────────────────

function GoldEntry({ fields, setField, theme, accent, base, errors }: Omit<Props, 'cat' | 'setMany'> & { setMany?: unknown }) {
  const rates = getGoldRates();
  const goldColor = CAT['gold']?.color ?? '#EAB308';
  const perGram = fields.purity === '22K' ? rates.perGram22k : rates.perGram24k;
  const weight = parseFloat(fields.weight) || 0;

  return (
    <View>
      <EntryLabel text="Purity" theme={theme} />
      <View style={goldS.purRow}>
        {(['24K', '22K'] as const).map(p => {
          const on = fields.purity === p;
          return (
            <TouchableOpacity
              key={p}
              onPress={() => setField('purity', p)}
              style={[goldS.purBtn, { borderColor: on ? goldColor : theme.line, backgroundColor: on ? goldColor + '14' : theme.cardBg }]}
            >
              <Text style={[goldS.purLabel, { color: on ? theme.text : theme.sub }]}>{p}</Text>
              <Text style={[goldS.purSub, { color: theme.sub }]}>{p === '24K' ? '99.9%' : '91.6%'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <EntryLabel text="Weight (grams)" theme={theme} />
      <QtyField value={fields.weight} onChangeText={v => setField('weight', v)} placeholder="0" hasError={errors.weight} theme={theme} />

      {weight > 0 && (
        <ValueReadout
          value={weight * perGram}
          currency={rates.currency}
          base={base}
          theme={theme}
          accent={accent}
          formulaLine={`${weight} g × ${formatMoney(perGram, rates.currency)}/g (${fields.purity}) · today +${rates.changePct.toFixed(2)}%`}
        />
      )}
    </View>
  );
}
const goldS = StyleSheet.create({
  purRow:   { flexDirection: 'row', gap: 10, marginBottom: 22 },
  purBtn:   { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 8, alignItems: 'center', gap: 3 },
  purLabel: { fontSize: 17, fontFamily: FONTS.jakartaExtraBold },
  purSub:   { fontSize: 11.5, fontFamily: FONTS.jakartaSemiBold },
});

// ─── Shared empty-state styles ────────────────────────────────────────────────
const emptyS = StyleSheet.create({
  wrap: { paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center' },
  text: { fontSize: 13.5, fontFamily: FONTS.jakarta, textAlign: 'center' },
});

// ─── TrackedEntry dispatcher ──────────────────────────────────────────────────

export function TrackedEntry({ cat, fields, setField, setMany, theme, accent, base, errors }: Props) {
  if (cat === 'stocks') return <StockEntry fields={fields} setField={setField} setMany={setMany} theme={theme} accent={accent} base={base} errors={errors} />;
  if (cat === 'crypto') return <CryptoEntry fields={fields} setField={setField} setMany={setMany} theme={theme} accent={accent} base={base} errors={errors} />;
  if (cat === 'gold')   return <GoldEntry fields={fields} setField={setField} setMany={setMany} theme={theme} accent={accent} base={base} errors={errors} />;
  return null;
}

// ─── Subtitle helper for asset list rows ─────────────────────────────────────

export function trackedSubtitle(track: import('../../types').AssetTrack): string {
  if (track.kind === 'stock')  return `${track.symbol} · ${track.exchange} · ${track.qty} sh`;
  if (track.kind === 'crypto') return `${track.qty} ${track.symbol} · ${track.chain}`;
  if (track.kind === 'gold')   return `${track.purity} · ${track.weight} g`;
  return '';
}
