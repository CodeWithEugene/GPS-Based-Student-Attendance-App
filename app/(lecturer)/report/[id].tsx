import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Card, Pill } from '../../../src/components/UI';
import { TopBar } from '../../../src/components/TopBar';
import { colors, spacing } from '../../../src/theme';
import { repo } from '../../../src/data/repo';
import { AttendanceRecord, ClassUnit, Session, User } from '../../../src/data/types';

export default function SingleReport() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [unit, setUnit] = useState<ClassUnit | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    (async () => {
      const all = await repo.getSessions();
      const s = all.find(x => x.id === id) || null;
      setSession(s);
      if (s) {
        const units = await repo.getUnits();
        setUnit(units.find(x => x.id === s.unitId) || null);
        setRecords(await repo.getAttendanceForSession(s.id));
        setUsers(await repo.getUsers());
      }
    })();
  }, [id]);

  if (!session || !unit) return null;

  const enrolled = unit.enrolledStudentIds;
  const signedMap = new Map(records.map(r => [r.studentId, r]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['bottom']}>
      <TopBar title="Session Report" tone="green" back />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '800' }}>{session.unitName}</Text>
        <Body muted>{session.unitCode} • {session.room}</Body>
        <Body muted>{new Date(session.startedAt).toLocaleString()} → {session.endedAt ? new Date(session.endedAt).toLocaleTimeString() : '—'}</Body>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Enrolled" value={enrolled.length} color={colors.green} />
          <Stat label="Signed in" value={records.length} color={colors.green} filled />
          <Stat label="Absent" value={enrolled.length - records.length} color={colors.red} filled />
        </View>

        <Card>
          {enrolled.map(sid => {
            const u = users.find(x => x.id === sid);
            const rec = signedMap.get(sid);
            return (
              <View key={sid} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600' }}>{u?.name ?? sid}</Text>
                  <Body muted>{sid}{rec ? ` • ${new Date(rec.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</Body>
                </View>
                {rec && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="location" size={14} color={colors.green} />
                    <Text style={{ fontSize: 12, color: colors.green, fontWeight: '600' }}>GPS</Text>
                  </View>
                )}
                <View style={{ marginLeft: 8 }}>
                  <Pill label={rec ? 'Present' : 'Absent'} tone={rec ? 'success' : 'danger'} />
                </View>
              </View>
            );
          })}
        </Card>

        <Button title="Export This Session (CSV)" onPress={() => {}} />
        <Button title="Flag Anomaly" variant="ghost" style={{ borderWidth: 1, borderColor: colors.border }} onPress={() => {}} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color, filled }: any) {
  return (
    <View style={{
      flex: 1, padding: 14, borderRadius: 12,
      backgroundColor: filled ? color : 'transparent',
      borderWidth: filled ? 0 : 1.5, borderColor: color, alignItems: 'center',
    }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: filled ? '#fff' : color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: filled ? '#fff' : colors.textMuted, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
});
