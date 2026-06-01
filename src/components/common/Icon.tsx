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
  | 'calendar'
  | 'car'
  | 'plane'
  | 'globe'
  | 'briefcase'
  | 'graduation'
  | 'laptop'
  | 'phone'
  | 'watch'
  | 'camera'
  | 'music'
  | 'palette'
  | 'gift'
  | 'cart'
  | 'tag'
  | 'tv'
  | 'coffee'
  | 'heart'
  | 'shield'
  | 'umbrella'
  | 'key'
  | 'leaf'
  | 'crown'
  | 'flame'
  | 'bolt'
  | 'star';

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
    case 'car':
      return (
        <>
          <Path d="M5 10l2.5-4.5A2 2 0 019.3 4.5h5.4a2 2 0 011.8 1l2.5 4.5" />
          <Rect x="2" y="10" width="20" height="7" rx="1.5" />
          <Circle cx="7" cy="19.5" r="2" />
          <Circle cx="17" cy="19.5" r="2" />
          <Path d="M2 14h20" />
        </>
      );
    case 'plane':
      return (
        <>
          <Path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
        </>
      );
    case 'globe':
      return (
        <>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M3 12h18" />
          <Path d="M12 3c-2.4 3-3.8 5.7-3.8 9s1.4 6 3.8 9" />
          <Path d="M12 3c2.4 3 3.8 5.7 3.8 9s-1.4 6-3.8 9" />
        </>
      );
    case 'briefcase':
      return (
        <>
          <Rect x="2" y="8" width="20" height="13" rx="2" />
          <Path d="M16 8V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
          <Path d="M2 13h20" />
        </>
      );
    case 'graduation':
      return (
        <>
          <Path d="M22 10l-10-5-10 5 10 5 10-5z" />
          <Path d="M6 12.5v4.5c0 1.7 5.4 2.5 6 2.5s6-.8 6-2.5V12.5" />
          <Path d="M22 10v6" />
        </>
      );
    case 'laptop':
      return (
        <>
          <Rect x="3" y="4" width="18" height="13" rx="1.5" />
          <Path d="M1 21h22" />
          <Path d="M9 21l1.5-4h3L15 21" />
        </>
      );
    case 'phone':
      return (
        <>
          <Rect x="6" y="2" width="12" height="20" rx="2.5" />
          <Path d="M10 17.5h4" />
        </>
      );
    case 'watch':
      return (
        <>
          <Circle cx="12" cy="12" r="5.5" />
          <Path d="M12 9.5v2.5l1.8 1.8" />
          <Path d="M9.5 4.5L10.5 2h3l1 2.5M9.5 19.5L10.5 22h3l1-2.5" />
        </>
      );
    case 'camera':
      return (
        <>
          <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <Circle cx="12" cy="13" r="4" />
        </>
      );
    case 'music':
      return (
        <>
          <Path d="M9 18V5l12-2v13" />
          <Circle cx="6" cy="18" r="3" />
          <Circle cx="18" cy="16" r="3" />
        </>
      );
    case 'palette':
      return (
        <>
          <Circle cx="12" cy="12" r="9" />
          <Circle cx="8.5" cy="9" r="1.5" fill={color} stroke="none" />
          <Circle cx="14" cy="7.5" r="1.5" fill={color} stroke="none" />
          <Circle cx="16.5" cy="12" r="1.5" fill={color} stroke="none" />
          <Circle cx="8" cy="14.5" r="1.5" fill={color} stroke="none" />
          <Path d="M12 20c1 0 2-.4 2.5-1a2 2 0 012-2H18a2 2 0 000-4h-1" />
        </>
      );
    case 'gift':
      return (
        <>
          <Rect x="3" y="9" width="18" height="12" rx="1.5" />
          <Path d="M3 9h18M12 9v12" />
          <Path d="M7.5 9C7.5 6.5 8.5 5 10 5c2 0 2 4 2 4" />
          <Path d="M16.5 9C16.5 6.5 15.5 5 14 5c-2 0-2 4-2 4" />
        </>
      );
    case 'cart':
      return (
        <>
          <Path d="M2 3h2l.4 2M7 13h10l4-8H5.4" />
          <Path d="M7 13L5.4 5" />
          <Circle cx="9" cy="19.5" r="1.8" />
          <Circle cx="18" cy="19.5" r="1.8" />
        </>
      );
    case 'tag':
      return (
        <>
          <Path d="M20.6 11.3V5.5a1 1 0 00-1-1h-5.8a1 1 0 00-.7.3L3.3 14.7a1.5 1.5 0 000 2.1l3.9 3.9a1.5 1.5 0 002.1 0l9.8-9.8a1 1 0 00.5-.6z" />
          <Circle cx="16.5" cy="7.5" r="1.3" fill={color} stroke="none" />
        </>
      );
    case 'tv':
      return (
        <>
          <Rect x="2" y="5" width="20" height="14" rx="2" />
          <Path d="M8 21h8M12 19v2" />
        </>
      );
    case 'coffee':
      return (
        <>
          <Path d="M17 8h2a3 3 0 010 6h-2" />
          <Path d="M3 8h14v9a3 3 0 01-3 3H6a3 3 0 01-3-3V8z" />
          <Path d="M6.5 2.5c0 1.5 1.5 1.5 1.5 3M10 2.5c0 1.5 1.5 1.5 1.5 3" />
        </>
      );
    case 'heart':
      return (
        <Path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1 7.8 7.8 7.8-7.8 1-1a5.5 5.5 0 000-7.8z" />
      );
    case 'shield':
      return (
        <Path d="M12 3L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7l-8-4z" />
      );
    case 'umbrella':
      return (
        <>
          <Path d="M23 12a11.1 11.1 0 00-22 0z" />
          <Path d="M12 12v8a2 2 0 004 0" />
        </>
      );
    case 'key':
      return (
        <>
          <Circle cx="8.5" cy="12" r="5" />
          <Path d="M13.5 12H22M19 10v4" />
        </>
      );
    case 'leaf':
      return (
        <>
          <Path d="M20 2c0 0 .5 10-10 14M20 2c0 0-2 10-12 14" />
          <Path d="M4 22c0 0 1-7 6-10" />
        </>
      );
    case 'crown':
      return (
        <Path d="M2 19l2.5-10L9 14l3-10 3 10 4.5-5L22 19H2z" />
      );
    case 'flame':
      return (
        <Path d="M12 2c0 0-4 4-4 9a4 4 0 008 0c0-1-.3-2-1-3 0 0 0 3-2 3s-1-3-1-3c-1 2-1 4 0 5" />
      );
    case 'bolt':
      return (
        <Path d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z" />
      );
    case 'star':
      return (
        <Path d="M12 2l3.1 6.3 6.9.9-5 4.9 1.2 6.9L12 18l-6.2 3 1.2-6.9-5-4.9 6.9-.9L12 2z" />
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
