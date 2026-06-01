import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Icon } from './Icon';
import {
  searchStocks, searchCryptos, getCryptoChains, getGoldRates,
  type StockInfo, type CryptoInfo,
} from '../../services/marketData';
import { formatMoney, convert } from '../../utils/currency';
import { CAT } from '../../data/categories';
import type { ThemeColors, AccentDef } from '../../constants/theme';
import { FONTS } from '../../constants/fonts';

// ─── Shared field types passed down from AddEditSheet ────────────────────────

export type TrackedFormFields = {
  symbol: string;
  exchange: string;
  chain: string;
  purity: '24K' | '22K';
  qty: string;
  weight: string;
  price: number;
  changePct: number;
  name: string;      // full instrument name (company / coin)
  currency: string;  // native currency of the instrument
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

type ResultRowProps = {
  symbol: string;
  name: string;
  exchange?: string;
  price: number;
  changePct: number;
  currency: string;
  color: string;
  theme: ThemeColors;
  isLast: boolean;
  onPress: () => void;
};

function SearchResultRow({ symbol, name, exchange, price, changePct, currency, color, theme, isLast, onPress }: ResultRowProps) {
  const decimals = price >= 1 ? 2 : 4;
  const formattedPrice = formatMoney(price, currency, { decimals });
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
      <View style={resultS.priceCol}>
        <Text style={[resultS.price, { color: theme.text }]}>{formattedPrice}</Text>
        <Text style={[resultS.change, { color: changePct > 0 ? theme.pos : changePct < 0 ? theme.neg : theme.sub }]}>
          {changePct > 0 ? '+' : ''}{changePct.toFixed(2)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}
const resultS = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 11 },
  info:     { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  symbol:   { fontSize: 14.5, fontFamily: FONTS.jakartaBold },
  name:     { fontSize: 12.5, marginTop: 1, fontFamily: FONTS.jakarta },
  priceCol: { alignItems: 'flex-end' },
  price:    { fontSize: 14, fontFamily: FONTS.groteskBold },
  change:   { fontSize: 12, fontFamily: FONTS.groteskBold },
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
};

function SelectedCard({ symbol, name, exchange, price, changePct, currency, color, theme, accent, onChangePress }: SelectedCardProps) {
  const decimals = price >= 1 ? 2 : 4;
  const formattedPrice = formatMoney(price, currency, { decimals });
  const changeTint = changePct > 0 ? theme.pos : changePct < 0 ? theme.neg : theme.sub;
  return (
    <View style={[selectedS.card, { backgroundColor: theme.chipBg }]}>
      <TickerBadge symbol={symbol} color={color} size={44} />
      <View style={selectedS.info}>
        <View style={selectedS.titleRow}>
          <Text style={[selectedS.symbol, { color: theme.text }]} numberOfLines={1}>{symbol}</Text>
          {exchange ? <ExchangeTag label={exchange} theme={theme} /> : null}
        </View>
        <View style={selectedS.priceRow}>
          <Text style={[selectedS.price, { color: theme.text }]}>{formattedPrice}</Text>
          <View style={[selectedS.badge, { backgroundColor: changeTint + '22' }]}>
            <Text style={[selectedS.badgeText, { color: changeTint }]}>
              {changePct > 0 ? '+' : ''}{changePct.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={onChangePress} accessibilityLabel="Change instrument">
        <Text style={[selectedS.changeBtn, { color: accent.solid }]}>Change</Text>
      </TouchableOpacity>
    </View>
  );
}
const selectedS = StyleSheet.create({
  card:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, marginBottom: 20 },
  info:       { flex: 1, minWidth: 0 },
  titleRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  symbol:     { fontSize: 15.5, fontFamily: FONTS.jakartaExtraBold },
  priceRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  price:      { fontSize: 13.5, fontFamily: FONTS.groteskBold },
  badge:      { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:  { fontSize: 12, fontFamily: FONTS.groteskBold },
  changeBtn:  { fontSize: 13.5, fontFamily: FONTS.jakartaBold },
});

// ─── ValueReadout ─────────────────────────────────────────────────────────────

function ValueReadout({
  value, currency, base, theme, accent, formulaLine,
}: {
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

// ─── EntryLabel ──────────────────────────────────────────────────────────────

function EntryLabel({ text, theme }: { text: string; theme: ThemeColors }) {
  return (
    <Text style={[labelS.text, { color: theme.sub }]}>{text}</Text>
  );
}
const labelS = StyleSheet.create({
  text: { fontSize: 12.5, fontFamily: FONTS.jakartaBold, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8, marginLeft: 2 },
});

// ─── QtyField ────────────────────────────────────────────────────────────────

function QtyField({
  value, onChangeText, placeholder, hasError, theme,
}: {
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

// ─── SearchBar ───────────────────────────────────────────────────────────────

function SearchBar({
  value, onChangeText, placeholder, hasError, theme,
}: {
  value: string; onChangeText: (v: string) => void; placeholder: string;
  hasError?: boolean; theme: ThemeColors;
}) {
  return (
    <View style={[searchBarS.wrap, { backgroundColor: theme.chipBg, borderColor: hasError ? theme.neg : 'transparent' }]}>
      <Icon name="search" size={18} color={theme.sub} strokeWidth={2.1} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.faint}
        style={[searchBarS.input, { color: theme.text }]}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {!!value && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Icon name="close" size={16} color={theme.sub} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );
}
const searchBarS = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  input: { flex: 1, fontSize: 15.5, padding: 0, fontFamily: FONTS.jakarta },
});

// ─── StockEntry ───────────────────────────────────────────────────────────────

function StockEntry({ fields, setField, setMany, theme, accent, base, errors }: Omit<Props, 'cat'>) {
  const [searchQ, setSearchQ] = useState('');
  const color = CAT['stocks']?.color ?? accent.solid;
  const results = searchStocks(searchQ).slice(0, 8);

  if (!fields.symbol) {
    return (
      <View>
        <EntryLabel text="Find a stock" theme={theme} />
        <SearchBar
          value={searchQ}
          onChangeText={setSearchQ}
          placeholder="Search by name or symbol (e.g. TCS, Apple)"
          hasError={errors.symbol}
          theme={theme}
        />
        <View style={[listS.wrap, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
          {results.length === 0 ? (
            <Text style={[listS.empty, { color: theme.sub }]}>
              {searchQ ? `No match for "${searchQ}"` : 'Type to search stocks…'}
            </Text>
          ) : (
            results.map((s: StockInfo, i: number) => (
              <SearchResultRow
                key={s.symbol + s.exchange}
                symbol={s.symbol}
                name={s.name}
                exchange={s.exchange}
                price={s.price}
                changePct={s.changePct}
                currency={s.currency}
                color={color}
                theme={theme}
                isLast={i === results.length - 1}
                onPress={() => setMany({ symbol: s.symbol, exchange: s.exchange, price: s.price, changePct: s.changePct, currency: s.currency, name: s.name })}
              />
            ))
          )}
        </View>
      </View>
    );
  }

  const qty = parseFloat(fields.qty) || 0;
  const value = qty * fields.price;
  const priceDecimals = fields.price >= 1 ? 2 : 4;

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
        onChangePress={() => setMany({ symbol: '', qty: '' })}
      />
      <EntryLabel text="Quantity (shares)" theme={theme} />
      <QtyField value={fields.qty} onChangeText={v => setField('qty', v)} placeholder="0" hasError={errors.qty} theme={theme} />
      {qty > 0 && (
        <ValueReadout
          value={value}
          currency={fields.currency}
          base={base}
          theme={theme}
          accent={accent}
          formulaLine={`${qty} sh × ${formatMoney(fields.price, fields.currency, { decimals: priceDecimals })} · today ${fields.changePct > 0 ? '+' : ''}${fields.changePct.toFixed(2)}%`}
        />
      )}
    </View>
  );
}

// ─── CryptoEntry ──────────────────────────────────────────────────────────────

function CryptoEntry({ fields, setField, setMany, theme, accent, base, errors }: Omit<Props, 'cat'>) {
  const [searchQ, setSearchQ] = useState('');
  const color = CAT['crypto']?.color ?? accent.solid;
  const results = searchCryptos(searchQ).slice(0, 8);
  const chains = fields.symbol ? getCryptoChains(fields.symbol) : [];

  if (!fields.symbol) {
    return (
      <View>
        <EntryLabel text="Find a coin" theme={theme} />
        <SearchBar
          value={searchQ}
          onChangeText={setSearchQ}
          placeholder="Search by name or symbol (e.g. BTC, Solana)"
          hasError={errors.symbol}
          theme={theme}
        />
        <View style={[listS.wrap, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
          {results.length === 0 ? (
            <Text style={[listS.empty, { color: theme.sub }]}>
              {searchQ ? `No match for "${searchQ}"` : 'Type to search coins…'}
            </Text>
          ) : (
            results.map((c: CryptoInfo, i: number) => (
              <SearchResultRow
                key={c.symbol}
                symbol={c.symbol}
                name={c.name}
                price={c.price}
                changePct={c.changePct}
                currency="USD"
                color={color}
                theme={theme}
                isLast={i === results.length - 1}
                onPress={() => setMany({ symbol: c.symbol, price: c.price, changePct: c.changePct, currency: 'USD', name: c.name, chain: c.chains[0] ?? '' })}
              />
            ))
          )}
        </View>
      </View>
    );
  }

  const qty = parseFloat(fields.qty) || 0;
  const value = qty * fields.price;
  const priceDecimals = fields.price >= 1 ? 2 : 4;

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
                  style={[chainS.chip, {
                    borderColor: on ? color : theme.line,
                    backgroundColor: on ? color + '14' : theme.cardBg,
                  }]}
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
          formulaLine={`${qty} ${fields.symbol} × ${formatMoney(fields.price, 'USD', { decimals: priceDecimals })} · today ${fields.changePct > 0 ? '+' : ''}${fields.changePct.toFixed(2)}%`}
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
  const value = weight * perGram;

  return (
    <View>
      <EntryLabel text="Purity" theme={theme} />
      <View style={goldS.purRow}>
        {(['24K', '22K'] as const).map(p => {
          const on = fields.purity === p;
          const sub = p === '24K' ? '99.9%' : '91.6%';
          return (
            <TouchableOpacity
              key={p}
              onPress={() => setField('purity', p)}
              style={[goldS.purBtn, {
                borderColor: on ? goldColor : theme.line,
                backgroundColor: on ? goldColor + '14' : theme.cardBg,
              }]}
            >
              <Text style={[goldS.purLabel, { color: on ? theme.text : theme.sub }]}>{p}</Text>
              <Text style={[goldS.purSub, { color: theme.sub }]}>{sub}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <EntryLabel text="Weight (grams)" theme={theme} />
      <QtyField value={fields.weight} onChangeText={v => setField('weight', v)} placeholder="0" hasError={errors.weight} theme={theme} />

      {weight > 0 && (
        <ValueReadout
          value={value}
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

// ─── ListWrapper styles ───────────────────────────────────────────────────────
const listS = StyleSheet.create({
  wrap:  { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 22 },
  empty: { padding: 16, textAlign: 'center', fontSize: 13.5, fontFamily: FONTS.jakarta },
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
