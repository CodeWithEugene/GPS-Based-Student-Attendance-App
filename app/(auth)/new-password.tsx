import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../../src/components/UI';
import { TopBar } from '../../src/components/TopBar';
import { colors, spacing } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';

function strength(p: string): { label: string; color: string; fill: number } {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { label: 'Weak', color: colors.red, fill: 0.33 };
  if (score === 2 || score === 3) return { label: 'Medium', color: colors.gold, fill: 0.66 };
  return { label: 'Strong', color: colors.green, fill: 1 };
}

export default function NewPassword() {
  const router = useRouter();
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const s = strength(p1);

  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (p1.length < 8) return setErr('Password must be at least 8 characters.');
    if (p1 !== p2) return setErr('Passwords do not match.');
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setSaving(false);
    if (error) return setErr(error.message);
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['bottom']}>
      <TopBar title="Set New Password" tone="green" back />
      <View style={{ flex: 1, padding: spacing.xl, gap: spacing.md }}>
        <Text style={styles.label}>New password</Text>
        <View>
          <Input secureTextEntry={!show} value={p1} onChangeText={setP1} placeholder="At least 8 characters" />
          <Pressable style={styles.eye} onPress={() => setShow(v => !v)}>
            <Ionicons name={show ? 'eye-off' : 'eye'} size={22} color={colors.textMuted} />
          </Pressable>
        </View>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${s.fill * 100}%`, backgroundColor: s.color }]} />
        </View>
        <Text style={{ color: s.color, fontWeight: '600' }}>{p1 ? s.label : ' '}</Text>
        <Text style={styles.label}>Confirm password</Text>
        <View>
          <Input secureTextEntry={!show} value={p2} onChangeText={setP2} placeholder="Re-enter password" />
        </View>
        {err ? <Text style={{ color: colors.red }}>{err}</Text> : null}
        <View style={{ height: 8 }} />
        <Button title="Save New Password" onPress={save} loading={saving} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', color: colors.text },
  eye: { position: 'absolute', right: 14, top: 14 },
  bar: { height: 6, backgroundColor: '#EEE', borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
