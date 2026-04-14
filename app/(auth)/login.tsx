import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Input } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { supabase } from '../../src/lib/supabase';
import { signInWithGoogle } from '../../src/lib/google-auth';
import { useAuth } from '../../src/store';

export default function Login() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [id, setId] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onContinue = async () => {
    Keyboard.dismiss();
    setErr('');
    if (!id.trim()) return setErr('Please enter your Student or Staff ID.');
    setLoading(true);
    try {
      const user = await repo.getUserById(id.trim());
      if (!user) { setErr('No account found with that ID.'); return; }
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: true },
      });
      if (error) { setErr(error.message); return; }
      router.push({ pathname: '/(auth)/otp-sent', params: { userId: user.id, email: user.email } });
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    Keyboard.dismiss();
    setErr('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.ok) { setErr(result.error); return; }
      await refresh();
      router.replace('/(auth)/biometric');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: spacing.xl, gap: spacing.md }}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Welcome back</Text>
        <Body muted style={{ textAlign: 'center' }}>Sign in with your JKUAT ID or Google account.</Body>
        <View style={{ height: 12 }} />
        <Text style={styles.label}>Enter your Student ID</Text>
        <Input
          placeholder="e.g. S001"
          autoCapitalize="characters"
          value={id}
          onChangeText={setId}
          returnKeyType="done"
          onSubmitEditing={onContinue}
        />
        {err ? <Text style={styles.err}>{err}</Text> : null}
        <View style={{ height: 4 }} />
        <Button title="Continue" onPress={onContinue} loading={loading} />

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
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text style={styles.googleText}>
            {googleLoading ? 'Opening Google…' : 'Continue with Google'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/forgot')} style={{ alignSelf: 'center', marginTop: 4 }}>
          <Text style={{ color: colors.green, fontWeight: '600' }}>Forgot Password?</Text>
        </Pressable>

        <View style={{ flex: 1 }} />
        <Body muted style={{ textAlign: 'center', fontSize: 12 }}>
          Demo IDs — Students: S001–S004, Lecturers: L001, L002
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
