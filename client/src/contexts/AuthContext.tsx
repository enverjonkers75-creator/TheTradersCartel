import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/member-types";

type AuthValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);
const PROFILE_RETRY_DELAYS = [0, 250, 750, 1500] as const;

const wait = (milliseconds: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, milliseconds);
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRequest = useRef(0);

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    const requestId = ++profileRequest.current;
    if (!nextSession?.user) { setProfile(null); return; }

    let lastError: unknown = new Error("Profile is not ready yet");
    for (let attempt = 0; attempt < PROFILE_RETRY_DELAYS.length; attempt += 1) {
      if (PROFILE_RETRY_DELAYS[attempt] > 0) await wait(PROFILE_RETRY_DELAYS[attempt]);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", nextSession.user.id)
        .maybeSingle();

      if (data) {
        if (requestId === profileRequest.current) setProfile(data as Profile);
        return;
      }
      lastError = error ?? lastError;
    }

    if (requestId === profileRequest.current) setProfile(null);
    throw lastError;
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      await loadProfile(session);
    } catch {
      // A newly-created profile can take a moment to appear after email confirmation.
      // Route guards keep the member in the safe pending state until the next refresh.
      setProfile(null);
    }
  }, [loadProfile, session]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active) return;
      if (error) {
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setSession(data.session);
      try { await loadProfile(data.session); }
      catch { if (active) setProfile(null); }
      finally { if (active) setLoading(false); }
    }).catch(() => {
      if (!active) return;
      setSession(null);
      setProfile(null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setLoading(true);
      setSession(nextSession);
      window.setTimeout(() => {
        void loadProfile(nextSession)
          .catch(() => setProfile(null))
          .finally(() => setLoading(false));
      }, 0);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [loadProfile]);

  const value = useMemo<AuthValue>(() => ({
    session,
    profile,
    loading,
    refreshProfile,
    signOut: async () => { await supabase.auth.signOut(); setProfile(null); },
  }), [session, profile, loading, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
