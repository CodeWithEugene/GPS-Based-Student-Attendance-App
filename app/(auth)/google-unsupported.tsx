import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button } from '../../src/components/UI';
import { TopBar } from '../../src/components/TopBar';
import { maskEmailForDisplay } from '../../src/lib/auth-helpers';
import { colors, radius, spacing } from '../../src/theme';

export default function GoogleUnsupportedEmail() {
  const router = useRouter();
  const { email, hint } = useLocalSearchParams<{ email?: string; hint?: string }>();
  const raw = typeof email === 'string' ? email : '';
  const masked = raw ? maskEmailForDisplay(raw) : null;
  let hintText = '';
  if (typeof hint === 'string' && hint) {
    try {
      hintText = decodeURIComponent(hint);
    } catch {
      hintText = hint;
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['bottom']}>
      <TopBar
        title="Google sign-in"
        tone="green"
        back
        onBackPress={() => router.replace('/(auth)/login')}
      />
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name="school-outline" size={64} color={colors.gold} />
        </View>
        <Text style={styles.title}>JKUAT email required</Text>
        <Body muted style={styles.lead}>
          Sign-in is for @students.jkuat.ac.ke, @jkuat.ac.ke (lecturers), or individually authorized accounts. Unsupported
          Google accounts cannot be used.
        </Body>
        {hintText ? (
          <View style={styles.hintBox}>
            <Body style={styles.hintDetail}>{hintText}</Body>
          </View>
        ) : null}
        {masked ? (
          <View style={styles.emailPill}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <Text style={styles.emailText}>{masked}</Text>
          </View>
        ) : null}
        <View style={styles.list}>
          <Text style={styles.listTitle}>Allowed domains</Text>
          <Row text="@students.jkuat.ac.ke — students" />
          <Row text="@jkuat.ac.ke — lecturers & staff" />
        </View>
        <Body muted style={styles.hint}>
          Use a Google account on an allowed domain, or go back and sign in with email and your verification code.
        </Body>
        <Button
          title="Back to sign in"
          variant="secondary"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

function Row({ text }: { text: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.xl, paddingTop: spacing.md },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  lead: { textAlign: 'center', lineHeight: 22, marginBottom: spacing.md },
  hintBox: {
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  hintDetail: { fontSize: 14, color: colors.text, lineHeight: 20, textAlign: 'center' },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  emailText: { fontSize: 15, fontWeight: '600', color: colors.text },
  list: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  listTitle: { fontWeight: '700', fontSize: 15, color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
    marginTop: 7,
  },
  rowText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  hint: { textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  btn: { minWidth: 220, alignSelf: 'center' },
});
