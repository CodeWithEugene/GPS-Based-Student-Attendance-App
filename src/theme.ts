export const colors = {
  green: '#1B5E20',
  greenLight: '#E8F3E9',
  greenDark: '#0F3C12',
  red: '#B71C1C',
  redLight: '#FDECEC',
  gold: '#F9A825',
  goldLight: '#FFF6DD',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B6B6B',
  border: '#E1E4E8',
  bg: '#FFFFFF',
  bgSubtle: '#F7F8FA',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 22,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  bodyMuted: { fontSize: 14, color: colors.textMuted },
  small: { fontSize: 12, color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
};
