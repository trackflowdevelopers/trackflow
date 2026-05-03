import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RouteStop } from '@trackflow/shared-types';

import { colors } from '../theme/colors';
import { Icon } from '../components/Icon';
import { DARK_MAP_STYLE } from '../lib/mapStyle';
import { getVehicleRoute } from '../api/vehicles';
import { formatDurationSec } from '../lib/status';
import type { RootStackParamList } from '../navigation/types';

type RouteMapNavRoute = RouteProp<RootStackParamList, 'RouteMap'>;

function StopMarker({ stop, t }: { stop: RouteStop; t: (k: string) => string }) {
  const [tracks, setTracks] = useState(true);
  const isLong = stop.durationSec >= 30 * 60;
  const bg = isLong ? colors.warn : colors.info;

  return (
    <Marker
      coordinate={{ latitude: stop.lat, longitude: stop.lng }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracks}
    >
      <View
        onLayout={() => setTracks(false)}
        style={{
          paddingHorizontal: 7,
          paddingVertical: 4,
          borderRadius: 8,
          backgroundColor: bg + '22',
          borderWidth: 1,
          borderColor: bg,
          alignItems: 'center',
          marginBottom: 2,
        }}
      >
        <Icon name="power-off" size={10} color={bg} />
        <Text style={{ fontSize: 9, color: bg, fontWeight: '700', marginTop: 1 }}>
          {formatDurationSec(stop.durationSec, t)}
        </Text>
      </View>
    </Marker>
  );
}

export function RouteMapScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } = useRoute<RouteMapNavRoute>();
  const { vehicleId, plateNumber, from, to } = params;
  const mapRef = useRef<MapView>(null);

  const { data: route, isLoading } = useQuery({
    queryKey: ['vehicle-route', vehicleId, from, to],
    queryFn: () => getVehicleRoute(vehicleId, from, to),
  });

  useEffect(() => {
    if (!route?.points.length) return;
    const coords = route.points.map((p) => ({ latitude: p.lat, longitude: p.lng }));
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 140, right: 40, bottom: 80, left: 40 },
        animated: true,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [route?.points]);

  const polylineCoords = (route?.points ?? []).map((p) => ({
    latitude: p.lat,
    longitude: p.lng,
  }));

  const firstPt = route?.points[0];
  const lastPt = route && route.points.length > 1
    ? route.points[route.points.length - 1]
    : undefined;

  const dateLabel = new Date(from).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={{
          latitude: 41.2995,
          longitude: 69.2401,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor={colors.primary}
            strokeWidth={3}
          />
        )}

        {firstPt && (
          <Marker
            coordinate={{ latitude: firstPt.lat, longitude: firstPt.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.startDot} />
          </Marker>
        )}

        {lastPt && (
          <Marker
            coordinate={{ latitude: lastPt.lat, longitude: lastPt.lng }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <View style={styles.endPin}>
              <View style={styles.endPinBox}>
                <Icon name="flag" size={12} color={colors.primary} />
              </View>
              <View style={styles.endPinStem} />
            </View>
          </Marker>
        )}

        {(route?.stops ?? []).map((stop, i) => (
          <StopMarker key={i} stop={stop} t={t} />
        ))}
      </MapView>

      <View style={[styles.header, { top: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>#{plateNumber}</Text>
          <Text style={styles.headerSub}>{dateLabel}</Text>
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(15,27,48,0.95)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(15,27,48,0.95)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  headerTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 11, color: colors.text3, marginTop: 1 },
  startDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  endPin: { alignItems: 'center' },
  endPinBox: {
    padding: 5,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  endPinStem: { width: 2, height: 6, backgroundColor: colors.primary },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(15,27,48,0.95)',
  },
});
