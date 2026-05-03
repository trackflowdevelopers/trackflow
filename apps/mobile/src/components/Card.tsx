import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export function Card({ children, style, padding = 14 }: CardProps) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 16,
          padding,
          shadowColor: theme.cardShadow,
          shadowOpacity: theme.isDark ? 0 : 1,
          shadowRadius: theme.isDark ? 0 : 6,
          shadowOffset: { width: 0, height: theme.isDark ? 0 : 2 },
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
