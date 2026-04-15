import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../src/components/Avatar';
import { GreenHeader } from '../../src/components/GreenHeader';
import { Body, Button, Caption, Pill } from '../../src/components/UI';
import { colors, radius, shadows, spacing } from '../../src/theme';
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
      courseList.forEach(c => { m[c.id] = c.name; });
      setCourseLabel(m);
    } catch {}
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!user) return null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const liveCount = sessions.filter(s => s.status === 'live' && units.some(u => u.id === s.unitId)).length;
  const endedToday = sessions.filter(s => {
    if (s.status !== 'ended' || !s.endedAt) return false;
    return units.some(u => u.id === s.unitId) && new Date(s.endedAt).toDateString() === new Date().toDateString();
  }).length;

  const listPadBottom = spacing.lg + Math.max(insets.bottom, 12) + 56;
  const firstName = user.name.split(' ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <GreenHeader>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.role}>Lecturer · {user.department ?? 'JKUAT'}</Text>
          </View>
          <Pressable onPress={() => router.push('/(lecturer)/profile')} hitSlop={8}>
            <Avatar uri={user.avatarUrl} name={firstName} size={44} ring tone="white" />
          </Pressable>
        </View>
      </GreenHeader>

      {/* Overlapping stat cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, shadows.md]}>
          <View style={[styles.statIcon, { backgroundColor: colors.goldLight }]}>
            <Ionicons name="radio" size={18} color={colors.gold} />
          </View>
          <Text style={styles.statNum}>{liveCount}</Text>
          <Caption>LIVE NOW</Caption>
        </View>
        <View style={[styles.statCard, shadows.md]}>
          <View style={[styles.statIcon, { backgroundColor: colors.greenLight }]}>
            <Ionicons name="school" size={18} color={colors.green} />
          </View>
          <Text style={styles.statNum}>{units.length}</Text>
          <Caption>CLASSES</Caption>
        </View>
        <View style={[styles.statCard, shadows.md]}>
          <View style={[styles.statIcon, { backgroundColor: '#E8F0FE' }]}>
            <Ionicons name="checkmark-done" size={18} color="#1A56DB" />
          </View>
          <Text style={styles.statNum}>{endedToday}</Text>
          <Caption>TODAY</Caption>
        </View>
      </View>

      {units.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={56} color={colors.green} />
          </View>
          <Text style={styles.emptyTitle}>No classes yet</Text>
          <Body muted style={{ textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl }}>
            Add your first class to start collecting attendance.
          </Body>
          <Button
            title="Add class"
            variant="secondary"
            style={{ marginTop: spacing.lg, minWidth: 220 }}
            icon={<Ionicons name="add" size={20} color="#fff" />}
            onPress={() => router.push('/(lecturer)/create-unit')}
          />
        </View>
      ) : (
        <FlatList
          data={units}
          keyExtractor={u => u.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: listPadBottom, gap: spacing.md }}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Caption>YOUR CLASSES</Caption>
              <Pressable onPress={() => router.push('/(lecturer)/create-unit')} hitSlop={8} style={styles.addChip}>
                <Ionicons name="add" size={14} color={colors.green} />
                <Text style={{ color: colors.green, fontWeight: '800', fontSize: 12, letterSpacing: 0.3 }}>ADD CLASS</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => {
            const live = sessions.find(s => s.unitId === item.id && s.status === 'live');
            const ended = sessions.filter(s => s.unitId === item.id && s.status === 'ended').sort((a, b) => b.endedAt!.localeCompare(a.endedAt!))[0];
            const deg = courseLabel[item.courseId] ?? item.courseId ?? '—';
            return (
              <View style={[styles.classCard, shadows.md]}>
                {live && (
                  <View style={styles.liveRibbon}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={[styles.classIcon, { backgroundColor: live ? colors.goldLight : colors.greenLight }]}>
                    <Ionicons name="book" size={22} color={live ? colors.gold : colors.green} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.className} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                    <Body muted style={{ fontSize: 13 }}>{item.code} · {deg}</Body>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <Pill label={item.room} tone="neutral" size="sm" />
                      <Body muted style={{ fontSize: 12 }}>
                        {item.schedule.day} · {item.schedule.start}–{item.schedule.end}
                      </Body>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
                  {live ? (
                    <Button
                      title="Open live session"
                      variant="secondary"
                      style={{ flex: 1 }}
                      size="md"
                      icon={<Ionicons name="radio" size={16} color="#fff" />}
                      onPress={() => router.push('/(lecturer)/active')}
                    />
                  ) : (
                    <Button
                      title="Start session"
                      variant="secondary"
                      style={{ flex: 1 }}
                      size="md"
                      icon={<Ionicons name="play-circle" size={16} color="#fff" />}
                      onPress={() => router.push({ pathname: '/(lecturer)/setup', params: { unitId: item.id } })}
                    />
                  )}
                  {ended && (
                    <Button
                      title="Report"
                      variant="outline"
                      size="md"
                      onPress={() => router.push({ pathname: '/(lecturer)/report/[id]', params: { id: ended.id } })}
                    />
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  name: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 2, letterSpacing: -0.2 },
  role: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'flex-start', gap: spacing.xs,
  },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  addChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.pill, backgroundColor: colors.greenLight,
  },
  classCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  classIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  className: { fontWeight: '800', fontSize: 16, color: colors.text, letterSpacing: -0.1 },
  liveRibbon: {
    position: 'absolute', top: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.gold,
    paddingHorizontal: 10, paddingVertical: 4,
    borderBottomLeftRadius: radius.md,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  liveText: { color: colors.white, fontWeight: '800', fontSize: 10, letterSpacing: 0.8 },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginTop: spacing.lg },
});
