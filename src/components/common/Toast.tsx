import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastContext, type ToastType } from '../../store/ToastContext';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from './Icon';
import { FONTS } from '../../constants/fonts';

const TYPE_CONFIG: Record<ToastType, { icon: 'check' | 'close' | 'info'; color: string }> = {
  success: { icon: 'check', color: '#10B981' },
  error:   { icon: 'close', color: '#EF4444' },
  info:    { icon: 'info',  color: '#3B82F6' },
};

export function Toast() {
  const { current, dismiss } = useToastContext();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!current) return;

    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 220,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after duration
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => dismiss());
    }, current.duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current?.id]);

  if (!current) return null;

  const { icon, color } = TYPE_CONFIG[current.type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 12,
          backgroundColor: theme.cardBg,
          borderColor: theme.line,
          shadowColor: theme.dark ? '#000' : '#1E293B',
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={16} color={color} strokeWidth={2.4} />
      </View>
      <Text style={[styles.message, { color: theme.text }]} numberOfLines={3}>
        {current.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 13,
    paddingRight: 16,
    zIndex: 999,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 10,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginLeft: 4,
    flexShrink: 0,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.jakartaSemiBold,
  },
});
