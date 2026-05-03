import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface MapThemeFadeProps {
  style?: StyleProp<ViewStyle>;
  duration?: number;
}

export function MapThemeFade({ style, duration = 380 }: MapThemeFadeProps) {
  const { theme, themeName } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    opacity.setValue(1);
    Animated.timing(opacity, {
      toValue: 0,
      duration,
      delay: 60,
      useNativeDriver: true,
    }).start();
  }, [themeName, opacity, duration]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: theme.bg, opacity },
        style,
      ]}
    />
  );
}
