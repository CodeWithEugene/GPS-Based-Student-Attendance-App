import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { Session } from '../../src/data/types';
import { useAuth } from '../../src/store';

export default function End() {
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [signedCount, setSignedCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const sessions = await repo.getSessions();
      const live = sessions.find(s => s.lecturerId === user.id && s.status === 'live') || null;
      setSession(live);
      if (live) {
        const units = await repo.getUnits();
        const u = units.find(x => x.id === live.unitId);
        setTotal(u?.enrolledStudentIds.length ?? 0);
        const recs = await repo.getAttendanceForSession(live.id);
        setSignedCount(recs.length);
      }
    })();
  }, [user]);

  const endSession = async () => {
    if (!session) return;
    setEnding(true);
    await repo.updateSession(session.id, { status: 'ended', endedAt: new Date().toISOString() });
    router.replace({ pathname: '/(lecturer)/report/[id]', params: { id: session.id } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: colors.redLight, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="warning" size={64} color={colors.red} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.red, marginTop: 16 }}>End This Session?</Text>
        <Text style={{ marginTop: 10, fontWeight: '600' }}>{signedCount} of {total} students signed in</Text>
        <Body muted style={{ textAlign: 'center', marginTop: 6 }}>
          This cannot be undone — a report will be generated immediately.
        </Body>
        <View style={{ height: 24, width: '100%' }} />
        <Button title="Keep Session Open" variant="ghost" style={{ minWidth: 240, borderWidth: 1, borderColor: colors.border }} onPress={() => router.back()} />
        <View style={{ height: 10 }} />
        <Button title="End Session + Generate Report" variant="danger" loading={ending} onPress={endSession} style={{ minWidth: 240 }} />
      </View>
    </SafeAreaView>
  );
}
