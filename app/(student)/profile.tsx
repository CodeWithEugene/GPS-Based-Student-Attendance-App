import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as LocalAuth from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GreenHeader } from '../../src/components/GreenHeader';
import { Avatar } from '../../src/components/Avatar';
import { Body } from '../../src/components/UI';
import { pickAndUploadAvatar } from '../../src/lib/avatar';
import { repo } from '../../src/data/repo';
import { colors, shadows, spacing } from '../../src/theme';
import { useAuth } from '../../src/store';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signIn, signOut } = useAuth();
  const [bio, setBio] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('ae.biometricEnabled').then(v => setBio(v === '1'));
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

  const onChangePhoto = async () => {
    if (!user || uploading) return;
    setUploading(true);
    try {
      const res = await pickAndUploadAvatar(user.id);
      if (res.ok) {
        const fresh = await repo.fetchProfileById(user.id);
        if (fresh) await signIn(fresh);
      } else if (res.reason === 'error') {
        Alert.alert('Could not update photo', res.message);
      }
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <GreenHeader title="Profile" centered />

      <View style={{ alignItems: 'center', padding: spacing.lg }}>
        <Pressable onPress={onChangePhoto} style={styles.avatarWrap} disabled={uploading}>
          <Avatar uri={user.avatarUrl} name={user.name} size={96} ring />
          <View style={[styles.cameraBadge, shadows.sm]}>
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={16} color="#fff" />
            )}
          </View>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 12 }}>{user.name}</Text>
        <Body muted>{user.id} · {user.programme || user.department || '—'}</Body>
        <Pressable onPress={onChangePhoto} disabled={uploading}>
          <Text style={styles.changePhoto}>{uploading ? 'Uploading…' : 'Change photo'}</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Row icon="key-outline" label="Change Password" onPress={() => router.push('/(auth)/new-password')} />
        <Divider />
        <Row icon="finger-print" label="Biometric Login" right={<Switch value={bio} onValueChange={toggleBio} trackColor={{ true: colors.green }} thumbColor="#fff" />} />
        <Divider />
        <Row icon="notifications-outline" label="Notification Preferences" onPress={() => Linking.openSettings()} />
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
  avatarWrap: { position: 'relative' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.bgCanvas,
  },
  changePhoto: { color: colors.green, fontWeight: '700', fontSize: 13, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  logout: { backgroundColor: colors.red, padding: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: spacing.lg, marginTop: spacing.sm },
});
