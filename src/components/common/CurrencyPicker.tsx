import React, { useRef, useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from './Icon';
import { CURRENCIES } from '../../utils/currency';
import { FONTS } from '../../constants/fonts';

const { height: SCREEN_H } = Dimensions.get('window');

export function CurrencyPicker() {
  const { currencyPickerOpen, closeCurrencyPicker, baseCurrency, setBaseCurrency } = useAppState();
  const { theme, accent } = useTheme();
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (currencyPickerOpen) {
      setMounted(true);
      Animated.spring(slideAnim, {
        toValue: 0, damping: 26, stiffness: 260, useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_H, duration: 280, useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [currencyPickerOpen]);

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} statusBarTranslucent animationType="none">
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={closeCurrencyPicker}
        style={styles.backdrop}
      />

      {/* Sheet */}
      <Animated.View style={[
        styles.sheet,
        {
          backgroundColor: theme.cardBg,
          paddingBottom: Math.max(insets.bottom, 16),
          transform: [{ translateY: slideAnim }],
        },
      ]}>
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: theme.line }]} />
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Base currency</Text>
          <TouchableOpacity onPress={closeCurrencyPicker} style={styles.doneBtn}>
            <Text style={[styles.doneBtnText, { color: accent.solid }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {CURRENCIES.map((c, i) => {
            const on = c.code === baseCurrency;
            return (
              <TouchableOpacity
                key={c.code}
                onPress={() => { setBaseCurrency(c.code); closeCurrencyPicker(); }}
                style={[
                  styles.row,
                  i < CURRENCIES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line },
                ]}
                accessibilityRole="button"
              >
                <View style={[styles.symbolBox, { backgroundColor: theme.chipBg }]}>
                  <Text style={[styles.symbolText, { color: theme.text }]}>{c.symbol}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.code, { color: theme.text }]}>{c.code}</Text>
                  <Text style={[styles.name, { color: theme.sub }]}>{c.name}</Text>
                </View>
                {on && <Icon name="check" size={22} color={accent.solid} strokeWidth={2.6} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
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
    maxHeight: SCREEN_H * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  handle: { width: 40, height: 5, borderRadius: 5 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  title: { fontSize: 17, fontFamily: FONTS.jakartaExtraBold },
  doneBtn: { padding: 6 },
  doneBtnText: { fontSize: 16, fontFamily: FONTS.jakartaBold },
  list: { paddingHorizontal: 16, paddingBottom: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 8,
  },
  symbolBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  symbolText: { fontSize: 19, fontFamily: FONTS.groteskBold },
  code: { fontSize: 16, fontFamily: FONTS.groteskBold },
  name: { fontSize: 13, marginTop: 1, fontFamily: FONTS.jakarta },
});
