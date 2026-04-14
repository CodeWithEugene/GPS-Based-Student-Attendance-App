import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';

export default function NotOpen() {
  const router = useRouter();
  const { unit, at } = useLocalSearchParams<{ unit?: string; at?: string }>();
  const [notif, setNotif] = useState(true);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top', 'bottom']}>
      <View style={styles.banner}>
        <Text style={{ color: '#8A5A00', fontWeight: '700' }}>Session hasn't opened yet</Text>
      </View>
      <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="time-outline" size={72} color={colors.gold} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 16, textAlign: 'center' }}>Come back soon</Text>
        <Body muted style={{ textAlign: 'center', marginTop: 6 }}>
          {unit || 'This class'} starts at {at || '—'}. You'll be able to sign in once your lecturer opens the session.
        </Body>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 10 }}>
          <Text style={{ fontWeight: '600' }}>Notify me when it opens</Text>
          <Switch value={notif} onValueChange={setNotif} trackColor={{ true: colors.green }} thumbColor="#fff" />
        </View>
        <View style={{ height: 24 }} />
        <Button title="Back" variant="outline" onPress={() => router.back()} style={{ minWidth: 200 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.gold, padding: 10, alignItems: 'center' },
});
