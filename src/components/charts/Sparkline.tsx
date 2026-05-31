import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { Snapshot } from '../../types';

type Props = {
  points: Snapshot[];
  width?: number;
  height?: number;
  color?: string;
};

export function Sparkline({ points, width = 120, height = 34, color = 'rgba(255,255,255,0.9)' }: Props) {
  if (!points || points.length < 2) return null;

  const vals = points.map(p => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const sp = (max - min) || 1;

  const X = (i: number) => (i / (points.length - 1)) * width;
  const Y = (v: number) => height - ((v - min) / sp) * height;

  let d = `M ${X(0)} ${Y(vals[0])}`;
  for (let i = 1; i < vals.length; i++) {
    d += ` L ${X(i)} ${Y(vals[i])}`;
  }

  const area = `${d} L ${width} ${height} L 0 ${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Path d={area} fill="rgba(255,255,255,0.14)" />
      <Path d={d} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
