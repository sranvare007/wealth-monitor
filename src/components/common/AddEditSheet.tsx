import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from './Icon';
import { CATEGORIES, CAT } from '../../data/categories';
import { CURRENCIES, CUR, convert } from '../../utils/currency';
import { formatMoney } from '../../utils/currency';
import type { Asset, AssetCategory } from '../../types';
import { FONTS } from '../../constants/fonts';

const { height: SCREEN_H } = Dimensions.get('window');

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

  const blank = {
    cat: 'cash' as AssetCategory,
    name: '',
    value: '',
    currency: 'INR',
    note: '',
  };
  const [f, setF] = useState(blank);
  const [errors, setErrors] = useState<{ name?: boolean; value?: boolean }>({});

  useEffect(() => {
    if (addEditOpen) {
      setErrors({});
      if (editingAsset) {
        setF({
          cat: editingAsset.cat,
          name: editingAsset.name,
          value: String(editingAsset.value),
          currency: editingAsset.currency,
          note: editingAsset.note ?? '',
        });
      } else {
        setF(blank);
      }
    }
  }, [addEditOpen, editingAsset]);

  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const isLiab = CAT[f.cat]?.liability;

  function submit() {
    const e: { name?: boolean; value?: boolean } = {};
    if (!f.name.trim()) e.name = true;
    const val = parseFloat(f.value.replace(/,/g, ''));
    if (!val || val <= 0) e.value = true;
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    saveAsset({
      id: editingAsset?.id,
      cat: f.cat,
      name: f.name.trim(),
      value: val,
      currency: f.currency,
      note: f.note.trim(),
    });
  }

  const convertedVal =
    f.currency !== 'INR' && parseFloat(f.value) > 0
      ? convert(parseFloat(f.value) || 0, f.currency, 'INR')
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
                const on = f.cat === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => set('cat', c.id)}
                    style={[
                      styles.catBtn,
                      {
                        borderColor: on ? c.color : theme.line,
                        backgroundColor: on ? c.color + '22' : theme.chipBg,
                      },
                    ]}
                    accessibilityLabel={c.label}
                  >
                    <Icon name={c.icon as any} size={21} color={c.color} strokeWidth={2.1} />
                    <Text style={[styles.catBtnText, { color: on ? theme.text : theme.sub }]}>
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
                value={f.name}
                onChangeText={v => set('name', v)}
                placeholder={isLiab ? 'e.g. Home Loan' : 'e.g. HDFC Savings'}
                placeholderTextColor={theme.faint}
                style={[styles.input, { color: theme.text }]}
                maxLength={60}
              />
            </View>

            {/* Value + currency */}
            <Text style={[styles.fieldLabel, { color: theme.sub }]}>
              {isLiab ? 'OUTSTANDING AMOUNT' : 'CURRENT VALUE'}
            </Text>
            <View style={[
              styles.valueBox,
              { backgroundColor: theme.chipBg, borderColor: errors.value ? theme.neg : 'transparent' },
            ]}>
              <Text style={[styles.currencySymbol, { color: theme.sub }]}>
                {CUR[f.currency]?.symbol}
              </Text>
              <TextInput
                value={f.value}
                onChangeText={v => set('value', v.replace(/[^0-9.]/g, ''))}
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
                const on = f.currency === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => set('currency', c.code)}
                    style={[
                      styles.currencyChip,
                      {
                        borderColor: on ? accent.solid : theme.line,
                        backgroundColor: on ? accent.solid + '20' : theme.chipBg,
                      },
                    ]}
                  >
                    <Text style={[styles.currencyChipText, { color: on ? accent.solid : theme.sub }]}>
                      {c.symbol} {c.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {convertedVal != null && (
              <Text style={[styles.convertedHint, { color: theme.sub }]}>
                ≈ {formatMoney(convertedVal, 'INR')} in INR
              </Text>
            )}

            {/* Notes */}
            <Text style={[styles.fieldLabel, { color: theme.sub }]}>NOTES (OPTIONAL)</Text>
            <View style={[styles.inputBox, { backgroundColor: theme.chipBg, borderColor: 'transparent', minHeight: 80 }]}>
              <TextInput
                value={f.note}
                onChangeText={v => set('note', v)}
                placeholder="Add a note…"
                placeholderTextColor={theme.faint}
                multiline
                numberOfLines={3}
                style={[styles.input, { color: theme.text, textAlignVertical: 'top', minHeight: 60 }]}
                maxLength={200}
              />
            </View>

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
});
