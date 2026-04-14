import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '../../src/theme';

export default function StudentTabs() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { height: 64, paddingTop: 6, paddingBottom: 8, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
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
      <Tabs.Screen name="sign" options={{ title: 'Sign Attendance' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="notification" options={{ href: null }} />
      <Tabs.Screen name="confirm" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="denied" options={{ href: null }} />
      <Tabs.Screen name="not-open" options={{ href: null }} />
      <Tabs.Screen name="help-fail" options={{ href: null }} />
    </Tabs>
  );
}
