import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  StyleSheet, Animated, Dimensions, KeyboardAvoidingView, Platform, Alert, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { CATEGORIES, CATEGORY_PICKER_ICONS, CATEGORY_COLOR_PALETTE } from '../../data/categories';
import type { Category } from '../../types';
import type { ThemeColors, AccentDef } from '../../constants/theme';
import { FONTS } from '../../constants/fonts';

const { height: SCREEN_H } = Dimensions.get('window');
const ICON_COLS = 5;
const DEFAULT_COLOR = CATEGORY_COLOR_PALETTE[4]; // teal as default

type SheetView = 'list' | 'form';

type FormState = {
  editingId: string | null;
  name: string;
  selectedIcon: IconName;
  selectedColor: string;
  isLiability: boolean;
};

const BLANK_FORM: FormState = {
  editingId: null,
  name: '',
  selectedIcon: 'wallet',
  selectedColor: DEFAULT_COLOR,
  isLiability: false,
};

export function CategoriesSheet() {
  const {
    categoriesSheetOpen, categoriesSheetForCreate, closeCategoriesSheet,
    customCategories, saveCustomCategory, removeCustomCategory,
    assets,
  } = useAppState();
  const { theme, accent } = useTheme();
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<SheetView>('list');
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    if (categoriesSheetOpen) {
      setMounted(true);
      setView(categoriesSheetForCreate ? 'form' : 'list');
      if (categoriesSheetForCreate) resetForm();
      Animated.spring(slideAnim, {
        toValue: 0, damping: 26, stiffness: 260, useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_H, duration: 280, useNativeDriver: true,
      }).start(() => {
        setMounted(false);
        resetForm();
      });
    }
  }, [categoriesSheetOpen]);

  function resetForm() {
    setForm(BLANK_FORM);
    setNameError(false);
  }

  function openNewForm() {
    resetForm();
    setView('form');
  }

  function openEditForm(cat: Category) {
    setForm({
      editingId: cat.id,
      name: cat.label,
      selectedIcon: cat.icon as IconName,
      selectedColor: cat.color,
      isLiability: cat.liability ?? false,
    });
    setNameError(false);
    setView('form');
  }

  function goBack() {
    if (categoriesSheetForCreate) {
      closeCategoriesSheet();
    } else {
      setView('list');
      resetForm();
    }
  }

  function handleSave() {
    if (!form.name.trim()) {
      setNameError(true);
      return;
    }
    saveCustomCategory({
      id: form.editingId ?? undefined,
      label: form.name.trim(),
      icon: form.selectedIcon,
      color: form.selectedColor,
      liability: form.isLiability,
    });
    if (categoriesSheetForCreate) {
      closeCategoriesSheet();
    } else {
      setView('list');
      resetForm();
    }
  }

  function handleDeleteFromForm() {
    if (!form.editingId) return;
    const cat = customCategories.find(c => c.id === form.editingId);
    if (!cat) return;
    const usedCount = assets.filter(a => a.cat === form.editingId).length;
    if (usedCount > 0) {
      Alert.alert(
        'Category in use',
        `"${cat.label}" is used by ${usedCount} asset${usedCount > 1 ? 's' : ''}. Remove those assets first.`,
        [{ text: 'OK' }],
      );
      return;
    }
    Alert.alert(
      `Delete "${cat.label}"?`,
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: () => {
            removeCustomCategory(form.editingId!);
            setView('list');
            resetForm();
          },
        },
      ],
    );
  }

  function handleDeleteFromList(catId: string, catLabel: string) {
    const usedCount = assets.filter(a => a.cat === catId).length;
    if (usedCount > 0) {
      Alert.alert(
        'Category in use',
        `"${catLabel}" is used by ${usedCount} asset${usedCount > 1 ? 's' : ''}. Remove those assets first.`,
        [{ text: 'OK' }],
      );
      return;
    }
    Alert.alert(
      `Delete "${catLabel}"?`,
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeCustomCategory(catId) },
      ],
    );
  }

  const setFormField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'name' && nameError) setNameError(false);
  };

  const renderIcon = useCallback(({ item }: { item: IconName }) => {
    const isSelected = item === form.selectedIcon;
    return (
      <TouchableOpacity
        onPress={() => setFormField('selectedIcon', item)}
        style={[
          styles.iconCell,
          {
            borderColor: isSelected ? form.selectedColor : theme.line,
            backgroundColor: isSelected ? form.selectedColor + '18' : theme.chipBg,
          },
        ]}
        accessibilityLabel={item}
        accessibilityRole="button"
      >
        <Icon
          name={item}
          size={22}
          color={isSelected ? form.selectedColor : theme.sub}
          strokeWidth={2}
        />
      </TouchableOpacity>
    );
  }, [form.selectedIcon, form.selectedColor, theme.line, theme.chipBg, theme.sub]);

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} statusBarTranslucent animationType="none">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={view === 'list' ? closeCategoriesSheet : undefined}
          style={styles.backdrop}
        />

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

          {view === 'list' ? (
            <ListContent
              theme={theme}
              accent={accent}
              customCategories={customCategories}
              assets={assets}
              onClose={closeCategoriesSheet}
              onNewCategory={openNewForm}
              onEditCategory={openEditForm}
              onDelete={handleDeleteFromList}
            />
          ) : (
            <FormContent
              theme={theme}
              accent={accent}
              form={form}
              nameError={nameError}
              isEditing={form.editingId !== null}
              onBack={goBack}
              onSave={handleSave}
              onDelete={handleDeleteFromForm}
              setFormField={setFormField}
              renderIcon={renderIcon}
            />
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

type ListProps = {
  theme: ThemeColors;
  accent: AccentDef;
  customCategories: Category[];
  assets: import('../../types').Asset[];
  onClose: () => void;
  onNewCategory: () => void;
  onEditCategory: (cat: Category) => void;
  onDelete: (id: string, label: string) => void;
};

function ListContent({
  theme, accent, customCategories, assets,
  onClose, onNewCategory, onEditCategory, onDelete,
}: ListProps) {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>Categories</Text>
        <TouchableOpacity onPress={onClose} style={styles.ghostBtn}>
          <Text style={[styles.ghostBtnText, { color: accent.solid, fontFamily: FONTS.jakartaBold }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listBody}>
        <TouchableOpacity
          onPress={onNewCategory}
          style={[styles.newCatBtn, { borderColor: theme.line, backgroundColor: theme.chipBg }]}
          accessibilityRole="button"
          accessibilityLabel="New category"
        >
          <View style={[styles.newCatIcon, { backgroundColor: accent.solid }]}>
            <Icon name="plus" size={18} color="#fff" strokeWidth={2.5} />
          </View>
          <Text style={[styles.newCatText, { color: accent.solid }]}>New category</Text>
        </TouchableOpacity>

        {customCategories.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.sub }]}>YOUR CATEGORIES</Text>
            <View style={[styles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
              {customCategories.map((cat, i) => {
                const count = assets.filter(a => a.cat === cat.id).length;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => onEditCategory(cat)}
                    style={[
                      styles.catRow,
                      i < customCategories.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line },
                    ]}
                    accessibilityRole="button"
                  >
                    <View style={[styles.catIconBadge, { backgroundColor: cat.color + '22' }]}>
                      <Icon name={cat.icon as any} size={18} color={cat.color} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.catRowLabel, { color: theme.text }]} numberOfLines={1}>{cat.label}</Text>
                      <Text style={[styles.catRowSub, { color: theme.sub }]}>
                        {count} asset{count !== 1 ? 's' : ''}{cat.liability ? ' · Liability' : ''}
                      </Text>
                    </View>
                    <Icon name="chevR" size={16} color={theme.faint} strokeWidth={2.2} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <Text style={[styles.sectionLabel, { color: theme.sub }]}>BUILT-IN</Text>
        <View style={[styles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.line }]}>
          {CATEGORIES.map((cat, i) => (
            <View
              key={cat.id}
              style={[
                styles.catRow,
                i < CATEGORIES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line },
              ]}
            >
              <View style={[styles.catIconBadge, { backgroundColor: cat.color + '22' }]}>
                <Icon name={cat.icon as any} size={18} color={cat.color} strokeWidth={2} />
              </View>
              <Text style={[styles.catRowLabel, { color: theme.sub }]}>{cat.label}</Text>
              <View style={[styles.defaultBadge, { backgroundColor: theme.chipBg }]}>
                <Text style={[styles.defaultBadgeText, { color: theme.faint }]}>Default</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

// ─── Form view ────────────────────────────────────────────────────────────────

type FormProps = {
  theme: ThemeColors;
  accent: AccentDef;
  form: FormState;
  nameError: boolean;
  isEditing: boolean;
  onBack: () => void;
  onSave: () => void;
  onDelete: () => void;
  setFormField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  renderIcon: ({ item }: { item: IconName }) => React.ReactElement;
};

function FormContent({
  theme, accent, form, nameError, isEditing,
  onBack, onSave, onDelete, setFormField, renderIcon,
}: FormProps) {
  const displayName = form.name.trim() || 'Category name';
  const isPlaceholder = !form.name.trim();

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.ghostBtn}>
          <Text style={[styles.ghostBtnText, { color: theme.sub }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isEditing ? 'Edit category' : 'New category'}
        </Text>
        <TouchableOpacity onPress={onSave} style={styles.ghostBtn}>
          <Text style={[styles.ghostBtnText, { color: form.name.trim() ? accent.solid : theme.faint, fontFamily: FONTS.jakartaBold }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.formBody}
        keyboardShouldPersistTaps="handled"
      >
        {/* Live preview */}
        <View style={[styles.previewCard, { backgroundColor: theme.chipBg, borderColor: theme.line }]}>
          <View style={[styles.previewIconBadge, { backgroundColor: form.selectedColor + '24' }]}>
            <Icon name={form.selectedIcon} size={26} color={form.selectedColor} strokeWidth={2.1} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[styles.previewName, { color: isPlaceholder ? theme.faint : theme.text }]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text style={[styles.previewSub, { color: theme.sub }]}>
              {form.isLiability ? 'Subtracts from net worth' : 'Adds to net worth'}
            </Text>
          </View>
        </View>

        {/* Name */}
        <Text style={[styles.fieldLabel, { color: theme.sub }]}>NAME</Text>
        <View style={[
          styles.inputBox,
          { backgroundColor: theme.chipBg, borderColor: nameError ? '#EF4444' : 'transparent' },
        ]}>
          <TextInput
            value={form.name}
            onChangeText={v => setFormField('name', v)}
            placeholder="e.g. Vehicles, Art, Pension"
            placeholderTextColor={theme.faint}
            style={[styles.input, { color: theme.text }]}
            maxLength={40}
          />
        </View>

        {/* Icon picker */}
        <Text style={[styles.fieldLabel, { color: theme.sub }]}>ICON</Text>
        <FlatList
          data={CATEGORY_PICKER_ICONS}
          renderItem={renderIcon}
          keyExtractor={item => item}
          numColumns={ICON_COLS}
          scrollEnabled={false}
          contentContainerStyle={styles.iconGrid}
          columnWrapperStyle={styles.iconRow}
        />

        {/* Color picker */}
        <Text style={[styles.fieldLabel, { color: theme.sub, marginTop: 6 }]}>COLOR</Text>
        <View style={styles.colorGrid}>
          {CATEGORY_COLOR_PALETTE.map(col => {
            const isSelected = form.selectedColor === col;
            return (
              <TouchableOpacity
                key={col}
                onPress={() => setFormField('selectedColor', col)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: col },
                  isSelected && {
                    shadowColor: col,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 5,
                    elevation: 4,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={col}
              >
                {isSelected && <Icon name="check" size={15} color="#fff" strokeWidth={3.2} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Liability toggle */}
        <TouchableOpacity
          onPress={() => setFormField('isLiability', !form.isLiability)}
          style={[styles.liabilityRow, { backgroundColor: theme.chipBg }]}
          activeOpacity={0.75}
          accessibilityRole="switch"
          accessibilityState={{ checked: form.isLiability }}
          accessibilityLabel="Counts as a liability"
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.liabilityLabel, { color: theme.text }]}>Counts as a liability</Text>
            <Text style={[styles.liabilitySub, { color: theme.sub }]}>Subtract these assets from net worth</Text>
          </View>
          <Switch
            value={form.isLiability}
            onValueChange={v => setFormField('isLiability', v)}
            trackColor={{ false: theme.line, true: '#EF4444aa' }}
            thumbColor={form.isLiability ? '#EF4444' : theme.sub}
          />
        </TouchableOpacity>

        {/* Save button */}
        <TouchableOpacity
          onPress={onSave}
          style={[styles.saveBtn, { backgroundColor: accent.solid }]}
          accessibilityRole="button"
        >
          <Icon name={isEditing ? 'check' : 'plus'} size={19} color="#fff" strokeWidth={2.3} />
          <Text style={styles.saveBtnText}>{isEditing ? 'Save Category' : 'Add Category'}</Text>
        </TouchableOpacity>

        {/* Delete (edit mode only) */}
        {isEditing && (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteBtn}
            accessibilityRole="button"
          >
            <Icon name="trash" size={18} color={theme.neg} strokeWidth={2.1} />
            <Text style={[styles.deleteBtnText, { color: theme.neg }]}>Delete Category</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,10,15,0.45)' },
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  headerTitle: { fontSize: 17, fontFamily: FONTS.jakartaExtraBold },
  headerSpacer: { width: 50 },
  ghostBtn: { padding: 6, minWidth: 50 },
  ghostBtnText: { fontSize: 16, fontFamily: FONTS.jakartaSemiBold },

  // ── List ──────────────────────────────────────────────────────────────────
  listBody: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 },
  newCatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20,
  },
  newCatIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  newCatText: { fontSize: 16, fontFamily: FONTS.jakartaBold },
  sectionLabel: {
    fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase',
    marginBottom: 8, marginLeft: 4, fontFamily: FONTS.jakartaBold,
  },
  listCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  catIconBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catRowLabel: { fontSize: 15, fontFamily: FONTS.jakartaSemiBold },
  catRowSub: { fontSize: 12.5, fontFamily: FONTS.jakarta, marginTop: 1 },
  defaultBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  defaultBadgeText: { fontSize: 12, fontFamily: FONTS.jakartaSemiBold },

  // ── Form ──────────────────────────────────────────────────────────────────
  formBody: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 },
  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24,
  },
  previewIconBadge: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 17, fontFamily: FONTS.jakartaBold, marginBottom: 3 },
  previewSub: { fontSize: 13, fontFamily: FONTS.jakarta },
  fieldLabel: {
    fontSize: 12.5, letterSpacing: 0.3, textTransform: 'uppercase',
    marginBottom: 8, marginLeft: 2, fontFamily: FONTS.jakartaBold,
  },
  inputBox: { borderRadius: 14, borderWidth: 1.5, marginBottom: 22 },
  input: { fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, fontFamily: FONTS.jakarta },
  iconGrid: { gap: 9, marginBottom: 22 },
  iconRow: { gap: 9 },
  iconCell: {
    flex: 1, aspectRatio: 1, borderRadius: 13, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  colorGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    marginBottom: 22,
  },
  colorSwatch: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  liabilityRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 22,
  },
  liabilityLabel: { fontSize: 15, fontFamily: FONTS.jakartaBold, marginBottom: 3 },
  liabilitySub: { fontSize: 12.5, fontFamily: FONTS.jakarta, lineHeight: 17 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 15, paddingVertical: 15,
  },
  saveBtnText: { fontSize: 16, color: '#fff', fontFamily: FONTS.jakartaBold },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, marginTop: 10, paddingVertical: 14,
  },
  deleteBtnText: { fontSize: 15, fontFamily: FONTS.jakartaBold },
});
