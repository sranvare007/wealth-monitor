import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from './Icon';
import { FONTS } from '../../constants/fonts';

export function DeleteConfirm() {
  const { deleteTarget, setDeleteTarget, confirmDelete } = useAppState();
  const { theme } = useTheme();

  if (!deleteTarget) return null;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setDeleteTarget(null)}
        style={styles.backdrop}
      />
      <View style={styles.centered} pointerEvents="box-none">
        <View style={[styles.dialog, { backgroundColor: theme.cardBg }]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.neg + '22' }]}>
            <Icon name="trash" size={26} color={theme.neg} strokeWidth={2} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Delete asset?</Text>
          <Text style={[styles.body, { color: theme.sub }]}>
            "{deleteTarget.name}" will be permanently removed. This cannot be undone.
          </Text>
          <View style={styles.btnRow}>
            <TouchableOpacity
              onPress={() => setDeleteTarget(null)}
              style={[styles.btn, { backgroundColor: theme.chipBg }]}
              accessibilityRole="button"
            >
              <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmDelete}
              style={[styles.btn, { backgroundColor: theme.neg }]}
              accessibilityRole="button"
            >
              <Text style={[styles.btnText, { color: '#fff' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,10,15,0.5)',
  },
  centered: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  dialog: {
    borderRadius: 24,
    padding: 26,
    paddingBottom: 18,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  title:  { fontSize: 18, textAlign: 'center', fontFamily: FONTS.jakartaExtraBold },
  body:   { fontSize: 14.5, marginTop: 7, lineHeight: 21, textAlign: 'center', fontFamily: FONTS.jakarta },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' },
  btn:    { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontSize: 15.5, fontFamily: FONTS.jakartaBold },
});
