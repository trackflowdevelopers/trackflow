import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Vehicle, WsVehicleUpdate } from '@trackflow/shared-types';
import { Icon, StatusIcon } from './Icon';
import { STATUS_STYLE, colors } from '../theme/colors';
import { toStatusKey } from '../lib/status';

interface SelectedPreviewProps {
  vehicle: Vehicle;
  live?: WsVehicleUpdate;
  onOpen: () => void;
  onClose: () => void;
}

export function SelectedPreview({ vehicle, live, onOpen, onClose }: SelectedPreviewProps) {
  const { t } = useTranslation();
  const status = toStatusKey(live?.status ?? vehicle.status);
  const c = STATUS_STYLE[status];
  const speed = live?.speed ?? vehicle.lastSpeed ?? 0;
  const fuel = live?.fuelLevel ?? vehicle.lastFuelLevel ?? 0;
  const statusLabel = t(`home.${status}`);
  const driverName = vehicle.currentDriverName ?? '—';

  return (
    <View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12,
        backgroundColor: 'rgba(15,27,48,0.95)',
        borderWidth: 1,
        borderColor: colors.borderStrong,
        borderRadius: 18,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: c.bg,
            borderWidth: 1,
            borderColor: c.ring,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="truck" size={22} color={c.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text
              style={{ fontWeight: '700', fontSize: 16, color: colors.text, letterSpacing: -0.3 }}
            >
              #{vehicle.plateNumber}
            </Text>
            <Text style={{ fontSize: 12, color: colors.text2 }}>
              {vehicle.make} {vehicle.model}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.text2, marginTop: 2 }} numberOfLines={1}>
            {driverName}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="close" size={14} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <PreviewStat label={t('detail.current_status')} value={statusLabel} color={c.fg} statusKey={status} />
        <PreviewStat label={t('detail.speed')} value={String(Math.round(speed))} unit={t('units.km_per_hour')} />
        <PreviewStat label={t('detail.fuel')} value={String(Math.round(fuel))} unit="%" />
      </View>

      <TouchableOpacity
        onPress={onOpen}
        style={{
          marginTop: 12,
          height: 44,
          borderRadius: 12,
          backgroundColor: colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
          {t('detail.open_details')}
        </Text>
        <Icon name="arrow-right" size={16} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

interface PreviewStatProps {
  label: string;
  value: string;
  unit?: string;
  color?: string;
  statusKey?: ReturnType<typeof toStatusKey>;
}

function PreviewStat({ label, value, unit, color, statusKey }: PreviewStatProps) {
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: '600',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          color: colors.text3,
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
            color: color ?? colors.text,
            letterSpacing: -0.2,
          }}
        >
          {value}
        </Text>
        {unit && <Text style={{ fontSize: 10, color: colors.text3 }}>{unit}</Text>}
      </View>
    </View>
  );
}
