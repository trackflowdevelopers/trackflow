import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  Vehicle,
  RoutePoint,
  WsVehicleUpdate,
  VehicleStatus,
} from '@trackflow/shared-types';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader } from '../components/AppHeader';
import { Stat } from '../components/Stat';
import { CarMarker } from '../components/CarMarker';
import { SelectedPreview } from '../components/SelectedPreview';
import { Icon } from '../components/Icon';
import { colors, STATUS_STYLE } from '../theme/colors';
import { toStatusKey } from '../lib/status';
import { DARK_MAP_STYLE } from '../lib/mapStyle';
import { useFleetSocket } from '../hooks/useFleetSocket';
import { getVehicles, getVehicleRoute } from '../api/vehicles';
import type { RootStackParamList } from '../navigation/types';

type StatusFilter = 'all' | 'moving' | 'idle' | 'parked' | 'offline';

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

const TASHKENT: Region = {
  latitude: 41.2995,
  longitude: 69.2401,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

function todayLocalISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function dateRange(localDate: string): { from: string; to: string } {
  const start = new Date(`${localDate}T00:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNav>();
  const mapRef = useRef<MapView | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: vehiclesData, isLoading, isError } = useQuery({
    queryKey: ['vehicles', { mobile: true }],
    queryFn: () => getVehicles({ limit: 100 }),
    refetchInterval: 30_000,
  });

  const liveUpdates = useFleetSocket();
  const vehicles = vehiclesData?.data ?? [];
  const selectedVehicle = vehicles.find((v) => v.id === selectedId) ?? null;
  const liveSelected = selectedId ? liveUpdates.get(selectedId) : undefined;

  const { from, to } = useMemo(() => dateRange(todayLocalISO()), []);

  const { data: route } = useQuery({
    queryKey: ['vehicle-route', selectedId, from, to],
    queryFn: () => getVehicleRoute(selectedId!, from, to),
    enabled: Boolean(selectedId),
    refetchInterval: selectedId ? 10_000 : false,
  });

  const [livePoints, setLivePoints] = useState<RoutePoint[]>([]);

  useEffect(() => {
    setLivePoints([]);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !liveSelected) return;
    setLivePoints((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.timestamp === liveSelected.timestamp) return prev;
      return [
        ...prev,
        {
          lat: liveSelected.latitude,
          lng: liveSelected.longitude,
          speed: liveSelected.speed,
          ignition:
            liveSelected.status === 'active' || liveSelected.status === 'idle',
          timestamp: liveSelected.timestamp,
        },
      ];
    });
  }, [selectedId, liveSelected]);

  const combinedPoints = useMemo<RoutePoint[]>(() => {
    if (!route) return livePoints;
    if (livePoints.length === 0) return route.points;
    const last = route.points[route.points.length - 1];
    const cutoff = last ? new Date(last.timestamp).getTime() : 0;
    const tail = livePoints.filter((p) => new Date(p.timestamp).getTime() > cutoff);
    return [...route.points, ...tail];
  }, [route, livePoints]);

  const segments = useMemo(() => {
    const segs: { latitude: number; longitude: number }[][] = [];
    let current: { latitude: number; longitude: number }[] = [];
    for (const p of combinedPoints) {
      if (p.ignition) {
        current.push({ latitude: p.lat, longitude: p.lng });
      } else if (current.length > 1) {
        segs.push(current);
        current = [];
      } else {
        current = [];
      }
    }
    if (current.length > 1) segs.push(current);
    return segs;
  }, [combinedPoints]);

  const engineEvents = useMemo(() => {
    const pts = combinedPoints;
    if (pts.length < 2) return [];
    const events: { lat: number; lng: number; type: 'on' | 'off'; timestamp: string }[] = [];
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      if (!prev.ignition && curr.ignition) {
        events.push({ lat: curr.lat, lng: curr.lng, type: 'on', timestamp: curr.timestamp });
      } else if (prev.ignition && !curr.ignition) {
        events.push({ lat: curr.lat, lng: curr.lng, type: 'off', timestamp: curr.timestamp });
      }
    }
    return events;
  }, [combinedPoints]);

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
    if (!selectedVehicle || !mapRef.current) return;
    const live = liveUpdates.get(selectedVehicle.id);
    const lat = live?.latitude ?? selectedVehicle.lastLatitude;
    const lng = live?.longitude ?? selectedVehicle.lastLongitude;
    if (lat === null || lng === null) return;
    mapRef.current.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      450,
    );
  }, [selectedVehicle, liveUpdates]);

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

  // Tab bar is position:absolute, height ≈ paddingTop(10) + inner(54) + insets.bottom + 12 = 76 + insets.bottom
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
                  backgroundColor: on ? colors.text : colors.surface,
                  borderColor: on ? colors.text : colors.borderStrong,
                },
              ]}
            >
              {f.dot && <View style={[styles.chipDot, { backgroundColor: f.dot }]} />}
              <Text
                style={{
                  color: on ? colors.bg : colors.text2,
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
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          customMapStyle={Platform.OS === 'android' ? DARK_MAP_STYLE : undefined}
          initialRegion={TASHKENT}
          showsCompass={false}
          showsMyLocationButton={false}
        >
          {segments.map((seg, i) => (
            <Polyline
              key={`seg-${i}`}
              coordinates={seg}
              strokeColor={colors.primary}
              strokeWidth={4}
            />
          ))}
          {(route?.stops ?? []).map((s, i) => (
            <Marker
              key={`stop-${i}`}
              coordinate={{ latitude: s.lat, longitude: s.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges
            >
              <View style={styles.stopMarker}>
                <View style={styles.stopMarkerInner} />
              </View>
            </Marker>
          ))}
          {engineEvents.map((e, i) => (
            <Marker
              key={`engine-${e.type}-${i}`}
              coordinate={{ latitude: e.lat, longitude: e.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges
            >
              <View
                style={[
                  styles.engineMarker,
                  e.type === 'on' ? styles.engineMarkerOn : styles.engineMarkerOff,
                ]}
              >
                <Icon
                  name={e.type === 'on' ? 'power-on' : 'power-off'}
                  size={11}
                  color={e.type === 'on' ? colors.moving : colors.offline}
                />
              </View>
            </Marker>
          ))}
          {filtered.map((v) => (
            <CarMarker
              key={v.id}
              vehicle={v}
              live={liveUpdates.get(v.id)}
              selected={selectedId === v.id}
              onPress={() => setSelectedId(v.id)}
            />
          ))}
        </MapView>

        {/* Map controls */}
        <View style={[styles.mapControls, { top: 12 }]}>
          <MapBtn icon="layers" onPress={() => undefined} />
          <MapBtn
            icon="crosshair"
            onPress={() => mapRef.current?.animateToRegion(TASHKENT, 400)}
          />
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {/* API error */}
        {isError && (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle" size={14} color={colors.offline} />
            <Text style={{ color: colors.offline, fontSize: 12, fontWeight: '600', flex: 1 }}>
              {t('home.api_error')}
            </Text>
          </View>
        )}

        {/* No GPS data hint */}
        {!isLoading && !isError && vehicles.length > 0 && gpsCount === 0 && (
          <View style={styles.hintBanner}>
            <Icon name="map-pin" size={14} color={colors.warn} />
            <Text style={{ color: colors.warn, fontSize: 12, fontWeight: '600', flex: 1 }}>
              {vehicles.length} {t('home.cars')} {t('home.no_gps_hint')}
            </Text>
          </View>
        )}

        {/* Selected preview OR fleet overview */}
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
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>
                {t('home.fleet_overview')}
              </Text>
              <Text style={{ fontSize: 11, color: colors.text2 }}>
                {vehicles.length} {t('home.cars')} · {gpsCount} {t('home.on_map')}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.text3 }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface MapBtnProps {
  icon: 'layers' | 'plus' | 'minus' | 'compass' | 'crosshair';
  onPress: () => void;
}

function MapBtn({ icon, onPress }: MapBtnProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        backgroundColor: 'rgba(15,27,48,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={16} color={colors.text} />
    </TouchableOpacity>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
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
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
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
    backgroundColor: 'rgba(15,27,48,0.92)',
    borderRadius: 12,
  },
  fleetPill: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(15,27,48,0.92)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stopMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.idleBg,
    borderWidth: 2,
    borderColor: colors.idle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopMarkerInner: {
    width: 8,
    height: 8,
    backgroundColor: colors.idle,
    borderRadius: 2,
  },
  engineMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engineMarkerOn: {
    backgroundColor: colors.movingBg,
    borderColor: colors.moving,
  },
  engineMarkerOff: {
    backgroundColor: colors.offlineBg,
    borderColor: colors.offline,
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
