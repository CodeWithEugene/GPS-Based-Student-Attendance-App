import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Card } from '../../src/components/UI';
import { TopBar } from '../../src/components/TopBar';
import { PERMISSION_ONBOARDING_KEY } from '../../src/lib/onboarding-keys';
import { colors, spacing } from '../../src/theme';

type PermState = 'idle' | 'granted' | 'denied';

export default function Permissions() {
  const router = useRouter();
  const [loc, setLoc] = useState<PermState>('idle');
  const [notif, setNotif] = useState<PermState>('idle');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const l = await Location.getForegroundPermissionsAsync();
        const n = await Notifications.getPermissionsAsync();
        if (cancelled) return;
        setLoc(l.status === 'granted' ? 'granted' : l.status === 'denied' ? 'denied' : 'idle');
        setNotif(n.status === 'granted' ? 'granted' : n.status === 'denied' ? 'denied' : 'idle');
      } catch {
        /* keep idle */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const askLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLoc(status === 'granted' ? 'granted' : 'denied');
  };
  const askNotif = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotif(status === 'granted' ? 'granted' : 'denied');
  };

  const onContinue = async () => {
    await AsyncStorage.setItem(PERMISSION_ONBOARDING_KEY, '1');
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgCanvas }} edges={['top', 'bottom']}>
      <TopBar title="Permissions" tone="green" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          Allow access when you are ready. You can change this later in system settings.
        </Text>

        <PermRow
          icon={<Ionicons name="location" size={24} color={colors.green} />}
          title="Location"
          desc="Used only to confirm you are inside the classroom geofence when signing attendance."
          state={loc}
          onAllow={askLocation}
        />
        <PermRow
          icon={<Ionicons name="notifications-outline" size={24} color={colors.green} />}
          title="Notifications"
          desc="Optional — alerts when a lecturer starts an attendance session."
          state={notif}
          onAllow={askNotif}
        />

        <Button title="Continue to sign in" onPress={onContinue} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PermRow({
  icon,
  title,
  desc,
  state,
  onAllow,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  state: PermState;
  onAllow: () => void;
}) {
  const granted = state === 'granted';
  return (
    <Card style={styles.card}>
      <View style={styles.iconWrap}>{icon}</View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Body muted style={{ marginTop: 4, lineHeight: 20 }}>{desc}</Body>
      </View>
      <Button
        title={granted ? 'Allowed' : 'Allow'}
        variant="secondary"
        disabled={granted}
        onPress={onAllow}
        style={{ height: 42, paddingHorizontal: spacing.md, minWidth: 96 }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  card: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontWeight: '700', fontSize: 16, color: colors.text },
});
