import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const COMPETITION_LIMITS = {
  dailyDrawdownPercent: 5,
  overallDrawdownPercent: 10,
  riskPerTradePercent: 1,
} as const;

const provisioningBase = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

type Actor = { id: string; email: string; full_name: string; role: "student" | "owner" | "developer"; status: string };

export type CompetitionAccountRow = {
  id: string;
  user_id: string;
  provider_account_id: string;
  provider_region: string | null;
  daily_tracker_id: string | null;
  overall_tracker_id: string | null;
  account_type: "demo" | "real";
  platform: "mt4" | "mt5";
  server: string;
  login_last4: string | null;
  connection_status: "awaiting_credentials" | "connecting" | "live" | "error";
  starting_balance: number | null;
  maximum_risk_per_trade_percent: number | null;
  connected_at: string | null;
};

type ProvisionedAccount = {
  _id: string;
  login?: string;
  server: string;
  connectionStatus: "CONNECTED" | "DISCONNECTED" | "DISCONNECTED_FROM_BROKER";
  state: string;
  region: string;
  version: number;
};

type AccountInformation = {
  broker: string;
  currency: string;
  balance: number;
  equity: number;
  name: string;
  login: number;
  type: "ACCOUNT_TRADE_MODE_DEMO" | "ACCOUNT_TRADE_MODE_CONTEST" | "ACCOUNT_TRADE_MODE_REAL";
  investorMode?: boolean;
};

type Position = {
  symbol: string;
  openPrice: number;
  stopLoss?: number;
  volume: number;
  currentTickValue?: number;
};

type SymbolSpecification = { tickSize?: number };
type DailyGrowth = { date: string; drawdownPercentage?: number };
type MetaStatsMetrics = {
  balance: number;
  equity: number;
  dailyGrowth?: DailyGrowth[];
};
type MetaStatsTrade = { riskInBalancePercent?: number };
type MetaStatsResponse = { metrics?: MetaStatsMetrics; state?: string; message?: string };
type HistoricalTradesResponse = { trades?: MetaStatsTrade[]; state?: string; message?: string };

export function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error("Member backend is not configured");
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function authenticateRequest(req: any, admin: SupabaseClient): Promise<Actor> {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) throw Object.assign(new Error("Authentication required"), { status: 401 });
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) throw Object.assign(new Error("Invalid session"), { status: 401 });
  const { data: actor, error } = await admin.from("profiles").select("id,email,full_name,role,status").eq("id", authData.user.id).single();
  if (error || !actor || actor.status !== "active") throw Object.assign(new Error("Active membership required"), { status: 403 });
  return actor as Actor;
}

function metaapiToken() {
  const token = process.env.METAAPI_TOKEN;
  if (!token) throw Object.assign(new Error("Live MT4/MT5 connection is not configured"), { status: 503 });
  return token;
}

async function metaapiRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("auth-token", metaapiToken());
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    let message = `MT4/MT5 provider returned ${response.status}`;
    try {
      const body = await response.json() as { message?: string; error?: string };
      message = body.message || body.error || message;
    } catch { /* provider returned no JSON */ }
    throw Object.assign(new Error(message), { status: response.status >= 500 ? 503 : 400 });
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function createProviderAccount(input: { userId: string; fullName: string; accountType: "demo" | "real"; platform: "mt4" | "mt5"; server: string }) {
  return metaapiRequest<{ id: string; state: string }>(`${provisioningBase}/users/current/accounts`, {
    method: "POST",
    headers: { "transaction-id": randomUUID().replaceAll("-", "") },
    body: JSON.stringify({
      name: `TTC ${input.fullName} ${input.accountType}`.slice(0, 100),
      server: input.server,
      platform: input.platform,
      magic: 0,
      type: "cloud-g2",
      manualTrades: true,
      // MetaStats supplies the competition metrics without enabling the
      // separately billed Risk Management API.
      metastatsApiEnabled: true,
      tags: ["thetraderscartel", input.accountType],
      metadata: { memberId: input.userId, competitionAccountType: input.accountType },
    }),
  });
}

