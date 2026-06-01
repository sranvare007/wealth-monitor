import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Switch,
  StyleSheet, Animated, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from './Icon';
import { TrackedEntry, type TrackedFormFields, type TrackedErrors } from './TrackedEntry';
import { CATEGORIES, CAT } from '../../data/categories';
import { CURRENCIES, CUR, convert } from '../../utils/currency';
import { formatMoney } from '../../utils/currency';
import { advanceByFrequency, fmtDate } from '../../utils/date';
import { getGoldRates, isTrackedCat } from '../../services/marketData';
import type { Asset, AssetCategory, AssetTrack, RecurringContributionFrequency } from '../../types';
import { FONTS } from '../../constants/fonts';

const { height: SCREEN_H } = Dimensions.get('window');

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
  // tracked instrument fields (stocks / crypto / gold)
  symbol: string;
  exchange: string;
  chain: string;
  purity: '24K' | '22K';
  qty: string;
  weight: string;
  price: number;
  changePct: number;
};

type FormErrors = {
  name?: boolean;
  value?: boolean;
  recurringContributionAmount?: boolean;
  symbol?: boolean;
  qty?: boolean;
  weight?: boolean;
};

const BLANK_FORM: FormState = {
  cat: 'cash',
  name: '',
  value: '',
  currency: 'INR',
  note: '',
  recurringContributionEnabled: false,
  recurringContributionAmount: '',
  recurringContributionFrequency: 'MONTHLY',
  symbol: '',
  exchange: '',
  chain: '',
  purity: '24K',
  qty: '',
  weight: '',
  price: 0,
  changePct: 0,
};

