export const colors = {
  primary: '#2563FF',
  primarySoft: 'rgba(37,99,255,0.16)',

  bg: '#0A1428',
  bg2: '#0F1B30',
  surface: 'rgba(255,255,255,0.04)',
  surface2: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.10)',

  text: '#FFFFFF',
  text2: 'rgba(255,255,255,0.65)',
  text3: 'rgba(255,255,255,0.45)',

  moving: '#22C55E',
  movingBg: 'rgba(34,197,94,0.16)',
  movingRing: 'rgba(34,197,94,0.35)',

  idle: '#F59E0B',
  idleBg: 'rgba(245,158,11,0.16)',
  idleRing: 'rgba(245,158,11,0.32)',

  parked: '#94A3B8',
  parkedBg: 'rgba(148,163,184,0.18)',
  parkedRing: 'rgba(148,163,184,0.32)',

  offline: '#EF4444',
  offlineBg: 'rgba(239,68,68,0.16)',
  offlineRing: 'rgba(239,68,68,0.35)',

  info: '#60A5FA',
  warn: '#F59E0B',
  alert: '#EF4444',

  accent: '#00C2FF',
  card: '#111f36',
  red: '#FF4560',
  primaryDark: '#1948c8',
} as const;

export type StatusKey = 'moving' | 'idle' | 'parked' | 'offline';

export const STATUS_STYLE: Record<StatusKey, { fg: string; bg: string; ring: string }> = {
  moving: { fg: colors.moving, bg: colors.movingBg, ring: colors.movingRing },
  idle: { fg: colors.idle, bg: colors.idleBg, ring: colors.idleRing },
  parked: { fg: colors.parked, bg: colors.parkedBg, ring: colors.parkedRing },
  offline: { fg: colors.offline, bg: colors.offlineBg, ring: colors.offlineRing },
};
