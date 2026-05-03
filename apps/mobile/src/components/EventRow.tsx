import React from 'react';
import { View, Text } from 'react-native';
import type { ThemeTokens } from '@trackflow/shared-types';
import { Icon } from './Icon';
import { colors } from '../theme/colors';
import { formatDurationSec } from '../lib/status';
import type { RouteEvent } from '../lib/events';

interface EventRowProps {
  event: RouteEvent;
  t: (k: string) => string;
  last: boolean;
  theme: ThemeTokens;
}

export function EventRow({ event, t, last, theme }: EventRowProps) {
  const kindColor = {
    info: colors.info,
    warn: colors.warn,
    alert: colors.alert,
  }[event.kind];

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.borderSoft,
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          backgroundColor: kindColor + '20',
          borderWidth: 1,
          borderColor: kindColor + '40',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={event.icon as 'play'} size={14} color={kindColor} />
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
            {t(`detail.${event.type}`)}
          </Text>
          <Text style={{ fontSize: 11, color: theme.text3 }}>
            {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {event.durationSec !== undefined && (
          <Text style={{ fontSize: 11, color: theme.text2, marginTop: 2 }}>
            {formatDurationSec(event.durationSec, t)}
          </Text>
        )}
      </View>
    </View>
  );
}
