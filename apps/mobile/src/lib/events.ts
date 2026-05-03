import type { VehicleRoute } from '@trackflow/shared-types';

export type EventKind = 'info' | 'warn' | 'alert';
export type EventType =
  | 'departed'
  | 'arrived'
  | 'started_engine'
  | 'stopped_engine'
  | 'long_idle'
  | 'overspeeding'
  | 'refuel'
  | 'geofence_exit';

export interface RouteEvent {
  type: EventType;
  kind: EventKind;
  icon: string;
  time: string;
  detail?: string;
  durationSec?: number;
}

const LONG_IDLE_THRESHOLD_SEC = 30 * 60;

export function buildEvents(route: VehicleRoute | undefined): RouteEvent[] {
  if (!route) return [];
  const events: RouteEvent[] = [];

  if (route.points.length > 0) {
    events.push({
      type: 'departed',
      kind: 'info',
      icon: 'play',
      time: route.points[0].timestamp,
    });
  }

  for (const stop of route.stops) {
    const isLongIdle = stop.durationSec >= LONG_IDLE_THRESHOLD_SEC;
    events.push({
      type: isLongIdle ? 'long_idle' : 'stopped_engine',
      kind: isLongIdle ? 'warn' : 'info',
      icon: isLongIdle ? 'idle' : 'power-off',
      time: stop.stoppedAt,
      durationSec: stop.durationSec,
    });
    if (stop.resumedAt) {
      events.push({
        type: 'started_engine',
        kind: 'info',
        icon: 'power-on',
        time: stop.resumedAt,
      });
    }
  }

  if (route.points.length > 1) {
    const last = route.points[route.points.length - 1];
    const lastStop = route.stops[route.stops.length - 1];
    if (!lastStop || lastStop.resumedAt !== null) {
      events.push({
        type: 'arrived',
        kind: 'info',
        icon: 'flag',
        time: last.timestamp,
      });
    }
  }

  events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  return events;
}
