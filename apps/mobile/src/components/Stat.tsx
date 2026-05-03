import React from 'react';
import { View, Text, ViewStyle, StyleProp } from 'react-native';
import { Card } from './Card';
import { colors } from '../theme/colors';

interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  style?: StyleProp<ViewStyle>;
}

export function Stat({ label, value, unit, sub, style }: StatProps) {
  return (
    <Card padding={12} style={[{ flex: 1 }, style]}>
      <Text
        style={{
          fontSize: 10,
          letterSpacing: 0.5,
          fontWeight: '600',
          textTransform: 'uppercase',
          color: colors.text3,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: colors.text,
            letterSpacing: -0.6,
          }}
        >
          {value}
        </Text>
        {unit && (
          <Text style={{ fontSize: 11, color: colors.text3, fontWeight: '500' }}>{unit}</Text>
        )}
      </View>
      {sub && (
        <Text style={{ fontSize: 11, color: colors.primary, marginTop: 2, fontWeight: '500' }}>
          {sub}
        </Text>
      )}
    </Card>
  );
}
