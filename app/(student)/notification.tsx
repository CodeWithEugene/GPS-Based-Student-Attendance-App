import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button } from '../../src/components/UI';
import { TopBar } from '../../src/components/TopBar';
import { colors, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { Session } from '../../src/data/types';

export default function NotificationDetail() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    (async () => {
      const all = await repo.getSessions();
      const s = all.find(x => x.id === sessionId) || null;
      setSession(s);
      if (s) setLeft(Math.max(0, Math.floor((new Date(s.endsAt).getTime() - Date.now()) / 1000)));
    })();
  }, [sessionId]);

  useEffect(() => {
    const t = setInterval(() => setLeft(n => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['bottom']}>
        <TopBar title="Session" tone="green" back />
        <View style={{ padding: spacing.xl }}><Body muted>Session not found.</Body></View>
      </SafeAreaView>
    );
  }
  const m = Math.floor(left / 60).toString().padStart(2, '0');
  const s = (left % 60).toString().padStart(2, '0');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['bottom']}>
      <TopBar title="Attendance Alert" tone="green" back />
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{session.unitName}</Text>
        <Text style={{ color: colors.textMuted, fontWeight: '600' }}>{session.unitCode} • {session.room}</Text>

        <View style={styles.banner}>
          <Text style={{ color: '#8A5A00', fontWeight: '700', fontSize: 15 }}>Session is now open</Text>
          <Text style={{ color: '#8A5A00', fontSize: 13, marginTop: 2 }}>Sign in before the window closes.</Text>
        </View>

        <View style={styles.timerWrap}>
          <Text style={{ color: colors.textMuted }}>Closes in</Text>
          <Text style={styles.timer}>{m}:{s}</Text>
        </View>

        <Button
          title="Go Sign Attendance"
          onPress={() => router.push({ pathname: '/(student)/sign', params: { sessionId: session.id } })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.goldLight, padding: 14, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.gold },
  timerWrap: { alignItems: 'center', padding: 20, backgroundColor: colors.bgSubtle, borderRadius: 12 },
  timer: { fontSize: 42, fontWeight: '800', color: colors.green, marginTop: 4 },
});
