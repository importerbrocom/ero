/**
 * ERO mobile design tokens — mirrors the web design system (frontend/src/index.css)
 * so the brand is consistent across web and mobile (dark navy + electric blue).
 */
export const colors = {
  bg: '#070B16',
  bg2: '#0B1120',
  surface: '#0F1A30',
  surface2: '#111A2E',
  card: '#13203A',
  border: '#1E2D4D',

  primary: '#2563EB',
  primary400: '#3B82F6',
  primary600: '#1D4ED8',

  accent: '#7C3AED',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  streak: '#F97316',

  text: '#E8EEFC',
  muted: '#93A3C0',
  faint: '#64748B',
  white: '#FFFFFF',
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
}

export const spacing = (n: number) => n * 4

export const font = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
}
