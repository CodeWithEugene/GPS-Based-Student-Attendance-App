import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GreenHeader } from '../../src/components/GreenHeader';
import { Body, Button, Card, Pill } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { AttendanceRecord, ClassUnit, Session, User } from '../../src/data/types';
import { buildOverviewCsv, shareCsv } from '../../src/lib/export';
import { useAuth } from '../../src/store';

export default function Reports() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [units, setUnits] = useState<ClassUnit[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [u, s, r, uu] = await Promise.all([
        repo.getUnitsForLecturer(user.id),
        repo.getSessions(),
        repo.getAttendance(),
        repo.getUsers(),
      ]);
      setUnits(u);
      setSessions(s.filter(x => u.some(y => y.id === x.unitId)));
      setRecords(r);
      setUsers(uu);
    } catch {}
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredSessions = sessions
    .filter(s => s.status === 'ended' && (selectedUnit === 'all' || s.unitId === selectedUnit))
    .sort((a, b) => (b.endedAt || '').localeCompare(a.endedAt || ''));

  const totalPresent = filteredSessions.reduce((acc, s) => acc + records.filter(r => r.sessionId === s.id).length, 0);
  const totalSlots = filteredSessions.reduce((acc, s) => {
    const u = units.find(x => x.id === s.unitId);
    return acc + (u?.enrolledStudentIds.length ?? 0);
  }, 0);

  const maxBar = Math.max(1, ...filteredSessions.map(s => records.filter(r => r.sessionId === s.id).length));

  const studentStats = (() => {
    const unitIds = selectedUnit === 'all' ? units.map(u => u.id) : [selectedUnit];
    const relevantUnits = units.filter(u => unitIds.includes(u.id));
    const studentIds = Array.from(new Set(relevantUnits.flatMap(u => u.enrolledStudentIds)));
    return studentIds.map(sid => {
      const su = users.find(x => x.id === sid);
      const sessIds = filteredSessions.filter(s => unitIds.includes(s.unitId)).map(s => s.id);
      const attended = records.filter(r => r.studentId === sid && sessIds.includes(r.sessionId)).length;
      const tot = sessIds.length;
      const pct = tot ? Math.round((attended / tot) * 100) : 100;
      const risk = pct >= 75 ? 'Good' : pct >= 50 ? 'At Risk' : 'Critical';
      return { id: sid, name: su?.name ?? sid, attended, total: tot, pct, risk };
    });
  })();

  const scrollPadBottom = spacing.lg + Math.max(insets.bottom, 12) + 56;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <GreenHeader title="Reports" centered />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: scrollPadBottom, gap: 14 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Chip label="All" active={selectedUnit === 'all'} onPress={() => setSelectedUnit('all')} />
          {units.map(u => (
            <Chip key={u.id} label={u.code} active={selectedUnit === u.id} onPress={() => setSelectedUnit(u.id)} />
          ))}
        </View>

        <Card>
          <Text style={{ fontWeight: '700' }}>Per-session attendance</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 12, height: 120 }}>
            {filteredSessions.slice(0, 10).reverse().map(s => {
              const c = records.filter(r => r.sessionId === s.id).length;
              const h = (c / maxBar) * 100;
              const u = units.find(x => x.id === s.unitId);
              const threshold = (u?.enrolledStudentIds.length ?? 1) * 0.5;
              const low = c < threshold;
              return (
                <View key={s.id} style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ backgroundColor: low ? colors.red : colors.green, width: 16, height: `${Math.max(h, 4)}%`, borderRadius: 4 }} />
                  <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 4 }}>{s.unitCode.replace('ECS ', '')}</Text>
                </View>
              );
            })}
            {filteredSessions.length === 0 && <Body muted>No ended sessions yet.</Body>}
          </View>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700' }}>Present vs Absent</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 12 }}>
            <Donut percent={totalSlots ? totalPresent / totalSlots : 0} />
            <View style={{ gap: 8 }}>
              <LegendDot color={colors.green} label={`Present  ${totalPresent}`} />
              <LegendDot color={colors.red} label={`Absent  ${Math.max(totalSlots - totalPresent, 0)}`} />
            </View>
          </View>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Students</Text>
          {studentStats.map(s => (
            <View key={s.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600' }}>{s.name}</Text>
                <Body muted>{s.id} • {s.attended}/{s.total} • {s.pct}%</Body>
              </View>
              <Pill
                label={s.risk}
                tone={s.risk === 'Good' ? 'success' : s.risk === 'At Risk' ? 'warn' : 'danger'}
              />
            </View>
          ))}
        </Card>

        <Button
          title="Export All (CSV)"
          style={{ backgroundColor: colors.gold, borderColor: colors.gold }}
          onPress={() =>
            shareCsv(
              'Attendance report',
              buildOverviewCsv({ units, sessions: filteredSessions, records }),
            )
          }
        />

        <Text style={{ fontWeight: '700', marginTop: 8 }}>Session reports</Text>
        {filteredSessions.map(s => (
          <Card key={s.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>{s.unitName}</Text>
                <Body muted>{s.unitCode} • {new Date(s.endedAt!).toLocaleString()}</Body>
              </View>
              <Button
                title="Open"
                variant="outline"
                style={{ height: 40, paddingHorizontal: 14 }}
                onPress={() => router.push({ pathname: '/(lecturer)/report/[id]', params: { id: s.id } })}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({ label, active, onPress }: any) {
  return (
    <Text
      onPress={onPress}
      style={{
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
        backgroundColor: active ? colors.gold : colors.bgSubtle,
        color: active ? '#fff' : colors.text, fontWeight: '600', overflow: 'hidden',
      }}
    >
      {label}
    </Text>
  );
}

function LegendDot({ color, label }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
      <Text style={{ fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function Donut({ percent }: { percent: number }) {
  const size = 100;
  const r = size / 2 - 10;
  const p = Math.round(percent * 100);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 10, borderColor: colors.red, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <View style={{
        position: 'absolute', top: -5, left: -5, width: size, height: size, borderRadius: size / 2,
        borderWidth: 10, borderColor: colors.green,
        borderRightColor: percent > 0.25 ? colors.green : 'transparent',
        borderBottomColor: percent > 0.5 ? colors.green : 'transparent',
        borderLeftColor: percent > 0.75 ? colors.green : 'transparent',
        transform: [{ rotate: `${percent * 360}deg` }],
      }} />
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.green }}>{p}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
});
