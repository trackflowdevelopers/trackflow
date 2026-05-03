import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { WsVehicleUpdate } from '@trackflow/shared-types';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3000';

export function useFleetSocket(): Map<string, WsVehicleUpdate> {
  const [updates, setUpdates] = useState<Map<string, WsVehicleUpdate>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('tf_access_token') ?? '';
    const socket = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
    });

    socket.on('vehicle:update', (update: WsVehicleUpdate) => {
      setUpdates((prev) => new Map(prev).set(update.vehicleId, update));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  return updates;
}
