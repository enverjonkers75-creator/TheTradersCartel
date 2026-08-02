import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ArrowUpRight, BarChart3, Clock3, Plus, Target } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { MemberLayout } from "@/components/member/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useJournalEntries } from "@/hooks/use-member-data";
import { calculateCumulativePnl, calculateQuickJournalAnalytics } from "@shared/member";

type Period = "7D" | "30D" | "90D" | "ALL";

function money(value: number, currency: string) {
  try { return new Intl.NumberFormat("en-ZA", { style: "currency", currency, maximumFractionDigits: 2 }).format(value); }
  catch { return `${currency} ${value.toFixed(2)}`; }
}

function Metric({ label, value, detail, icon: Icon, delay }: { label: string; value: string; detail: string; icon: typeof Activity; delay: number }) {
  return <motion.div className="border-t border-white/[0.09] pt-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <div className="flex items-center justify-between"><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35">{label}</p><Icon className="size-4 text-white/35" /></div>
    <div className="mt-4"><p className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-[28px]">{value}</p><p className="mt-1 text-[10px] text-white/30">{detail}</p></div>
  </motion.div>;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: entries = [], isLoading, error } = useJournalEntries(profile?.id);
  const [period, setPeriod] = useState<Period>("30D");
  const currencies = useMemo(() => Array.from(new Set(entries.map((entry) => entry.currency))), [entries]);
  const [currency, setCurrency] = useState(() => localStorage.getItem("tc-dashboard-currency") || "");

  useEffect(() => {
    if (!entries.length) return;
    const next = currencies.includes(currency) ? currency : entries[0].currency;
    if (next !== currency) setCurrency(next);
  }, [currencies, currency, entries]);

  function chooseCurrency(next: string) {
    setCurrency(next);
    localStorage.setItem("tc-dashboard-currency", next);
  }

  const cutoff = useMemo(() => {
    if (period === "ALL") return 0;
    return Date.now() - Number(period.replace("D", "")) * 86_400_000;
  }, [period]);
  const filtered = useMemo(() => entries.filter((entry) => entry.currency === currency && +new Date(entry.traded_at) >= cutoff), [entries, currency, cutoff]);
  const analytics = useMemo(() => calculateQuickJournalAnalytics(filtered), [filtered]);
  const curve = useMemo(() => calculateCumulativePnl(filtered), [filtered]);
  const chartData = curve.length ? [{ date: curve[0].date, cumulative: 0 }, ...curve] : [];
  const recent = useMemo(() => entries.filter((entry) => entry.currency === currency).slice(0, 5), [entries, currency]);
  const streak = analytics.streakDirection ? `${analytics.streak}${analytics.streakDirection}` : "None";
  const firstName = profile?.full_name?.split(" ")[0] || "member";

  return <MemberLayout>
    <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/32">Performance dashboard</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">Good to see you, {firstName}.</h1><p className="mt-2 text-sm text-white/38">A clear view of the trades you have logged.</p></div>
      {currencies.length > 1 && <label className="text-[9px] font-semibold uppercase tracking-[0.17em] text-white/30">Currency<select value={currency} onChange={(event) => chooseCurrency(event.target.value)} className="mt-2 block h-10 min-w-32 rounded-md border border-white/10 bg-black px-3 text-xs text-white outline-none">{currencies.map((item) => <option key={item}>{item}</option>)}</select></label>}
    </section>

    {isLoading ? <div className="mt-12 h-64 animate-pulse border-y border-white/[0.07] bg-white/[0.015]" /> : error ? <div className="mt-12 border-y border-white/[0.07] py-14"><p className="text-sm text-white/55">We could not load your journal right now.</p><p className="mt-2 text-xs text-white/25">Please refresh the page or try again shortly.</p></div> : entries.length === 0 ? <section className="mt-14 border-y border-white/[0.07] py-16 text-center"><BarChart3 className="mx-auto size-7 text-white/35" /><h2 className="mt-5 text-xl font-semibold tracking-[-0.03em]">Your dashboard starts with one trade</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">Log the result, currency and a short note. Your performance will calculate automatically.</p><Link href="/dashboard/journal?new=1" className="mt-7 inline-flex h-11 items-center gap-2 rounded-md bg-[#d8d8d8] px-5 text-xs font-semibold text-black"><Plus className="size-4" />Log first trade</Link></section> : <>
      <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-x-9">
        <Metric label="Total P&L" value={money(analytics.netPnl, currency)} detail={`${analytics.wins} wins · ${analytics.losses} losses`} icon={ArrowUpRight} delay={0.03} />
        <Metric label="Win rate" value={`${analytics.winRate.toFixed(1)}%`} detail={`${analytics.breakeven} breakeven excluded`} icon={Target} delay={0.06} />
        <Metric label="Trades" value={String(analytics.tradeCount)} detail={`${period === "ALL" ? "All time" : `Last ${period.replace("D", " days")}`}`} icon={Activity} delay={0.09} />
        <Metric label="Current streak" value={streak} detail={analytics.streakDirection === "W" ? "Winning streak" : analytics.streakDirection === "L" ? "Losing streak" : "Reset by breakeven"} icon={Clock3} delay={0.12} />
      </div>

      <section className="mt-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-base font-semibold">Cumulative P&amp;L</h2><p className="mt-1 text-xs text-white/30">{currency} only. Different currencies are never combined.</p></div><div className="flex w-fit rounded-md bg-white/[0.035] p-1">{(["7D", "30D", "90D", "ALL"] as Period[]).map((item) => <button key={item} onClick={() => setPeriod(item)} className={`rounded px-3 py-1.5 text-[10px] font-semibold transition ${period === item ? "bg-white/10 text-white" : "text-white/25 hover:text-white/60"}`}>{item}</button>)}</div></div>
        <div className="mt-6 h-[300px] sm:h-[360px]">{filtered.length === 0 ? <div className="grid h-full place-items-center border-y border-white/[0.07]"><p className="text-sm text-white/30">No {currency} trades in this period.</p></div> : <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}><defs><linearGradient id="pnl-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d8d8d8" stopOpacity={0.2} /><stop offset="100%" stopColor="#d8d8d8" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(255,255,255,.065)" strokeDasharray="4 5" /><XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" })} tick={{ fill: "rgba(255,255,255,.24)", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={30} /><YAxis tickFormatter={(value) => money(Number(value), currency)} width={78} tick={{ fill: "rgba(255,255,255,.2)", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#080808", border: "1px solid rgba(255,255,255,.14)", borderRadius: 6, color: "#fff", fontSize: 12 }} labelFormatter={(date) => new Date(date).toLocaleString("en-ZA")} formatter={(value) => [money(Number(value), currency), "Cumulative P&L"]} /><Area type="linear" dataKey="cumulative" stroke="#d8d8d8" strokeWidth={2} fill="url(#pnl-fill)" activeDot={{ r: 4, fill: "#050505", stroke: "#fff" }} /></AreaChart></ResponsiveContainer>}</div>
      </section>

      <section className="mt-12 border-t border-white/[0.08] pt-8"><div className="flex items-center justify-between"><div><h2 className="text-base font-semibold">Recent entries</h2><p className="mt-1 text-xs text-white/30">Your five latest {currency} trades</p></div><Link href="/dashboard/journal" className="text-xs text-white/40 transition hover:text-white">View journal →</Link></div><div className="mt-4 divide-y divide-white/[0.07]">{recent.map((entry) => <div key={entry.id} className="grid grid-cols-[1fr_auto] items-center py-4 sm:grid-cols-[1fr_0.8fr_auto]"><div><p className="text-xs font-semibold">{entry.symbol}</p><p className="mt-1 text-[9px] text-white/25">{new Date(entry.traded_at).toLocaleString("en-ZA")}</p></div><p className="hidden text-xs uppercase tracking-wider text-white/30 sm:block">{entry.side}</p><p className={`font-mono text-xs ${Number(entry.pnl_amount) >= 0 ? "text-white" : "text-white/42"}`}>{money(Number(entry.pnl_amount), currency)}</p></div>)}</div></section>
    </>}
  </MemberLayout>;
}
