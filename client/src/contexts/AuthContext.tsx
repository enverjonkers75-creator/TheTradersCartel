import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.user) { setProfile(null); return; }
    const { data, error } = await supabase.from("profiles").select("*").eq("id", nextSession.user.id).single();
    if (error) throw error;
    setProfile(data as Profile);
  }, []);

  const refreshProfile = useCallback(async () => loadProfile(session), [loadProfile, session]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      try { await loadProfile(data.session); } finally { if (active) setLoading(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setLoading(true);
      setSession(nextSession);
      window.setTimeout(() => loadProfile(nextSession).catch(() => setProfile(null)).finally(() => setLoading(false)), 0);
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
