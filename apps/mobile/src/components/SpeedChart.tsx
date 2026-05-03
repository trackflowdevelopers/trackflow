import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';
import type { RoutePoint } from '@trackflow/shared-types';

interface SpeedChartProps {
  points: RoutePoint[];
  height?: number;
}

export function SpeedChart({ points, height = 70 }: SpeedChartProps) {
  if (points.length < 2) {
    return <View style={{ height }} />;
  }

  const W = 100;
  const H = 60;
  const N = Math.min(80, points.length);
  const step = points.length / N;
  const speeds: number[] = [];
  for (let i = 0; i < N; i++) {
    speeds.push(points[Math.floor(i * step)].speed);
  }
  const max = Math.max(...speeds, 80);

  const path = speeds
    .map((v, i) => {
      const x = (i / (N - 1)) * W;
      const y = H - (v / max) * H;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
  const area = `${path} L ${W} ${H} L 0 ${H} Z`;

  return (
    <View style={{ height }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.4} />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#sg)" />
        <Path
          d={path}
          stroke={colors.primary}
          strokeWidth={1.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </Svg>
    </View>
  );
}
