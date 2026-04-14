import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Input } from '../../src/components/UI';
import { GoogleIcon } from '../../src/components/GoogleIcon';
import { colors, spacing } from '../../src/theme';
import { getSupabaseConfigError, supabase } from '../../src/lib/supabase';
import { isAllowedSignInEmail } from '../../src/lib/auth-helpers';
import { signInWithGoogle } from '../../src/lib/google-auth';
import { formatAuthErrorForDisplay } from '../../src/lib/auth-errors';

export default function Login() {
  const router = useRouter();
  const { oauthError } = useLocalSearchParams<{ oauthError?: string }>();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (typeof oauthError !== 'string' || !oauthError) return;
    try {
      setErr(decodeURIComponent(oauthError));
    } catch {
      setErr(oauthError);
    }
  }, [oauthError]);

  const onContinue = async () => {
    Keyboard.dismiss();
    setErr('');
    const configError = getSupabaseConfigError();
    if (configError) return setErr(configError);
    const normalized = email.trim().toLowerCase();
    if (!normalized) return setErr('Please enter your email address.');
    if (!isAllowedSignInEmail(normalized)) {
      return setErr(
        'Use your @students.jkuat.ac.ke or @jkuat.ac.ke address, or an authorized account.',
      );
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: { shouldCreateUser: true },
      });
      if (error) {
        setErr(formatAuthErrorForDisplay(error));
        return;
      }
      router.push({ pathname: '/(auth)/otp', params: { email: normalized } });
    } catch (e: any) {
      setErr(formatAuthErrorForDisplay(e));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    Keyboard.dismiss();
    setErr('');
    const configError = getSupabaseConfigError();
    if (configError) return setErr(configError);
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.ok) {
        if (result.reason === 'unsupported_email') {
          router.replace({
            pathname: '/(auth)/google-unsupported',
            params: result.email ? { email: result.email } : {},
          });
          return;
        }
        setErr(result.message);
        return;
      }
      router.replace(result.user.role === 'lecturer' ? '/(lecturer)/dashboard' : '/(student)/dashboard');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: spacing.xl, gap: spacing.md }}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Welcome back</Text>
        <Body muted style={{ textAlign: 'center' }}>
          Students: @students.jkuat.ac.ke · Lecturers: @jkuat.ac.ke. We’ll email you a verification code.
        </Body>
        <Body muted style={{ textAlign: 'center', fontSize: 13, marginTop: -4 }}>
          Lecturers schedule classes and set sign-in locations; students only sign attendance on site.
        </Body>
        <View style={{ height: 12 }} />
        <Text style={styles.label}>Email</Text>
        <Input
          placeholder="you@students.jkuat.ac.ke or you@jkuat.ac.ke"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          returnKeyType="done"
          onSubmitEditing={onContinue}
        />
        {err ? <Text style={styles.err}>{err}</Text> : null}
        <View style={{ height: 4 }} />
        <Button title="Send code" onPress={onContinue} loading={loading} />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          onPress={onGoogle}
          disabled={googleLoading}
          style={({ pressed }) => [styles.googleBtn, { opacity: pressed || googleLoading ? 0.7 : 1 }]}
        >
          <GoogleIcon size={20} />
          <Text style={styles.googleText}>
            {googleLoading ? 'Opening Google…' : 'Continue with Google'}
          </Text>
        </Pressable>

        <View style={{ flex: 1 }} />
        <Body muted style={{ textAlign: 'center', fontSize: 12 }}>
          Sign-in is limited to JKUAT student/staff domains (lecturers use @jkuat.ac.ke unless individually authorized).
        </Body>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logo: { width: 90, height: 90, alignSelf: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  label: { fontWeight: '600', color: colors.text },
  err: { color: colors.red, fontSize: 13 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 52, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  googleText: { fontSize: 16, fontWeight: '600', color: colors.text },
});
