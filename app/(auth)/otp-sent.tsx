import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { formatAuthErrorForDisplay } from '../../src/lib/auth-errors';

function mask(email: string) {
  const [u, d] = email.split('@');
  return `${u.slice(0, 2)}${'*'.repeat(Math.max(u.length - 2, 3))}@${d}`;
}
function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const r = (s % 60).toString().padStart(2, '0');
  return `${m}:${r}`;
}

export default function OtpSent() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [left, setLeft] = useState(600);
  const [resending, setResending] = useState(false);
  const [resendErr, setResendErr] = useState('');

  useEffect(() => {
    const t = setInterval(() => setLeft(n => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <View style={styles.iconWrap}>
          <Ionicons name="mail-outline" size={72} color={colors.green} />
        </View>
        <Text style={styles.h}>Check your email</Text>
        <Body muted style={{ textAlign: 'center' }}>
          We've sent a 6-digit verification code to
        </Body>
        <Text style={styles.email}>{email ? mask(String(email)) : ''}</Text>
        <Text style={styles.timer}>Expires in {fmt(left)}</Text>
        <View style={{ height: 12 }} />
        <Button
          title="Open Email App"
          variant="outline"
          onPress={async () => {
            const schemes = ['googlegmail://', 'message://', 'ms-outlook://', 'mailto:'];
            for (const s of schemes) {
              try { if (await Linking.canOpenURL(s)) { Linking.openURL(s); return; } } catch {}
            }
            Linking.openURL('mailto:');
          }}
        />
        <Pressable onPress={() => router.replace({ pathname: '/(auth)/otp', params: { email } })}>
          <Text style={{ color: colors.green, fontWeight: '600', marginTop: 6 }}>I have the code — Enter it</Text>
        </Pressable>
        {resendErr ? <Text style={{ color: colors.red, fontSize: 13, textAlign: 'center' }}>{resendErr}</Text> : null}
        <Pressable
          disabled={resending}
          onPress={async () => {
            if (!email) return;
            setResendErr('');
            setResending(true);
            setLeft(600);
            try {
              const { error } = await supabase.auth.signInWithOtp({
                email: String(email),
                options: { shouldCreateUser: true },
              });
              if (error) setResendErr(formatAuthErrorForDisplay(error));
            } finally {
              setResending(false);
            }
          }}
        >
          <Text style={{ color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
            {resending ? 'Sending…' : 'Resend code'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 140, height: 140, borderRadius: 70, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  h: { fontSize: 24, fontWeight: '800', color: colors.text },
  email: { fontSize: 16, fontWeight: '600', color: colors.text },
  timer: { color: colors.gold, fontWeight: '700', marginTop: 4 },
});
