import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GreenHeader } from '../../src/components/GreenHeader';
import { Body, Button, Caption, Pill } from '../../src/components/UI';
import { colors, radius, shadows, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { AttendanceRecord, ClassUnit, Session, User } from '../../src/data/types';
import { useAuth } from '../../src/store';

export default function Active() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [unit, setUnit] = useState<ClassUnit | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [left, setLeft] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const sessions = await repo.getSessions();
      const live = sessions.find(s => s.lecturerId === user.id && s.status === 'live') || null;
      setSession(live);
      if (live) {
        const [units, recs, allUsers] = await Promise.all([
          repo.getUnits(),
          repo.getAttendanceForSession(live.id),
          repo.getUsers(),
        ]);
        const u = units.find(x => x.id === live.unitId) || null;
        setUnit(u);
        setRecords(recs);
        if (u?.courseId) {
          const roster = await repo.getStudentsForCourse(u.courseId);
          setUsers(
            roster.length > 0
              ? roster
              : allUsers.filter(x => u.enrolledStudentIds.includes(x.id) && x.role === 'student'),
          );
        } else if (u) {
          setUsers(allUsers.filter(x => u.enrolledStudentIds.includes(x.id) && x.role === 'student'));
        } else {
          setUsers([]);
        }
        setLeft(Math.max(0, Math.floor((new Date(live.endsAt).getTime() - Date.now()) / 1000)));
      }
    } catch {}
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    const t = setInterval(() => { load(); }, 3000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => {
    const t = setInterval(() => setLeft(n => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  if (!session || !unit) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
        <GreenHeader title="Active Session" centered />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, paddingBottom: spacing.xl + insets.bottom }}>
          <View style={styles.emptyIcon}>
            <Ionicons name="radio-outline" size={56} color={colors.textSubtle} />
          </View>
          <Text style={styles.emptyTitle}>No live session</Text>
          <Body muted style={{ textAlign: 'center', marginTop: spacing.xs }}>
            Start a session from the Home tab to begin collecting attendance.
          </Body>
          <Button title="Go Home" variant="outline" onPress={() => router.push('/(lecturer)/dashboard')} style={{ marginTop: spacing.lg, minWidth: 200 }} />
        </View>
      </View>
    );
  }

  const rows = users.map(stu => {
    const rec = records.find(r => r.studentId === stu.id);
    return { id: stu.id, name: stu.name, record: rec };
  }).sort((a, b) => {
    // signed-in first, then alphabetical
    const aSigned = a.record ? 1 : 0;
    const bSigned = b.record ? 1 : 0;
    if (aSigned !== bSigned) return bSigned - aSigned;
    return a.name.localeCompare(b.name);
  });
  const m = Math.floor(left / 60).toString().padStart(2, '0');
  const s = (left % 60).toString().padStart(2, '0');
  const pct = rows.length ? Math.round((records.length / rows.length) * 100) : 0;

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const footerReserve = spacing.lg * 2 + 56 + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <GreenHeader compact>
        <View>
          <Caption style={{ color: 'rgba(255,255,255,0.85)' }}>LIVE SESSION</Caption>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <View style={styles.livePulseWrap}>
              <Animated.View
                style={[
                  styles.livePulseRing,
                  { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                ]}
              />
              <View style={styles.liveDot} />
            </View>
            <Text style={styles.liveTitle}>{unit.code} · {unit.name}</Text>
          </View>
          <Text style={styles.liveRoom}>{unit.room} · Ends in {m}:{s}</Text>
        </View>
      </GreenHeader>

      <View style={[styles.statCard, shadows.md]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Caption>SIGNED IN</Caption>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <Text style={styles.statBig}>{records.length}</Text>
              <Text style={styles.statOf}>/ {rows.length}</Text>
            </View>
            <Body muted style={{ fontSize: 13, marginTop: 2 }}>{pct}% attendance so far</Body>
          </View>
          <View style={[styles.miniRing, { borderColor: pct >= 50 ? colors.green : colors.gold }]}>
            <Text style={[styles.miniRingText, { color: pct >= 50 ? colors.green : colors.gold }]}>{pct}%</Text>
          </View>
        </View>
        <View style={styles.progress}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={r => r.id}
        contentContainerStyle={{ paddingBottom: footerReserve, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: 8 }}
        ListHeaderComponent={<Caption style={{ marginBottom: 4, marginLeft: 4 }}>STUDENTS ({rows.length})</Caption>}
        ListEmptyComponent={
          <Body muted style={{ textAlign: 'center', marginTop: spacing.xl }}>
            No students enrolled in this class yet.
          </Body>
        }
        renderItem={({ item }) => {
          const signed = !!item.record;
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/(lecturer)/student/[id]', params: { id: item.id, sid: session.id } })}
              style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: signed ? colors.greenLight : colors.bgSubtle }]}>
                <Text style={{ fontWeight: '800', color: signed ? colors.green : colors.textMuted }}>
                  {item.name[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Body muted style={{ fontSize: 12 }}>{item.id}</Body>
              </View>
              {signed ? (
                <Pill
                  label={new Date(item.record!.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  tone="success"
                />
              ) : (
                <Pill label="waiting" tone="neutral" />
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
            </Pressable>
          );
        }}
      />

      <View style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}>
        <Button title="End Session" variant="danger" onPress={() => router.push('/(lecturer)/end')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 12 },
  livePulseWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  livePulseRing: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: colors.gold },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  liveTitle: { color: colors.white, fontSize: 18, fontWeight: '800', letterSpacing: -0.1 },
  liveRoom: { color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '600', marginTop: 4 },
  statCard: {
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  statBig: { fontSize: 38, fontWeight: '800', color: colors.green, letterSpacing: -0.8 },
  statOf: { fontSize: 18, color: colors.textMuted, fontWeight: '700' },
  miniRing: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white,
  },
  miniRingText: { fontWeight: '800', fontSize: 14 },
  progress: { height: 6, backgroundColor: colors.bgSubtle, borderRadius: radius.pill, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: radius.pill, backgroundColor: colors.green },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    ...shadows.xs,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontWeight: '700', fontSize: 14, color: colors.text },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.lg, backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
});
