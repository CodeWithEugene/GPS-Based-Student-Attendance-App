import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';

export default function Locked() {
  const router = useRouter();
  const [left, setLeft] = useState(15 * 60);
  useEffect(() => {
    const t = setInterval(() => setLeft(n => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(left / 60).toString().padStart(2, '0');
  const s = (left % 60).toString().padStart(2, '0');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={72} color={colors.red} />
        </View>
        <Text style={styles.h}>Account Temporarily Locked</Text>
        <Text style={styles.timer}>{m}:{s}</Text>
        <Text style={styles.p}>
          You entered the wrong code too many times. For your security, please wait before trying again.
        </Text>
        <View style={{ height: 20 }} />
        <Button title="OK" variant="secondary" onPress={() => router.replace('/(auth)/login')} style={{ minWidth: 180 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 140, height: 140, borderRadius: 70, backgroundColor: colors.redLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  h: { fontSize: 22, fontWeight: '800', color: colors.red, textAlign: 'center' },
  timer: { fontSize: 36, fontWeight: '800', color: colors.gold, marginVertical: 8 },
  p: { color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
});
