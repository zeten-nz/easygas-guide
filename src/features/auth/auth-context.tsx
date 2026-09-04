import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../../api/auth.api';
import type { User } from '../../types/auth';

interface AuthContextValue {
  user: User | null;
  /** True while the initial /auth/me check is in flight. */
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const AUTH_ME_KEY = ['auth', 'me'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: authApi.fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const setUser = useCallback(
    (user: User | null) => {
      queryClient.setQueryData(AUTH_ME_KEY, user);
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // The cookie/session is dead server-side; drop all cached data locally.
      queryClient.setQueryData(AUTH_ME_KEY, null);
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
    }
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user: data ?? null, isLoading, setUser, logout }}>{children}</AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
