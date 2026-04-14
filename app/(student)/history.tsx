import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GreenHeader } from '../../src/components/GreenHeader';
import { Body, Card, Pill } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { AttendanceRecord, ClassUnit } from '../../src/data/types';
import { useAuth } from '../../src/store';

type Tab = 'all' | 'course' | 'month';
export default function History() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [units, setUnits] = useState<ClassUnit[]>([]);
  const [tab, setTab] = useState<Tab>('all');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [r, u] = await Promise.all([
        repo.getAttendanceForStudent(user.id),
        repo.getUnitsForStudent(user.id),
      ]);
      setRecords(r);
      setUnits(u);
    } catch {}
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pct = records.length ? Math.round((records.filter(r => r.status !== 'absent').length / records.length) * 100) : 100;
  const risk = pct >= 75 ? { label: 'On track', color: colors.green } : pct >= 50 ? { label: 'At risk', color: colors.gold } : { label: 'Critical', color: colors.red };

  const listPadBottom = spacing.lg + Math.max(insets.bottom, 12) + 56;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <GreenHeader title="My Attendance" centered />
      <FlatList
        data={records}
        keyExtractor={r => r.id}
        ListHeaderComponent={
          <View style={{ padding: spacing.lg, gap: 12 }}>
            <Card style={{ backgroundColor: colors.bgSubtle, borderColor: colors.border }}>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>Overall attendance</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                <Text style={{ fontSize: 40, fontWeight: '800', color: risk.color }}>{pct}%</Text>
                <Pill label={risk.label} tone={pct >= 75 ? 'success' : pct >= 50 ? 'warn' : 'danger'} />
              </View>
              <Body muted style={{ marginTop: 4 }}>{records.length} sessions across {units.length} units</Body>
            </Card>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {(['all', 'course', 'month'] as Tab[]).map(t => (
                <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
                  <Text style={{ color: tab === t ? colors.text : colors.textMuted, fontWeight: '600' }}>
                    {t === 'all' ? 'All' : t === 'course' ? 'By Course' : 'By Month'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Body muted>No attendance records yet. Once you sign for a session, it will appear here.</Body>
          </View>
        }
        contentContainerStyle={{ paddingBottom: listPadBottom }}
        renderItem={({ item }) => {
          const t = new Date(item.signedAt);
          const tone = item.status === 'present' ? 'success' : item.status === 'late' ? 'warn' : 'danger';
          return (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>{item.unitCode}</Text>
                <Body muted>{t.toLocaleDateString()} • {t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Body>
              </View>
              <Pill label={item.status[0].toUpperCase() + item.status.slice(1)} tone={tone} />
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tab: { paddingVertical: 6, paddingHorizontal: 4 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.gold },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
});
