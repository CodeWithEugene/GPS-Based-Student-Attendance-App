import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Pill } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { AttendanceRecord, ClassUnit, Session, User } from '../../src/data/types';
import { useAuth } from '../../src/store';

export default function Active() {
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [unit, setUnit] = useState<ClassUnit | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [left, setLeft] = useState(0);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const sessions = await repo.getSessions();
      const live = sessions.find(s => s.lecturerId === user.id && s.status === 'live') || null;
      setSession(live);
      if (live) {
        const [units, recs, users] = await Promise.all([
          repo.getUnits(),
          repo.getAttendanceForSession(live.id),
          repo.getUsers(),
        ]);
        setUnit(units.find(x => x.id === live.unitId) || null);
        setRecords(recs);
        setUsers(users);
        setLeft(Math.max(0, Math.floor((new Date(live.endsAt).getTime() - Date.now()) / 1000)));
      }
    } catch {
      // Silent failure for background polling; next tick will retry.
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    const t = setInterval(() => { setTick(n => n + 1); load(); }, 3000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => {
    const t = setInterval(() => setLeft(n => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  if (!session || !unit) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
        <View style={styles.hdr}><Text style={styles.hdrTitle}>Active Session</Text></View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Ionicons name="radio-outline" size={72} color={colors.textMuted} />
          <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 12 }}>No live session</Text>
          <Body muted style={{ textAlign: 'center', marginTop: 4 }}>
            Start a session from the Home tab to begin collecting attendance.
          </Body>
          <Button title="Go Home" variant="outline" onPress={() => router.push('/(lecturer)/dashboard')} style={{ marginTop: 20, minWidth: 200 }} />
        </View>
      </SafeAreaView>
    );
  }

  const enrolled = unit.enrolledStudentIds;
  const signedSet = new Set(records.map(r => r.studentId));
  const rows = enrolled.map(sid => {
    const u = users.find(x => x.id === sid);
    const rec = records.find(r => r.studentId === sid);
    return { id: sid, name: u?.name ?? sid, record: rec };
  });
  const m = Math.floor(left / 60).toString().padStart(2, '0');
  const s = (left % 60).toString().padStart(2, '0');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
      <View style={styles.banner}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green }} />
          <Text style={{ color: colors.greenDark, fontWeight: '800' }}>Session Live — {session.unitCode}</Text>
        </View>
        <Text style={{ color: colors.greenDark, fontWeight: '700', marginTop: 4 }}>
          {records.length} / {enrolled.length} signed
        </Text>
        <Text style={{ color: '#8A5A00', marginTop: 2 }}>Ends in {m}:{s}</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={r => r.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          const signed = !!item.record;
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/(lecturer)/student/[id]', params: { id: item.id, sid: session.id } })}
              style={[styles.row, { backgroundColor: signed ? colors.greenLight : '#fff' }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>{item.name}</Text>
                <Body muted>{item.id}</Body>
              </View>
              {signed ? (
                <Pill label={new Date(item.record!.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} tone="success" />
              ) : (
                <Pill label="—" />
              )}
            </Pressable>
          );
        }}
      />

      <View style={styles.footer}>
        <Button title="End Session" variant="danger" onPress={() => router.push('/(lecturer)/end')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hdr: { backgroundColor: colors.green, padding: spacing.lg },
  hdrTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  banner: { backgroundColor: colors.goldLight, padding: spacing.lg, borderBottomWidth: 3, borderBottomColor: colors.gold },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
});
