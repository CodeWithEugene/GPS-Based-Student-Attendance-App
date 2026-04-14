import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/UI';
import { PERMISSION_ONBOARDING_KEY } from '../src/lib/onboarding-keys';
import { colors, spacing } from '../src/theme';
import { useAuth } from '../src/store';

export default function Splash() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [routing, setRouting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(user.role === 'lecturer' ? '/(lecturer)/dashboard' : '/(student)/dashboard');
    }
  }, [user, loading]);

  const onGetStarted = async () => {
    setRouting(true);
    try {
      const done = await AsyncStorage.getItem(PERMISSION_ONBOARDING_KEY);
      router.push(done === '1' ? '/(auth)/login' : '/(auth)/permissions');
    } catch {
      router.push('/(auth)/permissions');
    } finally {
      setRouting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <View style={styles.logoRing}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.name}>GPS Attendance</Text>
        <Text style={styles.sub}>JKUAT · Verified by location</Text>
        <Text style={styles.tag}>Sign in once, mark attendance when your lecturer opens a session.</Text>
      </View>
      <View style={styles.footer}>
        <Button title="Get Started" onPress={onGetStarted} loading={routing} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.greenDark, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  logoRing: {
    padding: spacing.lg,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  logo: { width: 120, height: 120 },
  name: { color: colors.gold, fontSize: 34, fontWeight: '800', letterSpacing: 0.5 },
  sub: { color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: '600', marginTop: spacing.sm },
  tag: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    marginTop: spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
});
