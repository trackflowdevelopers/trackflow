import React from 'react';
import { Svg, Path, Circle } from 'react-native-svg';
import { colors } from '../theme/colors';

export function TrackFlowLogo() {
  return (
    <Svg width={160} height={52} viewBox="0 0 480 120">
      <Circle cx={32} cy={40} r={9} fill={colors.primary} fillOpacity={0.18} />
      <Circle cx={32} cy={40} r={5} fill={colors.accent} />
      <Path
        d="M32 49 Q32 80 60 80 Q88 80 88 60"
        stroke={colors.accent}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
        strokeOpacity={0.5}
      />
      <Circle cx={88} cy={48} r={13} fill={colors.primary} />
      <Circle cx={88} cy={48} r={6} fill="white" />
      <Path d="M88 61 L82 78 Q88 84 94 78 Z" fill={colors.primary} />
    </Svg>
  );
}
