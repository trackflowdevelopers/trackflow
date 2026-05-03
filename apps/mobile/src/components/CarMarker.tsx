import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import type { Vehicle, WsVehicleUpdate } from '@trackflow/shared-types';
import { STATUS_STYLE, colors } from '../theme/colors';
import { StatusIcon } from './Icon';
import { toStatusKey } from '../lib/status';

interface CarMarkerProps {
  vehicle: Vehicle;
  live?: WsVehicleUpdate;
  selected: boolean;
  onPress: () => void;
}

export function CarMarker({ vehicle, live, selected, onPress }: CarMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const onLayout = useCallback(() => setTracksViewChanges(false), []);

  const lat = live?.latitude ?? vehicle.lastLatitude;
  const lng = live?.longitude ?? vehicle.lastLongitude;
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return null;

  const status = toStatusKey(live?.status ?? vehicle.status);
  const speed = live?.speed ?? vehicle.lastSpeed ?? 0;
  const c = STATUS_STYLE[status];

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges || selected}
    >
      <View style={{ alignItems: 'center' }} onLayout={onLayout}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 5,
            borderRadius: 10,
            backgroundColor: selected ? colors.text : 'rgba(15,27,48,0.95)',
            borderWidth: 1.5,
            borderColor: selected ? colors.primary : c.ring,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            elevation: 6,
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              backgroundColor: c.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StatusIcon status={status} size={10} color={c.fg} />
          </View>
          <View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: -0.2,
                color: selected ? colors.bg : colors.text,
              }}
            >
              #{vehicle.plateNumber}
            </Text>
            {status === 'moving' && (
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '600',
                  color: selected ? '#475569' : 'rgba(255,255,255,0.65)',
                }}
              >
                {Math.round(speed)} km/h
              </Text>
            )}
          </View>
        </View>
        <View
          style={{
            width: 8,
            height: 8,
            backgroundColor: selected ? colors.primary : c.ring,
            borderRadius: 4,
            marginTop: 2,
          }}
        />
      </View>
    </Marker>
  );
}
