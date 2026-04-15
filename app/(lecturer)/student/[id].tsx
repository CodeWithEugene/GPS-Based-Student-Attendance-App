import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../../src/components/Avatar';
import { Body, Button, Card } from '../../../src/components/UI';
import { TopBar } from '../../../src/components/TopBar';
import { colors, spacing } from '../../../src/theme';
import { repo } from '../../../src/data/repo';
import { AttendanceRecord, Session, User } from '../../../src/data/types';
import { useAuth } from '../../../src/store';

export default function StudentDetail() {
  const router = useRouter();
  const { id, sid } = useLocalSearchParams<{ id: string; sid?: string }>();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [currentRec, setCurrentRec] = useState<AttendanceRecord | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [working, setWorking] = useState<'present' | 'absent' | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const u = await repo.getUserById(String(id));
      if (!u) {
        setUser(null);
        setAllRecords([]);
        setCurrentRec(null);
        setSession(null);
        setLoadError('Student not found.');
        return;
      }
      setUser(u);
      const all = await repo.getAttendanceForStudent(String(id));
      setAllRecords(all);
      if (sid) {
        setCurrentRec(all.find(r => r.sessionId === sid) ?? null);
        const sessions = await repo.getSessions();
        setSession(sessions.find(s => s.id === sid) ?? null);
      } else {
        setCurrentRec(null);
        setSession(null);
      }
    } catch (e: any) {
      setLoadError(e?.message ?? 'Could not load student.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [id, sid]);

  useEffect(() => { load(); }, [load]);

  const override = async (status: 'present' | 'absent') => {
    if (!user || !session) return;
    if (!authUser || authUser.role !== 'lecturer' || authUser.id !== session.lecturerId) {
      Alert.alert('Not allowed', 'Only the lecturer who started this session can override attendance.');
      return;
    }
    setWorking(status);
    try {
      await repo.overrideAttendance({
        sessionId: session.id,
        unitId: session.unitId,
        unitCode: session.unitCode,
        studentId: user.id,
        studentName: user.name,
        status,
        coords: { latitude: session.geofence.latitude, longitude: session.geofence.longitude },
      });
      await load();
      Alert.alert('Updated', `${user.name} has been marked ${status}.`);
    } catch (e: any) {
      Alert.alert('Could not update', e?.message ?? 'Please try again.');
    } finally {
      setWorking(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['bottom']}>
        <TopBar title="Student" tone="green" back />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.green} />
          <Body muted>Loading…</Body>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['bottom']}>
        <TopBar title="Student" tone="green" back />
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: 'center', gap: 16 }}>
          <Text style={{ color: colors.red, fontWeight: '700', textAlign: 'center' }}>
            {loadError ?? 'Student not found.'}
          </Text>
          <Button title="Retry" variant="secondary" onPress={load} />
        </View>
      </SafeAreaView>
    );
  }

  const total = allRecords.length || 1;
  const present = allRecords.filter(r => r.status !== 'absent').length;
  const pct = Math.round((present / total) * 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['bottom']}>
      <TopBar title={user.name} tone="green" back />
      <View style={{ padding: spacing.lg, gap: 12 }}>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Avatar uri={user.avatarUrl} name={user.name} size={80} ring />
          <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 8 }}>{user.name}</Text>
          <Body muted>{user.id} • {user.programme ?? user.department ?? '—'}</Body>
        </View>

        <Card style={{ backgroundColor: currentRec ? colors.greenLight : colors.redLight, borderColor: 'transparent' }}>
          <Text style={{ fontWeight: '700', color: currentRec ? colors.green : colors.red }}>
            Current session: {currentRec ? (currentRec.overridden ? 'Marked present (override)' : 'Signed in') : 'Absent'}
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

        {session ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <Button
              title="Mark Present"
              variant="secondary"
              style={{ flex: 1 }}
              loading={working === 'present'}
              onPress={() => override('present')}
            />
            <Button
              title="Mark Absent"
              variant="outline"
              style={{ flex: 1 }}
              loading={working === 'absent'}
              onPress={() => override('absent')}
            />
          </View>
        ) : (
          <Body muted style={{ textAlign: 'center', marginTop: 6 }}>
            Open this student from a live session to mark attendance.
          </Body>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.green },
  bar: { height: 8, backgroundColor: '#EEE', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.gold },
});
