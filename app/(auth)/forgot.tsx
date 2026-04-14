import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Input } from '../../src/components/UI';
import { TopBar } from '../../src/components/TopBar';
import { colors, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { supabase } from '../../src/lib/supabase';

export default function Forgot() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onSend = async () => {
    setErr('');
    setLoading(true);
    try {
      const u = await repo.getUserById(id.trim());
      if (!u) { setErr('No account found with that ID.'); return; }
      const { error } = await supabase.auth.signInWithOtp({ email: u.email });
      if (error) { setErr(error.message); return; }
      router.push({ pathname: '/(auth)/otp', params: { userId: u.id, mode: 'reset' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['bottom']}>
      <TopBar title="Reset Your Password" tone="green" back />
      <View style={{ flex: 1, padding: spacing.xl, gap: spacing.md }}>
        <Body muted>Enter your Student or Staff ID. We'll email you a 6-digit reset code.</Body>
        <Text style={styles.label}>Student / Staff ID</Text>
        <Input placeholder="e.g. S001" autoCapitalize="characters" value={id} onChangeText={setId} />
        {err ? <Text style={{ color: colors.red }}>{err}</Text> : null}
        <View style={{ height: 8 }} />
        <Button title="Send Reset Code" onPress={onSend} loading={loading} />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ label: { fontWeight: '600', color: colors.text } });
