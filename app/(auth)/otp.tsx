import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/UI';
import { TopBar } from '../../src/components/TopBar';
import { colors, spacing } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { ensureProfileForSession } from '../../src/lib/auth-helpers';
import { useAuth } from '../../src/store';

export default function OtpEntry() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { signIn } = useAuth();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [err, setErr] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [left, setLeft] = useState(600);
  const [loading, setLoading] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const t = setInterval(() => setLeft(n => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const onChange = (i: number, v: string) => {
    const c = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = c;
    setDigits(next);
    if (c && i < 5) refs.current[i + 1]?.focus();
  };

  const verify = async () => {
    const code = digits.join('');
    if (code.length < 6) return setErr('Enter all 6 digits.');
    if (!email) return setErr('Missing email. Go back and re-enter it.');
    setErr('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: String(email),
        token: code,
        type: 'email',
      });

      if (error || !data.session || !data.user) {
        const a = attempts + 1;
        setAttempts(a);
        if (a >= 3) return router.replace('/(auth)/locked');
        setErr(`Incorrect code. ${3 - a} attempt${3 - a === 1 ? '' : 's'} left.`);
        return;
      }

      const profile = await ensureProfileForSession(String(email), data.user.id);
      await signIn(profile);
      router.replace(profile.role === 'lecturer' ? '/(lecturer)/dashboard' : '/(student)/dashboard');
    } catch (e: any) {
      setErr(e?.message ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) return;
    setErr('');
    setLeft(600);
    await supabase.auth.signInWithOtp({ email: String(email) });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['bottom']}>
      <TopBar title="Verify Your Identity" tone="green" back />
      <View style={{ flex: 1, padding: spacing.xl, gap: spacing.md }}>
        <Text style={styles.sub}>Enter the 6-digit code sent to {email ?? 'your email'}.</Text>
        <View style={styles.row}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={r => { refs.current[i] = r; }}
              value={d}
              onChangeText={v => onChange(i, v)}
              onKeyPress={e => {
                if (e.nativeEvent.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus();
              }}
              keyboardType="number-pad"
              maxLength={1}
              style={styles.box}
            />
          ))}
        </View>
        <Text style={{ color: colors.gold, textAlign: 'center', fontWeight: '600' }}>
          Code expires in {Math.floor(left / 60)}:{(left % 60).toString().padStart(2, '0')}
        </Text>
        {err ? <Text style={{ color: colors.red, textAlign: 'center' }}>{err}</Text> : null}
        <Button title="Verify" onPress={verify} loading={loading} />
        <Pressable onPress={resend}>
          <Text style={{ color: colors.green, textAlign: 'center', fontWeight: '600' }}>Resend Code</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.textMuted, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  box: {
    width: 48, height: 56, borderWidth: 1.5, borderColor: colors.green, borderRadius: 10,
    textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.text, backgroundColor: colors.white,
  },
});
