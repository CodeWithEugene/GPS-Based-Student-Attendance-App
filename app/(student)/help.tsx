import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../../src/components/UI';
import { TopBar } from '../../src/components/TopBar';
import { colors, spacing } from '../../src/theme';

const FAQ = [
  { q: 'Why can\'t I sign attendance?', a: 'You must be inside the classroom geofence and the lecturer must have opened the session. Make sure GPS is on.' },
  { q: 'Why does it say I\'m outside?', a: 'GPS can drift indoors. Try moving closer to a window, or wait a moment for accuracy to improve.' },
  { q: 'Can my friend sign for me?', a: 'No. Each device is tied to one account. If you\'re absent, the lecturer can mark you manually.' },
  { q: 'I lost my phone — what now?', a: 'Contact the ICT helpdesk to unlink your device and reset your account.' },
  { q: 'How is my data used?', a: 'Your GPS location is only recorded at the moment you sign in, and is visible only to your lecturer.' },
];

export default function Help() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<number | null>(0);
  const items = FAQ.filter(f => f.q.toLowerCase().includes(q.toLowerCase()));
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['bottom']}>
      <TopBar title="Help & FAQ" tone="green" back />
      <View style={{ padding: spacing.lg }}>
        <Input placeholder="Search FAQs…" value={q} onChangeText={setQ} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 20 }}>
        {items.map((f, i) => {
          const isOpen = open === i;
          return (
            <Pressable key={i} onPress={() => setOpen(isOpen ? null : i)} style={styles.item}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ flex: 1, fontWeight: '600' }}>{f.q}</Text>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.green} />
              </View>
              {isOpen && <Text style={{ color: colors.textMuted, marginTop: 8 }}>{f.a}</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={{ padding: spacing.lg }}>
        <Button title="Contact Support" onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  item: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, marginBottom: 10 },
});
