import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

type Props = {
  title?: string;
  centered?: boolean;
  children?: ReactNode;
  style?: ViewStyle;
};

/**
 * Full-width primary header that respects the status bar / notch (no duplicate SafeArea padding).
 */
export function GreenHeader({ title, centered, children, style }: Props) {
  const insets = useSafeAreaInsets();
  const padTop = Math.max(insets.top, spacing.md) + spacing.sm;
  return (
    <View style={[styles.wrap, { paddingTop: padTop }, style]}>
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
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#0F3C12',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 0.2 },
  titleCenter: { textAlign: 'center', width: '100%' },
});
