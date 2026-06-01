import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppState } from '../../store/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { AddEditSheet } from './AddEditSheet';
import { DeleteConfirm } from './DeleteConfirm';
import { CurrencyPicker } from './CurrencyPicker';
import { CategoriesSheet } from './CategoriesSheet';
import { OnboardingScreen } from '../../navigation/screens/Onboarding';

// Renders all full-screen overlays above the main navigation.
// This component must be inside AppProvider.
export function AppOverlays() {
  const { onboardingDone, deleteTarget, addEditOpen, currencyPickerOpen } = useAppState();
  const { theme } = useTheme();

  return (
    <>
      <AddEditSheet />
      <CurrencyPicker />
      <CategoriesSheet />
      {deleteTarget && <DeleteConfirm />}

      {/* Onboarding overlay — rendered last so it sits on top of everything */}
      {!onboardingDone && (
        <View style={[styles.fullScreen, { backgroundColor: theme.bg }]}>
          <OnboardingScreen />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300,
  },
});
