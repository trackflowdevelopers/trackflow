import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { StatusIcon } from './StatusIcon';
import { toStatusKey } from '../lib/status';

interface PreviewStatProps {
  label: string;
  value: string;
  unit?: string;
  color?: string;
  statusKey?: ReturnType<typeof toStatusKey>;
}

export function PreviewStat({ label, value, unit, color, statusKey }: PreviewStatProps) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.borderSoft,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: '600',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          color: theme.text3,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
        {statusKey && <StatusIcon status={statusKey} size={12} color={color} />}
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: color ?? theme.text,
            letterSpacing: -0.2,
          }}
        >
          {value}
        </Text>
        {unit && <Text style={{ fontSize: 10, color: theme.text3 }}>{unit}</Text>}
      </View>
    </View>
  );
}
