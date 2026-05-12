import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { GreenHeader } from '../../src/components/GreenHeader';
import { Body, Button, Card, Caption, Pill } from '../../src/components/UI';
import { colors, radius, shadows, spacing } from '../../src/theme';
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
    return studentIds
      .map(sid => {
        const su = users.find(x => x.id === sid);
        const sessIds = filteredSessions.filter(s => unitIds.includes(s.unitId)).map(s => s.id);
        const attended = records.filter(r => r.studentId === sid && sessIds.includes(r.sessionId)).length;
        const tot = sessIds.length;
        const pct = tot ? Math.round((attended / tot) * 100) : 0;
        const risk: 'Good' | 'At Risk' | 'Critical' | 'No data' =
          tot === 0 ? 'No data' : pct >= 75 ? 'Good' : pct >= 50 ? 'At Risk' : 'Critical';
        return { id: sid, name: su?.name ?? sid, attended, total: tot, pct, risk };
      })
      .sort((a, b) => {
        // Critical first, then At Risk, then Good, then No data; within group by lowest pct
        const order = { Critical: 0, 'At Risk': 1, Good: 2, 'No data': 3 } as const;
        if (order[a.risk] !== order[b.risk]) return order[a.risk] - order[b.risk];
        return a.pct - b.pct;
      });
  })();

  const scrollPadBottom = spacing.lg + Math.max(insets.bottom, 12) + 56;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <GreenHeader title="Reports" centered />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: scrollPadBottom, gap: 14 }}>
        <Caption style={{ marginBottom: -6 }}>FILTER BY CLASS</Caption>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          <Chip
            icon="apps"
            label="All classes"
            sub={`${units.length} ${units.length === 1 ? 'class' : 'classes'}`}
            active={selectedUnit === 'all'}
            onPress={() => setSelectedUnit('all')}
          />
          {units.map(u => (
            <Chip
              key={u.id}
              icon="book"
              label={u.code}
              sub={u.name}
              active={selectedUnit === u.id}
              onPress={() => setSelectedUnit(u.id)}
            />
          ))}
        </ScrollView>

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
          {studentStats.length === 0 ? (
            <Body muted>No students enrolled for this filter.</Body>
          ) : (
            studentStats.map(s => (
              <View key={s.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600' }} numberOfLines={1}>{s.name}</Text>
                  <Body muted>
                    {s.id} • {s.total === 0 ? 'no sessions yet' : `${s.attended}/${s.total} · ${s.pct}%`}
                  </Body>
                </View>
                <Pill
                  label={s.risk}
                  tone={
                    s.risk === 'Good'
                      ? 'success'
                      : s.risk === 'At Risk'
                        ? 'warn'
                        : s.risk === 'Critical'
                          ? 'danger'
                          : 'neutral'
                  }
                />
              </View>
            ))
          )}
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

function Chip({
  label,
  sub,
  icon,
  active,
  onPress,
}: {
  label: string;
  sub?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        !active && shadows.xs,
        { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={active ? colors.white : colors.green}
          style={{ marginRight: 6 }}
        />
      ) : null}
      <View>
        <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
        {sub ? (
          <Text style={[styles.chipSub, active && styles.chipSubActive]} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
    </Pressable>
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
  const size = 110;
  const stroke = 12;
  const p = Math.max(0, Math.min(1, percent));
  const pct = Math.round(p * 100);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.red}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Foreground arc — rotate -90° to start at 12 o'clock */}
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.green}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c * p} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{ position: 'absolute', fontSize: 20, fontWeight: '800', color: colors.green }}>
        {pct}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 110,
  },
  chipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  chipLabel: { fontWeight: '800', fontSize: 13, color: colors.text, letterSpacing: 0.2 },
  chipLabelActive: { color: colors.white },
  chipSub: { fontSize: 11, color: colors.textMuted, marginTop: 1, maxWidth: 160 },
  chipSubActive: { color: 'rgba(255,255,255,0.85)' },
});
