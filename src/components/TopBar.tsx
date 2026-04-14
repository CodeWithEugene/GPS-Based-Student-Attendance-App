import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export function TopBar({
  title,
  back,
  onBackPress,
  right,
  tone = 'green',
}: {
  title: string;
  back?: boolean;
  /** When set with `back`, runs instead of `router.back()`. */
  onBackPress?: () => void;
  right?: ReactNode;
  tone?: 'green' | 'white' | 'gold';
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bg = tone === 'green' ? colors.green : tone === 'gold' ? colors.gold : colors.white;
  const fg = tone === 'white' ? colors.text : colors.white;
  const padTop = Math.max(insets.top, spacing.sm);
  const goBack = () => (onBackPress ? onBackPress() : router.back());

  return (
    <View style={[styles.bar, { backgroundColor: bg, borderBottomColor: tone === 'white' ? colors.border : 'transparent', paddingTop: padTop }]}>
      {back ? (
        <Pressable onPress={goBack} hitSlop={12} style={styles.side}>
          <Ionicons name="chevron-back" size={26} color={fg} />
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <Text style={[styles.title, { color: fg }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  side: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
});
