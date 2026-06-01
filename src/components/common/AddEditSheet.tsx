import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Switch,
  StyleSheet, Animated, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from './Icon';
import { CATEGORIES, CAT } from '../../data/categories';
import { CURRENCIES, CUR, convert } from '../../utils/currency';
import { formatMoney } from '../../utils/currency';
import { advanceByFrequency, fmtDate } from '../../utils/date';
import type { Asset, AssetCategory, RecurringContributionFrequency } from '../../types';
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
};

type FormErrors = {
  name?: boolean;
  value?: boolean;
  recurringContributionAmount?: boolean;
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
};

export function AddEditSheet() {
  const {
    addEditOpen, editingAsset, saveAsset, setDeleteTarget, closeSheet,
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
    if (addEditOpen) {
      setErrors({});
      if (editingAsset) {
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
        });
      } else {
        setForm(BLANK_FORM);
      }
    }
  }, [addEditOpen, editingAsset]);

  const setField = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const isLiability = CAT[form.cat]?.liability;
  const recurringContributionAmountVal = parseFloat(form.recurringContributionAmount.replace(/,/g, ''));

  // Compute when the next contribution would fire, for the preview hint
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

  function submit() {
    const formErrors: FormErrors = {};
    if (!form.name.trim()) formErrors.name = true;
    const assetValue = parseFloat(form.value.replace(/,/g, ''));
    if (!assetValue || assetValue <= 0) formErrors.value = true;
    if (form.recurringContributionEnabled && !(recurringContributionAmountVal > 0)) {
      formErrors.recurringContributionAmount = true;
    }
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    // Preserve rc_next_due if still in the future and frequency unchanged, else reset
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
      recurringContributionEnabled: form.recurringContributionEnabled ? 1 : 0,
      recurringContributionAmount: form.recurringContributionEnabled ? recurringContributionAmountVal : null,
      recurringContributionFrequency: form.recurringContributionEnabled ? form.recurringContributionFrequency : null,
      recurringContributionNextDue,
      recurringContributionLastApplied: editingAsset?.recurringContributionLastApplied ?? null,
    });
  }

  const convertedValue =
    form.currency !== 'INR' && parseFloat(form.value) > 0
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
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeSheet}
          style={[styles.backdrop]}
        />

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
          {/* handle */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: theme.line }]} />
          </View>

          {/* header */}
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
            {/* Category grid */}
            <Text style={[styles.fieldLabel, { color: theme.sub }]}>CATEGORY</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map(c => {
                const isSelected = form.cat === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setField('cat', c.id)}
                    style={[
                      styles.catBtn,
                      {
                        borderColor: isSelected ? c.color : theme.line,
                        backgroundColor: isSelected ? c.color + '22' : theme.chipBg,
                      },
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
            </View>

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

            {/* ── Recurring Contribution ─────────────────────────────────── */}
            <View style={[styles.recurringContributionDivider, { borderTopColor: theme.line }]} />

            <View style={styles.recurringContributionToggleRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={[styles.recurringContributionToggleLabel, { color: theme.text }]}>
                  Recurring Contribution
                </Text>
                <Text style={[styles.recurringContributionToggleSub, { color: theme.sub }]}>
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
                {/* Amount per period */}
                <Text style={[styles.fieldLabel, { color: theme.sub }]}>AMOUNT PER PERIOD</Text>
                <View style={[
                  styles.valueBox,
                  {
                    backgroundColor: theme.chipBg,
                    borderColor: errors.recurringContributionAmount ? theme.neg : 'transparent',
                  },
                ]}>
                  <Text style={[styles.currencySymbol, { color: theme.sub }]}>
                    {CUR[form.currency]?.symbol}
                  </Text>
                  <TextInput
                    value={form.recurringContributionAmount}
                    onChangeText={v =>
                      setForm(prev => ({ ...prev, recurringContributionAmount: v.replace(/[^0-9.]/g, '') }))
                    }
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={theme.faint}
                    style={[styles.valueInput, { color: theme.text }]}
                  />
                </View>

                {/* Frequency */}
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
                        onPress={() =>
                          setForm(prev => ({ ...prev, recurringContributionFrequency: freq.value }))
                        }
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

                {/* Next due hint */}
                {nextDueDisplay != null && (
                  <View style={[
                    styles.recurringContributionNextDueRow,
                    { backgroundColor: accent.solid + '12', borderColor: accent.solid + '30' },
                  ]}>
                    <Icon name="calendar" size={14} color={accent.solid} strokeWidth={2} />
                    <Text style={[styles.recurringContributionNextDueText, { color: accent.solid }]}>
                      Next contribution: {fmtDate(nextDueDisplay, { full: true })}
                    </Text>
                  </View>
                )}

                {editingAsset?.recurringContributionLastApplied != null && (
                  <Text style={[styles.recurringContributionLastAppliedText, { color: theme.sub }]}>
                    Last applied: {fmtDate(editingAsset.recurringContributionLastApplied, { full: true })}
                  </Text>
                )}
              </>
            )}

            {/* ────────────────────────────────────────────────────────────── */}

            {/* Save button */}
            <TouchableOpacity
              onPress={submit}
              style={[styles.saveBtn, { backgroundColor: accent.solid }]}
              accessibilityRole="button"
            >
              <Icon
                name={editingAsset ? 'check' : 'plus'}
                size={19} color="#fff" strokeWidth={2.3}
              />
              <Text style={styles.saveBtnText}>
                {editingAsset ? 'Save Changes' : 'Add Asset'}
              </Text>
            </TouchableOpacity>

            {/* Delete option (edit mode only) */}
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,10,15,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_H * 0.92,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  handle: { width: 40, height: 5, borderRadius: 5 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  sheetTitle: { fontSize: 17, fontFamily: FONTS.jakartaExtraBold },
  ghostBtn: { padding: 6 },
  ghostBtnText: { fontSize: 16, fontFamily: FONTS.jakartaSemiBold },
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  fieldLabel: {
    fontSize: 12.5, letterSpacing: 0.3,
    textTransform: 'uppercase', marginBottom: 8, marginLeft: 2,
    fontFamily: FONTS.jakartaBold,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  catBtn: {
    width: '22%',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 6,
    minWidth: 72,
    flex: 1,
  },
  catBtnText: { fontSize: 10.5, textAlign: 'center', lineHeight: 14, fontFamily: FONTS.jakartaBold },
  inputBox: {
    borderRadius: 14, borderWidth: 1.5,
    marginBottom: 22,
  },
  input: { fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, fontFamily: FONTS.jakarta },
  valueBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1.5,
    paddingLeft: 16, paddingRight: 6, paddingVertical: 4,
    marginBottom: 12,
  },
  currencySymbol: { fontSize: 24, fontFamily: FONTS.groteskBold },
  valueInput: { flex: 1, fontSize: 26, paddingHorizontal: 8, paddingVertical: 12, fontFamily: FONTS.groteskBold },
  currencyRow: { gap: 7, paddingBottom: 4, marginBottom: 22 },
  currencyChip: {
    borderWidth: 1.5, borderRadius: 11,
    paddingHorizontal: 13, paddingVertical: 7,
    flexShrink: 0,
  },
  currencyChipText: { fontSize: 13.5, fontFamily: FONTS.groteskSemiBold },
  convertedHint: { fontSize: 13, marginTop: -12, marginBottom: 22, marginLeft: 2, fontFamily: FONTS.jakarta },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 15, paddingVertical: 15, width: '100%',
  },
  saveBtnText: { fontSize: 16, color: '#fff', fontFamily: FONTS.jakartaBold },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, marginTop: 10, paddingVertical: 14,
  },
  deleteBtnText: { fontSize: 15, fontFamily: FONTS.jakartaBold },
  // ── Recurring Contribution ───────────────────────────────────────────────
  recurringContributionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
    marginTop: 6,
  },
  recurringContributionToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  recurringContributionToggleLabel: {
    fontSize: 15,
    fontFamily: FONTS.jakartaBold,
    marginBottom: 3,
  },
  recurringContributionToggleSub: {
    fontSize: 12.5,
    fontFamily: FONTS.jakarta,
    lineHeight: 17,
  },
  recurringContributionNextDueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
  },
  recurringContributionNextDueText: {
    fontSize: 13,
    fontFamily: FONTS.jakartaSemiBold,
  },
  recurringContributionLastAppliedText: {
    fontSize: 12,
    fontFamily: FONTS.jakarta,
    marginBottom: 14,
    marginLeft: 2,
  },
});
