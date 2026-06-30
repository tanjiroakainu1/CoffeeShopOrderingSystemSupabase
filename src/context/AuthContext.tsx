import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabase, ensureSupabaseSession } from "@/lib/supabase/client";
import * as auth from "@/services/authService";
import type { UserAccount } from "@/types";

interface AuthContextValue {
  user: UserAccount | null;
  loading: boolean;
  authReady: boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<UserAccount>;
  signOut: () => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    displayName?: string;
    birthdayIso?: string;
    sex?: string;
  }) => Promise<UserAccount>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const syncUser = useCallback(async () => {
    await ensureSupabaseSession();
    setUser(await auth.getSessionUser());
  }, []);

  const refresh = useCallback(async () => {
    await syncUser();
  }, [syncUser]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await syncUser();
      } finally {
        if (mounted) {
          setLoading(false);
          setAuthReady(true);
        }
      }
    })();
    const sb = getSupabase();
    if (!sb) {
      setAuthReady(true);
      setLoading(false);
      return;
    }
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) {
        void auth.getSessionUser().then(setUser);
      } else {
        setUser(null);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [syncUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authReady,
      refresh,
      signIn: async (email, password) => {
        const u = await auth.signIn(email, password);
        setUser(u);
        setAuthReady(true);
        return u;
      },
      signOut: async () => {
        await auth.signOut();
        setUser(null);
      },
      register: async (input) => {
        const u = await auth.registerCustomer(input);
        setUser(u);
        setAuthReady(true);
        return u;
      },
    }),
    [user, loading, authReady, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
