import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Card, Pill } from '../../src/components/UI';
import { colors, radius, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { AttendanceRecord, ClassUnit, Session } from '../../src/data/types';
import { useAuth } from '../../src/store';

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [units, setUnits] = useState<ClassUnit[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    const [u, s, r] = await Promise.all([
      repo.getUnitsForStudent(user.id),
      repo.getSessions(),
      repo.getAttendanceForStudent(user.id),
    ]);
    setUnits(u);
    setSessions(s);
    setRecords(r);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const pct = records.length === 0 ? 0 : Math.round((records.filter(r => r.status !== 'absent').length / Math.max(records.length, 1)) * 100);

  const statusOf = (u: ClassUnit): { label: string; tone: any } => {
    const live = sessions.find(s => s.unitId === u.id && s.status === 'live');
    if (live) return { label: 'In Progress', tone: 'success' };
    const ended = sessions.find(s => s.unitId === u.id && s.status === 'ended');
    if (ended) return { label: 'Ended', tone: 'danger' };
    return { label: 'Upcoming', tone: 'neutral' };
  };

  if (!user) return null;

  if (units.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
        <Header greeting={greeting} name={user.name.split(' ')[0]} />
        <EmptyState onView={() => router.push('/(student)/history')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
      <Header greeting={greeting} name={user.name.split(' ')[0]} />
      <FlatList
        data={units}
        keyExtractor={u => u.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.green} />}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListHeaderComponent={
          <Card style={{ backgroundColor: colors.greenLight, borderColor: colors.greenLight }}>
            <Text style={{ color: colors.green, fontWeight: '700' }}>Attendance this semester</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 36, fontWeight: '800', color: colors.green }}>{pct}%</Text>
              <Text style={{ color: colors.textMuted }}>{records.length} sessions logged</Text>
            </View>
            <View style={styles.bar}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: pct >= 75 ? colors.green : pct >= 50 ? colors.gold : colors.red }]} />
            </View>
          </Card>
        }
        ListHeaderComponentStyle={{ marginBottom: 6 }}
        renderItem={({ item }) => {
          const st = statusOf(item);
          const live = sessions.find(s => s.unitId === item.id && s.status === 'live');
          return (
            <Pressable
              onPress={() => live
                ? router.push({ pathname: '/(student)/notification', params: { sessionId: live.id } })
                : null
              }
            >
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>{item.name}</Text>
                    <Body muted style={{ marginTop: 2 }}>{item.code} • {item.room}</Body>
                    <Body muted>{item.schedule.start} – {item.schedule.end} • {item.lecturerName}</Body>
                  </View>
                  <Pill label={st.label} tone={st.tone} />
                </View>
                {live && (
                  <Pressable
                    onPress={() => router.push({ pathname: '/(student)/sign', params: { sessionId: live.id } })}
                    style={{ marginTop: 12, backgroundColor: colors.red, padding: 12, borderRadius: radius.md, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Go Sign Attendance</Text>
                  </Pressable>
                )}
              </Card>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

function Header({ greeting, name }: { greeting: string; name: string }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#D9E7DB', fontSize: 13 }}>{greeting},</Text>
        <Text style={{ color: colors.white, fontSize: 20, fontWeight: '700' }}>{name}</Text>
      </View>
      <View style={{ position: 'relative' }}>
        <Ionicons name="notifications-outline" size={24} color={colors.white} />
        <View style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.red }} />
      </View>
    </View>
  );
}

function EmptyState({ onView }: { onView: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="calendar-outline" size={72} color={colors.green} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 16 }}>No classes today</Text>
      <Text style={{ color: colors.textMuted, marginTop: 4 }}>Enjoy your free time!</Text>
      <Pressable onPress={onView} style={{ marginTop: 20, padding: 14, borderWidth: 1.5, borderColor: colors.green, borderRadius: 10 }}>
        <Text style={{ color: colors.green, fontWeight: '700' }}>View full timetable</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.green, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 10 },
  bar: { height: 8, backgroundColor: '#fff', borderRadius: 4, overflow: 'hidden', marginTop: 10 },
  fill: { height: 8, borderRadius: 4 },
});
