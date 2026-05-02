import React from 'react';
import { Svg, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

export function LockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={11} width={18} height={11} rx={2} stroke={colors.text3} strokeWidth={1.8} />
      <Path
        d="M7 11V7a5 5 0 0110 0v4"
        stroke={colors.text3}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
