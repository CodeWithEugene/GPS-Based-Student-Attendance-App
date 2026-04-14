import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button } from '../../src/components/UI';
import { colors, spacing } from '../../src/theme';

export default function Denied() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: colors.redLight, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="location-outline" size={72} color={colors.red} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.red, marginTop: 16 }}>Location Access Required</Text>
        <Body muted style={{ textAlign: 'center', marginTop: 6 }}>
          This app needs GPS to confirm you are in class. Enable location in your phone settings to continue.
        </Body>
        <View style={{ height: 20 }} />
        <Button title="Open Phone Settings" onPress={() => Linking.openSettings()} style={{ minWidth: 240 }} />
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
