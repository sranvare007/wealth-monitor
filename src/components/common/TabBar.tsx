import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, useColorScheme,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { useAppState } from '../../store/AppContext';
import { ACCENTS } from '../../constants/theme';

type TabDef = { route: string; icon: IconName; label: string };

const TABS: TabDef[] = [
  { route: 'Dashboard', icon: 'home_nav', label: 'Home' },
  { route: 'Assets',    icon: 'list',     label: 'Assets' },
  { route: 'History',   icon: 'history',  label: 'History' },
  { route: 'Settings',  icon: 'settings', label: 'Settings' },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { openAddSheet, accentKey } = useAppState();
  const accent = ACCENTS[accentKey];

  const bgColor = isDark ? 'rgba(11,14,20,0.9)' : 'rgba(255,255,255,0.92)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#E8EBEF';
  const activeColor = accent.solid;
  const inactiveColor = isDark ? '#5B6678' : '#94A3B8';

  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.root, { paddingBottom: bottomPad }]}>
      {/* Background fill */}
      <View style={[styles.bg, { backgroundColor: bgColor, borderTopColor: borderColor }]} />

      {/* Tab buttons */}
      <View style={styles.row}>
        {TABS.map((tab, i) => {
          const active = state.index === i;
          return (
            <React.Fragment key={tab.route}>
              {/* Leave a gap in the middle for the FAB */}
              {i === 2 && <View style={styles.fabGap} />}
              <TouchableOpacity
                onPress={() => navigation.navigate(tab.route)}
                style={styles.tab}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: active }}
              >
                <Icon
                  name={tab.icon}
                  size={23}
                  color={active ? activeColor : inactiveColor}
                  strokeWidth={active ? 2.3 : 2}
                />
                <Text style={[styles.label, { color: active ? activeColor : inactiveColor }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>

      {/* FAB — centred absolutely above the tab bar */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity
          onPress={openAddSheet}
          accessibilityRole="button"
          accessibilityLabel="Add asset"
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[accent.from, accent.to]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.fab, { shadowColor: accent.solid }]}
          >
            <Icon name="plus" size={28} color="#fff" strokeWidth={2.6} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const FAB_SIZE = 58;
const TAB_HEIGHT = 62;

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_HEIGHT + 24, // extra room for the FAB to poke above
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: StyleSheet.hairlineWidth,
    // Top portion is transparent so the FAB sits above it visually
    top: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 32, // pushes tab icons below the FAB
    height: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  fabGap: {
    width: FAB_SIZE + 10,
  },
  fabWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
});
