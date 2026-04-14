export const colors = {
  green: '#1B5E20',
  greenMid: '#2E7D32',
  greenSoft: '#4CAF50',
  greenLight: '#E8F3E9',
  greenDark: '#0F3C12',
  red: '#B71C1C',
  redMid: '#D32F2F',
  redLight: '#FFEBEE',
  gold: '#F9A825',
  goldMid: '#FBC02D',
  goldLight: '#FFF6DD',
  white: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  border: '#E2E8F0',
  borderSoft: '#EFF2F6',
  bg: '#FFFFFF',
  /** Main screen background — neutral with a hint of cool tint */
  bgCanvas: '#F7F9FC',
  bgSubtle: '#F1F5F9',
  overlay: 'rgba(15,23,42,0.4)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 44,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

/**
 * Five-tier elevation scale — use instead of ad-hoc shadow objects.
 * xs=hairline, sm=button/chip, md=card, lg=lifted card/CTA, xl=modal/hero.
 */
export const shadows = {
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 9,
  },
  xl: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 14,
  },
  // legacy aliases so existing imports keep working
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  button: {
    shadowColor: '#B71C1C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const typography = {
  display: { fontSize: 40, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.6 },
  h1: { fontSize: 30, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.2 },
  h3: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '500' as const, color: colors.text, lineHeight: 22 },
  bodyMuted: { fontSize: 14, fontWeight: '500' as const, color: colors.textMuted, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '700' as const, color: colors.text, letterSpacing: 0.2 },
  caption: { fontSize: 11, fontWeight: '700' as const, color: colors.textMuted, letterSpacing: 0.4, textTransform: 'uppercase' as const },
};
