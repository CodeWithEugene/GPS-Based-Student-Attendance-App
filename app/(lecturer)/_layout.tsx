import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { useAuth } from '../../src/store';

function LiveDot() {
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, position: 'absolute', top: -2, right: -6 }} />;
}

export default function LecturerTabs() {
  const { user } = useAuth();
  const [hasLive, setHasLive] = useState(false);
  useEffect(() => {
    const t = setInterval(async () => {
      if (!user) return;
      const s = await repo.getSessions();
      setHasLive(s.some(x => x.lecturerId === user.id && x.status === 'live'));
    }, 2000);
    return () => clearInterval(t);
  }, [user]);

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
            active: focused ? 'radio' : 'radio-outline',
            reports: focused ? 'bar-chart' : 'bar-chart-outline',
            profile: focused ? 'person' : 'person-outline',
          }[route.name] || 'ellipse';
          return (
            <View>
              <Ionicons name={n} size={22} color={color} />
              {route.name === 'active' && hasLive ? <LiveDot /> : null}
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
      <Tabs.Screen name="active" options={{ title: 'Active Session' }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="setup" options={{ href: null }} />
      <Tabs.Screen name="end" options={{ href: null }} />
      <Tabs.Screen name="student/[id]" options={{ href: null }} />
      <Tabs.Screen name="report/[id]" options={{ href: null }} />
    </Tabs>
  );
}
