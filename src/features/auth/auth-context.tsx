import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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

  // Phase 10C: the API client fires this once on a definitive 401 (session
  // idle/absolute expiry, revocation, or a confirmed replay). Clear cached auth
  // state so the route guards redirect to login exactly once (no redirect loop).
  // A transient/offline failure has no response and never fires this event, so
  // unsaved work is not discarded on a flaky network.
  useEffect(() => {
    const onExpired = (): void => {
      if (queryClient.getQueryData(AUTH_ME_KEY)) {
        queryClient.setQueryData(AUTH_ME_KEY, null);
        queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
        // Tell the user why they landed back on login (only when a session existed).
        toast.error('Sessiya muddati tugadi. Iltimos, qayta kiring.');
      }
    };
    window.addEventListener('easygas:session-expired', onExpired);
    return () => window.removeEventListener('easygas:session-expired', onExpired);
  }, [queryClient]);

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
