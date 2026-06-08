import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

type Props = {
  value: boolean;
  onColor: string;
  offColor: string;
};

export function AnimatedToggle({ value, onColor, offColor }: Props) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      damping: 18,
      stiffness: 300,
      mass: 0.7,
      useNativeDriver: false, // color interpolation requires JS driver
    }).start();
  }, [value, anim]);

  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [offColor, onColor] });
  const thumbX  = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });

  return (
    <Animated.View style={[styles.track, { backgroundColor: bgColor }]}>
      <Animated.View style={[styles.thumb, { transform: [{ translateX: thumbX }] }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 50, height: 30, borderRadius: 999,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
});
