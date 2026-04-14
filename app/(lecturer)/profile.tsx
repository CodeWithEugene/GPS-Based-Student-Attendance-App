import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as LocalAuth from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GreenHeader } from '../../src/components/GreenHeader';
import { Body } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';
import { useAuth } from '../../src/store';

export default function LecturerProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [bio, setBio] = useState(false);
  const [radius, setRadius] = useState(30);

  useEffect(() => {
    AsyncStorage.getItem('ae.biometricEnabled').then(v => setBio(v === '1'));
    AsyncStorage.getItem('ae.defaultRadius').then(v => { if (v) setRadius(Number(v)); });
  }, []);

  const toggleBio = async (v: boolean) => {
    if (v) {
      const hw = await LocalAuth.hasHardwareAsync();
      const enrolled = await LocalAuth.isEnrolledAsync();
      if (!hw || !enrolled) { Alert.alert('Biometric unavailable', 'No fingerprint or face ID is set up on this device.'); return; }
      const res = await LocalAuth.authenticateAsync({ promptMessage: 'Confirm to enable biometric login' });
      if (!res.success) return;
    }
    setBio(v);
    await AsyncStorage.setItem('ae.biometricEnabled', v ? '1' : '0');
  };

  const changeRadius = () => {
    Alert.alert(
      'Default geofence radius',
      'Choose the default for new sessions. You can always adjust it per session.',
      [
        { text: '15 m', onPress: () => saveRadius(15) },
        { text: '30 m', onPress: () => saveRadius(30) },
        { text: '50 m', onPress: () => saveRadius(50) },
        { text: '100 m', onPress: () => saveRadius(100) },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };
  const saveRadius = async (n: number) => {
    setRadius(n);
    await AsyncStorage.setItem('ae.defaultRadius', String(n));
  };

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <GreenHeader title="Profile" centered />
      <View style={{ alignItems: 'center', padding: spacing.lg }}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 30, fontWeight: '800', color: colors.green }}>{user.name[0]}</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 10 }}>{user.name}</Text>
        <Body muted>{user.id} • {user.department}</Body>
      </View>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Row icon="key-outline" label="Change Password" onPress={() => router.push('/(auth)/new-password')} />
        <Divider />
        <Row icon="finger-print" label="Biometric Login" right={<Switch value={bio} onValueChange={toggleBio} trackColor={{ true: colors.green }} thumbColor="#fff" />} />
        <Divider />
        <Row icon="notifications-outline" label="Notification Preferences" onPress={() => Linking.openSettings()} />
        <Divider />
        <Row icon="radio-outline" label="Default Geofence Radius" right={<Body muted>{radius} m</Body>} onPress={changeRadius} />
        <Divider />
        <Row icon="help-circle-outline" label="Help and FAQ" onPress={() => router.push('/(student)/help')} />
      </View>
      <View style={{ flex: 1 }} />
      <Pressable
        onPress={async () => { await signOut(); router.replace('/'); }}
        style={[styles.logout, { marginBottom: spacing.lg + insets.bottom }]}
      >
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '700' }}>Log Out</Text>
      </Pressable>
    </View>
  );
}

function Row({ icon, label, right, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Ionicons name={icon} size={22} color={colors.green} />
      <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '500' }}>{label}</Text>
      {right ?? <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
    </Pressable>
  );
}
function Divider() { return <View style={{ height: 1, backgroundColor: colors.border }} />; }

const styles = StyleSheet.create({
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.green },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  logout: { backgroundColor: colors.red, padding: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: spacing.lg, marginTop: spacing.sm },
});
