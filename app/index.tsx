import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/UI';
import { colors, spacing } from '../src/theme';
import { useAuth } from '../src/store';
import { useEffect } from 'react';

export default function Splash() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(user.role === 'lecturer' ? '/(lecturer)/dashboard' : '/(student)/dashboard');
    }
  }, [user, loading]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.name}>GPS Attendance</Text>
        <Text style={styles.sub}>Student Attendance App</Text>
        <Text style={styles.tag}>Smart Attendance, Verified by GPS</Text>
      </View>
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
        <Button title="Get Started" onPress={() => router.push('/(auth)/permissions')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.green, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { width: 150, height: 150, marginBottom: 24, backgroundColor: '#FFFFFF22', borderRadius: 20 },
  name: { color: colors.gold, fontSize: 38, fontWeight: '800', letterSpacing: 0.5 },
  sub: { color: colors.white, fontSize: 15, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },
  tag: { color: colors.white, fontSize: 14, marginTop: 10, textAlign: 'center', opacity: 0.85 },
});
