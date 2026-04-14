import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';

type Props = {
  title?: string;
  centered?: boolean;
  children?: ReactNode;
  style?: ViewStyle;
  compact?: boolean;
};

/**
 * Full-width primary header with a soft curved bottom and depth shadow.
 * Handles safe-area top padding so callers don't need to.
 */
export function GreenHeader({ title, centered, children, style, compact }: Props) {
  const insets = useSafeAreaInsets();
  const padTop = Math.max(insets.top, spacing.md) + (compact ? 6 : spacing.sm);
  const padBottom = compact ? spacing.lg : spacing.xl;
  return (
    <View style={[styles.wrap, { paddingTop: padTop, paddingBottom: padBottom }, style]}>
      {/* Subtle decorative arc for depth */}
      <View style={styles.accent} pointerEvents="none" />
      {children ? (
        children
      ) : title ? (
        <Text style={[styles.title, centered && styles.titleCenter]} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.green,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F3C12',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  accent: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.1 },
  titleCenter: { textAlign: 'center', width: '100%' },
});
