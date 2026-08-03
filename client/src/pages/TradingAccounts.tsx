import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Check, ExternalLink, Link2, Loader2, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MemberLayout } from "@/components/member/MemberLayout";
import type { CompetitionAccount } from "@/lib/member-types";
import { supabase } from "@/lib/supabase";
import { tradingAccountRequest } from "@/lib/trading-account-api";

type AccountType = "demo" | "real";
type Platform = "mt4" | "mt5";

const statusLabels: Record<CompetitionAccount["connection_status"], string> = {
  awaiting_credentials: "Credentials required",
  connecting: "Connecting",
  live: "Live",
  error: "Needs attention",
};

function formatNumber(value: number | null, currency: string | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-ZA", { style: currency ? "currency" : "decimal", currency: currency || undefined, maximumFractionDigits: 2 }).format(value);
}

export default function TradingAccountsPage() {
  const [accountType, setAccountType] = useState<AccountType>("demo");
  const [platform, setPlatform] = useState<Platform>("mt5");
  const [server, setServer] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [configurationLink, setConfigurationLink] = useState("");
  const queryClient = useQueryClient();
  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ["competition-accounts-own"],
    queryFn: async () => {
      const { data, error: queryError } = await supabase.from("competition_accounts").select("*").order("created_at", { ascending: true });
      if (queryError) throw queryError;
      return data as CompetitionAccount[];
    },
    refetchInterval: 20_000,
  });

  async function openConfiguration(accountId?: string) {
    setBusy(accountId ? `link-${accountId}` : "start");
    setMessage("");
    setConfigurationLink("");
    const popup = window.open("", "_blank");
    try {
      const result = accountId
        ? await tradingAccountRequest<{ configurationLink: string }>({ action: "configuration_link", accountId })
        : await tradingAccountRequest<{ configurationLink: string }>({ action: "start", accountType, platform, server: server.trim() });
      if (popup) {
        popup.opener = null;
        popup.location.href = result.configurationLink;
      } else {
        setConfigurationLink(result.configurationLink);
      }
      setMessage("Enter the investor password on the secure MetaApi page, then return here and select Verify & sync.");
      await queryClient.invalidateQueries({ queryKey: ["competition-accounts-own"] });
    } catch (requestError) {
      popup?.close();
      setMessage(requestError instanceof Error ? requestError.message : "Connection could not be started");
    } finally {
      setBusy("");
    }
  }

  async function syncAccount(accountId: string) {
    setBusy(`sync-${accountId}`);
    setMessage("");
    try {
      await tradingAccountRequest({ action: "sync", accountId });
      setMessage("The account was checked against the live MT4/MT5 connection.");
      await queryClient.invalidateQueries({ queryKey: ["competition-accounts-own"] });
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "Account verification failed");
      await queryClient.invalidateQueries({ queryKey: ["competition-accounts-own"] });
    } finally {
      setBusy("");
    }
  }

  async function disconnectAccount(accountId: string) {
    if (!window.confirm("Disconnect this trading account and remove it from the competition?")) return;
    setBusy(`delete-${accountId}`);
    setMessage("");
    try {
      await tradingAccountRequest({ action: "disconnect", accountId });
      setMessage("The trading account was disconnected and removed from the competition.");
      await queryClient.invalidateQueries({ queryKey: ["competition-accounts-own"] });
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "Account could not be disconnected");
    } finally {
      setBusy("");
    }
  }

  return <MemberLayout>
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <header className="border-b border-white/[0.08] pb-7"><div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/30"><ShieldCheck className="size-3.5" />Read-only connection</div><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Trading accounts</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/38">Connect Exness MT4 or MT5 accounts to the correct live leaderboard. Only investor passwords are accepted.</p></header>

      {(message || error) && <p role="status" className="mt-5 border-l border-white/30 pl-3 text-xs leading-5 text-white/55">{message || "Trading accounts could not be loaded."}</p>}
      {configurationLink && <a href={configurationLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-white underline underline-offset-4">Open secure credential page <ExternalLink className="size-3.5" /></a>}

      <section className="grid gap-10 border-b border-white/[0.08] py-9 lg:grid-cols-[0.8fr_1.2fr]">
        <div><h2 className="text-sm font-semibold text-white/85">Connect another account</h2><p className="mt-2 max-w-sm text-xs leading-5 text-white/32">Use the exact server name shown inside your Exness account, for example an Exness MT5 real or trial server.</p></div>
        <form onSubmit={(event) => { event.preventDefault(); void openConfiguration(); }} className="space-y-6">
          <div><p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">Leaderboard</p><div className="grid grid-cols-2 border border-white/10">{(["demo", "real"] as const).map((value) => <button key={value} type="button" onClick={() => setAccountType(value)} className={`h-11 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${accountType === value ? "bg-white text-black" : "text-white/38 hover:text-white"}`}>{value}</button>)}</div></div>
          <div><p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">Platform</p><div className="grid grid-cols-2 border border-white/10">{(["mt4", "mt5"] as const).map((value) => <button key={value} type="button" onClick={() => setPlatform(value)} className={`h-11 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${platform === value ? "bg-white text-black" : "text-white/38 hover:text-white"}`}>{value}</button>)}</div></div>
          <label className="block"><span className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">Exness server</span><input value={server} onChange={(event) => setServer(event.target.value)} required minLength={2} maxLength={120} placeholder="Exact server name" className="h-12 w-full border border-white/10 bg-white/[0.025] px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/35" /></label>
          <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-white/42"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 size-4 accent-white" /><span>I will use the investor/read-only password. I understand that a normal trading password will be rejected.</span></label>
          <button type="submit" disabled={!confirmed || !server.trim() || busy === "start"} className="inline-flex h-11 items-center gap-2 bg-white px-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-black transition disabled:cursor-not-allowed disabled:opacity-35">{busy === "start" ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}Continue securely</button>
        </form>
      </section>

      <section className="pt-9"><div className="flex items-end justify-between border-b border-white/[0.08] pb-4"><div><h2 className="text-sm font-semibold text-white/85">Connected accounts</h2><p className="mt-1 text-[10px] text-white/28">One demo and one real account may be connected per member.</p></div><span className="text-[9px] uppercase tracking-[0.15em] text-white/25">{accounts.length} of 2</span></div>
        {isLoading ? <div className="h-40 animate-pulse bg-white/[0.015]" /> : accounts.length === 0 ? <div className="py-16 text-center"><Link2 className="mx-auto size-6 text-white/25" /><p className="mt-4 text-sm text-white/35">No live trading accounts connected.</p></div> : <div className="divide-y divide-white/[0.07]">{accounts.map((account) => <article key={account.id} className="grid gap-5 py-6 lg:grid-cols-[1.1fr_0.8fr_1fr_auto] lg:items-center">
          <div><div className="flex items-center gap-2"><p className="text-sm font-semibold text-white/85">{account.account_type === "demo" ? "Demo" : "Real"} · {account.platform.toUpperCase()}</p><span className={`size-1.5 rounded-full ${account.connection_status === "live" ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" : account.connection_status === "error" ? "bg-white/30" : "animate-pulse bg-white/55"}`} /></div><p className="mt-1 text-[10px] text-white/28">{account.broker || account.server}{account.login_last4 ? ` · ••••${account.login_last4}` : ""}</p></div>
          <div><p className="flex items-center gap-1.5 text-xs text-white/55">{account.connection_status === "live" ? <Check className="size-3.5" /> : account.connection_status === "error" ? <AlertTriangle className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}{statusLabels[account.connection_status]}</p><p className="mt-1 text-[9px] text-white/22">{account.is_read_only ? "Investor access verified" : "Read-only access not verified"}</p></div>
          <div className="grid grid-cols-2 gap-4"><div><p className="font-mono text-sm text-white/70">{formatNumber(account.current_equity, account.currency)}</p><p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-white/22">Equity</p></div><div><p className="font-mono text-sm text-white/70">{Number(account.return_percent || 0) >= 0 ? "+" : ""}{Number(account.return_percent || 0).toFixed(2)}%</p><p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-white/22">Return</p></div></div>
          <div className="flex flex-wrap gap-2 lg:justify-end">{account.connection_status !== "live" && <button type="button" disabled={busy === `link-${account.id}`} onClick={() => void openConfiguration(account.id)} className="inline-flex h-9 items-center gap-2 border border-white/12 px-3 text-[9px] uppercase tracking-[0.12em] text-white/55 disabled:opacity-35"><ExternalLink className="size-3.5" />Credentials</button>}<button type="button" disabled={busy === `sync-${account.id}`} onClick={() => void syncAccount(account.id)} className="inline-flex h-9 items-center gap-2 border border-white/12 px-3 text-[9px] uppercase tracking-[0.12em] text-white/55 disabled:opacity-35"><RefreshCw className={`size-3.5 ${busy === `sync-${account.id}` ? "animate-spin" : ""}`} />{account.connection_status === "live" ? "Sync" : "Verify & sync"}</button><button type="button" aria-label="Disconnect account" disabled={busy === `delete-${account.id}`} onClick={() => void disconnectAccount(account.id)} className="grid size-9 place-items-center border border-white/10 text-white/28 transition hover:text-white disabled:opacity-35"><Trash2 className="size-3.5" /></button></div>
          {account.sync_error && <p className="text-xs leading-5 text-white/40 lg:col-span-4">{account.sync_error}</p>}
        </article>)}</div>}
      </section>
    </motion.section>
  </MemberLayout>;
}
