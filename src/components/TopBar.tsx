import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

export function TopBar({
  title,
  back,
  right,
  tone = 'green',
}: {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
  tone?: 'green' | 'white' | 'gold';
}) {
  const router = useRouter();
  const bg = tone === 'green' ? colors.green : tone === 'gold' ? colors.gold : colors.white;
  const fg = tone === 'white' ? colors.text : colors.white;
  return (
    <View style={[styles.bar, { backgroundColor: bg, borderBottomColor: tone === 'white' ? colors.border : bg }]}>
      {back ? (
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.side}>
          <Ionicons name="chevron-back" size={26} color={fg} />
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <Text style={[styles.title, { color: fg }]} numberOfLines={1}>{title}</Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
  },
  side: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
});
