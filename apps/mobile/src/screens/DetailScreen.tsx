import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ThemeTokens } from '@trackflow/shared-types';

import { AppHeader } from '../components/AppHeader';
import { Card } from '../components/Card';
import { Stat } from '../components/Stat';
import { Icon } from '../components/Icon';
import { SpeedChart } from '../components/SpeedChart';
import { colors, STATUS_STYLE } from '../theme/colors';
import { toStatusKey, formatDurationSec } from '../lib/status';
import { useFleetSocket } from '../hooks/useFleetSocket';
import { getVehicleById, getVehicleRoute, lockVehicle, unlockVehicle } from '../api/vehicles';
import { buildEvents, type RouteEvent } from '../lib/events';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';

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

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

export function DetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DetailNav>();
  const { params } = useRoute<DetailRoute>();
  const { vehicleId } = params;
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [selectedDate, setSelectedDate] = useState(todayLocalISO);

  const today = todayLocalISO();
  const isToday = selectedDate === today;

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => getVehicleById(vehicleId),
    refetchInterval: 30_000,
  });

  const liveUpdates = useFleetSocket();
  const live = liveUpdates.get(vehicleId);

  const { from, to } = useMemo(() => dateRange(selectedDate), [selectedDate]);

  const { data: route } = useQuery({
    queryKey: ['vehicle-route', vehicleId, from, to],
    queryFn: () => getVehicleRoute(vehicleId, from, to),
    refetchInterval: isToday ? 10_000 : false,
  });

  const routeStats = useMemo(() => {
    const pts = route?.points ?? [];
    let idleSec = 0;
    let parkedSec = 0;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const dt =
        (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
      if (!prev.ignition) {
        parkedSec += dt;
      } else if (prev.speed < 2) {
        idleSec += dt;
      }
    }
    return { idleSec, parkedSec };
  }, [route?.points]);

  const events = useMemo(() => buildEvents(route), [route]);
  const filtered = useMemo(() => filterEvents(events, eventFilter), [events, eventFilter]);

  const goToPrevDay = useCallback(() => setSelectedDate((d) => shiftDate(d, -1)), []);
  const goToNextDay = useCallback(() => {
    setSelectedDate((d) => {
      const next = shiftDate(d, 1);
      return next <= today ? next : d;
    });
  }, [today]);

  const queryClient = useQueryClient();

  const lockMutation = useMutation({
    mutationFn: () => lockVehicle(vehicleId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['vehicle', vehicleId], updated);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: () => unlockVehicle(vehicleId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['vehicle', vehicleId], updated);
    },
  });

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
  const driveSec = route?.totalDriveSec ?? 0;
  const totalStoppedSec = routeStats.idleSec + routeStats.parkedSec;

  const isMoving = (live?.speed ?? vehicle.lastSpeed ?? 0) > 2;
  const immobilized = vehicle.isImmobilized;
  const isMutating = lockMutation.isPending || unlockMutation.isPending;

  const handleImmobilizerPress = () => {
    if (!immobilized && isMoving) {
      Alert.alert('', t('detail.lock_moving_warn'));
      return;
    }
    const title = immobilized ? t('detail.unlock_confirm_title') : t('detail.lock_confirm_title');
    const msg = immobilized ? t('detail.unlock_confirm_msg') : t('detail.lock_confirm_msg');
    Alert.alert(title, msg, [
      { text: t('detail.confirm_no'), style: 'cancel' },
      {
        text: t('detail.confirm_yes'),
        style: immobilized ? 'default' : 'destructive',
        onPress: () => (immobilized ? unlockMutation.mutate() : lockMutation.mutate()),
      },
    ]);
  };

  const callDriver = () => {};

  const openRouteMap = () => {
    navigation.navigate('RouteMap', {
      vehicleId,
      plateNumber: vehicle.plateNumber,
      from,
      to,
    });
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
        <View style={styles.datePicker}>
          <TouchableOpacity onPress={goToPrevDay} style={styles.dateArrowBtn}>
            <Icon name="arrow-left" size={16} color={theme.text2} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.dateLabel}>
              {isToday ? t('detail.today') : formatDisplayDate(selectedDate)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={goToNextDay}
            style={[styles.dateArrowBtn, isToday && { opacity: 0.3 }]}
            disabled={isToday}
          >
            <Icon name="arrow-right" size={16} color={theme.text2} />
          </TouchableOpacity>
        </View>

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
                backgroundColor: theme.surface2,
                borderWidth: 1,
                borderColor: theme.borderStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="truck" size={28} color={theme.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: theme.text2 }}>
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
                  color: theme.text3,
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
                  color: theme.text,
                  letterSpacing: -0.8,
                  lineHeight: 30,
                }}
              >
                {Math.round(status === 'moving' ? speed : 0)}
              </Text>
              <Text style={{ fontSize: 10, color: theme.text3 }}>
                {t('units.km_per_hour')}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stat
              label={t('detail.distance')}
              value={totalKm}
              unit={t('units.km')}
            />
            <Stat
              label={t('detail.duration')}
              value={formatDurationSec(driveSec, t)}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stat
              label={t('detail.idle_time')}
              value={formatDurationSec(routeStats.idleSec, t)}
            />
            <Stat
              label={t('detail.parked_time')}
              value={formatDurationSec(routeStats.parkedSec, t)}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stat
              label={t('detail.total_stopped')}
              value={formatDurationSec(totalStoppedSec, t)}
            />
            <Stat
              label={t('detail.fuel_remaining')}
              value={Math.round(fuel)}
              unit="%"
              sub={`~${vehicle.fuelConsumptionNorm}L/100km`}
            />
          </View>
        </View>

        <TouchableOpacity onPress={openRouteMap} style={styles.mapBtn}>
          <Icon name="map-pin" size={16} color={theme.text} />
          <Text style={styles.mapBtnText}>{t('detail.view_on_map')}</Text>
          <Icon name="arrow-right" size={14} color={theme.text2} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleImmobilizerPress}
          disabled={isMutating}
          style={[
            styles.immobilizerBtn,
            immobilized ? styles.immobilizerBtnLocked : styles.immobilizerBtnUnlocked,
            isMutating && { opacity: 0.6 },
          ]}
        >
          {isMutating ? (
            <ActivityIndicator size="small" color={immobilized ? colors.alert : theme.text} />
          ) : (
            <Icon
              name="shield"
              size={18}
              color={immobilized ? colors.alert : theme.text}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.immobilizerBtnText,
                { color: immobilized ? colors.alert : theme.text },
              ]}
            >
              {immobilized ? t('detail.unlock_engine') : t('detail.lock_engine')}
            </Text>
            {immobilized && (
              <Text style={styles.immobilizerBtnSub}>{t('detail.immobilized')}</Text>
            )}
          </View>
          {!isMutating && (
            <View
              style={[
                styles.immobilizerDot,
                { backgroundColor: immobilized ? colors.alert : '#22c55e' },
              ]}
            />
          )}
        </TouchableOpacity>

        <Card style={{ marginBottom: 14 }} padding={14}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
              {t('detail.speed')} · {isToday ? t('detail.today') : formatDisplayDate(selectedDate)}
            </Text>
            <Text style={{ fontSize: 11, color: theme.text3 }}>
              max {Math.round(maxSpeed(route?.points ?? []))} km/h
            </Text>
          </View>
          <SpeedChart points={route?.points ?? []} />
        </Card>

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
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
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
                color: theme.text3,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: '600',
              }}
            >
              {t('detail.driver')}
            </Text>
            <Text
              style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginTop: 1 }}
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
            <Icon name="phone" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <InfoRow label={t('detail.license_plate')} value={vehicle.plateNumber} theme={theme} />
          <InfoRow label={t('detail.engine')} value={vehicle.fuelType} theme={theme} />
          <InfoRow
            label={t('detail.odometer')}
            value={`${Math.round(vehicle.totalMileage).toLocaleString()} ${t('units.km')}`}
            theme={theme}
          />
          <InfoRow label={t('detail.last_service')} value="—" last theme={theme} />
        </Card>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
            {t('detail.full_log')}
          </Text>
          <Text style={{ fontSize: 11, color: theme.text3 }}>
            {filtered.length} {t('detail.events')}
          </Text>
        </View>

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
                  backgroundColor: on ? theme.chipBgActive : theme.chipBg,
                  borderWidth: 1,
                  borderColor: on ? theme.chipBgActive : theme.borderStrong,
                }}
              >
                <Text
                  style={{
                    color: on ? theme.chipFgActive : theme.text2,
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

        <Card padding={0}>
          {filtered.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: theme.text3, fontSize: 13 }}>—</Text>
            </View>
          ) : (
            filtered.map((e, i) => (
              <EventRow key={i} event={e} t={t} last={i === filtered.length - 1} theme={theme} />
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

interface InfoRowProps {
  label: string;
  value: string;
  last?: boolean;
  theme: ThemeTokens;
}

function InfoRow({ label, value, last, theme }: InfoRowProps) {
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

interface EventRowProps {
  event: RouteEvent;
  t: (k: string) => string;
  last: boolean;
  theme: ThemeTokens;
}

function EventRow({ event, t, last, theme }: EventRowProps) {
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

function makeStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    loading: {
      flex: 1,
      backgroundColor: theme.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    datePicker: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      paddingHorizontal: 4,
    },
    dateArrowBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    mapBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 14,
      borderRadius: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: colors.primary + '55',
      marginBottom: 10,
    },
    mapBtnText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    immobilizerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 14,
    },
    immobilizerBtnLocked: {
      backgroundColor: colors.alert + '18',
      borderColor: colors.alert + '60',
    },
    immobilizerBtnUnlocked: {
      backgroundColor: theme.surface,
      borderColor: theme.borderStrong,
    },
    immobilizerBtnText: {
      fontSize: 13,
      fontWeight: '700',
    },
    immobilizerBtnSub: {
      fontSize: 11,
      color: colors.alert,
      fontWeight: '500',
      marginTop: 1,
    },
    immobilizerDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
  });
}
