import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  Vehicle,
  WsVehicleUpdate,
  VehicleStatus,
  ThemeTokens,
} from '@trackflow/shared-types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader } from '../components/AppHeader';
import { Stat } from '../components/Stat';
import { CarMarker } from '../components/CarMarker';
import { SelectedPreview } from '../components/SelectedPreview';
import { Icon } from '../components/Icon';
import { MapBtn } from '../components/MapBtn';
import { MapThemeFade } from '../components/MapThemeFade';
import { colors, STATUS_STYLE } from '../theme/colors';
import { toStatusKey } from '../lib/status';
import { getMapStyle } from '../lib/mapStyle';
import { useFleetSocket } from '../hooks/useFleetSocket';
import { getVehicles } from '../api/vehicles';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/useTheme';

type StatusFilter = 'all' | 'moving' | 'idle' | 'parked' | 'offline';

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

const TASHKENT: Region = {
  latitude: 41.2995,
  longitude: 69.2401,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

export function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNav>();
  const { theme, themeName } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const mapRef = useRef<MapView | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [markerNonce, setMarkerNonce] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setMarkerNonce((n) => n + 1);
    }, []),
  );

  useEffect(() => {
    setMarkerNonce((n) => n + 1);
  }, [themeName]);

  const { data: vehiclesData, isLoading, isError } = useQuery({
    queryKey: ['vehicles', { mobile: true }],
    queryFn: () => getVehicles({ limit: 100 }),
    refetchInterval: 30_000,
  });

  const liveUpdates = useFleetSocket();
  const vehicles = vehiclesData?.data ?? [];
  const selectedVehicle = vehicles.find((v) => v.id === selectedId) ?? null;
  const liveSelected = selectedId ? liveUpdates.get(selectedId) : undefined;

  const filtered = useMemo(
    () =>
      vehicles.filter((v) => {
        if (statusFilter === 'all') return true;
        const live = liveUpdates.get(v.id);
        return toStatusKey(live?.status ?? v.status) === statusFilter;
      }),
    [vehicles, statusFilter, liveUpdates],
  );

  const stats = useMemo(() => computeStats(vehicles, liveUpdates), [vehicles, liveUpdates]);

  const vehiclesRef = useRef(vehicles);
  vehiclesRef.current = vehicles;
  const liveRef = useRef(liveUpdates);
  liveRef.current = liveUpdates;

  const fittedRef = useRef(false);
  useEffect(() => {
    if (fittedRef.current || vehicles.length === 0 || !mapRef.current) return;
    const coords = vehicles
      .map((v) => {
        const live = liveUpdates.get(v.id);
        const lat = live?.latitude ?? v.lastLatitude;
        const lng = live?.longitude ?? v.lastLongitude;
        if (lat === null || lng === null) return null;
        return { latitude: lat, longitude: lng };
      })
      .filter((c): c is { latitude: number; longitude: number } => c !== null);
    if (coords.length === 0) return;
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 60, bottom: 280, left: 60 },
      animated: false,
    });
    fittedRef.current = true;
  }, [vehicles, liveUpdates]);

  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const v = vehiclesRef.current.find((veh) => veh.id === selectedId);
    if (!v) return;
    const live = liveRef.current.get(selectedId);
    const lat = live?.latitude ?? v.lastLatitude;
    const lng = live?.longitude ?? v.lastLongitude;
    if (lat == null || lng == null) return;
    mapRef.current.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      450,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const filterChips: { id: StatusFilter; dot?: string }[] = [
    { id: 'all' },
    { id: 'moving', dot: STATUS_STYLE.moving.fg },
    { id: 'idle', dot: STATUS_STYLE.idle.fg },
    { id: 'parked', dot: STATUS_STYLE.parked.fg },
    { id: 'offline', dot: STATUS_STYLE.offline.fg },
  ];

  const onlineCount = vehicles.length - stats.offline;
  const gpsCount = vehicles.filter((v) => {
    const live = liveUpdates.get(v.id);
    return (live?.latitude ?? v.lastLatitude) !== null;
  }).length;

  const tabBarBottom = insets.bottom + 80;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: tabBarBottom }]}>
      <AppHeader />

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 12 }}>
        <Stat
          label={t('home.online')}
          value={onlineCount}
          unit={`/ ${vehicles.length}`}
          sub={`${stats.moving} ${t('home.moving').toLowerCase()}`}
        />
        <Stat label={t('home.total_km')} value={Math.round(stats.totalKm)} unit={t('units.km')} />
        <Stat
          label={t('home.avg_speed')}
          value={stats.avgSpeed}
          unit={t('units.km_per_hour')}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 10, gap: 6 }}
      >
        {filterChips.map((f) => {
          const on = statusFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setStatusFilter(f.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: on ? theme.chipBgActive : theme.chipBg,
                  borderColor: on ? theme.chipBgActive : theme.borderStrong,
                },
              ]}
            >
              {f.dot && <View style={[styles.chipDot, { backgroundColor: f.dot }]} />}
              <Text
                style={{
                  color: on ? theme.chipFgActive : theme.text2,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {t(`home.${f.id}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          customMapStyle={Platform.OS === 'android' ? getMapStyle(themeName) : undefined}
          initialRegion={TASHKENT}
          showsCompass={false}
          showsMyLocationButton={false}
        >
          {filtered.map((v) => (
            <CarMarker
              key={`${v.id}-${markerNonce}`}
              vehicle={v}
              live={liveUpdates.get(v.id)}
              selected={selectedId === v.id}
              onPress={() => setSelectedId(v.id)}
            />
          ))}
        </MapView>

        <MapThemeFade style={{ borderRadius: 22 }} />

        <View pointerEvents="none" style={styles.mapBorderOverlay} />

        <View style={[styles.mapControls, { top: 12 }]}>
          <MapBtn icon="layers" onPress={() => undefined} theme={theme} />
          <MapBtn
            icon="crosshair"
            onPress={() => mapRef.current?.animateToRegion(TASHKENT, 400)}
            theme={theme}
          />
        </View>

        {isLoading && (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {isError && (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle" size={14} color={colors.offline} />
            <Text style={{ color: colors.offline, fontSize: 12, fontWeight: '600', flex: 1 }}>
              {t('home.api_error')}
            </Text>
          </View>
        )}

        {!isLoading && !isError && vehicles.length > 0 && gpsCount === 0 && (
          <View style={styles.hintBanner}>
            <Icon name="map-pin" size={14} color={colors.warn} />
            <Text style={{ color: colors.warn, fontSize: 12, fontWeight: '600', flex: 1 }}>
              {vehicles.length} {t('home.cars')} {t('home.no_gps_hint')}
            </Text>
          </View>
        )}

        {selectedVehicle ? (
          <SelectedPreview
            vehicle={selectedVehicle}
            live={liveSelected}
            onOpen={() => navigation.navigate('Detail', { vehicleId: selectedVehicle.id })}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <View style={styles.fleetPill}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="truck" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600' }}>
                {t('home.fleet_overview')}
              </Text>
              <Text style={{ fontSize: 11, color: theme.text2 }}>
                {vehicles.length} {t('home.cars')} · {gpsCount} {t('home.on_map')}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.text3 }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function computeStats(vehicles: Vehicle[], liveUpdates: Map<string, WsVehicleUpdate>) {
  let moving = 0;
  let offline = 0;
  let speedSum = 0;
  let speedCount = 0;
  let totalKm = 0;
  for (const v of vehicles) {
    const live = liveUpdates.get(v.id);
    const status: VehicleStatus = live?.status ?? v.status;
    const key = toStatusKey(status);
    if (key === 'moving') {
      moving += 1;
      speedSum += live?.speed ?? v.lastSpeed ?? 0;
      speedCount += 1;
    }
    if (key === 'offline') offline += 1;
    totalKm += v.totalMileage / 1000;
  }
  return {
    moving,
    offline,
    avgSpeed: speedCount > 0 ? Math.round(speedSum / speedCount) : 0,
    totalKm,
  };
}

function makeStyles(theme: ThemeTokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
    },
    chipDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    mapWrap: {
      flex: 1,
      marginHorizontal: 14,
      marginBottom: 14,
    },
    map: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 22,
    },
    mapBorderOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
    },
    mapControls: {
      position: 'absolute',
      right: 12,
      flexDirection: 'column',
      gap: 6,
    },
    loading: {
      position: 'absolute',
      top: 16,
      left: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.surfaceStrong,
      borderRadius: 12,
    },
    fleetPill: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 12,
      backgroundColor: theme.surfaceStrong,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      borderRadius: 16,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      shadowColor: theme.cardShadow,
      shadowOpacity: theme.isDark ? 0 : 1,
      shadowRadius: theme.isDark ? 0 : 10,
      shadowOffset: { width: 0, height: theme.isDark ? 0 : 6 },
      elevation: theme.isDark ? 0 : 4,
    },
    errorBanner: {
      position: 'absolute',
      top: 12,
      left: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: colors.offlineBg,
      borderWidth: 1,
      borderColor: colors.offlineRing,
      borderRadius: 12,
    },
    hintBanner: {
      position: 'absolute',
      top: 12,
      left: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: colors.idleBg,
      borderWidth: 1,
      borderColor: colors.idleRing,
      borderRadius: 12,
    },
  });
}
