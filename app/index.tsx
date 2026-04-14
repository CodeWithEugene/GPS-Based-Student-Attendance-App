import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/UI';
import { PERMISSION_ONBOARDING_KEY } from '../src/lib/onboarding-keys';
import { colors, radius, shadows, spacing } from '../src/theme';
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
      {/* Decorative background circles */}
      <View style={styles.bgCircleOne} pointerEvents="none" />
      <View style={styles.bgCircleTwo} pointerEvents="none" />

      <View style={styles.center}>
        <View style={[styles.logoRing, shadows.xl]}>
          <View style={styles.logoInner}>
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
        </View>
        <Text style={styles.name}>GPS Attendance</Text>
        <Text style={styles.sub}>JKUAT · Verified by location</Text>
        <View style={styles.tagline}>
          <Text style={styles.tag}>Sign in once, mark attendance when your lecturer opens a session.</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Button title="Get Started" onPress={onGetStarted} loading={routing} iconPosition="right" />
        <Text style={styles.footerNote}>Powered by Supabase · Secured by biometric</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.greenDark, justifyContent: 'space-between', overflow: 'hidden' },
  bgCircleOne: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -80,
    right: -120,
  },
  bgCircleTwo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(249,168,37,0.08)',
    bottom: 80,
    left: -100,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  logoRing: {
    padding: 10,
    borderRadius: radius.xl + 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
    }),
  },
  logoInner: {
    width: 130,
    height: 130,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 100, height: 100 },
  name: { color: colors.gold, fontSize: 36, fontWeight: '800', letterSpacing: 0.3 },
  sub: { color: 'rgba(255,255,255,0.94)', fontSize: 15, fontWeight: '700', marginTop: spacing.sm, letterSpacing: 0.3 },
  tagline: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tag: { color: 'rgba(255,255,255,0.82)', fontSize: 13, textAlign: 'center', lineHeight: 19, maxWidth: 300 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md },
  footerNote: { color: 'rgba(255,255,255,0.55)', fontSize: 11, textAlign: 'center', letterSpacing: 0.3 },
});
