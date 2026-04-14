import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Card } from '../../src/components/UI';
import { TopBar } from '../../src/components/TopBar';
import { colors, spacing } from '../../src/theme';

export default function Permissions() {
  const router = useRouter();
  const [loc, setLoc] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [notif, setNotif] = useState<'idle' | 'granted' | 'denied'>('idle');

  const askLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLoc(status === 'granted' ? 'granted' : 'denied');
  };
  const askNotif = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotif(status === 'granted' ? 'granted' : 'denied');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['bottom']}>
      <TopBar title="Permissions" tone="green" />
      <View style={{ flex: 1, padding: spacing.lg, gap: spacing.md }}>
        <Text style={{ fontSize: 15, color: colors.textMuted, marginBottom: 6 }}>
          This app needs a few permissions to verify your attendance securely.
        </Text>

        <PermRow
          icon={<Ionicons name="location" size={26} color={colors.green} />}
          title="Location"
          desc="Used to verify you are inside the classroom when signing attendance."
          state={loc}
          onAllow={askLocation}
        />
        <PermRow
          icon={<Ionicons name="notifications" size={26} color={colors.green} />}
          title="Notifications"
          desc="So we can alert you when an attendance session opens."
          state={notif}
          onAllow={askNotif}
        />

        <View style={{ flex: 1 }} />
        <Button title="Continue" onPress={() => router.push('/(auth)/login')} />
      </View>
    </SafeAreaView>
  );
}

function PermRow({ icon, title, desc, state, onAllow }: any) {
  const granted = state === 'granted';
  return (
    <Card style={styles.card}>
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>{title}</Text>
        <Body muted style={{ marginTop: 2 }}>{desc}</Body>
      </View>
      <Button
        title={granted ? 'Allowed' : 'Allow'}
        variant="secondary"
        disabled={granted}
        onPress={onAllow}
        style={{ height: 40, paddingHorizontal: 14 }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center' },
});
