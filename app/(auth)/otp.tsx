import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/UI';
import { TopBar } from '../../src/components/TopBar';
import { colors, spacing } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { ensureProfileForSession } from '../../src/lib/auth-helpers';
import { OTP_CODE_LENGTH } from '../../src/lib/auth-constants';
import { markPermissionOnboardingComplete } from '../../src/lib/onboarding-keys';
import { useAuth } from '../../src/store';
import { formatAuthErrorForDisplay, shouldCountOtpFailedAttempt } from '../../src/lib/auth-errors';

const emptyDigits = () => Array.from({ length: OTP_CODE_LENGTH }, () => '');

export default function OtpEntry() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { signIn } = useAuth();
  const [digits, setDigits] = useState(emptyDigits);
  const [err, setErr] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [left, setLeft] = useState(600);
  const [loading, setLoading] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const t = setInterval(() => setLeft(n => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => refs.current[0]?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  const onChange = (i: number, v: string) => {
    const c = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = c;
    setDigits(next);
    if (c && i < OTP_CODE_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const verify = async () => {
    const code = digits.join('');
    if (code.length < OTP_CODE_LENGTH) return setErr(`Enter all ${OTP_CODE_LENGTH} digits.`);
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
        const countThisFailure = !error || shouldCountOtpFailedAttempt(error);
        let nextAttempts = attempts;
        if (countThisFailure) {
          nextAttempts = attempts + 1;
          setAttempts(nextAttempts);
          if (nextAttempts >= 3) return router.replace('/(auth)/locked');
        }
        if (error) {
          setErr(formatAuthErrorForDisplay(error));
          return;
        }
        setErr(
          `Incorrect code. ${3 - nextAttempts} attempt${3 - nextAttempts === 1 ? '' : 's'} left.`,
        );
        return;
      }

      const sessionEmail = (data.user.email ?? email).trim().toLowerCase();
      const profile = await ensureProfileForSession(sessionEmail, data.user.id);
      await signIn(profile);
      await markPermissionOnboardingComplete();
      router.replace(profile.role === 'lecturer' ? '/(lecturer)/dashboard' : '/(student)/dashboard');
    } catch (e: any) {
      setErr(formatAuthErrorForDisplay(e));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) return;
    setErr('');
    setLeft(600);
    const { error } = await supabase.auth.signInWithOtp({
      email: String(email),
      options: { shouldCreateUser: true },
    });
    if (error) setErr(formatAuthErrorForDisplay(error));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['bottom']}>
      <TopBar title="Verify Your Identity" tone="green" back />
      <View style={{ flex: 1, padding: spacing.xl, gap: spacing.md }}>
        <Text style={styles.sub}>
          Enter the {OTP_CODE_LENGTH}-digit code sent to {email ?? 'your email'}.
        </Text>
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
  row: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginVertical: 12 },
  box: {
    width: 38,
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.green,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.white,
  },
});
