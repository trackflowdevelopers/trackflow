import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export type IconName =
  | 'play' | 'idle' | 'power-off' | 'power-on' | 'speed' | 'fuel' | 'flag'
  | 'geo' | 'pin' | 'map-pin' | 'arrow-left' | 'arrow-right' | 'home' | 'user' | 'phone'
  | 'search' | 'filter' | 'layers' | 'plus' | 'minus' | 'compass'
  | 'chevron-right' | 'chevron-down' | 'bell' | 'clock' | 'route' | 'gauge'
  | 'truck' | 'shield' | 'globe' | 'logout' | 'tune' | 'check' | 'logo'
  | 'close' | 'crosshair' | 'alert-circle' | 'sun' | 'moon';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 16, color = '#fff', strokeWidth = 1.8 }: IconProps) {
  const sw = strokeWidth;
  const stroke = color;
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
  };
  switch (name) {
    case 'play':
      return (
        <Svg {...props}>
          <Path d="M6 4l14 8-14 8z" fill={color} />
        </Svg>
      );
    case 'idle':
      return (
        <Svg {...props}>
          <Circle cx={12} cy={12} r={9} stroke={stroke} strokeWidth={sw} />
          <Path d="M12 7v5l3 2" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'power-off':
      return (
        <Svg {...props}>
          <Path d="M12 3v9" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M5.6 7.4a8 8 0 1 0 12.8 0" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'power-on':
      return (
        <Svg {...props}>
          <Circle cx={12} cy={12} r={9} stroke={stroke} strokeWidth={sw} />
          <Path d="M12 8v6" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'speed':
      return (
        <Svg {...props}>
          <Path d="M12 14l5-5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={12} cy={14} r={1.4} fill={color} />
          <Path d="M4 16a8 8 0 0 1 16 0" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'fuel':
      return (
        <Svg {...props}>
          <Rect x={3} y={3} width={10} height={18} rx={1.5} stroke={stroke} strokeWidth={sw} />
          <Path d="M13 8h2.5a2.5 2.5 0 0 1 2.5 2.5v6a1.5 1.5 0 0 0 3 0V7l-2-2" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M6 7h4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'flag':
      return (
        <Svg {...props}>
          <Path d="M5 21V4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M5 4h11l-2 4 2 4H5" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'geo':
    case 'pin':
    case 'map-pin':
      return (
        <Svg {...props}>
          <Path d="M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <Circle cx={12} cy={9} r={2.5} stroke={stroke} strokeWidth={sw} />
        </Svg>
      );
    case 'arrow-left':
      return (
        <Svg {...props}>
          <Path d="M19 12H5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M12 19l-7-7 7-7" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'arrow-right':
      return (
        <Svg {...props}>
          <Path d="M5 12h14" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M12 5l7 7-7 7" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'home':
      return (
        <Svg {...props}>
          <Path d="M3 11l9-7 9 7" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M5 10v10h14V10" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'user':
      return (
        <Svg {...props}>
          <Circle cx={12} cy={8} r={4} stroke={stroke} strokeWidth={sw} />
          <Path d="M4 21a8 8 0 0 1 16 0" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'phone':
      return (
        <Svg {...props}>
          <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...props}>
          <Path d="M12 5v14M5 12h14" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'minus':
      return (
        <Svg {...props}>
          <Path d="M5 12h14" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'layers':
      return (
        <Svg {...props}>
          <Path d="M12 2 2 7l10 5 10-5z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M2 12l10 5 10-5" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M2 17l10 5 10-5" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'compass':
      return (
        <Svg {...props}>
          <Circle cx={12} cy={12} r={9} stroke={stroke} strokeWidth={sw} />
          <Path d="M16 8l-2 6-6 2 2-6 6-2z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'crosshair':
      return (
        <Svg {...props}>
          <Circle cx={12} cy={12} r={9} stroke={stroke} strokeWidth={sw} />
          <Path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={12} cy={12} r={2} fill={color} />
        </Svg>
      );
    case 'chevron-right':
      return (
        <Svg {...props}>
          <Path d="M9 6l6 6-6 6" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-down':
      return (
        <Svg {...props}>
          <Path d="M6 9l6 6 6-6" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...props}>
          <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M10 21a2 2 0 0 0 4 0" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'clock':
      return (
        <Svg {...props}>
          <Circle cx={12} cy={12} r={9} stroke={stroke} strokeWidth={sw} />
          <Path d="M12 7v5l3 2" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'route':
      return (
        <Svg {...props}>
          <Circle cx={6} cy={19} r={2} stroke={stroke} strokeWidth={sw} />
          <Circle cx={18} cy={5} r={2} stroke={stroke} strokeWidth={sw} />
          <Path d="M8 19h7a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h7" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'gauge':
      return (
        <Svg {...props}>
          <Path d="M12 14l4-4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Path d="M3 18a9 9 0 1 1 18 0" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={12} cy={14} r={1.4} fill={color} />
        </Svg>
      );
    case 'truck':
      return (
        <Svg {...props}>
          <Rect x={2} y={7} width={11} height={9} rx={1} stroke={stroke} strokeWidth={sw} />
          <Path d="M13 10h4l3 3v3h-7" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <Circle cx={6} cy={18} r={2} stroke={stroke} strokeWidth={sw} />
          <Circle cx={17} cy={18} r={2} stroke={stroke} strokeWidth={sw} />
        </Svg>
      );
    case 'shield':
      return (
        <Svg {...props}>
          <Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'globe':
      return (
        <Svg {...props}>
          <Circle cx={12} cy={12} r={9} stroke={stroke} strokeWidth={sw} />
          <Path d="M3 12h18" stroke={stroke} strokeWidth={sw} />
          <Path d="M12 3a14 14 0 0 1 0 18" stroke={stroke} strokeWidth={sw} />
          <Path d="M12 3a14 14 0 0 0 0 18" stroke={stroke} strokeWidth={sw} />
        </Svg>
      );
    case 'logout':
      return (
        <Svg {...props}>
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M16 17l5-5-5-5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M21 12H9" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'tune':
      return (
        <Svg {...props}>
          <Path d="M4 6h10M4 12h6M4 18h12" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={17} cy={6} r={2} stroke={stroke} strokeWidth={sw} />
          <Circle cx={13} cy={12} r={2} stroke={stroke} strokeWidth={sw} />
          <Circle cx={19} cy={18} r={2} stroke={stroke} strokeWidth={sw} />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...props}>
          <Path d="M5 12l5 5L20 7" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'close':
      return (
        <Svg {...props}>
          <Path d="M18 6L6 18M6 6l12 12" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'logo':
      return (
        <Svg {...props}>
          <Circle cx={6} cy={6} r={3} fill={color} />
          <Path d="M6 6 C 10 12, 14 8, 18 16" stroke={color} strokeWidth={2.4} fill="none" />
          <Path d="M18 16 l -3 -1 M 18 16 l -1 -3" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'alert-circle':
      return (
        <Svg {...props}>
          <Circle cx={12} cy={12} r={9} stroke={stroke} strokeWidth={sw} />
          <Path d="M12 8v4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <Circle cx={12} cy={16} r={0.8} fill={stroke} />
        </Svg>
      );
    case 'sun':
      return (
        <Svg {...props}>
          <Circle cx={12} cy={12} r={4} stroke={stroke} strokeWidth={sw} />
          <Path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'moon':
      return (
        <Svg {...props}>
          <Path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        </Svg>
      );
    default:
      return null;
  }
}

import type { StatusKey } from '../theme/colors';
import { STATUS_STYLE } from '../theme/colors';

export function StatusIcon({
  status,
  size = 12,
  color,
}: {
  status: StatusKey;
  size?: number;
  color?: string;
}) {
  const c = color ?? STATUS_STYLE[status].fg;
  if (status === 'moving') return <Icon name="play" size={size} color={c} />;
  if (status === 'idle') return <Icon name="idle" size={size} color={c} />;
  if (status === 'parked') return <Icon name="power-off" size={size} color={c} />;
  return <Icon name="power-off" size={size} color={c} />;
}
