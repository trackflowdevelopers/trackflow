import React from 'react';
import type { StatusKey } from '../theme/colors';
import { STATUS_STYLE } from '../theme/colors';
import { Icon } from './Icon';

interface StatusIconProps {
  status: StatusKey;
  size?: number;
  color?: string;
}

export function StatusIcon({ status, size = 12, color }: StatusIconProps) {
  const c = color ?? STATUS_STYLE[status].fg;
  if (status === 'moving') return <Icon name="play" size={size} color={c} />;
  if (status === 'idle') return <Icon name="idle" size={size} color={c} />;
  if (status === 'parked') return <Icon name="power-off" size={size} color={c} />;
  return <Icon name="power-off" size={size} color={c} />;
}
