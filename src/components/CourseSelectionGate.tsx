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
import { Body } from './UI';
import { repo } from '../data/repo';
import type { Course } from '../data/types';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../store';

const COPY = {
  student: {
    title: 'Select your degree course',
    sub: 'Required once. You will only see classes and attendance for your programme.',
    searchPh: 'Search e.g. Computer, Civil…',
  },
  lecturer: {
    title: 'Select your programme',
    sub: 'Choose the degree programme you teach. Live rosters and defaults use students in this programme.',
    searchPh: 'Search e.g. Computer, Civil…',
  },
} as const;

type Variant = keyof typeof COPY;

/**
 * Blocks the app until profiles.course_id is set (full screen — avoids Modal stacking issues on Android).
 */
export function CourseSelectionGate({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  const { user, signIn } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [err, setErr] = useState('');

  const roleOk =
    variant === 'student' ? user?.role === 'student' : user?.role === 'lecturer';
  const needsCourse = Boolean(user && roleOk && !user.courseId);

  /** If DB was updated elsewhere (or after migration), pick up course_id without forcing a false gate. */
  useEffect(() => {
    if (!user?.id || user.courseId) return;
    let cancelled = false;
    (async () => {
      try {
        const fresh = await repo.fetchProfileById(user.id);
        if (cancelled || !fresh?.courseId) return;
        await signIn(fresh);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
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
      setErr(e instanceof Error ? e.message : 'Could not save. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!needsCourse) return <>{children}</>;

  const t = COPY[variant];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.sheet}>
        <Text style={styles.title}>{t.title}</Text>
        <Body muted style={styles.sub}>
          {t.sub}
        </Body>
        <TextInput
          placeholder={t.searchPh}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {listLoading ? (
          <ActivityIndicator style={{ marginVertical: 24 }} color={colors.green} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                disabled={loading}
                style={({ pressed }) => [styles.row, (pressed || loading) && { opacity: 0.75 }]}
              >
                <Text style={styles.rowText}>{item.name}</Text>
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
          <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 8 }}>Saving…</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgCanvas, padding: spacing.lg },
  sheet: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.md, lineHeight: 20 },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  list: { flex: 1 },
  row: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  rowText: { fontSize: 16, fontWeight: '600', color: colors.text },
  err: { color: colors.red, textAlign: 'center', marginBottom: 8, fontSize: 13 },
});
