import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GreenHeader } from '../../src/components/GreenHeader';
import { Body, Button, Card } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { ClassUnit, Session } from '../../src/data/types';
import { useAuth } from '../../src/store';

export default function LecturerDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [units, setUnits] = useState<ClassUnit[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courseLabel, setCourseLabel] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [u, s, courseList] = await Promise.all([
        repo.getUnitsForLecturer(user.id),
        repo.getSessions(),
        repo.getCourses(),
      ]);
      setUnits(u);
      setSessions(s);
      const m: Record<string, string> = {};
      courseList.forEach(c => {
        m[c.id] = c.name;
      });
      setCourseLabel(m);
    } catch {}
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!user) return null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const listPadBottom = spacing.lg + Math.max(insets.bottom, 12) + 56;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <GreenHeader>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' }}>{greeting},</Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 }}>{user.name}</Text>
          </View>
          <Ionicons name="notifications-outline" size={26} color="#fff" />
        </View>
      </GreenHeader>

      {units.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="calendar-outline" size={72} color={colors.green} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 16 }}>No classes yet</Text>
          <Body muted style={{ textAlign: 'center', marginTop: 8 }}>Add a class and pick its degree programme.</Body>
          <Button title="Add class" variant="secondary" style={{ marginTop: 16, minWidth: 200 }} onPress={() => router.push('/(lecturer)/create-unit')} />
          <Button title="Go to Reports" variant="outline" style={{ marginTop: 12 }} onPress={() => router.push('/(lecturer)/reports')} />
        </View>
      ) : (
        <FlatList
          data={units}
          keyExtractor={u => u.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: listPadBottom, gap: spacing.md }}
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.md }}>
              <Button title="Add class" variant="outline" onPress={() => router.push('/(lecturer)/create-unit')} />
            </View>
          }
          renderItem={({ item }) => {
            const live = sessions.find(s => s.unitId === item.id && s.status === 'live');
            const ended = sessions.filter(s => s.unitId === item.id && s.status === 'ended').sort((a,b)=>b.endedAt!.localeCompare(a.endedAt!))[0];
            const deg = courseLabel[item.courseId] ?? item.courseId;
            return (
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', fontSize: 16 }}>{item.name}</Text>
                    <Body muted>{deg}</Body>
                    <Body muted>{item.code} • {item.room}</Body>
                    <Body muted>{item.schedule.start} – {item.schedule.end} • {item.schedule.day}</Body>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  {live ? (
                    <Button title="Go to Live Session" variant="secondary" style={{ flex: 1 }}
                      onPress={() => router.push({ pathname: '/(lecturer)/active' })} />
                  ) : (
                    <Button title="Start Session" variant="secondary" style={{ flex: 1 }}
                      onPress={() => router.push({ pathname: '/(lecturer)/setup', params: { unitId: item.id } })} />
                  )}
                  {ended && (
                    <Button title="View Report" variant="ghost" style={{ flex: 1, borderColor: colors.border, borderWidth: 1 }}
                      onPress={() => router.push({ pathname: '/(lecturer)/report/[id]', params: { id: ended.id } })} />
                  )}
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}
