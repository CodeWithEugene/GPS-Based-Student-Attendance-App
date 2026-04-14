import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Caption } from './UI';
import { GreenHeader } from './GreenHeader';
import { repo } from '../data/repo';
import type { Course } from '../data/types';
import { formatAuthErrorForDisplay } from '../lib/auth-errors';
import { colors, radius, shadows, spacing } from '../theme';
import { useAuth } from '../store';

const COPY = {
  student: {
    title: 'Pick your degree',
    sub: 'One-time setup. We use this to show only your programme\'s classes.',
    searchPh: 'Search e.g. Computer, Civil…',
  },
  lecturer: {
    title: 'Choose a programme',
    sub: 'Which programme do you teach? Live rosters use students in this programme.',
    searchPh: 'Search e.g. Computer, Civil…',
  },
} as const;

type Variant = keyof typeof COPY;

/**
 * Blocks the app until the user picks a degree programme (students) or a teaching programme (lecturers).
 * Lecturers may be allowed to skip (optional course link); students must select.
 */
export function CourseSelectionGate({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  const { user, signIn } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [err, setErr] = useState('');

  const roleOk = variant === 'student' ? user?.role === 'student' : user?.role === 'lecturer';
  const needsCourse = Boolean(user && roleOk && !user.courseId);

  useEffect(() => {
    if (!user?.id || user.courseId) return;
    let cancelled = false;
    (async () => {
      try {
        const fresh = await repo.fetchProfileById(user.id);
        if (cancelled || !fresh?.courseId) return;
        await signIn(fresh);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user?.id, user?.courseId, signIn]);

  const loadCourses = useCallback(async () => {
    setListLoading(true);
    try {
      setCourses(await repo.getCourses());
    } catch {
      setCourses([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (needsCourse) loadCourses();
  }, [needsCourse, loadCourses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(c => c.name.toLowerCase().includes(q));
  }, [courses, query]);

  const onSelect = async (c: Course) => {
    if (!user) return;
    setErr('');
    setLoading(true);
    try {
      await repo.updateUserCourse(user.id, c.id, c.name);
      const next = await repo.fetchProfileById(user.id);
      if (next) await signIn(next);
    } catch (e: unknown) {
      setErr(formatAuthErrorForDisplay(e));
    } finally {
      setLoading(false);
    }
  };

  if (!needsCourse) return <>{children}</>;

  const t = COPY[variant];

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <GreenHeader title={t.title} centered compact />
      <View style={styles.body}>
        <View style={styles.heroIcon}>
          <Ionicons name="school" size={36} color={colors.green} />
        </View>
        <Text style={styles.title}>{t.title}</Text>
        <Body muted style={styles.sub}>{t.sub}</Body>

        <View style={[styles.searchWrap, shadows.xs]}>
          <Ionicons name="search" size={18} color={colors.textSubtle} />
          <TextInput
            placeholder={t.searchPh}
            placeholderTextColor={colors.textSubtle}
            value={query}
            onChangeText={setQuery}
            style={styles.search}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <Caption style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
          PROGRAMMES
        </Caption>

        {listLoading ? (
          <ActivityIndicator style={{ marginVertical: 24 }} color={colors.green} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={{ paddingBottom: spacing.xl, gap: 8 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                disabled={loading}
                style={({ pressed }) => [
                  styles.row,
                  shadows.xs,
                  (pressed || loading) && { opacity: 0.75, transform: [{ scale: 0.99 }] },
                ]}
              >
                <View style={styles.rowIcon}>
                  <Ionicons name="ribbon" size={18} color={colors.green} />
                </View>
                <Text style={styles.rowText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Pressable>
            )}
            ListEmptyComponent={
              <Body muted style={{ textAlign: 'center', padding: spacing.lg }}>
                No courses match your search.
              </Body>
            }
          />
        )}
        {loading ? (
          <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 8, fontWeight: '600' }}>Saving…</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgCanvas },
  body: { flex: 1, padding: spacing.lg },
  heroIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.greenLight,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: spacing.md,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: spacing.md, letterSpacing: -0.2 },
  sub: { textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 20, paddingHorizontal: spacing.md },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    backgroundColor: colors.white, height: 50,
  },
  search: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  list: { flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
  },
  rowIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  err: { color: colors.red, textAlign: 'center', marginTop: 8, fontSize: 13, fontWeight: '600' },
});
