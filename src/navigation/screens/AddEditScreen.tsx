import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Switch,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../../components/common/Icon';
import { TrackedEntry, type TrackedFormFields, type TrackedErrors } from '../../components/common/TrackedEntry';
import { CATEGORIES, CAT } from '../../data/categories';
import { CURRENCIES, CUR, convert, formatMoney } from '../../utils/currency';
import { advanceByFrequency, fmtDate } from '../../utils/date';
import { fdTotalDurationDays } from '../../utils/fd';
import { getGoldRates, isTrackedCat } from '../../services/marketData';
import type { AssetCategory, AssetTrack, RecurringContributionFrequency } from '../../types';
import { FONTS } from '../../constants/fonts';

export type AddEditScreenParams = { assetId?: string };

type RouteType = RouteProp<{ AddEdit: AddEditScreenParams }, 'AddEdit'>;

const RECURRING_CONTRIBUTION_FREQUENCIES: { label: string; value: RecurringContributionFrequency }[] = [
  { label: 'Daily',     value: 'DAILY' },
  { label: 'Weekly',    value: 'WEEKLY' },
  { label: 'Monthly',   value: 'MONTHLY' },
  { label: 'Quarterly', value: 'QUARTERLY' },
  { label: 'Yearly',    value: 'YEARLY' },
];

type FormState = {
  cat: AssetCategory;
  name: string;
  value: string;
  currency: string;
  note: string;
  recurringContributionEnabled: boolean;
  recurringContributionAmount: string;
  recurringContributionFrequency: RecurringContributionFrequency;
  symbol: string;
  exchange: string;
  instrumentKey: string;
  cryptoId: number;
  purity: '24K' | '22K';
  qty: string;
  weight: string;
  price: number;
  changePct: number;
  // Fixed Deposit fields
  fdInterestRate: string;
  fdDurationYears: string;
  fdDurationMonths: string;
  fdDurationDays: string;
  fdStartDay: string;
  fdStartMonth: string;
  fdStartYear: string;
  // Mutual Fund fields
  mfSchemeCode: number;
  mfSchemeName: string;
  mfUnits: string;
  mfAmount: string;
  mfNav: number;
  mfNavDate: string;
};

type FormErrors = {
  name?: boolean;
  value?: boolean;
  recurringContributionAmount?: boolean;
  symbol?: boolean;
  qty?: boolean;
  weight?: boolean;
  price?: boolean;
  fdInterestRate?: boolean;
  fdDuration?: boolean;
  fdStartDate?: boolean;
  mfScheme?: boolean;
  mfQty?: boolean;
};

function todayParts(): { fdStartDay: string; fdStartMonth: string; fdStartYear: string } {
  const d = new Date();
  return {
    fdStartDay:   String(d.getDate()).padStart(2, '0'),
    fdStartMonth: String(d.getMonth() + 1).padStart(2, '0'),
    fdStartYear:  String(d.getFullYear()),
  };
}

function blankForm(currency: string): FormState {
  return {
    cat: 'bank',
    name: '',
    value: '',
    currency,
    note: '',
    recurringContributionEnabled: false,
    recurringContributionAmount: '',
    recurringContributionFrequency: 'MONTHLY',
    symbol: '',
    exchange: '',
    instrumentKey: '',
    cryptoId: 0,
    purity: '24K',
    qty: '',
    weight: '',
    price: 0,
    changePct: 0,
    fdInterestRate: '',
    fdDurationYears: '',
    fdDurationMonths: '',
    fdDurationDays: '',
    ...todayParts(),
    mfSchemeCode: 0,
    mfSchemeName: '',
    mfUnits: '',
    mfAmount: '',
    mfNav: 0,
    mfNavDate: '',
  };
}

