import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Card } from '../../src/components/UI';
import { colors, radius, shadows, spacing } from '../../src/theme';

export default function Confirm() {
  const router = useRouter();
  const { ok, unit, code, lat, lng, at, reason } = useLocalSearchParams<any>();
  const success = ok === '1';
  const color = success ? colors.green : colors.red;
  const bg = success ? colors.greenLight : colors.redLight;

  const scale = useRef(new Animated.Value(0)).current;
  const tick = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }),
      Animated.timing(tick, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [scale, tick]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
        <Animated.View style={[styles.outerRing, { backgroundColor: bg, transform: [{ scale }] }]}>
          <View style={[styles.innerRing, { borderColor: color }]}>
            <Animated.View style={{ opacity: tick }}>
              <Ionicons name={success ? 'checkmark' : 'close'} size={64} color={color} />
            </Animated.View>
          </View>
        </Animated.View>

        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={[styles.h, { color }]}>
            {success ? 'Attendance signed!' : 'Sign-in failed'}
          </Text>
          {unit ? <Text style={styles.unit}>{unit}{code ? ` · ${code}` : ''}</Text> : null}
        </View>

        {success && at && (
          <Card style={[styles.detailsCard, shadows.sm]}>
            <View style={styles.detailsRow}>
              <Ionicons name="time-outline" size={18} color={colors.green} />
              <Text style={styles.detailsText}>{new Date(String(at)).toLocaleString()}</Text>
            </View>
            {lat && lng && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailsRow}>
                  <Ionicons name="location-outline" size={18} color={colors.green} />
                  <Text style={styles.detailsText}>
                    {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
                  </Text>
                </View>
              </>
            )}
          </Card>
        )}

        {!success && reason && (
          <Card tone="danger" elevated={false} style={{ padding: spacing.md }}>
            <Body style={{ color: colors.red, textAlign: 'center', fontWeight: '600' }}>{reason}</Body>
          </Card>
        )}

        <View style={{ flex: 1 }} />

        <View style={{ width: '100%', gap: spacing.sm }}>
          {success ? (
            <Button
              title="Back to Dashboard"
              variant="secondary"
              onPress={() => router.replace('/(student)/dashboard')}
              icon={<Ionicons name="home" size={18} color="#fff" />}
            />
          ) : (
            <>
              <Button title="Try again" onPress={() => router.back()} />
              <Button title="Get help" variant="outline" onPress={() => router.replace('/(student)/help-fail')} />
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerRing: { width: 168, height: 168, borderRadius: 84, alignItems: 'center', justifyContent: 'center' },
  innerRing: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  h: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  unit: { fontSize: 15, fontWeight: '700', color: colors.text },
  detailsCard: { width: '100%', padding: spacing.lg, gap: spacing.md },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  detailsText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.borderSoft },
});
