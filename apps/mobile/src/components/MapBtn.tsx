import React from 'react';
import { TouchableOpacity } from 'react-native';
import type { ThemeTokens } from '@trackflow/shared-types';
import { Icon } from './Icon';

interface MapBtnProps {
  icon: 'layers' | 'plus' | 'minus' | 'compass' | 'crosshair';
  onPress: () => void;
  theme: ThemeTokens;
}

export function MapBtn({ icon, onPress, theme }: MapBtnProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: theme.borderStrong,
        backgroundColor: theme.surfaceFloat,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.cardShadow,
        shadowOpacity: theme.isDark ? 0 : 1,
        shadowRadius: theme.isDark ? 0 : 6,
        shadowOffset: { width: 0, height: theme.isDark ? 0 : 2 },
        elevation: theme.isDark ? 0 : 3,
      }}
    >
      <Icon name={icon} size={16} color={theme.text} />
    </TouchableOpacity>
  );
}
