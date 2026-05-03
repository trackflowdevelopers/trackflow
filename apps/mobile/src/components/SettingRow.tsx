import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { ThemeTokens } from '@trackflow/shared-types';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { colors } from '../theme/colors';

interface SettingRowProps {
  icon: IconName;
  label: string;
  value: string;
  last?: boolean;
  onPress?: () => void;
  theme: ThemeTokens;
}

export function SettingRow({ icon, label, value, last, onPress, theme }: SettingRowProps) {
  const Comp = onPress ? TouchableOpacity : View;
  return (
    <Comp
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.borderSoft,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: `${colors.primary}22`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={15} color={colors.primary} />
      </View>
      <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: theme.text }}>{label}</Text>
      <Text style={{ fontSize: 12, color: theme.text2 }}>{value}</Text>
      {onPress && <Icon name="chevron-right" size={14} color={theme.text3} />}
    </Comp>
  );
}
