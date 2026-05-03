import React from 'react';
import { View, Text } from 'react-native';
import type { ThemeTokens } from '@trackflow/shared-types';

interface InfoRowProps {
  label: string;
  value: string;
  last?: boolean;
  theme: ThemeTokens;
}

export function InfoRow({ label, value, last, theme }: InfoRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.borderSoft,
      }}
    >
      <Text style={{ fontSize: 12, color: theme.text2 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>{value}</Text>
    </View>
  );
}
