import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';
import { useAuth } from '../../src/store';

export default function Profile() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [bio, setBio] = useState(false);
  if (!user) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
      <View style={styles.hdr}><Text style={styles.hdrTitle}>Profile</Text></View>
      <View style={{ alignItems: 'center', padding: spacing.lg }}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 30, fontWeight: '800', color: colors.green }}>{user.name[0]}</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 10 }}>{user.name}</Text>
        <Body muted>{user.id} • {user.programme || user.department}</Body>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Row icon="key-outline" label="Change Password" onPress={() => router.push('/(auth)/new-password')} />
        <Divider />
        <Row icon="finger-print" label="Biometric Login" right={<Switch value={bio} onValueChange={setBio} trackColor={{ true: colors.green }} thumbColor="#fff" />} />
        <Divider />
        <Row icon="notifications-outline" label="Notification Preferences" onPress={() => {}} />
        <Divider />
        <Row icon="help-circle-outline" label="Help and FAQ" onPress={() => router.push('/(student)/help')} />
      </View>

      <View style={{ flex: 1 }} />
      <Pressable
        onPress={async () => { await signOut(); router.replace('/'); }}
        style={styles.logout}
      >
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '700' }}>Log Out</Text>
      </Pressable>
    </SafeAreaView>
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
  hdr: { backgroundColor: colors.green, padding: spacing.lg },
  hdrTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.green },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  logout: { backgroundColor: colors.red, padding: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: spacing.lg },
});
