import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Body } from './UI';
import { repo } from '../data/repo';
import type { Course } from '../data/types';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../store';

/**
 * Blocks the student app until a degree course is chosen (profiles.course_id).
 */
export function StudentCourseGate({ children }: { children: React.ReactNode }) {
  const { user, signIn } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [err, setErr] = useState('');

  const needsCourse = user?.role === 'student' && !user.courseId;

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
      await repo.updateStudentCourse(user.id, c.id, c.name);
      const next = await repo.fetchProfileById(user.id);
      if (next) await signIn(next);
    } catch (e: any) {
      setErr(e?.message ?? 'Could not save. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {children}
      <Modal visible={needsCourse} animationType="fade" transparent onRequestClose={() => {}}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Select your degree course</Text>
            <Body muted style={styles.sub}>
              This is required once. You will see classes and attendance for your programme only.
            </Body>
            <TextInput
              placeholder="Search e.g. Computer, Civil…"
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
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    maxHeight: '88%',
  },
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
  },
  list: { maxHeight: 360 },
  row: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowText: { fontSize: 16, fontWeight: '600', color: colors.text },
  err: { color: colors.red, textAlign: 'center', marginBottom: 8, fontSize: 13 },
});
