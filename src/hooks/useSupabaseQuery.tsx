import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ensureSupabaseSession } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useSupabaseQuery<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  options?: { requireAuth?: boolean },
) {
  const { user, authReady } = useAuth();
  const accountId = user?.accountId ?? null;
  const requireAuth = options?.requireAuth !== false;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!authReady) return;
      if (requireAuth && !accountId) {
        setData(null);
        setError("Sign in required.");
        return;
      }
      const hasSession = requireAuth ? await ensureSupabaseSession() : true;
      if (requireAuth && accountId && !hasSession) {
        setData(null);
        setError("Session expired. Sign out and sign in again.");
        return;
      }
      setData(await loader());
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  }, [authReady, accountId, requireAuth, loader]);

  useEffect(() => {
    if (!authReady) return;
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller deps
  }, [authReady, accountId, reload, ...deps]);

  return { data, loading: !authReady || loading, error, reload, setData };
}

export function AdminQueryState({
  loading,
  error,
  empty,
  emptyMessage,
  emptyHint,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyMessage: string;
  emptyHint?: string;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-card border border-brown-deep/10 bg-white px-6 py-14 shadow-card">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-deep/15 border-t-yellow" />
        <p className="text-sm font-semibold text-muted">Loading from Supabase…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-card border border-red-200 bg-gradient-to-br from-red-50 to-white px-5 py-8 shadow-card">
        <p className="font-serif text-lg font-bold text-red-900">Could not load data</p>
        <p className="mt-2 text-sm text-red-800/90">{error}</p>
        {onRetry ? (
          <button type="button" className="btn-ghost mt-4 min-h-10 text-sm" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="empty-state py-14">
        <p className="font-serif text-xl font-bold text-brown-deep">{emptyMessage}</p>
        <p className="mt-2 max-w-md text-sm text-muted">
          {emptyHint ??
            "Data is stored in Supabase. Use Refresh after changes on web or mobile."}
        </p>
        {onRetry ? (
          <button type="button" className="btn-ghost mt-5 min-h-10 text-sm" onClick={onRetry}>
            Refresh
          </button>
        ) : null}
      </div>
    );
  }
  return <>{children}</>;
}
