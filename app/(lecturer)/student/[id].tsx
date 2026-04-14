import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Card, Pill } from '../../../src/components/UI';
import { TopBar } from '../../../src/components/TopBar';
import { colors, spacing } from '../../../src/theme';
import { repo } from '../../../src/data/repo';
import { AttendanceRecord, User } from '../../../src/data/types';

export default function StudentDetail() {
  const router = useRouter();
  const { id, sid } = useLocalSearchParams<{ id: string; sid?: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [currentRec, setCurrentRec] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    (async () => {
      const u = await repo.getUserById(String(id));
      setUser(u ?? null);
      const all = await repo.getAttendanceForStudent(String(id));
      setAllRecords(all);
      if (sid) setCurrentRec(all.find(r => r.sessionId === sid) ?? null);
    })();
  }, [id, sid]);

  if (!user) return null;
  const total = allRecords.length || 1;
  const present = allRecords.filter(r => r.status !== 'absent').length;
  const pct = Math.round((present / total) * 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['bottom']}>
      <TopBar title={user.name} tone="green" back />
      <View style={{ padding: spacing.lg, gap: 12 }}>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <View style={styles.avatar}><Text style={{ fontSize: 26, fontWeight: '800', color: colors.green }}>{user.name[0]}</Text></View>
          <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 8 }}>{user.name}</Text>
          <Body muted>{user.id} • {user.programme}</Body>
        </View>

        <Card style={{ backgroundColor: currentRec ? colors.greenLight : colors.redLight, borderColor: 'transparent' }}>
          <Text style={{ fontWeight: '700', color: currentRec ? colors.green : colors.red }}>
            Current session: {currentRec ? 'Signed in' : 'Absent'}
          </Text>
          {currentRec && <Body muted>At {new Date(currentRec.signedAt).toLocaleTimeString()}</Body>}
        </Card>

        <Card>
          <Text style={{ fontWeight: '700' }}>Attendance this unit</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.gold }}>{pct}%</Text>
            <Body muted>{present}/{allRecords.length} sessions</Body>
          </View>
          <View style={styles.bar}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
          <Button title="Mark Present" variant="secondary" style={{ flex: 1 }} onPress={() => router.back()} />
          <Button title="Mark Absent" variant="outline" style={{ flex: 1 }} onPress={() => router.back()} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.green },
  bar: { height: 8, backgroundColor: '#EEE', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.gold },
});
