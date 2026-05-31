import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'bank'
  | 'trending'
  | 'home'
  | 'coin'
  | 'gem'
  | 'grid'
  | 'minus'
  | 'home_nav'
  | 'list'
  | 'history'
  | 'settings'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'search'
  | 'close'
  | 'chevR'
  | 'chevD'
  | 'chevL'
  | 'arrowUp'
  | 'arrowDn'
  | 'check'
  | 'lock'
  | 'wallet'
  | 'sparkle'
  | 'info'
  | 'dots'
  | 'calendar';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  style?: StyleProp<ViewStyle>;
};

function IconPaths({ name, color }: { name: IconName; color: string }) {
  switch (name) {
    case 'bank':
      return (
        <>
          <Path d="M3 9l9-5 9 5" />
          <Path d="M4 9v9M9 9v9M15 9v9M20 9v9" />
          <Path d="M2 21h20" />
        </>
      );
    case 'trending':
      return (
        <>
          <Path d="M3 17l6-6 4 4 7-7" />
          <Path d="M17 8h4v4" />
        </>
      );
    case 'home':
      return (
        <>
          <Path d="M3 10l9-7 9 7" />
          <Path d="M5 9v11h14V9" />
          <Path d="M10 20v-6h4v6" />
        </>
      );
    case 'coin':
      return (
        <>
          <Circle cx="12" cy="12" r="8.5" />
          <Path d="M12 7.5v9M9.7 9.4h3.6a1.6 1.6 0 010 3.2H9.7m0 0h3.9" />
        </>
      );
    case 'gem':
      return (
        <>
          <Path d="M5 4h14l3 5-10 11L2 9z" />
          <Path d="M2 9h20M8.5 4l-1.5 5 5 11M15.5 4l1.5 5-5 11" />
        </>
      );
    case 'grid':
      return (
        <>
          <Rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <Rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <Rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <Rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </>
      );
    case 'minus':
      return (
        <>
          <Circle cx="12" cy="12" r="8.5" />
          <Path d="M8 12h8" />
        </>
      );
    case 'home_nav':
      return (
        <>
          <Path d="M3 10l9-7 9 7" />
          <Path d="M5 9v11h14V9" />
        </>
      );
    case 'list':
      return (
        <>
          <Path d="M8 6h13M8 12h13M8 18h13" />
          <Circle cx="3.5" cy="6" r="1.2" fill={color} stroke="none" />
          <Circle cx="3.5" cy="12" r="1.2" fill={color} stroke="none" />
          <Circle cx="3.5" cy="18" r="1.2" fill={color} stroke="none" />
        </>
      );
    case 'history':
      return (
        <>
          <Path d="M3 12a9 9 0 109-9 9 9 0 00-7 3.5" />
          <Path d="M3 3v3.5h3.5" />
          <Path d="M12 8v4l3 2" />
        </>
      );
    case 'settings':
      return (
        <>
          <Circle cx="12" cy="12" r="3.2" />
          <Path d="M19.4 13a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1v.1a2 2 0 11-4 0v-.1A1.6 1.6 0 005 17.7l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 002.6 11H2.5a2 2 0 110-4h.1A1.6 1.6 0 004.3 5L4.2 5a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 009 2.6V2.5a2 2 0 014 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8 1.6 1.6 0 001.5 1h.1a2 2 0 010 4h-.1a1.6 1.6 0 00-1.5 1z" />
        </>
      );
    case 'plus':
      return <Path d="M12 5v14M5 12h14" />;
    case 'edit':
      return (
        <>
          <Path d="M12 20h9" />
          <Path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
        </>
      );
    case 'trash':
      return (
        <>
          <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          <Path d="M10 11v6M14 11v6" />
        </>
      );
    case 'search':
      return (
        <>
          <Circle cx="11" cy="11" r="7" />
          <Path d="M21 21l-4.3-4.3" />
        </>
      );
    case 'close':
      return <Path d="M6 6l12 12M18 6L6 18" />;
    case 'chevR':
      return <Path d="M9 6l6 6-6 6" />;
    case 'chevD':
      return <Path d="M6 9l6 6 6-6" />;
    case 'chevL':
      return <Path d="M15 6l-6 6 6 6" />;
    case 'arrowUp':
      return <Path d="M12 19V5M6 11l6-6 6 6" />;
    case 'arrowDn':
      return <Path d="M12 5v14M6 13l6 6 6-6" />;
    case 'check':
      return <Path d="M20 6L9 17l-5-5" />;
    case 'lock':
      return (
        <>
          <Rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
          <Path d="M8 10.5V7a4 4 0 018 0v3.5" />
        </>
      );
    case 'wallet':
      return (
        <>
          <Rect x="3" y="6" width="18" height="14" rx="2.5" />
          <Path d="M3 10h18" />
          <Path d="M16 14.5h2" />
        </>
      );
    case 'sparkle':
      return <Path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />;
    case 'info':
      return (
        <>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 11v5M12 7.5v.5" />
        </>
      );
    case 'dots':
      return (
        <>
          <Circle cx="5" cy="12" r="1.6" fill={color} stroke="none" />
          <Circle cx="12" cy="12" r="1.6" fill={color} stroke="none" />
          <Circle cx="19" cy="12" r="1.6" fill={color} stroke="none" />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect x="3.5" y="5" width="17" height="16" rx="2.5" />
          <Path d="M3.5 9.5h17M8 3v4M16 3v4" />
        </>
      );
    default:
      return null;
  }
}

export function Icon({
  name,
  size = 22,
  color = '#000000',
  strokeWidth = 1.9,
  fill = 'none',
  style,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <G
        fill={fill}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <IconPaths name={name} color={color} />
      </G>
    </Svg>
  );
}