export function AddEditSheet() {
  const {
    addEditOpen, editingAsset, saveAsset, setDeleteTarget, closeSheet,
    customCategories, openCategoriesSheetForCreate, baseCurrency,
  } = useAppState();
  const { theme, accent } = useTheme();
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (addEditOpen) {
      setMounted(true);
      Animated.spring(slideAnim, {
        toValue: 0, damping: 26, stiffness: 260, useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_H, duration: 280, useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [addEditOpen]);

  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!addEditOpen) return;
    setErrors({});
    if (editingAsset) {
      const tk = editingAsset.track;
      setForm({
        cat: editingAsset.cat,
        name: editingAsset.name,
        value: String(editingAsset.value),
        currency: editingAsset.currency,
        note: editingAsset.note ?? '',
        recurringContributionEnabled: editingAsset.recurringContributionEnabled === 1,
        recurringContributionAmount: editingAsset.recurringContributionAmount
          ? String(editingAsset.recurringContributionAmount)
          : '',
        recurringContributionFrequency: editingAsset.recurringContributionFrequency ?? 'MONTHLY',
        // tracked
        symbol:     tk && tk.kind !== 'gold' ? tk.symbol : '',
        exchange:   tk && tk.kind === 'stock'  ? tk.exchange : '',
        chain:      tk && tk.kind === 'crypto' ? tk.chain   : '',
        purity:     tk && tk.kind === 'gold'   ? tk.purity  : '24K',
        qty:        tk && tk.kind !== 'gold'   ? String(tk.qty)    : '',
        weight:     tk && tk.kind === 'gold'   ? String(tk.weight) : '',
        price:      tk && tk.kind !== 'gold'   ? tk.price    : (tk && tk.kind === 'gold' ? tk.perGram : 0),
        changePct:  tk ? tk.changePct : 0,
      });
    } else {
      setForm({ ...BLANK_FORM, currency: baseCurrency });
    }
  }, [addEditOpen, editingAsset]);

  // ── Field setters ───────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setField = (key: keyof FormState, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const setMany = (updates: Partial<FormState>) =>
    setForm(prev => ({ ...prev, ...updates }));

  // Switching category clears any in-progress tracked selection
  const chooseCat = (id: string) => {
    if (id === form.cat) return;
    setForm(prev => ({ ...prev, cat: id, symbol: '', qty: '', chain: '', weight: '' }));
  };

  // ── Computed ────────────────────────────────────────────────────────────────

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

  // Auto-select a newly created custom category while this sheet is open
  const prevCustomCatCount = useRef(customCategories.length);
  useEffect(() => {
    if (addEditOpen && customCategories.length > prevCustomCatCount.current) {
      const newest = customCategories[customCategories.length - 1];
      if (newest) setField('cat', newest.id);
    }
    prevCustomCatCount.current = customCategories.length;
  }, [customCategories.length]);

  const recurringContributionAmountVal = parseFloat(form.recurringContributionAmount.replace(/,/g, ''));

  const nextDueDisplay = useMemo(() => {
    if (!form.recurringContributionEnabled || !(recurringContributionAmountVal > 0)) return null;
    const existingNextDue = editingAsset?.recurringContributionNextDue;
    const frequencyChanged = editingAsset?.recurringContributionFrequency !== form.recurringContributionFrequency;
    if (existingNextDue && existingNextDue > Date.now() && !frequencyChanged) return existingNextDue;
    return advanceByFrequency(Date.now(), form.recurringContributionFrequency);
  }, [
    form.recurringContributionEnabled,
    form.recurringContributionAmount,
    form.recurringContributionFrequency,
    editingAsset,
  ]);

  // ── Submit ──────────────────────────────────────────────────────────────────

  function submit() {
    if (tracked) return submitTracked();

    const formErrors: FormErrors = {};
    if (!form.name.trim()) formErrors.name = true;
    const assetValue = parseFloat(form.value.replace(/,/g, ''));
    if (!assetValue || assetValue <= 0) formErrors.value = true;
    if (form.recurringContributionEnabled && !(recurringContributionAmountVal > 0)) {
      formErrors.recurringContributionAmount = true;
    }
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    let recurringContributionNextDue: number | null = null;
    if (form.recurringContributionEnabled && recurringContributionAmountVal > 0) {
      const existingNextDue = editingAsset?.recurringContributionNextDue;
      const frequencyChanged = editingAsset?.recurringContributionFrequency !== form.recurringContributionFrequency;
      if (existingNextDue && existingNextDue > Date.now() && !frequencyChanged) {
        recurringContributionNextDue = existingNextDue;
      } else {
        recurringContributionNextDue = advanceByFrequency(Date.now(), form.recurringContributionFrequency);
      }
    }

    saveAsset({
      id: editingAsset?.id,
      cat: form.cat,
      name: form.name.trim(),
      value: assetValue,
      currency: form.currency,
      note: form.note.trim(),
      track: null,
      recurringContributionEnabled: form.recurringContributionEnabled ? 1 : 0,
      recurringContributionAmount: form.recurringContributionEnabled ? recurringContributionAmountVal : null,
      recurringContributionFrequency: form.recurringContributionEnabled ? form.recurringContributionFrequency : null,
      recurringContributionNextDue,
      recurringContributionLastApplied: editingAsset?.recurringContributionLastApplied ?? null,
    });
  }

  function submitTracked() {
    if (form.cat === 'gold') {
      const w = parseFloat(form.weight);
      if (!w || w <= 0) { setErrors({ weight: true }); return; }
      const rates = getGoldRates();
      const perGram = form.purity === '22K' ? rates.perGram22k : rates.perGram24k;
      const track: AssetTrack = {
        kind: 'gold', purity: form.purity, weight: w, perGram, changePct: rates.changePct,
      };
      saveAsset({
        id: editingAsset?.id,
        cat: 'gold',
        name: form.purity + ' Gold',
        value: w * perGram,
        currency: rates.currency,
        note: form.note.trim(),
        track,
        recurringContributionEnabled: 0,
        recurringContributionAmount: null,
        recurringContributionFrequency: null,
        recurringContributionNextDue: null,
        recurringContributionLastApplied: null,
      });
      return;
    }

    const formErrors: FormErrors = {};
    const qty = parseFloat(form.qty);
    if (!form.symbol) formErrors.symbol = true;
    if (!qty || qty <= 0) formErrors.qty = true;
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    const track: AssetTrack = form.cat === 'crypto'
      ? { kind: 'crypto', symbol: form.symbol, chain: form.chain, qty, price: form.price, changePct: form.changePct, name: form.name }
      : { kind: 'stock',  symbol: form.symbol, exchange: form.exchange, qty, price: form.price, changePct: form.changePct, name: form.name, currency: form.currency };

    saveAsset({
      id: editingAsset?.id,
      cat: form.cat,
      name: form.name || form.symbol,
      value: qty * form.price,
      currency: form.currency,
      note: form.note.trim(),
      track,
      recurringContributionEnabled: 0,
      recurringContributionAmount: null,
      recurringContributionFrequency: null,
      recurringContributionNextDue: null,
      recurringContributionLastApplied: null,
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const trackedFields: TrackedFormFields = {
    symbol: form.symbol, exchange: form.exchange, chain: form.chain,
    purity: form.purity, qty: form.qty, weight: form.weight,
    price: form.price, changePct: form.changePct,
    name: form.name, currency: form.currency,
  };

  const trackedErrors: TrackedErrors = {
    symbol: errors.symbol, qty: errors.qty, weight: errors.weight,
  };

  const convertedValue =
    !tracked && form.currency !== 'INR' && parseFloat(form.value) > 0
      ? convert(parseFloat(form.value) || 0, form.currency, 'INR')
      : null;

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} statusBarTranslucent animationType="none">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop */}
        <TouchableOpacity activeOpacity={1} onPress={closeSheet} style={styles.backdrop} />

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.cardBg,
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: theme.line }]} />
          </View>

          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={closeSheet} style={styles.ghostBtn}>
              <Text style={[styles.ghostBtnText, { color: theme.sub }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {editingAsset ? 'Edit Asset' : 'New Asset'}
            </Text>
            <TouchableOpacity onPress={submit} style={styles.ghostBtn}>
              <Text style={[styles.ghostBtnText, { color: accent.solid, fontFamily: FONTS.jakartaBold }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Category grid ─────────────────────────────────────────── */}
            <Text style={[styles.fieldLabel, { color: theme.sub }]}>CATEGORY</Text>
            <View style={styles.catGrid}>
              {allCategories.map(c => {
                const isSelected = form.cat === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => chooseCat(c.id)}
                    style={[
                      styles.catBtn,
                      { borderColor: isSelected ? c.color : theme.line, backgroundColor: isSelected ? c.color + '22' : theme.chipBg },
                    ]}
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

            {/* ── Tracked entry (stocks / crypto / gold) ────────────────── */}
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
                {/* Asset name */}
                <Text style={[styles.fieldLabel, { color: theme.sub }]}>ASSET NAME</Text>
                <View style={[
                  styles.inputBox,
                  { backgroundColor: theme.chipBg, borderColor: errors.name ? theme.neg : 'transparent' },
                ]}>
                  <TextInput
                    value={form.name}
                    onChangeText={v => setField('name', v)}
                    placeholder={isLiability ? 'e.g. Home Loan' : 'e.g. HDFC Savings'}
                    placeholderTextColor={theme.faint}
                    style={[styles.input, { color: theme.text }]}
                    maxLength={60}
                  />
                </View>

                {/* Value + currency */}
                <Text style={[styles.fieldLabel, { color: theme.sub }]}>
                  {isLiability ? 'OUTSTANDING AMOUNT' : 'CURRENT VALUE'}
                </Text>
                <View style={[
                  styles.valueBox,
                  { backgroundColor: theme.chipBg, borderColor: errors.value ? theme.neg : 'transparent' },
                ]}>
                  <Text style={[styles.currencySymbol, { color: theme.sub }]}>
                    {CUR[form.currency]?.symbol}
                  </Text>
                  <TextInput
                    value={form.value}
                    onChangeText={v => setField('value', v.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={theme.faint}
                    style={[styles.valueInput, { color: theme.text }]}
                  />
                </View>

                {/* Currency chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.currencyRow}
                >
                  {CURRENCIES.map(c => {
                    const isSelected = form.currency === c.code;
                    return (
                      <TouchableOpacity
                        key={c.code}
                        onPress={() => setField('currency', c.code)}
                        style={[
                          styles.currencyChip,
                          {
                            borderColor: isSelected ? accent.solid : theme.line,
                            backgroundColor: isSelected ? accent.solid + '20' : theme.chipBg,
                          },
                        ]}
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
              </>
            )}

            {/* ── Notes ─────────────────────────────────────────────────── */}
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

            {/* ── Recurring Contribution (manual assets only) ────────────── */}
            {!tracked && (
              <>
                <View style={[styles.rcDivider, { borderTopColor: theme.line }]} />

                <View style={styles.rcToggleRow}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={[styles.rcToggleLabel, { color: theme.text }]}>
                      Recurring Contribution
                    </Text>
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

                {form.recurringContributionEnabled && (
                  <>
                    <Text style={[styles.fieldLabel, { color: theme.sub }]}>AMOUNT PER PERIOD</Text>
                    <View style={[
                      styles.valueBox,
                      { backgroundColor: theme.chipBg, borderColor: errors.recurringContributionAmount ? theme.neg : 'transparent' },
                    ]}>
                      <Text style={[styles.currencySymbol, { color: theme.sub }]}>
                        {CUR[form.currency]?.symbol}
                      </Text>
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
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={[styles.currencyRow, { marginBottom: 12 }]}
                    >
                      {RECURRING_CONTRIBUTION_FREQUENCIES.map(freq => {
                        const isSelected = form.recurringContributionFrequency === freq.value;
                        return (
                          <TouchableOpacity
                            key={freq.value}
                            onPress={() => setForm(prev => ({ ...prev, recurringContributionFrequency: freq.value }))}
                            style={[
                              styles.currencyChip,
                              {
                                borderColor: isSelected ? accent.solid : theme.line,
                                backgroundColor: isSelected ? accent.solid + '20' : theme.chipBg,
                              },
                            ]}
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
                      <Text style={[styles.rcLastAppliedText, { color: theme.sub }]}>
                        Last applied: {fmtDate(editingAsset.recurringContributionLastApplied, { full: true })}
                      </Text>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── Save button ────────────────────────────────────────────── */}
            <TouchableOpacity
              onPress={submit}
              style={[styles.saveBtn, { backgroundColor: accent.solid }]}
              accessibilityRole="button"
            >
              <Icon name={editingAsset ? 'check' : 'plus'} size={19} color="#fff" strokeWidth={2.3} />
              <Text style={styles.saveBtnText}>
                {editingAsset ? 'Save Changes' : 'Add Asset'}
              </Text>
            </TouchableOpacity>

            {editingAsset && (
              <TouchableOpacity
                onPress={() => { closeSheet(); setDeleteTarget(editingAsset); }}
                style={styles.deleteBtn}
                accessibilityRole="button"
              >
                <Icon name="trash" size={18} color={theme.neg} strokeWidth={2.1} />
                <Text style={[styles.deleteBtnText, { color: theme.neg }]}>Delete Asset</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,10,15,0.45)' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: SCREEN_H * 0.92,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 20,
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  handle:    { width: 40, height: 5, borderRadius: 5 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 6,
  },
  sheetTitle:   { fontSize: 17, fontFamily: FONTS.jakartaExtraBold },
  ghostBtn:     { padding: 6 },
  ghostBtnText: { fontSize: 16, fontFamily: FONTS.jakartaSemiBold },
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  fieldLabel: {
    fontSize: 12.5, letterSpacing: 0.3, textTransform: 'uppercase',
    marginBottom: 8, marginLeft: 2, fontFamily: FONTS.jakartaBold,
  },
  catGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  catBtn:    { width: '22%', borderWidth: 1.5, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 4, alignItems: 'center', gap: 6, minWidth: 72, flex: 1 },
  catBtnText:{ fontSize: 10.5, textAlign: 'center', lineHeight: 14, fontFamily: FONTS.jakartaBold },
  catBtnNew: { borderStyle: 'dashed' },
  inputBox:  { borderRadius: 14, borderWidth: 1.5, marginBottom: 22 },
  input:     { fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, fontFamily: FONTS.jakarta },
  valueBox:  {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5,
    paddingLeft: 16, paddingRight: 6, paddingVertical: 4, marginBottom: 12,
  },
  currencySymbol: { fontSize: 24, fontFamily: FONTS.groteskBold },
  valueInput:     { flex: 1, fontSize: 26, paddingHorizontal: 8, paddingVertical: 12, fontFamily: FONTS.groteskBold },
  currencyRow:    { gap: 7, paddingBottom: 4, marginBottom: 22 },
  currencyChip:   { borderWidth: 1.5, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 7, flexShrink: 0 },
  currencyChipText: { fontSize: 13.5, fontFamily: FONTS.groteskSemiBold },
  convertedHint:  { fontSize: 13, marginTop: -12, marginBottom: 22, marginLeft: 2, fontFamily: FONTS.jakarta },
  saveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 15, paddingVertical: 15, width: '100%' },
  saveBtnText: { fontSize: 16, color: '#fff', fontFamily: FONTS.jakartaBold },
  deleteBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10, paddingVertical: 14 },
  deleteBtnText: { fontSize: 15, fontFamily: FONTS.jakartaBold },
  // ── Recurring Contribution ──────────────────────────────────────────────────
  rcDivider:        { borderTopWidth: StyleSheet.hairlineWidth, marginBottom: 20, marginTop: 6 },
  rcToggleRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  rcToggleLabel:    { fontSize: 15, fontFamily: FONTS.jakartaBold, marginBottom: 3 },
  rcToggleSub:      { fontSize: 12.5, fontFamily: FONTS.jakarta, lineHeight: 17 },
  rcNextDueRow:     { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 14 },
  rcNextDueText:    { fontSize: 13, fontFamily: FONTS.jakartaSemiBold },
  rcLastAppliedText:{ fontSize: 12, fontFamily: FONTS.jakarta, marginBottom: 14, marginLeft: 2 },
});
