import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import type { WsVehicleUpdate } from '@trackflow/shared-types';
import { SOCKET_URL } from '../api/client';

const ACCESS_TOKEN_KEY = 'trackflow_access_token';

export function useFleetSocket(): Map<string, WsVehicleUpdate> {
  const [updates, setUpdates] = useState<Map<string, WsVehicleUpdate>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = (await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)) ?? '';
      if (cancelled || !token) return;

      const socket = io(SOCKET_URL, {
        auth: { token: `Bearer ${token}` },
        transports: ['websocket'],
      });

      socket.on('vehicle:update', (update: WsVehicleUpdate) => {
        setUpdates((prev) => new Map(prev).set(update.vehicleId, update));
      });

      socketRef.current = socket;
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
    };
  }, []);

  return updates;
}
