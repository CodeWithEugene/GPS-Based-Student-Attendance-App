import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../src/theme';
import { TopBar } from '../../src/components/TopBar';

export default function HelpFail() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['bottom']}>
      <TopBar title="Need help?" tone="white" back />
      <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center' }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.redLight, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="warning" size={48} color={colors.red} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 14, textAlign: 'center' }}>Still having trouble?</Text>
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>Try one of the options below.</Text>
        <View style={{ height: 20, width: '100%' }} />
        <Option color={colors.green} label="Try Again" onPress={() => router.back()} />
        <Option color={colors.green} label="Contact Lecturer" outline onPress={() => {}} />
        <Option color="#AAA" label="Go to Dashboard" onPress={() => router.replace('/(student)/dashboard')} />
      </View>
    </SafeAreaView>
  );
}

function Option({ color, label, outline, onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.opt,
        { backgroundColor: outline ? 'transparent' : color, borderColor: color },
      ]}
    >
      <Text style={{ color: outline ? color : '#fff', fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  opt: { width: '100%', padding: 16, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', marginBottom: 10 },
});
