import React, { useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../hooks/useTheme';
import { FONTS } from '../../constants/fonts';

type Props = { onDone: () => void };

export function SplashAnimation({ onDone }: Props) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  function handleFinish() {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 380,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDone();
    });
  }

  return (
    <Animated.View
      style={[styles.overlay, { backgroundColor: theme.bg, opacity }]}
    >
      <View style={styles.container}>
        <LottieView
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../assets/splash-animation.json')}
          autoPlay
          loop={false}
          onAnimationFinish={handleFinish}
          style={styles.animation}
        />
        <Text style={[styles.appName, { color: theme.text }]}>Wealth Monitor</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    gap: 16,
  },
  animation: {
    width: 240,
    height: 240,
  },
  appName: {
    fontSize: 22,
    letterSpacing: -0.4,
    fontFamily: FONTS.jakartaExtraBold,
  },
});
