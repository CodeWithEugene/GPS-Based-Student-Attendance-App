import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../src/components/Avatar';
import { GreenHeader } from '../../src/components/GreenHeader';
import { Body, Card, Pill } from '../../src/components/UI';
import { colors, radius, shadows, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { AttendanceRecord, ClassUnit, Session } from '../../src/data/types';
import { useAuth } from '../../src/store';

export default function StudentDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [units, setUnits] = useState<ClassUnit[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const [u, s, r] = await Promise.all([
        repo.getUnitsForStudent(user.id),
        repo.getSessions(),
        repo.getAttendanceForStudent(user.id),
      ]);
      setUnits(u);
      setSessions(s);
      setRecords(r);
    } catch {}
    finally { setRefreshing(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const pct = records.length === 0 ? 0 : Math.round((records.filter(r => r.status !== 'absent').length / Math.max(records.length, 1)) * 100);

  const statusOf = (u: ClassUnit): { label: string; tone: any } => {
    const live = sessions.find(s => s.unitId === u.id && s.status === 'live');
    if (live) return { label: 'Live now', tone: 'success' };
    const ended = sessions.find(s => s.unitId === u.id && s.status === 'ended');
    if (ended) return { label: 'Ended', tone: 'danger' };
    return { label: 'Upcoming', tone: 'neutral' };
  };

  if (!user) return null;
  const listPadBottom = spacing.lg + Math.max(insets.bottom, 12) + 56;
  const firstName = user.name.split(' ')[0];
  const riskTone = pct >= 75 ? colors.green : pct >= 50 ? colors.gold : colors.red;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <GreenHeader>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{firstName} 👋</Text>
            <Text style={styles.role}>Student · {user.programme ?? 'JKUAT'}</Text>
          </View>
          <Pressable
            hitSlop={8}
            onPress={() => router.push('/(student)/profile')}
          >
            <Avatar uri={user.avatarUrl} name={firstName} size={44} ring tone="white" />
            <View style={styles.dot} />
          </Pressable>
        </View>
      </GreenHeader>

      <FlatList
        data={units}
        keyExtractor={u => u.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.green} />}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: listPadBottom, gap: spacing.md }}
        ListHeaderComponent={
          <View style={styles.heroStat}>
            <View style={[styles.statCard, shadows.md]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statLabel}>ATTENDANCE RATE</Text>
                  <Text style={[styles.statValue, { color: riskTone }]}>{pct}%</Text>
                  <Text style={styles.statSub}>{records.length} session{records.length === 1 ? '' : 's'} logged this term</Text>
                </View>
                <View style={[styles.ringOuter, { backgroundColor: `${riskTone}15` }]}>
                  <View style={[styles.ringInner, { borderColor: riskTone }]}>
                    <Ionicons name="checkmark" size={24} color={riskTone} />
                  </View>
                </View>
              </View>
              <View style={styles.progress}>
                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: riskTone }]} />
              </View>
            </View>
            <Text style={styles.sectionLabel}>TODAY'S CLASSES</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState onView={() => router.push('/(student)/history')} />}
        renderItem={({ item }) => {
          const st = statusOf(item);
          const live = sessions.find(s => s.unitId === item.id && s.status === 'live');
          return (
            <Pressable
              onPress={() => live && router.push({ pathname: '/(student)/notification', params: { sessionId: live.id } })}
            >
              <Card style={{ padding: spacing.lg }}>
                <View style={styles.classTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.className} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                    <Body muted style={{ marginTop: 2 }}>{item.code} · {item.room}</Body>
                    <Body muted style={{ fontSize: 13 }}>{item.schedule.start}–{item.schedule.end} · {item.lecturerName}</Body>
                  </View>
                  <Pill label={st.label} tone={st.tone} />
                </View>
                {live && (
                  <Pressable
                    onPress={() => router.push({ pathname: '/(student)/sign', params: { sessionId: live.id } })}
                    style={({ pressed }) => [
                      styles.cta,
                      shadows.button,
                      { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                    ]}
                  >
                    <Ionicons name="location" size={18} color="#fff" />
                    <Text style={styles.ctaText}>Sign attendance now</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </Pressable>
                )}
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function EmptyState({ onView }: { onView: () => void }) {
  return (
    <View style={{ alignItems: 'center', padding: spacing.xl, paddingTop: spacing.xxxl }}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-outline" size={56} color={colors.green} />
      </View>
      <Text style={styles.emptyTitle}>No classes today</Text>
      <Body muted style={{ marginTop: 4 }}>Enjoy your free time!</Body>
      <Pressable onPress={onView} style={styles.emptyBtn}>
        <Text style={{ color: colors.green, fontWeight: '700' }}>View full timetable</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  name: { color: colors.white, fontSize: 24, fontWeight: '800', marginTop: 2, letterSpacing: -0.2 },
  role: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  dot: { position: 'absolute', top: -2, right: -2, width: 11, height: 11, borderRadius: 6, backgroundColor: colors.gold, borderWidth: 2, borderColor: colors.green },
  heroStat: { marginTop: spacing.md, gap: spacing.lg, paddingTop: 0 },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  statLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8 },
  statValue: { fontSize: 40, fontWeight: '800', marginTop: spacing.xs, letterSpacing: -1 },
  statSub: { fontSize: 13, color: colors.textMuted, marginTop: 2, fontWeight: '500' },
  ringOuter: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  progress: { height: 8, backgroundColor: colors.bgSubtle, borderRadius: radius.pill, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: radius.pill },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8, marginTop: spacing.sm, marginLeft: 4 },
  classTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  className: { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: -0.1 },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.red,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: spacing.lg },
  emptyBtn: { marginTop: spacing.lg, paddingVertical: 12, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.green },
});
