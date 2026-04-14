import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/theme';

export default function Role() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center' }}>
        <Image source={require('../../assets/logo.png')} style={{ width: 90, height: 90, marginTop: 10 }} resizeMode="contain" />
        <Text style={styles.h}>Who are you?</Text>
        <Text style={styles.sub}>Choose your role to continue.</Text>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 24 }}>
          <RoleCard
            color={colors.green}
            icon={<FontAwesome5 name="user-graduate" size={40} color={colors.white} />}
            label="I'm a Student"
            onPress={() => router.replace('/(student)/dashboard')}
          />
          <RoleCard
            color={colors.red}
            icon={<FontAwesome5 name="chalkboard-teacher" size={40} color={colors.white} />}
            label="I'm a Lecturer"
            onPress={() => router.replace('/(lecturer)/dashboard')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function RoleCard({ color, icon, label, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: color, borderColor: pressed ? colors.gold : color }]}>
      {icon}
      <Text style={styles.cardLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 24, fontWeight: '800', marginTop: 14, color: colors.text },
  sub: { color: colors.textMuted, marginTop: 4 },
  card: { flex: 1, height: 180, borderRadius: 16, borderWidth: 3, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 12 },
  cardLabel: { color: colors.white, fontWeight: '700', fontSize: 15, textAlign: 'center' },
});
