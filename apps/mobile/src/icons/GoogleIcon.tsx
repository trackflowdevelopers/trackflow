import React from 'react';
import { Svg, Rect } from 'react-native-svg';

export function GoogleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={2} width={9} height={9} rx={1} fill="#4285F4" />
      <Rect x={13} y={2} width={9} height={9} rx={1} fill="#34A853" />
      <Rect x={2} y={13} width={9} height={9} rx={1} fill="#FBBC05" />
      <Rect x={13} y={13} width={9} height={9} rx={1} fill="#EA4335" />
    </Svg>
  );
}
