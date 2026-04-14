import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Input } from '../../src/components/UI';
import { TopBar } from '../../src/components/TopBar';
import { repo } from '../../src/data/repo';
import type { ClassUnit, Course } from '../../src/data/types';
import { colors, radius, spacing } from '../../src/theme';
import { useAuth } from '../../src/store';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export default function CreateUnit() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [room, setRoom] = useState('');
  const [day, setDay] = useState<(typeof DAYS)[number]>('Mon');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('11:00');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setCourses(await repo.getCourses());
    } catch {
      setCourses([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(c => c.name.toLowerCase().includes(q));
  }, [courses, query]);

  const selectedCourse = courses.find(c => c.id === courseId);

  const save = async () => {
    if (!user || user.role !== 'lecturer') return;
    if (!courseId) return Alert.alert('Course required', 'Select the degree course this class belongs to.');
    const c = code.trim();
    const n = unitName.trim();
    const r = room.trim();
    if (!c || !n || !r) return Alert.alert('Missing fields', 'Fill in unit code, name, and room.');
    setSaving(true);
    try {
      const unit: ClassUnit = {
        id: `U-${Date.now()}`,
        code: c,
        name: n,
        room: r,
        lecturerId: user.id,
        lecturerName: user.name,
        schedule: { start, end, day },
        enrolledStudentIds: [],
        geofence: { latitude: -1.0954, longitude: 37.0146, radius: 30 },
        courseId,
      };
      await repo.createUnit(unit);
      router.replace('/(lecturer)/dashboard');
    } catch (e: any) {
      Alert.alert('Could not create class', e?.message ?? 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['bottom']}>
      <TopBar title="Add class" tone="green" back />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md }}>
        <Text style={styles.label}>Degree course</Text>
        <Body muted style={{ fontSize: 13, lineHeight: 18 }}>
          Students registered in this programme will see this class on their timetable and can sign attendance when you
          start a session.
        </Body>
        <TextInput
          placeholder="Search courses…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          autoCapitalize="none"
        />
        <View style={styles.courseList}>
          {filtered.length === 0 ? (
            <Body muted>No matching courses.</Body>
          ) : (
            filtered.map(item => {
              const on = item.id === courseId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setCourseId(item.id)}
                  style={[styles.courseRow, on && styles.courseRowOn]}
                >
                  <Text style={[styles.courseText, on && styles.courseTextOn]}>{item.name}</Text>
                </Pressable>
              );
            })
          )}
        </View>
        {selectedCourse ? (
          <Text style={styles.picked}>Selected: {selectedCourse.name}</Text>
        ) : null}

        <Text style={styles.label}>Unit code</Text>
        <Input placeholder="e.g. ECS 401" value={code} onChangeText={setCode} autoCapitalize="characters" />
        <Text style={styles.label}>Class / module name</Text>
        <Input placeholder="e.g. Machine Learning" value={unitName} onChangeText={setUnitName} />
        <Text style={styles.label}>Room</Text>
        <Input placeholder="e.g. CS Lab 2" value={room} onChangeText={setRoom} />

        <Text style={styles.label}>Day</Text>
        <View style={styles.dayRow}>
          {DAYS.map(d => (
            <Pressable key={d} onPress={() => setDay(d)} style={[styles.dayChip, day === d && styles.dayChipOn]}>
              <Text style={[styles.dayText, day === d && styles.dayTextOn]}>{d}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Start</Text>
        <Input value={start} onChangeText={setStart} placeholder="09:00" />
        <Text style={styles.label}>End</Text>
        <Input value={end} onChangeText={setEnd} placeholder="11:00" />

        <Body muted style={{ fontSize: 12 }}>
          Default map location for sessions is main campus; adjust when you start a live session.
        </Body>
        <Button title="Save class" variant="secondary" loading={saving} onPress={save} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '700', fontSize: 15, color: colors.text },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  courseList: { maxHeight: 220, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
  courseRow: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  courseRowOn: { backgroundColor: colors.greenLight },
  courseText: { fontSize: 15, fontWeight: '600', color: colors.text },
  courseTextOn: { color: colors.green },
  picked: { fontSize: 14, fontWeight: '600', color: colors.green, marginTop: 4 },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  dayChipOn: { borderColor: colors.green, backgroundColor: colors.greenLight },
  dayText: { fontWeight: '600', color: colors.text },
  dayTextOn: { color: colors.green },
});
