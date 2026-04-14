import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as LocalAuth from 'expo-local-authentication';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';
import { useAuth } from '../../src/store';

export default function Biometric() {
  const router = useRouter();
  const { user } = useAuth();

  const next = () => {
    if (!user) return router.replace('/(auth)/role');
    router.replace(user.role === 'lecturer' ? '/(lecturer)/dashboard' : '/(student)/dashboard');
  };

  const enable = async () => {
    const hasHw = await LocalAuth.hasHardwareAsync();
    const enrolled = await LocalAuth.isEnrolledAsync();
    if (!hasHw || !enrolled) return next();
    await LocalAuth.authenticateAsync({ promptMessage: 'Enable biometric login' });
    next();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.wrap}>
          <Ionicons name="finger-print" size={88} color={colors.green} />
        </View>
        <Text style={styles.h}>Speed up future logins</Text>
        <Body muted style={{ textAlign: 'center', marginTop: 8 }}>
          Use your fingerprint or Face ID to sign in faster next time.
        </Body>
        <View style={{ height: 24 }} />
        <Button title="Enable Fingerprint" variant="secondary" onPress={enable} style={{ minWidth: 220 }} />
        <Pressable onPress={next} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 160, height: 160, borderRadius: 80, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  h: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
});
