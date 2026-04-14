import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Card } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { ClassUnit, Session } from '../../src/data/types';
import { useAuth } from '../../src/store';

export default function LecturerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [units, setUnits] = useState<ClassUnit[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [u, s] = await Promise.all([
        repo.getUnitsForLecturer(user.id),
        repo.getSessions(),
      ]);
      setUnits(u);
      setSessions(s);
    } catch {}
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!user) return null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
      <View style={styles.hdr}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#D9E7DB', fontSize: 13 }}>{greeting},</Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{user.name}</Text>
        </View>
        <Ionicons name="notifications-outline" size={24} color="#fff" />
      </View>

      {units.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="calendar-outline" size={72} color={colors.green} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 16 }}>No classes scheduled today</Text>
          <Button title="Go to Reports" variant="outline" style={{ marginTop: 20 }} onPress={() => router.push('/(lecturer)/reports')} />
        </View>
      ) : (
        <FlatList
          data={units}
          keyExtractor={u => u.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          renderItem={({ item }) => {
            const live = sessions.find(s => s.unitId === item.id && s.status === 'live');
            const ended = sessions.filter(s => s.unitId === item.id && s.status === 'ended').sort((a,b)=>b.endedAt!.localeCompare(a.endedAt!))[0];
            return (
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', fontSize: 16 }}>{item.name}</Text>
                    <Body muted>{item.code} • {item.room}</Body>
                    <Body muted>{item.schedule.start} – {item.schedule.end} • {item.enrolledStudentIds.length} students</Body>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hdr: { backgroundColor: colors.green, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 10 },
});
