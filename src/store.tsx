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
    (async () => {
      const u = await repo.getCurrentUser();
      setUser(u);
      setLoading(false);
    })();
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
