import React from 'react';
import { Svg, Path, Circle, Line } from 'react-native-svg';
import { colors } from '../theme/colors';

interface EyeIconProps {
  off: boolean;
}

export function EyeIcon({ off }: EyeIconProps) {
  if (off) {
    return (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path
          d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"
          stroke={colors.text2}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <Path
          d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"
          stroke={colors.text2}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <Line x1={1} y1={1} x2={23} y2={23} stroke={colors.text2} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={colors.text2}
        strokeWidth={1.8}
      />
      <Circle cx={12} cy={12} r={3} stroke={colors.text2} strokeWidth={1.8} />
    </Svg>
  );
}