export async function createCredentialLink(providerAccountId: string) {
  return metaapiRequest<{ configurationLink: string }>(`${provisioningBase}/users/current/accounts/${encodeURIComponent(providerAccountId)}/configuration-link?ttlInDays=1`, { method: "PUT" });
}

export async function removeProviderAccount(providerAccountId: string) {
  return metaapiRequest<void>(`${provisioningBase}/users/current/accounts/${encodeURIComponent(providerAccountId)}`, { method: "DELETE" });
}

function clientBase(region: string) {
  return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
}

function statsBase(region: string) {
  return `https://metastats-api-v1.${region}.agiliumtrade.ai`;
}

function brokerTimestamp(value: Date) {
  return value.toISOString().replace("T", " ").replace("Z", "");
}

async function loadMetaStats(accountId: string, region: string) {
  const result = await metaapiRequest<MetaStatsResponse>(`${statsBase(region)}/users/current/accounts/${accountId}/metrics?includeOpenPositions=true`);
  if (!result.metrics) {
    throw Object.assign(new Error(result.message || "Live statistics are still being prepared. Try syncing again shortly."), { status: 409 });
  }
  return result.metrics;
}

async function maximumHistoricalRiskPercent(accountId: string, region: string, since: Date) {
  const start = encodeURIComponent(brokerTimestamp(since));
  const end = encodeURIComponent(brokerTimestamp(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const result = await metaapiRequest<HistoricalTradesResponse>(`${statsBase(region)}/users/current/accounts/${accountId}/historical-trades/${start}/${end}?limit=1000&offset=0&updateHistory=true`);
  if (!result.trades) return 0;
  return result.trades.reduce((maximum, trade) => Math.max(maximum, Number(trade.riskInBalancePercent || 0)), 0);
}

async function maximumOpenRiskPercent(accountId: string, region: string, equity: number) {
  if (!(equity > 0)) return { percent: 0, missingStopLoss: false };
  const base = clientBase(region);
  const positions = await metaapiRequest<Position[]>(`${base}/users/current/accounts/${accountId}/positions?refreshTerminalState=true`);
  let maximum = 0;
  let missingStopLoss = false;
  const specifications = new Map<string, SymbolSpecification>();

  for (const position of positions) {
    if (!position.stopLoss || position.stopLoss <= 0) {
      missingStopLoss = true;
      continue;
    }
    let specification = specifications.get(position.symbol);
    if (!specification) {
      specification = await metaapiRequest<SymbolSpecification>(`${base}/users/current/accounts/${accountId}/symbols/${encodeURIComponent(position.symbol)}/specification`);
      specifications.set(position.symbol, specification);
    }
    const tickSize = Number(specification.tickSize || 0);
    const tickValue = Number(position.currentTickValue || 0);
    if (!(tickSize > 0) || !(tickValue > 0)) continue;
    const riskAmount = Math.abs(position.openPrice - position.stopLoss) / tickSize * tickValue * position.volume;
    maximum = Math.max(maximum, riskAmount / equity * 100);
  }
  return { percent: maximum, missingStopLoss };
}

export async function syncCompetitionAccount(admin: SupabaseClient, account: CompetitionAccountRow) {
  try {
    const provider = await metaapiRequest<ProvisionedAccount>(`${provisioningBase}/users/current/accounts/${encodeURIComponent(account.provider_account_id)}`);
    if (provider.state !== "DEPLOYED" || provider.connectionStatus !== "CONNECTED") {
      const status = provider.state === "DEPLOY_FAILED" ? "error" : "connecting";
      const message = provider.state === "DEPLOY_FAILED" ? "The trading account could not be deployed. Check the server and credentials." : null;
      await admin.from("competition_accounts").update({ connection_status: status, provider_region: provider.region || null, sync_error: message }).eq("id", account.id);
      return { status, message };
    }

    const region = provider.region;
    const base = clientBase(region);
    const information = await metaapiRequest<AccountInformation>(`${base}/users/current/accounts/${account.provider_account_id}/account-information?refreshTerminalState=true`);
    if (information.investorMode !== true) throw new Error("Reconnect using the investor/read-only password. Trading passwords are not accepted.");
    const actualType = information.type === "ACCOUNT_TRADE_MODE_REAL" ? "real" : "demo";
    if (actualType !== account.account_type) throw new Error(`This is a ${actualType} account. Connect it under the ${actualType} leaderboard.`);

    const competitionStartedAt = account.connected_at ? new Date(account.connected_at) : new Date();
    const [metrics, historicalRisk, openRisk, progressResult, attendanceResult] = await Promise.all([
      loadMetaStats(account.provider_account_id, region),
      maximumHistoricalRiskPercent(account.provider_account_id, region, competitionStartedAt),
      maximumOpenRiskPercent(account.provider_account_id, region, information.equity),
      admin.from("course_lesson_progress").select("id", { count: "exact", head: true }).eq("user_id", account.user_id).not("completed_at", "is", null),
      admin.from("seminar_attendance").select("points").eq("user_id", account.user_id),
    ]);

    const startingBalance = Number(account.starting_balance || metrics.balance || information.balance);
    const returnPercent = startingBalance > 0 ? (metrics.equity - startingBalance) / startingBalance * 100 : 0;
    const competitionStartDate = competitionStartedAt.toISOString().slice(0, 10);
    const dailyGrowth = (metrics.dailyGrowth || []).filter((day) => day.date >= competitionStartDate);
    const latestDay = dailyGrowth[dailyGrowth.length - 1];
    const maximumDailyDrawdownPercent = Math.max(0, Number(latestDay?.drawdownPercentage || 0));
    const maximumOverallDrawdownPercent = dailyGrowth.reduce((maximum, day) => Math.max(maximum, Number(day.drawdownPercentage || 0)), 0);
    const maximumRiskPerTradePercent = Math.max(Number(account.maximum_risk_per_trade_percent || 0), historicalRisk, openRisk.percent);
    const breaches: string[] = [];
    if (maximumDailyDrawdownPercent > COMPETITION_LIMITS.dailyDrawdownPercent) breaches.push("daily_drawdown");
    if (maximumOverallDrawdownPercent > COMPETITION_LIMITS.overallDrawdownPercent) breaches.push("overall_drawdown");
    if (maximumRiskPerTradePercent > COMPETITION_LIMITS.riskPerTradePercent) breaches.push("risk_per_trade");
    if (openRisk.missingStopLoss) breaches.push("missing_stop_loss");
    const seminarPoints = (attendanceResult.data || []).reduce((sum, item) => sum + Number(item.points || 0), 0);
    const login = String(information.login || provider.login || "");

    const update = {
      provider_region: region,
      login_last4: login.slice(-4) || null,
      account_name: information.name || null,
      broker: information.broker || null,
      currency: information.currency?.toUpperCase().slice(0, 3) || null,
      connection_status: "live",
      is_read_only: true,
      starting_balance: startingBalance,
      current_balance: metrics.balance,
      current_equity: metrics.equity,
      return_percent: returnPercent,
      maximum_daily_drawdown_percent: maximumDailyDrawdownPercent,
      maximum_overall_drawdown_percent: maximumOverallDrawdownPercent,
      maximum_risk_per_trade_percent: maximumRiskPerTradePercent,
      education_points: progressResult.count || 0,
      seminar_points: seminarPoints,
      rule_breaches: Array.from(new Set(breaches)),
      connected_at: account.connected_at || new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
      sync_error: null,
    };
    const { error } = await admin.from("competition_accounts").update(update).eq("id", account.id);
    if (error) throw error;
    return { status: "live", account: update };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Trading account sync failed";
    await admin.from("competition_accounts").update({ connection_status: "error", sync_error: message, last_synced_at: new Date().toISOString() }).eq("id", account.id);
    throw error;
  }
}