export function AddEditScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    assets, saveAsset, setDeleteTarget,
    customCategories, openCategoriesSheetForCreate, baseCurrency,
  } = useAppState();
  const { theme, accent } = useTheme();

  const { assetId } = route.params ?? {};
  const editingAsset = useMemo(
    () => (assetId ? (assets.find(a => a.id === assetId) ?? null) : null),
    [assetId, assets],
  );

  const [form, setForm] = useState<FormState>(() => blankForm(baseCurrency));
  const [errors, setErrors] = useState<FormErrors>({});

  // Populate form when editing
  useEffect(() => {
    setErrors({});
    if (editingAsset) {
      const tk = editingAsset.track;
      const startDate = editingAsset.fdStartDate ? new Date(editingAsset.fdStartDate) : new Date();
      setForm({
        cat: editingAsset.cat,
        name: editingAsset.name,
        value: String(editingAsset.value),
        currency: editingAsset.currency,
        note: editingAsset.note ?? '',
        recurringContributionEnabled: editingAsset.cat === 'rd' || editingAsset.recurringContributionEnabled === 1,
        recurringContributionAmount: editingAsset.recurringContributionAmount
          ? String(editingAsset.recurringContributionAmount)
          : '',
        recurringContributionFrequency: editingAsset.recurringContributionFrequency ?? 'MONTHLY',
        symbol:       tk && (tk.kind === 'stock' || tk.kind === 'crypto') ? tk.symbol       : '',
        exchange:     tk && tk.kind === 'stock'  ? tk.exchange     : '',
        instrumentKey: tk && tk.kind === 'stock'  ? tk.instrumentKey : '',
        cryptoId:      tk && tk.kind === 'crypto' ? tk.cryptoId      : 0,
        purity:    tk && tk.kind === 'gold'   ? tk.purity    : '24K',
        qty:       tk && (tk.kind === 'stock' || tk.kind === 'crypto') ? String(tk.qty)    : '',
        weight:    tk && tk.kind === 'gold'   ? String(tk.weight) : '',
        price:     tk && (tk.kind === 'stock' || tk.kind === 'crypto') ? tk.price : (tk?.kind === 'gold' ? tk.perGram : 0),
        changePct: tk && tk.kind !== 'mutual_fund' ? tk.changePct : 0,
        fdInterestRate:  editingAsset.fdInterestRate  != null ? String(editingAsset.fdInterestRate)  : '',
        fdDurationYears: editingAsset.fdDurationYears != null ? String(editingAsset.fdDurationYears) : '',
        fdDurationMonths:editingAsset.fdDurationMonths!= null ? String(editingAsset.fdDurationMonths): '',
        fdDurationDays:  editingAsset.fdDurationDays  != null ? String(editingAsset.fdDurationDays)  : '',
        fdStartDay:   String(startDate.getDate()).padStart(2, '0'),
        fdStartMonth: String(startDate.getMonth() + 1).padStart(2, '0'),
        fdStartYear:  String(startDate.getFullYear()),
        mfSchemeCode: tk?.kind === 'mutual_fund' ? tk.schemeCode : 0,
        mfSchemeName: tk?.kind === 'mutual_fund' ? tk.schemeName : '',
        mfUnits:      tk?.kind === 'mutual_fund' ? String(tk.units) : '',
        mfAmount:     tk?.kind === 'mutual_fund' ? (tk.units * tk.nav).toFixed(2) : '',
        mfNav:        tk?.kind === 'mutual_fund' ? tk.nav : 0,
        mfNavDate:    tk?.kind === 'mutual_fund' ? tk.navDate : '',
      });
    } else {
      setForm(blankForm(baseCurrency));
    }
  }, [editingAsset]);

  // ── Field setters ──────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setField = (key: keyof FormState, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const setMany = (updates: Partial<FormState>) =>
    setForm(prev => ({ ...prev, ...updates }));

  const chooseCat = (id: string) => {
    if (id === form.cat) return;
    setForm(prev => ({
      ...prev, cat: id, symbol: '', instrumentKey: '', cryptoId: 0, qty: '', weight: '',
      ...(id !== 'fd' ? { fdInterestRate: '', fdDurationYears: '', fdDurationMonths: '', fdDurationDays: '' } : {}),
      ...(id !== 'mf' ? { mfSchemeCode: 0, mfSchemeName: '', mfUnits: '', mfAmount: '', mfNav: 0, mfNavDate: '' } : {}),
      // Always reset RC toggle; RD is the only category where it starts on
      recurringContributionEnabled: id === 'rd',
    }));
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const allCategories = useMemo(
    () => [...CATEGORIES, ...customCategories],
    [customCategories],
  );
  const customCatMap = useMemo(
    () => Object.fromEntries(customCategories.map(c => [c.id, c])),
    [customCategories],
  );
  const isLiability = CAT[form.cat]?.liability ?? customCatMap[form.cat]?.liability ?? false;
  const tracked = isTrackedCat(form.cat);

  // Auto-select a newly created custom category
  const prevCustomCatCount = useRef(customCategories.length);
  useEffect(() => {
    if (customCategories.length > prevCustomCatCount.current) {
      const newest = customCategories[customCategories.length - 1];
      if (newest) setField('cat', newest.id);
    }
    prevCustomCatCount.current = customCategories.length;
  }, [customCategories.length]);

  const rcAmountVal = parseFloat(form.recurringContributionAmount.replace(/,/g, ''));

  const nextDueDisplay = useMemo(() => {
    if (!form.recurringContributionEnabled || !(rcAmountVal > 0)) return null;
    const existing = editingAsset?.recurringContributionNextDue;
    const freqChanged = editingAsset?.recurringContributionFrequency !== form.recurringContributionFrequency;
    if (existing && existing > Date.now() && !freqChanged) return existing;
    return advanceByFrequency(Date.now(), form.recurringContributionFrequency);
  }, [form.recurringContributionEnabled, form.recurringContributionAmount, form.recurringContributionFrequency, editingAsset]);

  // ── Mutual Fund submit ────────────────────────────────────────────────────
  function submitMF() {
    const errs: FormErrors = {};
    if (!form.mfSchemeCode) errs.mfScheme = true;
    const unitsVal = parseFloat(form.mfUnits);
    const amountVal = parseFloat(form.mfAmount);
    if (!(unitsVal > 0) && !(amountVal > 0)) errs.mfQty = true;
    if (!(form.mfNav > 0)) errs.price = true;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const finalUnits  = unitsVal > 0 ? unitsVal : amountVal / form.mfNav;
    const finalValue  = finalUnits * form.mfNav;

    let rcNextDue: number | null = null;
    if (form.recurringContributionEnabled && rcAmountVal > 0) {
      const existing = editingAsset?.recurringContributionNextDue;
      const freqChanged = editingAsset?.recurringContributionFrequency !== form.recurringContributionFrequency;
      rcNextDue = (existing && existing > Date.now() && !freqChanged)
        ? existing
        : advanceByFrequency(Date.now(), form.recurringContributionFrequency);
    }

    saveAsset({
      id: editingAsset?.id,
      cat: 'mf',
      name: form.mfSchemeName,
      value: finalValue,
      currency: 'INR',
      note: form.note.trim(),
      track: { kind: 'mutual_fund', schemeCode: form.mfSchemeCode, schemeName: form.mfSchemeName, units: finalUnits, nav: form.mfNav, navDate: form.mfNavDate },
      recurringContributionEnabled: form.recurringContributionEnabled ? 1 : 0,
      recurringContributionAmount: form.recurringContributionEnabled ? rcAmountVal : null,
      recurringContributionFrequency: form.recurringContributionEnabled ? form.recurringContributionFrequency : null,
      recurringContributionNextDue: rcNextDue,
      recurringContributionLastApplied: editingAsset?.recurringContributionLastApplied ?? null,
    });
    navigation.goBack();
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  function submit() {
    if (form.cat === 'mf') { submitMF(); return; }
    if (tracked) { submitTracked(); return; }

    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = true;
    const assetValue = parseFloat(form.value.replace(/,/g, ''));
    if (!assetValue || assetValue <= 0) errs.value = true;
    if (form.recurringContributionEnabled && !(rcAmountVal > 0)) errs.recurringContributionAmount = true;

    let fdInterestRate: number | null = null;
    let fdDurationYears: number | null = null;
    let fdDurationMonths: number | null = null;
    let fdDurationDays: number | null = null;
    let fdStartDate: number | null = null;

    if (form.cat === 'fd') {
      const rate = parseFloat(form.fdInterestRate);
      if (!rate || rate <= 0) errs.fdInterestRate = true;
      else fdInterestRate = rate;

      const yrs = parseInt(form.fdDurationYears || '0', 10);
      const mos = parseInt(form.fdDurationMonths || '0', 10);
      const dys = parseInt(form.fdDurationDays || '0', 10);
      if (fdTotalDurationDays(yrs, mos, dys) <= 0) errs.fdDuration = true;
      else { fdDurationYears = yrs || null; fdDurationMonths = mos || null; fdDurationDays = dys || null; }

      const d = parseInt(form.fdStartDay, 10);
      const m = parseInt(form.fdStartMonth, 10);
      const y = parseInt(form.fdStartYear, 10);
      const parsed = new Date(y, m - 1, d).getTime();
      if (!d || !m || !y || isNaN(parsed)) errs.fdStartDate = true;
      else fdStartDate = parsed;
    } else if (form.cat === 'rd') {
      const rate = parseFloat(form.fdInterestRate);
      if (rate > 0) fdInterestRate = rate;
      const d = parseInt(form.fdStartDay, 10);
      const m = parseInt(form.fdStartMonth, 10);
      const y = parseInt(form.fdStartYear, 10);
      const parsed = new Date(y, m - 1, d).getTime();
      if (d && m && y && !isNaN(parsed)) fdStartDate = parsed;
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const rcOn = form.cat === 'rd' ? true : form.recurringContributionEnabled;
    let rcNextDue: number | null = null;
    if (rcOn && rcAmountVal > 0) {
      const existing = editingAsset?.recurringContributionNextDue;
      const freqChanged = editingAsset?.recurringContributionFrequency !== form.recurringContributionFrequency;
      rcNextDue = (existing && existing > Date.now() && !freqChanged)
        ? existing
        : advanceByFrequency(Date.now(), form.recurringContributionFrequency);
    }

    saveAsset({
      id: editingAsset?.id,
      cat: form.cat,
      name: form.name.trim(),
      value: assetValue,
      currency: form.currency,
      note: form.note.trim(),
      track: null,
      recurringContributionEnabled: rcOn ? 1 : 0,
      recurringContributionAmount: rcOn ? rcAmountVal : null,
      recurringContributionFrequency: rcOn ? form.recurringContributionFrequency : null,
      recurringContributionNextDue: rcNextDue,
      recurringContributionLastApplied: editingAsset?.recurringContributionLastApplied ?? null,
      fdInterestRate,
      fdDurationYears,
      fdDurationMonths,
      fdDurationDays,
      fdStartDate,
    });
    navigation.goBack();
  }

  function submitTracked() {
    if (form.recurringContributionEnabled && !(rcAmountVal > 0)) {
      setErrors({ recurringContributionAmount: true });
      return;
    }

    let rcNextDue: number | null = null;
    if (form.recurringContributionEnabled && rcAmountVal > 0) {
      const existing = editingAsset?.recurringContributionNextDue;
      const freqChanged = editingAsset?.recurringContributionFrequency !== form.recurringContributionFrequency;
      rcNextDue = (existing && existing > Date.now() && !freqChanged)
        ? existing
        : advanceByFrequency(Date.now(), form.recurringContributionFrequency);
    }
    const rcFields = {
      recurringContributionEnabled: form.recurringContributionEnabled ? 1 : 0,
      recurringContributionAmount: form.recurringContributionEnabled ? rcAmountVal : null,
      recurringContributionFrequency: form.recurringContributionEnabled ? form.recurringContributionFrequency : null,
      recurringContributionNextDue: rcNextDue,
      recurringContributionLastApplied: editingAsset?.recurringContributionLastApplied ?? null,
    } as const;

    if (form.cat === 'gold') {
      const w = parseFloat(form.weight);
      if (!w || w <= 0) { setErrors({ weight: true }); return; }
      const rates = getGoldRates();
      const perGram = form.purity === '22K' ? rates.perGram22k : rates.perGram24k;
      saveAsset({
        id: editingAsset?.id,
        cat: 'gold',
        name: form.purity + ' Gold',
        value: w * perGram,
        currency: rates.currency,
        note: form.note.trim(),
        track: { kind: 'gold', purity: form.purity, weight: w, perGram, changePct: rates.changePct },
        ...rcFields,
      });
      navigation.goBack();
      return;
    }

    const errs: FormErrors = {};
    const qty = parseFloat(form.qty);
    if (!form.symbol) errs.symbol = true;
    if (!qty || qty <= 0) errs.qty = true;
    if (form.cat === 'stocks' && (!form.price || form.price <= 0)) errs.price = true;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const track: AssetTrack = form.cat === 'crypto'
      ? { kind: 'crypto', cryptoId: form.cryptoId, symbol: form.symbol, qty, price: form.price, changePct: form.changePct, name: form.name }
      : { kind: 'stock',  symbol: form.symbol, exchange: form.exchange, instrumentKey: form.instrumentKey, qty, price: form.price, changePct: form.changePct, name: form.name, currency: form.currency };

    saveAsset({
      id: editingAsset?.id,
      cat: form.cat,
      name: form.name || form.symbol,
      value: qty * form.price,
      currency: form.currency,
      note: form.note.trim(),
      track,
      ...rcFields,
    });
    navigation.goBack();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const trackedFields: TrackedFormFields = {
    symbol: form.symbol, exchange: form.exchange, instrumentKey: form.instrumentKey, cryptoId: form.cryptoId,
    purity: form.purity, qty: form.qty, weight: form.weight,
    price: form.price, changePct: form.changePct,
    name: form.name, currency: form.currency,
    mfSchemeCode: form.mfSchemeCode, mfSchemeName: form.mfSchemeName,
    mfUnits: form.mfUnits, mfAmount: form.mfAmount,
    mfNav: form.mfNav, mfNavDate: form.mfNavDate,
  };
  const trackedErrors: TrackedErrors = {
    symbol: errors.symbol, qty: errors.qty, weight: errors.weight, price: errors.price,
    mfScheme: errors.mfScheme, mfQty: errors.mfQty,
  };
  const convertedValue = !tracked && form.currency !== 'INR' && parseFloat(form.value) > 0
    ? convert(parseFloat(form.value) || 0, form.currency, 'INR')
    : null;

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
            {editingAsset ? 'Edit Asset' : 'New Asset'}
          </Text>
          <TouchableOpacity onPress={submit} style={styles.ghostBtn}>
            <Text style={[styles.ghostBtnText, { color: accent.solid, fontFamily: FONTS.jakartaBold }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* ── Form ───────────────────────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) + 28 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category grid */}
          <Text style={[styles.fieldLabel, { color: theme.sub }]}>CATEGORY</Text>
          <View style={styles.catGrid}>
            {allCategories.map(c => {
              const isSelected = form.cat === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => chooseCat(c.id)}
                  style={[styles.catBtn, {
                    borderColor: isSelected ? c.color : theme.line,
                    backgroundColor: isSelected ? c.color + '22' : theme.chipBg,
                  }]}
                  accessibilityLabel={c.label}
                >
                  <Icon name={c.icon as any} size={21} color={c.color} strokeWidth={2.1} />
                  <Text style={[styles.catBtnText, { color: isSelected ? theme.text : theme.sub }]}>
                    {c.short}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={openCategoriesSheetForCreate}
              style={[styles.catBtn, styles.catBtnNew, { borderColor: theme.line, backgroundColor: theme.chipBg }]}
              accessibilityLabel="New category"
              accessibilityRole="button"
            >
              <Icon name="plus" size={21} color={theme.sub} strokeWidth={2.3} />
              <Text style={[styles.catBtnText, { color: theme.sub }]}>New</Text>
            </TouchableOpacity>
          </View>

          {/* Tracked entry or manual fields */}
          {tracked ? (
            <TrackedEntry
              cat={form.cat}
              fields={trackedFields}
              setField={(key, value) => setField(key as keyof FormState, value)}
              setMany={updates => setMany(updates as Partial<FormState>)}
              theme={theme}
              accent={accent}
              base={baseCurrency}
              errors={trackedErrors}
            />
          ) : (
            <>
              <Text style={[styles.fieldLabel, { color: theme.sub }]}>ASSET NAME</Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.chipBg, borderColor: errors.name ? theme.neg : 'transparent' }]}>
                    <TextInput
                      value={form.name}
                      onChangeText={v => setField('name', v)}
                      placeholder={isLiability ? 'e.g. Home Loan' : form.cat === 'fd' ? 'e.g. SBI Fixed Deposit' : 'e.g. HDFC Savings'}
                      placeholderTextColor={theme.faint}
                      style={[styles.input, { color: theme.text }]}
                      maxLength={60}
                    />
                  </View>

                  <Text style={[styles.fieldLabel, { color: theme.sub }]}>
                    {isLiability ? 'OUTSTANDING AMOUNT' : form.cat === 'fd' ? 'PRINCIPAL AMOUNT' : form.cat === 'rd' ? 'INITIAL AMOUNT' : 'CURRENT VALUE'}
                  </Text>
                  <View style={[styles.valueBox, { backgroundColor: theme.chipBg, borderColor: errors.value ? theme.neg : 'transparent' }]}>
                    <Text style={[styles.currencySymbol, { color: theme.sub }]}>{CUR[form.currency]?.symbol}</Text>
                    <TextInput
                      value={form.value}
                      onChangeText={v => setField('value', v.replace(/[^0-9.]/g, ''))}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={theme.faint}
                      style={[styles.valueInput, { color: theme.text }]}
                    />
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyRow}>
                    {CURRENCIES.map(c => {
                      const isSelected = form.currency === c.code;
                      return (
                        <TouchableOpacity
                          key={c.code}
                          onPress={() => setField('currency', c.code)}
                          style={[styles.currencyChip, {
                            borderColor: isSelected ? accent.solid : theme.line,
                            backgroundColor: isSelected ? accent.solid + '20' : theme.chipBg,
                          }]}
                        >
                          <Text style={[styles.currencyChipText, { color: isSelected ? accent.solid : theme.sub }]}>
                            {c.symbol} {c.code}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {convertedValue != null && (
                    <Text style={[styles.convertedHint, { color: theme.sub }]}>
                      ≈ {formatMoney(convertedValue, 'INR')} in INR
                    </Text>
                  )}


              {/* ── Fixed Deposit fields ────────────────────────────────── */}
              {form.cat === 'fd' && (
                <>
                  <Text style={[styles.fieldLabel, { color: theme.sub, marginTop: 4 }]}>INTEREST RATE (% P.A.)</Text>
                  <View style={[styles.valueBox, { backgroundColor: theme.chipBg, borderColor: errors.fdInterestRate ? theme.neg : 'transparent' }]}>
                    <TextInput
                      value={form.fdInterestRate}
                      onChangeText={v => setField('fdInterestRate', v.replace(/[^0-9.]/g, ''))}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 7.5"
                      placeholderTextColor={theme.faint}
                      style={[styles.valueInput, { color: theme.text }]}
                    />
                    <Text style={[styles.currencySymbol, { color: theme.sub, marginRight: 12 }]}>%</Text>
                  </View>

                  <Text style={[styles.fieldLabel, { color: theme.sub }]}>DURATION</Text>
                  <View style={styles.fdDurationRow}>
                    <View style={[styles.fdDurationBox, { backgroundColor: theme.chipBg, borderColor: errors.fdDuration ? theme.neg : 'transparent' }]}>
                      <TextInput
                        value={form.fdDurationYears}
                        onChangeText={v => setField('fdDurationYears', v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={theme.faint}
                        style={[styles.fdDurationInput, { color: theme.text }]}
                        maxLength={2}
                      />
                      <Text style={[styles.fdDurationUnit, { color: theme.sub }]}>Yr</Text>
                    </View>
                    <View style={[styles.fdDurationBox, { backgroundColor: theme.chipBg, borderColor: errors.fdDuration ? theme.neg : 'transparent' }]}>
                      <TextInput
                        value={form.fdDurationMonths}
                        onChangeText={v => setField('fdDurationMonths', v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={theme.faint}
                        style={[styles.fdDurationInput, { color: theme.text }]}
                        maxLength={2}
                      />
                      <Text style={[styles.fdDurationUnit, { color: theme.sub }]}>Mo</Text>
                    </View>
                    <View style={[styles.fdDurationBox, { backgroundColor: theme.chipBg, borderColor: errors.fdDuration ? theme.neg : 'transparent' }]}>
                      <TextInput
                        value={form.fdDurationDays}
                        onChangeText={v => setField('fdDurationDays', v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={theme.faint}
                        style={[styles.fdDurationInput, { color: theme.text }]}
                      />
                      <Text style={[styles.fdDurationUnit, { color: theme.sub }]}>Day</Text>
                    </View>
                  </View>
                  {errors.fdDuration && (
                    <Text style={[styles.fdErrorHint, { color: theme.neg }]}>Enter at least one duration value</Text>
                  )}

                  <Text style={[styles.fieldLabel, { color: theme.sub }]}>INVESTMENT DATE</Text>
                  <View style={styles.fdDateRow}>
                    <View style={[styles.fdDateBox, { backgroundColor: theme.chipBg, borderColor: errors.fdStartDate ? theme.neg : 'transparent' }]}>
                      <TextInput
                        value={form.fdStartDay}
                        onChangeText={v => setField('fdStartDay', v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="DD"
                        placeholderTextColor={theme.faint}
                        style={[styles.fdDateInput, { color: theme.text }]}
                        maxLength={2}
                      />
                      <Text style={[styles.fdDurationUnit, { color: theme.sub }]}>DD</Text>
                    </View>
                    <Text style={[styles.fdDateSep, { color: theme.faint }]}>/</Text>
                    <View style={[styles.fdDateBox, { backgroundColor: theme.chipBg, borderColor: errors.fdStartDate ? theme.neg : 'transparent' }]}>
                      <TextInput
                        value={form.fdStartMonth}
                        onChangeText={v => setField('fdStartMonth', v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="MM"
                        placeholderTextColor={theme.faint}
                        style={[styles.fdDateInput, { color: theme.text }]}
                        maxLength={2}
                      />
                      <Text style={[styles.fdDurationUnit, { color: theme.sub }]}>MM</Text>
                    </View>
                    <Text style={[styles.fdDateSep, { color: theme.faint }]}>/</Text>
                    <View style={[styles.fdDateBox, { flex: 1.4, backgroundColor: theme.chipBg, borderColor: errors.fdStartDate ? theme.neg : 'transparent' }]}>
                      <TextInput
                        value={form.fdStartYear}
                        onChangeText={v => setField('fdStartYear', v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="YYYY"
                        placeholderTextColor={theme.faint}
                        style={[styles.fdDateInput, { color: theme.text }]}
                        maxLength={4}
                      />
                      <Text style={[styles.fdDurationUnit, { color: theme.sub }]}>YYYY</Text>
                    </View>
                  </View>
                  {errors.fdStartDate && (
                    <Text style={[styles.fdErrorHint, { color: theme.neg }]}>Enter a valid investment date</Text>
                  )}
                </>
              )}

              {/* ── Recurring Deposit fields ──────────────────────────────── */}
              {form.cat === 'rd' && (
                <>
                  <Text style={[styles.fieldLabel, { color: theme.sub, marginTop: 4 }]}>INTEREST RATE (% P.A.)</Text>
                  <View style={[styles.valueBox, { backgroundColor: theme.chipBg, borderColor: errors.fdInterestRate ? theme.neg : 'transparent' }]}>
                    <TextInput
                      value={form.fdInterestRate}
                      onChangeText={v => setField('fdInterestRate', v.replace(/[^0-9.]/g, ''))}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 7.0"
                      placeholderTextColor={theme.faint}
                      style={[styles.valueInput, { color: theme.text }]}
                    />
                    <Text style={[styles.currencySymbol, { color: theme.sub, marginRight: 12 }]}>%</Text>
                  </View>

                  <Text style={[styles.fieldLabel, { color: theme.sub }]}>START DATE</Text>
                  <View style={styles.fdDateRow}>
                    <View style={[styles.fdDateBox, { backgroundColor: theme.chipBg, borderColor: 'transparent' }]}>
                      <TextInput
                        value={form.fdStartDay}
                        onChangeText={v => setField('fdStartDay', v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="DD"
                        placeholderTextColor={theme.faint}
                        style={[styles.fdDateInput, { color: theme.text }]}
                        maxLength={2}
                      />
                      <Text style={[styles.fdDurationUnit, { color: theme.sub }]}>DD</Text>
                    </View>
                    <Text style={[styles.fdDateSep, { color: theme.faint }]}>/</Text>
                    <View style={[styles.fdDateBox, { backgroundColor: theme.chipBg, borderColor: 'transparent' }]}>
                      <TextInput
                        value={form.fdStartMonth}
                        onChangeText={v => setField('fdStartMonth', v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="MM"
                        placeholderTextColor={theme.faint}
                        style={[styles.fdDateInput, { color: theme.text }]}
                        maxLength={2}
                      />
                      <Text style={[styles.fdDurationUnit, { color: theme.sub }]}>MM</Text>
                    </View>
                    <Text style={[styles.fdDateSep, { color: theme.faint }]}>/</Text>
                    <View style={[styles.fdDateBox, { flex: 1.4, backgroundColor: theme.chipBg, borderColor: 'transparent' }]}>
                      <TextInput
                        value={form.fdStartYear}
                        onChangeText={v => setField('fdStartYear', v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="YYYY"
                        placeholderTextColor={theme.faint}
                        style={[styles.fdDateInput, { color: theme.text }]}
                        maxLength={4}
                      />
                      <Text style={[styles.fdDurationUnit, { color: theme.sub }]}>YYYY</Text>
                    </View>
                  </View>
                </>
              )}
            </>
          )}

          {/* Notes */}
          <Text style={[styles.fieldLabel, { color: theme.sub }]}>NOTES (OPTIONAL)</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.chipBg, borderColor: 'transparent', minHeight: 80 }]}>
            <TextInput
              value={form.note}
              onChangeText={v => setField('note', v)}
              placeholder="Add a note…"
              placeholderTextColor={theme.faint}
              multiline
              numberOfLines={3}
              style={[styles.input, { color: theme.text, textAlignVertical: 'top', minHeight: 60 }]}
              maxLength={200}
            />
          </View>

          {/* Recurring Contribution — hidden for bank/fd/realestate; always-on for rd; toggle for others */}
          {form.cat !== 'bank' && form.cat !== 'fd' && form.cat !== 'realestate' && (
            <>
              <View style={[styles.rcDivider, { borderTopColor: theme.line }]} />

              {/* RD: no toggle — fields shown directly */}
              {form.cat === 'rd' ? (
                <Text style={[styles.rcToggleLabel, { color: theme.text, marginBottom: 16 }]}>
                  {(RECURRING_CONTRIBUTION_FREQUENCIES.find(f => f.value === form.recurringContributionFrequency)?.label ?? 'Monthly') + ' Instalment'}
                </Text>
              ) : (
                <View style={styles.rcToggleRow}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={[styles.rcToggleLabel, { color: theme.text }]}>Recurring Contribution</Text>
                    <Text style={[styles.rcToggleSub, { color: theme.sub }]}>
                      Automatically add a fixed amount at regular intervals
                    </Text>
                  </View>
                  <Switch
                    value={form.recurringContributionEnabled}
                    onValueChange={v => setForm(prev => ({ ...prev, recurringContributionEnabled: v }))}
                    trackColor={{ false: theme.line, true: accent.solid + 'aa' }}
                    thumbColor={form.recurringContributionEnabled ? accent.solid : theme.sub}
                    accessibilityLabel="Toggle recurring contribution"
                    accessibilityRole="switch"
                  />
                </View>
              )}

              {(form.cat === 'rd' || form.recurringContributionEnabled) && (
                <>
                  <Text style={[styles.fieldLabel, { color: theme.sub }]}>
                    {form.cat === 'rd'
                      ? (RECURRING_CONTRIBUTION_FREQUENCIES.find(f => f.value === form.recurringContributionFrequency)?.label ?? 'Monthly').toUpperCase() + ' INSTALMENT'
                      : 'AMOUNT PER PERIOD'}
                  </Text>
                  <View style={[styles.valueBox, { backgroundColor: theme.chipBg, borderColor: errors.recurringContributionAmount ? theme.neg : 'transparent' }]}>
                    <Text style={[styles.currencySymbol, { color: theme.sub }]}>{CUR[form.currency]?.symbol}</Text>
                    <TextInput
                      value={form.recurringContributionAmount}
                      onChangeText={v => setForm(prev => ({ ...prev, recurringContributionAmount: v.replace(/[^0-9.]/g, '') }))}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={theme.faint}
                      style={[styles.valueInput, { color: theme.text }]}
                    />
                  </View>

                  <Text style={[styles.fieldLabel, { color: theme.sub }]}>FREQUENCY</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.currencyRow, { marginBottom: 12 }]}>
                    {RECURRING_CONTRIBUTION_FREQUENCIES.map(freq => {
                      const isSelected = form.recurringContributionFrequency === freq.value;
                      return (
                        <TouchableOpacity
                          key={freq.value}
                          onPress={() => setForm(prev => ({ ...prev, recurringContributionFrequency: freq.value }))}
                          style={[styles.currencyChip, {
                            borderColor: isSelected ? accent.solid : theme.line,
                            backgroundColor: isSelected ? accent.solid + '20' : theme.chipBg,
                          }]}
                          accessibilityLabel={freq.label}
                          accessibilityRole="button"
                        >
                          <Text style={[styles.currencyChipText, { color: isSelected ? accent.solid : theme.sub }]}>
                            {freq.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {nextDueDisplay != null && (
                    <View style={[styles.rcNextDueRow, { backgroundColor: accent.solid + '12', borderColor: accent.solid + '30' }]}>
                      <Icon name="calendar" size={14} color={accent.solid} strokeWidth={2} />
                      <Text style={[styles.rcNextDueText, { color: accent.solid }]}>
                        Next contribution: {fmtDate(nextDueDisplay, { full: true })}
                      </Text>
                    </View>
                  )}

                  {editingAsset?.recurringContributionLastApplied != null && (
                    <Text style={[styles.rcLastApplied, { color: theme.sub }]}>
                      Last applied: {fmtDate(editingAsset.recurringContributionLastApplied, { full: true })}
                    </Text>
                  )}
                </>
              )}
            </>
          )}

          {/* Save button */}
          <TouchableOpacity onPress={submit} style={[styles.saveBtn, { backgroundColor: accent.solid }]} accessibilityRole="button">
            <Icon name={editingAsset ? 'check' : 'plus'} size={19} color="#fff" strokeWidth={2.3} />
            <Text style={styles.saveBtnText}>{editingAsset ? 'Save Changes' : 'Add Asset'}</Text>
          </TouchableOpacity>

          {editingAsset && (
            <TouchableOpacity
              onPress={() => { setDeleteTarget(editingAsset); navigation.goBack(); }}
              style={styles.deleteBtn}
              accessibilityRole="button"
            >
              <Icon name="trash" size={18} color={theme.neg} strokeWidth={2.1} />
              <Text style={[styles.deleteBtnText, { color: theme.neg }]}>Delete Asset</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title:       { fontSize: 17, fontFamily: FONTS.jakartaExtraBold },
  ghostBtn:    { padding: 6 },
  ghostBtnText:{ fontSize: 16, fontFamily: FONTS.jakartaSemiBold },
  body:        { paddingHorizontal: 20, paddingTop: 16 },
  fieldLabel:  { fontSize: 12.5, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8, marginLeft: 2, fontFamily: FONTS.jakartaBold },
  catGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  catBtn:      { width: '22%', borderWidth: 1.5, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 4, alignItems: 'center', gap: 6, minWidth: 72, flex: 1 },
  catBtnText:  { fontSize: 10.5, textAlign: 'center', lineHeight: 14, fontFamily: FONTS.jakartaBold },
  catBtnNew:   { borderStyle: 'dashed' },
  inputBox:    { borderRadius: 14, borderWidth: 1.5, marginBottom: 22 },
  input:       { fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, fontFamily: FONTS.jakarta },
  valueBox:    { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, paddingLeft: 16, paddingRight: 6, paddingVertical: 4, marginBottom: 12 },
  currencySymbol: { fontSize: 24, fontFamily: FONTS.groteskBold },
  valueInput:  { flex: 1, fontSize: 26, paddingHorizontal: 8, paddingVertical: 12, fontFamily: FONTS.groteskBold },
  currencyRow: { gap: 7, paddingBottom: 4, marginBottom: 22 },
  currencyChip:{ borderWidth: 1.5, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 7, flexShrink: 0 },
  currencyChipText: { fontSize: 13.5, fontFamily: FONTS.groteskSemiBold },
  convertedHint: { fontSize: 13, marginTop: -12, marginBottom: 22, marginLeft: 2, fontFamily: FONTS.jakarta },
  saveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 15, paddingVertical: 15, width: '100%' },
  saveBtnText: { fontSize: 16, color: '#fff', fontFamily: FONTS.jakartaBold },
  deleteBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10, paddingVertical: 14 },
  deleteBtnText: { fontSize: 15, fontFamily: FONTS.jakartaBold },
  rcDivider:   { borderTopWidth: StyleSheet.hairlineWidth, marginBottom: 20, marginTop: 6 },
  rcToggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  rcToggleLabel: { fontSize: 15, fontFamily: FONTS.jakartaBold, marginBottom: 3 },
  rcToggleSub: { fontSize: 12.5, fontFamily: FONTS.jakarta, lineHeight: 17 },
  rcNextDueRow:  { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 14 },
  rcNextDueText: { fontSize: 13, fontFamily: FONTS.jakartaSemiBold },
  rcLastApplied: { fontSize: 12, fontFamily: FONTS.jakarta, marginBottom: 14, marginLeft: 2 },

  fdDurationRow:  { flexDirection: 'row', gap: 10, marginBottom: 8 },
  fdDurationBox:  { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10 },
  fdDurationInput:{ flex: 1, fontSize: 18, fontFamily: FONTS.groteskBold, padding: 0 },
  fdDurationUnit: { fontSize: 11, fontFamily: FONTS.jakartaBold, marginLeft: 4 },

  fdDateRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  fdDateBox:  { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 10 },
  fdDateInput:{ flex: 1, fontSize: 17, fontFamily: FONTS.groteskBold, padding: 0 },
  fdDateSep:  { fontSize: 20, fontFamily: FONTS.groteskBold },
  fdErrorHint:{ fontSize: 12, fontFamily: FONTS.jakarta, marginTop: -4, marginBottom: 14, marginLeft: 2 },
});
