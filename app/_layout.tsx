import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/store';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bgCanvas },
            animation: 'fade_from_bottom',
          }}
        />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
