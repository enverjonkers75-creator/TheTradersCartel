import type { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

function LoadingScreen() {
  return <div className="grid min-h-screen place-items-center bg-black text-white"><div className="text-center"><img src="/logo-v2.png" alt="TheTradersCartel" className="mx-auto w-56" /><p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-white/35">Loading members area</p></div></div>;
}

export function ProtectedRoute({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <Redirect to="/login" />;
  if (!profile || profile.status === "pending") return <Redirect to="/pending" />;
  if (profile.status === "rejected") return <Redirect to="/rejected" />;
  if (profile.status === "suspended") return <Redirect to="/suspended" />;
  if (admin && profile.role === "student") return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (session && profile?.status === "active") return <Redirect to="/dashboard" />;
  return <>{children}</>;
}
