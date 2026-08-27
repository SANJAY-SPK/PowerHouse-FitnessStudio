export const Colors = {
  primary: '#15173D',
  accent: '#982598',
  softPink: '#E491C9',
  background: '#F1E9E9',
  surface: '#FFFFFF',
  border: 'rgba(21,23,61,0.1)',

  // Text
  textOnDark: '#F1E9E9',
  textSubtleOnDark: '#E491C9',
  textPrimary: '#15173D',
  textMuted: 'rgba(21,23,61,0.5)',

  // Status
  activeGreen: '#22c55e',
  activeBg: '#dcfce7',
  activeText: '#15803d',
  expiringAmber: '#f59e0b',
  expiringBg: '#fef3c7',
  expiringText: '#92400e',
  expiredRed: '#ef4444',
  expiredBg: '#fee2e2',
  expiredText: '#991b1b',
  pausedGray: '#9ca3af',
  pausedBg: '#f3f4f6',
  pausedText: '#374151',
};

export type ThemeColor = keyof typeof Colors;


export const Typography = {
  heading1: { fontSize: 24, fontWeight: '700' as const },
  heading2: { fontSize: 20, fontWeight: '700' as const },
  heading3: { fontSize: 16, fontWeight: '600' as const },
  body:     { fontSize: 14, fontWeight: '400' as const },
  caption:  { fontSize: 12, fontWeight: '400' as const },
  label:    { fontSize: 11, fontWeight: '500' as const },
};

export const Layout = {
  radius: { sm: 8, md: 12, lg: 16, full: 999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  cardPadding: 14,
};

export const BottomTabInset = 80;
export const MaxContentWidth = 800;
export const Spacing = Layout.spacing;

import { Platform } from 'react-native';
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});
