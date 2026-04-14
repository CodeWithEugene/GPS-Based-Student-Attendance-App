import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from './data/types';
import { repo } from './data/repo';

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signIn: (u: User) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await repo.getCurrentUser();
        const bio = await AsyncStorage.getItem('ae.biometricEnabled');
        if (cancelled) return;

        if (u && bio === '1') {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          if (!hasHardware || !enrolled) {
            setUser(u);
            return;
          }
          const auth = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock GPS Attendance',
            fallbackLabel: 'Enter device passcode',
          });
          if (cancelled) return;
          if (auth.success) {
            setUser(u);
          } else {
            await repo.signOut();
            setUser(null);
          }
        } else {
          setUser(u);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        signIn: async u => {
          await repo.setCurrentUser(u);
          setUser(u);
        },
        signOut: async () => {
          await repo.signOut();
          setUser(null);
        },
        refresh: async () => setUser(await repo.getCurrentUser()),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
