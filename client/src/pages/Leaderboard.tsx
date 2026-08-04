import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, GraduationCap, Link2, RefreshCw, ShieldCheck, Trophy, Users } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { MemberLayout } from "@/components/member/MemberLayout";
import { competitionRules, rankCompetition, type CompetitionAccountType, type LeaderboardEntry } from "@/lib/leaderboard";
import type { CompetitionAccount } from "@/lib/member-types";
import { supabase } from "@/lib/supabase";
import { tradingAccountRequest } from "@/lib/trading-account-api";

const podiumLabels = ["Winner", "Second", "Third"];

function Metric({ value, label, limit }: { value: string; label: string; limit?: string }) {
  return <div className="border-l border-white/10 pl-4">
    <p className="font-display text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">{value}</p>
    <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.17em] text-white/28">{label}{limit ? ` · ${limit}` : ""}</p>
  </div>;
}

function PodiumLeader({ entry, featured = false }: { entry: LeaderboardEntry; featured?: boolean }) {
  return <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay: entry.rank * 0.06 }} className={`relative border-y px-5 py-6 sm:px-6 ${featured ? "border-white/30 bg-white/[0.065] lg:-translate-y-3" : "border-white/[0.09] bg-white/[0.018]"}`}>
    <div className="flex items-start justify-between">
      <span className={`grid size-12 place-items-center rounded-full border text-xs font-semibold ${featured ? "border-white bg-white text-black" : "border-white/12 text-white/60"}`}>{entry.initials}</span>
      <div className="text-right"><p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/28">{podiumLabels[entry.rank - 1]}</p><p className="mt-1 font-display text-3xl text-white/50">{String(entry.rank).padStart(2, "0")}</p></div>
    </div>
    <div className="mt-8"><p className="text-sm font-semibold text-white/85">{entry.displayName}</p><p className="mt-4 font-display text-5xl font-semibold tracking-[-0.04em] text-white">{entry.returnPercent >= 0 ? "+" : ""}{entry.returnPercent.toFixed(2)}%</p><p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-white/28">Verified return</p></div>
    <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-4 text-xs"><div><p className="font-mono text-white/72">{entry.maximumOverallDrawdownPercent.toFixed(2)}%</p><p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-white/24">Overall DD</p></div><div><p className="font-mono text-white/72">{entry.educationPoints + entry.seminarPoints}</p><p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-white/24">Activity points</p></div></div>
  </motion.article>;
}

function Status({ entry }: { entry: LeaderboardEntry }) {
  const eligible = entry.status === "eligible";
  return <span className={`inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${eligible ? "text-white/60" : "text-white/32"}`}>{eligible ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}{eligible ? "Eligible" : "Rule breached"}</span>;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "TC";
}

function toLeaderboard(accounts: CompetitionAccount[], accountType: CompetitionAccountType) {
  return rankCompetition(accounts.filter((account) => account.account_type === accountType && account.connection_status === "live").map((account) => {
    const displayName = account.profiles?.full_name || account.account_name || `Account •${account.login_last4 || ""}`;
    return {
      id: account.id,
      displayName,
      initials: initials(displayName),
      returnPercent: Number(account.return_percent || 0),
      maximumDailyDrawdownPercent: Number(account.maximum_daily_drawdown_percent || 0),
      maximumOverallDrawdownPercent: Number(account.maximum_overall_drawdown_percent || 0),
      maximumRiskPerTradePercent: Number(account.maximum_risk_per_trade_percent || 0),
      educationPoints: Number(account.education_points || 0),
      seminarPoints: Number(account.seminar_points || 0),
      ruleBreaches: account.rule_breaches || [],
    };
  }));
}

