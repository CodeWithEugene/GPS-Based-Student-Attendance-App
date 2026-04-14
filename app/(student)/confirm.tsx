import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';

export default function Confirm() {
  const router = useRouter();
  const { ok, unit, code, lat, lng, at, reason } = useLocalSearchParams<any>();
  const success = ok === '1';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' }}>
        <View style={[styles.wrap, { backgroundColor: success ? colors.greenLight : colors.redLight }]}>
          <Ionicons name={success ? 'checkmark' : 'close'} size={80} color={success ? colors.green : colors.red} />
        </View>
        <Text style={[styles.h, { color: success ? colors.green : colors.red }]}>
          {success ? 'Attendance Signed!' : 'Sign-in Failed'}
        </Text>
        {unit ? <Text style={styles.unit}>{unit}{code ? ` (${code})` : ''}</Text> : null}
        {success && at ? <Body muted style={{ marginTop: 4 }}>{new Date(String(at)).toLocaleString()}</Body> : null}
        {success && lat ? (
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
            GPS: {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </Text>
        ) : null}
        {!success && reason ? <Body muted style={{ textAlign: 'center', marginTop: 6 }}>{reason}</Body> : null}
        <View style={{ height: 24 }} />
        {success ? (
          <Button title="Back to Dashboard" variant="secondary" onPress={() => router.replace('/(student)/dashboard')} style={{ minWidth: 240 }} />
        ) : (
          <>
            <Button title="Try Again" onPress={() => router.back()} style={{ minWidth: 240 }} />
            <View style={{ height: 10 }} />
            <Button title="Get Help" variant="outline" onPress={() => router.replace('/(student)/help-fail')} style={{ minWidth: 240 }} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  h: { fontSize: 24, fontWeight: '800', marginTop: 16 },
  unit: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 4 },
});
