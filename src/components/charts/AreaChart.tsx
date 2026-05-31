import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, PanResponder, StyleSheet,
} from 'react-native';
import Svg, {
  Path, Line, Circle, Defs, LinearGradient as SvgGradient, Stop,
} from 'react-native-svg';
import type { ThemeColors } from '../../constants/theme';
import type { Snapshot } from '../../types';
import { formatMoney } from '../../utils/currency';
import { fmtDate } from '../../utils/date';
import { FONTS } from '../../constants/fonts';

type Props = {
  points: Snapshot[];
  base: string;
  theme: ThemeColors;
  accent?: string;
  height?: number;
};

export function AreaChart({ points, base, theme, accent = '#6366F1', height = 188 }: Props) {
  const [width, setWidth] = useState(320);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const padL = 6, padR = 6, padT = 14, padB = 22;

  const onLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);

  if (!points || points.length < 2) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.sub, fontSize: 14, fontFamily: FONTS.jakarta }}>Not enough data yet</Text>
      </View>
    );
  }

  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const vals = points.map(p => p.v);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  const span = (max - min) || max || 1;
  min -= span * 0.12;
  max += span * 0.12;

  const X = (i: number) => padL + (i / (points.length - 1)) * innerW;
  const Y = (v: number) => padT + (1 - (v - min) / (max - min)) * innerH;

  // Catmull-Rom to cubic bezier
  const pts = points.map((p, i) => [X(i), Y(p.v)] as [number, number]);
  let line = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    line += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  const lastPt = pts[pts.length - 1];
  const area = `${line} L ${lastPt[0]} ${padT + innerH} L ${pts[0][0]} ${padT + innerH} Z`;

  const gridCount = 4;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: evt => {
      const x = evt.nativeEvent.locationX - padL;
      const idx = Math.round((x / innerW) * (points.length - 1));
      setActiveIdx(Math.max(0, Math.min(points.length - 1, idx)));
    },
    onPanResponderMove: evt => {
      const x = evt.nativeEvent.locationX - padL;
      const idx = Math.round((x / innerW) * (points.length - 1));
      setActiveIdx(Math.max(0, Math.min(points.length - 1, idx)));
    },
    onPanResponderRelease: () => setActiveIdx(null),
    onPanResponderTerminate: () => setActiveIdx(null),
  });

  const ap = activeIdx != null ? points[activeIdx] : null;
  const ax = activeIdx != null ? X(activeIdx) : 0;
  const ay = activeIdx != null ? Y(points[activeIdx].v) : 0;

  const TIP_W = 132;
  let tipX = ax - TIP_W / 2;
  tipX = Math.max(padL, Math.min(width - TIP_W - padL, tipX));

  return (
    <View style={{ width: '100%', height, position: 'relative' }} onLayout={onLayout}>
      <Svg
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Defs>
          <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0.01} />
          </SvgGradient>
        </Defs>
        {/* grid lines */}
        {Array.from({ length: gridCount + 1 }).map((_, i) => {
          const y = padT + (i / gridCount) * innerH;
          return (
            <Line key={i} x1={padL} y1={y} x2={width - padR} y2={y}
              stroke={theme.faintLine} strokeWidth="1" />
          );
        })}
        {/* area fill */}
        <Path d={area} fill="url(#areaGrad)" />
        {/* line */}
        <Path d={line} fill="none" stroke={accent} strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round" />
        {/* endpoint dot */}
        {activeIdx == null && (
          <Circle
            cx={lastPt[0]} cy={lastPt[1]} r="4.5"
            fill={accent} stroke={theme.cardBg} strokeWidth="2.5"
          />
        )}
        {/* crosshair */}
        {activeIdx != null && (
          <>
            <Line x1={ax} y1={padT} x2={ax} y2={padT + innerH}
              stroke={accent} strokeWidth="1.4" strokeDasharray="3 3" opacity="0.6" />
            <Circle cx={ax} cy={ay} r="5.5"
              fill={accent} stroke={theme.cardBg} strokeWidth="2.5" />
          </>
        )}
      </Svg>

      {/* touch capture overlay */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: padB }}
        {...panResponder.panHandlers}
      />

      {/* tooltip */}
      {ap && (
        <View style={[styles.tooltip, { left: tipX, top: 0, backgroundColor: theme.text }]}>
          <Text style={[styles.tipValue, { color: theme.cardBg }]}>
            {formatMoney(ap.v, base, { compact: true })}
          </Text>
          <Text style={[styles.tipDate, { color: theme.cardBg }]}>
            {fmtDate(ap.t, { full: true })}
          </Text>
        </View>
      )}

      {/* x-axis labels */}
      <View style={[styles.xLabels, { left: padL, right: padR, bottom: 0 }]}>
        <Text style={{ color: theme.sub, fontSize: 10.5, fontFamily: FONTS.jakarta }}>{fmtDate(points[0].t)}</Text>
        <Text style={{ color: theme.sub, fontSize: 10.5, fontFamily: FONTS.jakarta }}>{fmtDate(points[points.length - 1].t)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    width: 132,
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  tipValue: { fontSize: 15, fontFamily: FONTS.groteskBold },
  tipDate:  { fontSize: 10.5, opacity: 0.7, marginTop: 1, fontFamily: FONTS.jakarta },
  xLabels: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
