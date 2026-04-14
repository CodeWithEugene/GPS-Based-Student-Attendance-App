import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import type { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from './data/types';
import { repo } from './data/repo';
import { ensureProfileForSession } from './lib/auth-helpers';
import { supabase } from './lib/supabase';

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signIn: (u: User) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as any);

/** Load app User from DB (and create/link profile if needed) for an existing Supabase auth session. */
async function loadProfileForSession(session: Session): Promise<User | null> {
  if (!session.user?.id) return null;

  await supabase.auth.refreshSession();

  let profile = await repo.getProfileByAuthUserId(session.user.id);

  if (!profile && session.user.email) {
    try {
      profile = await ensureProfileForSession(session.user.email, session.user.id);
    } catch {
      profile = null;
    }
  }

  return profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          const cached = await repo.getCurrentUser();
          if (cached) await repo.setCurrentUser(null);
          if (!cancelled) setUser(null);
          return;
        }

        let sessionUser = await loadProfileForSession(session);

        if (!sessionUser) {
          const cached = await repo.getCurrentUser();
          const em = session.user.email?.trim().toLowerCase();
          if (cached?.email && em && cached.email.trim().toLowerCase() === em) {
            sessionUser = cached;
          }
        }

        if (!sessionUser) {
          await supabase.auth.signOut();
          await repo.setCurrentUser(null);
          if (!cancelled) setUser(null);
          return;
        }

        await repo.setCurrentUser(sessionUser);

        const bio = await AsyncStorage.getItem('ae.biometricEnabled');
        if (cancelled) return;

        if (bio === '1') {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          if (!hasHardware || !enrolled) {
            if (!cancelled) setUser(sessionUser);
            return;
          }
          const auth = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock GPS Attendance',
            fallbackLabel: 'Enter device passcode',
          });
          if (cancelled) return;
          if (auth.success) {
            if (!cancelled) setUser(sessionUser);
          } else {
            await supabase.auth.signOut();
            await repo.setCurrentUser(null);
            if (!cancelled) setUser(null);
          }
        } else {
          if (!cancelled) setUser(sessionUser);
        }
      } catch {
        await supabase.auth.signOut();
        await repo.setCurrentUser(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async event => {
      if (event === 'SIGNED_OUT') {
        await repo.setCurrentUser(null);
        setUser(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
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
        refresh: async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) {
              await repo.setCurrentUser(null);
              setUser(null);
              return;
            }
            const p = await loadProfileForSession(session);
            if (p) {
              await repo.setCurrentUser(p);
              setUser(p);
            } else {
              await supabase.auth.signOut();
              await repo.setCurrentUser(null);
              setUser(null);
            }
          } catch {
            await supabase.auth.signOut();
            await repo.setCurrentUser(null);
            setUser(null);
          }
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
