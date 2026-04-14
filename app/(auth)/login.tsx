import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Caption, Input } from '../../src/components/UI';
import { GoogleIcon } from '../../src/components/GoogleIcon';
import { colors, radius, shadows, spacing } from '../../src/theme';
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
    try { setErr(decodeURIComponent(oauthError)); } catch { setErr(oauthError); }
  }, [oauthError]);

  const onContinue = async () => {
    Keyboard.dismiss();
    setErr('');
    const configError = getSupabaseConfigError();
    if (configError) return setErr(configError);
    const normalized = email.trim().toLowerCase();
    if (!normalized) return setErr('Please enter your email address.');
    if (!isAllowedSignInEmail(normalized)) {
      return setErr('Use your @students.jkuat.ac.ke or @jkuat.ac.ke address.');
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: { shouldCreateUser: true },
      });
      if (error) { setErr(formatAuthErrorForDisplay(error)); return; }
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
        setErr(formatAuthErrorForDisplay({ message: result.message }));
        return;
      }
      router.replace(result.user.role === 'lecturer' ? '/(lecturer)/dashboard' : '/(student)/dashboard');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Curved green hero */}
        <View style={styles.hero}>
          <View style={styles.heroCircleOne} pointerEvents="none" />
          <View style={styles.heroCircleTwo} pointerEvents="none" />
          <View style={[styles.logoRing, shadows.lg]}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.heroTitle}>Welcome back</Text>
          <Text style={styles.heroSub}>Sign in with your JKUAT email</Text>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, shadows.md]}>
            <Caption style={styles.label}>EMAIL ADDRESS</Caption>
            <Input
              placeholder="you@students.jkuat.ac.ke"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              returnKeyType="done"
              onSubmitEditing={onContinue}
            />
            {err ? <Text style={styles.err}>{err}</Text> : null}
            <View style={{ height: spacing.md }} />
            <Button title="Send verification code" onPress={onContinue} loading={loading} />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={onGoogle}
              disabled={googleLoading}
              style={({ pressed }) => [
                styles.googleBtn,
                shadows.xs,
                { opacity: pressed || googleLoading ? 0.82 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <GoogleIcon size={20} />
              <Text style={styles.googleText}>
                {googleLoading ? 'Opening Google…' : 'Continue with Google'}
              </Text>
            </Pressable>
          </View>

          <Body muted style={styles.foot}>
            Students: <Text style={styles.footBold}>@students.jkuat.ac.ke</Text>{'  ·  '}
            Lecturers: <Text style={styles.footBold}>@jkuat.ac.ke</Text>
          </Body>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.green,
    paddingTop: spacing.xxl + spacing.sm,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: radius.xl + 8,
    borderBottomRightRadius: radius.xl + 8,
    overflow: 'hidden',
  },
  heroCircleOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -70,
  },
  heroCircleTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(249,168,37,0.08)',
    bottom: -40,
    left: -50,
  },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: spacing.md,
  },
  logo: { width: 70, height: 70 },
  heroTitle: { color: colors.white, fontSize: 26, fontWeight: '800', letterSpacing: -0.2 },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: 14, marginTop: 4, fontWeight: '600' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: {
    marginTop: -spacing.xxl,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  label: { marginBottom: spacing.sm },
  err: { color: colors.red, fontSize: 13, marginTop: spacing.sm, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textSubtle, fontSize: 12, fontWeight: '600' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 54, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  googleText: { fontSize: 15, fontWeight: '700', color: colors.text },
  foot: { textAlign: 'center', fontSize: 12 },
  footBold: { fontWeight: '700', color: colors.text },
});
