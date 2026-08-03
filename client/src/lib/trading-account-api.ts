import { supabase } from "@/lib/supabase";

export type TradingAccountAction =
  | { action: "start"; accountType: "demo" | "real"; platform: "mt4" | "mt5"; server: string }
  | { action: "configuration_link"; accountId: string }
  | { action: "sync"; accountId: string }
  | { action: "sync_all" }
  | { action: "disconnect"; accountId: string };

export async function tradingAccountRequest<T = Record<string, unknown>>(body: TradingAccountAction): Promise<T> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Sign in again to continue");
  const response = await fetch("/api/trading-account", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) throw new Error(result.message || "Trading account request failed");
  return result as T;
}
