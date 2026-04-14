import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CourseSelectionGate } from '../../src/components/CourseSelectionGate';
import { colors } from '../../src/theme';
import { repo } from '../../src/data/repo';
import { useAuth } from '../../src/store';

function LiveDot() {
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.gold,
        position: 'absolute',
        top: -2,
        right: -6,
      }}
    />
  );
}

export default function LecturerTabs() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const tabHeight = 54 + bottomPad;
  const [hasLive, setHasLive] = useState(false);

  useEffect(() => {
    const t = setInterval(async () => {
      if (!user) return;
      const s = await repo.getSessions();
      setHasLive(s.some(x => x.lecturerId === user.id && x.status === 'live'));
    }, 2000);
    return () => clearInterval(t);
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgCanvas }}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }
  if (!user) return <Redirect href="/" />;
  if (user.role !== 'lecturer') return <Redirect href="/(student)/dashboard" />;

  return (
    <CourseSelectionGate variant="lecturer">
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
      <Tabs.Screen name="active" options={{ title: 'Live' }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="create-unit" options={{ href: null }} />
      <Tabs.Screen name="setup" options={{ href: null }} />
      <Tabs.Screen name="end" options={{ href: null }} />
      <Tabs.Screen name="student/[id]" options={{ href: null }} />
      <Tabs.Screen name="report/[id]" options={{ href: null }} />
    </Tabs>
    </CourseSelectionGate>
  );
}
