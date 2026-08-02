import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

// Capture this before the auth client exchanges and removes recovery parameters.
export const passwordRecoveryLinkDetected = typeof window !== "undefined" && (
  window.location.hash.includes("type=recovery") ||
  (window.location.pathname === "/reset-password" && new URLSearchParams(window.location.search).has("code"))
);

export const supabaseConfigured = Boolean(url && key);
export const supabase = createClient(url || "https://not-configured.supabase.co", key || "not-configured", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