export default function LeaderboardPage() {
  const [accountType, setAccountType] = useState<CompetitionAccountType>("demo");
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ["competition-accounts-admin"],
    queryFn: async () => {
      const { data, error: queryError } = await supabase.from("competition_accounts").select("*,profiles(full_name)").order("return_percent", { ascending: false });
      if (queryError) throw queryError;
      return data as CompetitionAccount[];
    },
    refetchInterval: 30_000,
  });
  const entries = useMemo(() => toLeaderboard(accounts, accountType), [accounts, accountType]);
  const leaders = entries.filter((entry) => entry.status === "eligible").slice(0, 3);
  const eligibleCount = entries.filter((entry) => entry.status === "eligible").length;
  const pendingCount = accounts.filter((account) => account.account_type === accountType && account.connection_status !== "live").length;
  const latestSync = accounts.filter((account) => account.account_type === accountType && account.last_synced_at).map((account) => new Date(account.last_synced_at as string).getTime()).sort((a, b) => b - a)[0];

  async function refreshLiveData() {
    setRefreshing(true);
    setMessage("");
    try {
      const result = await tradingAccountRequest<{ synced: number; failed: number }>({ action: "sync_all" });
      setMessage(`${result.synced} account${result.synced === 1 ? "" : "s"} refreshed${result.failed ? `, ${result.failed} need attention` : ""}.`);
      await queryClient.invalidateQueries({ queryKey: ["competition-accounts-admin"] });
    } catch (refreshError) {
      setMessage(refreshError instanceof Error ? refreshError.message : "Live refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  return <MemberLayout>
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/30"><ShieldCheck className="size-3.5" />Private administration</div><h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Trading competition</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/38">Live read-only MT4/MT5 accounts. Demo and real rankings remain separate.</p></div>
        <div className="flex flex-wrap items-center gap-3"><Link href="/dashboard/accounts" className="inline-flex h-10 items-center gap-2 border border-white/12 px-4 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/55 transition hover:border-white/30 hover:text-white"><Link2 className="size-3.5" />Manage accounts</Link><button type="button" onClick={() => void refreshLiveData()} disabled={refreshing || accounts.length === 0} className="inline-flex h-10 items-center gap-2 bg-white px-4 text-[9px] font-semibold uppercase tracking-[0.14em] text-black transition disabled:cursor-not-allowed disabled:opacity-35"><RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />Refresh live data</button></div>
      </header>
      {(message || error) && <p role="status" className="mt-5 border-l border-white/30 pl-3 text-xs text-white/55">{message || "Live competition accounts could not be loaded."}</p>}

      <div className="flex border-b border-white/[0.08] pt-6" role="tablist" aria-label="Competition account type">{(["demo", "real"] as const).map((type) => <button key={type} type="button" role="tab" aria-selected={accountType === type} onClick={() => setAccountType(type)} className={`relative min-w-[138px] px-4 pb-4 text-left text-[10px] font-semibold uppercase tracking-[0.17em] transition ${accountType === type ? "text-white" : "text-white/30 hover:text-white/60"}`}>{type} accounts{accountType === type && <motion.span layoutId="competition-tab" className="absolute inset-x-0 bottom-0 h-px bg-white" />}</button>)}</div>

      <section className="grid gap-y-6 border-b border-white/[0.08] py-8 sm:grid-cols-2 lg:grid-cols-4"><Metric value="Highest" label="Return wins" /><Metric value={`${competitionRules.maximumDailyDrawdownPercent}%`} label="Daily drawdown" limit="maximum" /><Metric value={`${competitionRules.maximumOverallDrawdownPercent}%`} label="Overall drawdown" limit="maximum" /><Metric value={`${competitionRules.maximumRiskPerTradePercent}%`} label="Risk per trade" limit="maximum" /></section>

      <AnimatePresence mode="wait"><motion.div key={accountType} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
        {isLoading ? <div className="mt-10 h-64 animate-pulse border-y border-white/[0.06] bg-white/[0.015]" /> : entries.length === 0 ? <section className="py-24 text-center"><Link2 className="mx-auto size-7 text-white/25" /><h2 className="mt-5 text-lg font-semibold">No live {accountType} accounts yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">Connect an Exness MT4 or MT5 {accountType} account using an investor password. Rankings appear only after the connection is verified.</p><Link href="/dashboard/accounts" className="mt-7 inline-flex h-11 items-center border border-white/15 px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70 transition hover:border-white/40 hover:text-white">Connect account</Link>{pendingCount > 0 && <p className="mt-4 text-[10px] text-white/28">{pendingCount} connection{pendingCount === 1 ? " is" : "s are"} awaiting verification.</p>}</section> : <>
          <section className="mt-11"><div className="flex items-center gap-3"><Trophy className="size-4 text-white/45" /><h2 className="text-sm font-semibold text-white/80">{accountType === "demo" ? "Demo" : "Real"} account leaders</h2><span className="h-px flex-1 bg-white/[0.08]" /></div><div className={`mt-7 grid gap-4 ${leaders.length >= 3 ? "lg:grid-cols-3" : leaders.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>{leaders.map((entry, index) => <PodiumLeader key={entry.id} entry={entry} featured={index === 0} />)}</div></section>
          <section className="mt-12 sm:mt-14"><div className="flex flex-col gap-3 border-b border-white/[0.09] pb-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-sm font-semibold text-white/80">Full ranking</h2><p className="mt-1 text-[10px] text-white/25">Return ranks eligible traders; lowest overall drawdown breaks a tie.</p></div><div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.14em] text-white/28"><span className="flex items-center gap-1.5"><Users className="size-3" />{eligibleCount} eligible</span><span className="flex items-center gap-1.5"><GraduationCap className="size-3" />Education tracked separately</span></div></div>
            <div className="overflow-x-auto"><div className="min-w-[940px]"><div className="grid grid-cols-[55px_minmax(180px,1fr)_105px_105px_105px_105px_105px_135px] gap-3 border-b border-white/[0.07] px-3 py-3 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/22"><span>Rank</span><span>Trader</span><span>Return</span><span>Daily DD</span><span>Overall DD</span><span>Max risk</span><span>Learning</span><span>Status</span></div><div className="divide-y divide-white/[0.065]">{entries.map((entry, index) => <motion.div key={entry.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + index * 0.02 }} className={`grid grid-cols-[55px_minmax(180px,1fr)_105px_105px_105px_105px_105px_135px] items-center gap-3 px-3 py-4 text-xs transition hover:bg-white/[0.025] ${entry.status === "breached" ? "opacity-45" : ""}`}><span className="font-display text-lg text-white/38">{String(entry.rank).padStart(2, "0")}</span><span className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full border border-white/10 text-[9px] font-semibold text-white/55">{entry.initials}</span><span className="font-medium text-white/75">{entry.displayName}</span></span><span className="font-mono text-white">{entry.returnPercent >= 0 ? "+" : ""}{entry.returnPercent.toFixed(2)}%</span><span className="font-mono text-white/52">{entry.maximumDailyDrawdownPercent.toFixed(2)}%</span><span className="font-mono text-white/52">{entry.maximumOverallDrawdownPercent.toFixed(2)}%</span><span className="font-mono text-white/52">{entry.maximumRiskPerTradePercent.toFixed(2)}%</span><span className="font-mono text-white/52">{entry.educationPoints + entry.seminarPoints} pts</span><Status entry={entry} /></motion.div>)}</div></div></div>
          </section>
        </>}
      </motion.div></AnimatePresence>
      <p className="mt-7 text-[9px] uppercase tracking-[0.14em] text-white/20">{latestSync ? `Last provider sync ${new Date(latestSync).toLocaleString("en-ZA")}` : "Waiting for the first verified provider sync"}</p>
    </motion.section>
  </MemberLayout>;
}
