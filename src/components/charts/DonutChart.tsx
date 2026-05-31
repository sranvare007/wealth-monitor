import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { ThemeColors } from '../../constants/theme';
import type { DistributionSegment } from '../../types';
import { formatMoney } from '../../utils/currency';
import { FONTS } from '../../constants/fonts';

type Props = {
  segments: DistributionSegment[];
  base: string;
  theme: ThemeColors;
  size?: number;
};

export function DonutChart({ segments, base, theme, size = 200 }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const strokeWidth = 22;
  const r = (size - strokeWidth) / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const gapFrac = segments.length > 1 ? 2.2 / 360 : 0;
  const gap = gapFrac * C;

  let offset = 0;
  const arcs = segments.map(seg => {
    const frac = seg.value / total;
    const len = Math.max(frac * C - gap, 0.6);
    const rot = (offset / C) * 360 - 90;
    const arc = { seg, len, rot, isSel: selected === seg.id };
    offset += frac * C;
    return arc;
  });

  const sel = segments.find(s => s.id === selected);
  const centerVal = sel ? sel.value : total;
  const centerLabel = sel ? sel.label : 'Total Assets';
  const centerPct = sel ? Math.round((sel.value / total) * 100) + '%' : null;

  const toggle = (id: string) => setSelected(prev => (prev === id ? null : id));
  const reset = () => setSelected(null);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* track ring */}
        <Circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={theme.faintLine}
          strokeWidth={strokeWidth}
        />
        {arcs.map(a => (
          <Circle
            key={a.seg.id}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={a.seg.color}
            strokeWidth={a.isSel ? strokeWidth + 7 : strokeWidth}
            strokeDasharray={`${a.len} ${C - a.len}`}
            strokeLinecap="round"
            transform={`rotate(${a.rot} ${cx} ${cy})`}
            opacity={selected && !a.isSel ? 0.32 : 1}
            onPress={() => toggle(a.seg.id)}
          />
        ))}
      </Svg>
      {/* center label — absolute overlay */}
      <TouchableOpacity
        onPress={reset}
        activeOpacity={1}
        style={[StyleSheet.absoluteFillObject, styles.center]}
      >
        <Text style={[styles.centerLabel, { color: theme.sub }]} numberOfLines={1}>
          {centerLabel}
        </Text>
        <Text style={[styles.centerValue, { color: theme.text }]} numberOfLines={1}>
          {formatMoney(centerVal, base, { compact: true })}
        </Text>
        {centerPct && sel && (
          <Text style={[styles.centerPct, { color: sel.color }]}>{centerPct}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  centerLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    fontFamily: FONTS.jakartaSemiBold,
  },
  centerValue: {
    fontSize: 21,
    marginTop: 3,
    lineHeight: 24,
    fontFamily: FONTS.groteskBold,
  },
  centerPct: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.groteskSemiBold,
  },
});
