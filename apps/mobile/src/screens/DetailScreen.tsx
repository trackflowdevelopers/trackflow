import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader } from '../components/AppHeader';
import { Card } from '../components/Card';
import { Stat } from '../components/Stat';
import { Icon } from '../components/Icon';
import { SpeedChart } from '../components/SpeedChart';
import { colors, STATUS_STYLE } from '../theme/colors';
import { toStatusKey, formatDurationSec } from '../lib/status';
import { useFleetSocket } from '../hooks/useFleetSocket';
import { getVehicleById, getVehicleRoute } from '../api/vehicles';
import { buildEvents, type RouteEvent } from '../lib/events';
import type { RootStackParamList } from '../navigation/types';

type EventFilter = 'all' | 'alerts' | 'stops' | 'fuel';
type DetailRoute = RouteProp<RootStackParamList, 'Detail'>;
type DetailNav = NativeStackNavigationProp<RootStackParamList>;

function todayLocalISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function dateRange(localDate: string): { from: string; to: string } {
  const start = new Date(`${localDate}T00:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function DetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DetailNav>();
  const { params } = useRoute<DetailRoute>();
  const { vehicleId } = params;
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => getVehicleById(vehicleId),
    refetchInterval: 30_000,
  });

  const liveUpdates = useFleetSocket();
  const live = liveUpdates.get(vehicleId);

  const { from, to } = useMemo(() => dateRange(todayLocalISO()), []);
  const { data: route } = useQuery({
    queryKey: ['vehicle-route', vehicleId, from, to],
    queryFn: () => getVehicleRoute(vehicleId, from, to),
    refetchInterval: 10_000,
  });

  const events = useMemo(() => buildEvents(route), [route]);
  const filtered = useMemo(() => filterEvents(events, eventFilter), [events, eventFilter]);

  if (isLoading || !vehicle) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const status = toStatusKey(live?.status ?? vehicle.status);
  const c = STATUS_STYLE[status];
  const speed = live?.speed ?? vehicle.lastSpeed ?? 0;
  const fuel = live?.fuelLevel ?? vehicle.lastFuelLevel ?? 0;
  const statusLabel = t(`home.${status}`);

  const totalKm = (route?.totalDistanceKm ?? 0).toFixed(1);
  const driveMinutes = Math.floor((route?.totalDriveSec ?? 0) / 60);
  const stopMinutes = Math.floor((route?.totalStopSec ?? 0) / 60);

  const callDriver = () => {
    if (live) return;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AppHeader
        title={`#${vehicle.plateNumber}`}
        subtitle={`${vehicle.make} ${vehicle.model}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View
          style={{
            position: 'relative',
            borderRadius: 20,
            overflow: 'hidden',
            backgroundColor: c.bg,
            borderWidth: 1,
            borderColor: c.ring,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: colors.surface2,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="truck" size={28} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: colors.text2 }}>
                {vehicle.year} · {vehicle.fuelType}
              </Text>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}
              >
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.fg }}
                />
                <Text style={{ fontSize: 14, fontWeight: '600', color: c.fg }}>
                  {statusLabel}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.text3,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontWeight: '600',
                }}
              >
                {t('detail.current_speed')}
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: colors.text,
                  letterSpacing: -0.8,
                  lineHeight: 30,
                }}
              >
                {Math.round(status === 'moving' ? speed : 0)}
              </Text>
              <Text style={{ fontSize: 10, color: colors.text3 }}>
                {t('units.km_per_hour')}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats grid 2x2 */}
        <View style={{ marginBottom: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stat
              label={`${t('detail.distance')} (${t('detail.today')})`}
              value={totalKm}
              unit={t('units.km')}
            />
            <Stat label={t('detail.duration')} value={formatDurationMin(driveMinutes, t)} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stat label={t('detail.stopped_time')} value={formatDurationMin(stopMinutes, t)} />
            <Stat
              label={t('detail.fuel_litres')}
              value={Math.round(fuel)}
              unit="%"
              sub={`~${vehicle.fuelConsumptionNorm}L/100km`}
            />
          </View>
        </View>

        {/* Speed chart */}
        <Card style={{ marginBottom: 14 }} padding={14}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
              {t('detail.speed')} · {t('detail.today')}
            </Text>
            <Text style={{ fontSize: 11, color: colors.text3 }}>
              max {Math.round(maxSpeed(route?.points ?? []))} km/h
            </Text>
          </View>
          <SpeedChart points={route?.points ?? []} />
        </Card>

        {/* Driver */}
        <Card style={{ marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>
              {(vehicle.currentDriverName ?? '—')
                .split(' ')
                .map((s) => s[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 10,
                color: colors.text3,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: '600',
              }}
            >
              {t('detail.driver')}
            </Text>
            <Text
              style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 1 }}
            >
              {vehicle.currentDriverName ?? '—'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={callDriver}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="phone" size={18} color={colors.text} />
          </TouchableOpacity>
        </Card>

        {/* Vehicle info */}
        <Card style={{ marginBottom: 14 }}>
          <InfoRow label={t('detail.license_plate')} value={vehicle.plateNumber} />
          <InfoRow label={t('detail.engine')} value={vehicle.fuelType} />
          <InfoRow
            label={t('detail.odometer')}
            value={`${Math.round(vehicle.totalMileage).toLocaleString()} ${t('units.km')}`}
          />
          <InfoRow
            label={t('detail.last_service')}
            value={`—`}
            last
          />
        </Card>

        {/* Full log header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
            {t('detail.full_log')}
          </Text>
          <Text style={{ fontSize: 11, color: colors.text3 }}>
            {filtered.length} {t('detail.events')}
          </Text>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginBottom: 12 }}
          contentContainerStyle={{ gap: 6 }}
        >
          {(['all', 'alerts', 'stops', 'fuel'] as const).map((f) => {
            const on = eventFilter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setEventFilter(f)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: on ? colors.text : colors.surface,
                  borderWidth: 1,
                  borderColor: on ? colors.text : colors.borderStrong,
                }}
              >
                <Text
                  style={{
                    color: on ? colors.bg : colors.text2,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {t(f === 'fuel' ? 'detail.fuel_events' : `detail.${f}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Timeline */}
        <Card padding={0}>
          {filtered.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: colors.text3, fontSize: 13 }}>—</Text>
            </View>
          ) : (
            filtered.map((e, i) => (
              <EventRow key={i} event={e} t={t} last={i === filtered.length - 1} />
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

function maxSpeed(points: { speed: number }[]): number {
  let max = 0;
  for (const p of points) if (p.speed > max) max = p.speed;
  return max;
}

function formatDurationMin(minutes: number, t: (k: string) => string): string {
  if (minutes <= 0) return `0${t('units.min')}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}${t('units.hours')} ${m}${t('units.min')}`;
  return `${m}${t('units.min')}`;
}

function filterEvents(events: RouteEvent[], filter: EventFilter): RouteEvent[] {
  if (filter === 'all') return events;
  if (filter === 'alerts') return events.filter((e) => e.kind === 'alert' || e.kind === 'warn');
  if (filter === 'stops')
    return events.filter(
      (e) => e.type === 'stopped_engine' || e.type === 'long_idle' || e.type === 'arrived',
    );
  if (filter === 'fuel') return events.filter((e) => e.type === 'refuel');
  return events;
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 12, color: colors.text2 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{value}</Text>
    </View>
  );
}

function EventRow({
  event,
  t,
  last,
}: {
  event: RouteEvent;
  t: (k: string) => string;
  last: boolean;
}) {
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
        borderBottomColor: colors.border,
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
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
            {t(`detail.${event.type}`)}
          </Text>
          <Text style={{ fontSize: 11, color: colors.text3 }}>
            {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {event.durationSec !== undefined && (
          <Text style={{ fontSize: 11, color: colors.text2, marginTop: 2 }}>
            {formatDurationSec(event.durationSec, t)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
