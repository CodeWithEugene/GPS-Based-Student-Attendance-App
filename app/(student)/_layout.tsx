import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CourseSelectionGate } from '../../src/components/CourseSelectionGate';
import { colors } from '../../src/theme';
import { useAuth } from '../../src/store';

export default function StudentTabs() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const tabHeight = 54 + bottomPad;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgCanvas }}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }
  if (!user) return <Redirect href="/" />;
  if (user.role !== 'student') return <Redirect href="/(lecturer)/dashboard" />;

  return (
    <CourseSelectionGate variant="student">
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: tabHeight,
          paddingTop: 8,
          paddingBottom: bottomPad,
          backgroundColor: colors.white,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
        tabBarIcon: ({ color, focused }) => {
          const n: any = {
            dashboard: focused ? 'home' : 'home-outline',
            sign: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
            history: focused ? 'time' : 'time-outline',
            profile: focused ? 'person' : 'person-outline',
          }[route.name] || 'ellipse';
          return <Ionicons name={n} size={22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
      <Tabs.Screen name="sign" options={{ title: 'Sign' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="notification" options={{ href: null }} />
      <Tabs.Screen name="confirm" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="denied" options={{ href: null }} />
      <Tabs.Screen name="help-fail" options={{ href: null }} />
       </Tabs>
    </CourseSelectionGate>
  );
}
