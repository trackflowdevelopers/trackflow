import type { VehicleStatus } from '@trackflow/shared-types';
import type { StatusKey } from '../theme/colors';

export function toStatusKey(status: VehicleStatus): StatusKey {
  switch (status) {
    case 'active':
      return 'moving';
    case 'idle':
      return 'idle';
    case 'stopped':
      return 'parked';
    case 'maintenance':
    case 'offline':
    default:
      return 'offline';
  }
}

export function formatDurationMin(minutes: number, t: (k: string) => string): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}${t('units.hours')} ${m}${t('units.min')}`;
  return `${m}${t('units.min')}`;
}

export function formatDurationSec(sec: number, t: (k: string) => string): string {
  const minutes = Math.floor(sec / 60);
  return formatDurationMin(minutes, t);
}
