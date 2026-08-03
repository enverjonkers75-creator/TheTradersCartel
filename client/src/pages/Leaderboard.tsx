import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, GraduationCap, ShieldCheck, Trophy, Users } from "lucide-react";
import { MemberLayout } from "@/components/member/MemberLayout";
import { competitionRules, leaderboardFeeds, type CompetitionAccountType, type LeaderboardEntry } from "@/lib/leaderboard";

const podiumLabels = ["Winner", "Second", "Third"];

function Metric({ value, label, limit }: { value: string; label: string; limit?: string }) {
  return <div className="border-l border-white/10 pl-4">
    <p className="font-display text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">{value}</p>
    <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.17em] text-white/28">{label}{limit ? ` · ${limit}` : ""}</p>
  </div>;
}

function PodiumLeader({ entry, featured = false }: { entry: LeaderboardEntry; featured?: boolean }) {
  return <motion.article
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay: entry.rank * 0.07 }}
    className={`relative border-y px-5 py-6 sm:px-6 ${featured ? "border-white/30 bg-white/[0.065] lg:-translate-y-3" : "border-white/[0.09] bg-white/[0.018]"}`}
  >
    <div className="flex items-start justify-between">
      <span className={`grid size-12 place-items-center rounded-full border text-xs font-semibold ${featured ? "border-white bg-white text-black" : "border-white/12 text-white/60"}`}>{entry.initials}</span>
      <div className="text-right"><p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/28">{podiumLabels[entry.rank - 1]}</p><p className="mt-1 font-display text-3xl text-white/50">0{entry.rank}</p></div>
    </div>
    <div className="mt-8">
      <p className="text-sm font-semibold text-white/85">{entry.displayName}</p>
      <p className="mt-4 font-display text-5xl font-semibold tracking-[-0.04em] text-white">+{entry.returnPercent.toFixed(2)}%</p>
      <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-white/28">Competition return</p>
    </div>
    <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-4 text-xs">
      <div><p className="font-mono text-white/72">{entry.maximumOverallDrawdownPercent.toFixed(2)}%</p><p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-white/24">Overall DD</p></div>
      <div><p className="font-mono text-white/72">{entry.educationPoints + entry.seminarPoints}</p><p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-white/24">Activity points</p></div>
    </div>
  </motion.article>;
}

function Status({ entry }: { entry: LeaderboardEntry }) {
  const eligible = entry.status === "eligible";
  return <span className={`inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${eligible ? "text-white/60" : "text-white/32"}`}>
    {eligible ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}{eligible ? "Eligible" : "Rule breached"}
  </span>;
}

export default function LeaderboardPage() {
  const [accountType, setAccountType] = useState<CompetitionAccountType>("demo");
  const feed = leaderboardFeeds[accountType];
  const entries = feed.entries;
  const leaders = entries.filter((entry) => entry.status === "eligible").slice(0, 3);
  const eligibleCount = entries.filter((entry) => entry.status === "eligible").length;
  const accountLabel = accountType === "demo" ? "Demo" : "Real";

  return <MemberLayout>
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/30"><ShieldCheck className="size-3.5" />Private administration</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Trading competition</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/38">Demo and real accounts compete separately. Highest verified percentage return wins within each leaderboard.</p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/28"><span className="size-1.5 rounded-full bg-white/45" />{feed.status === "live" ? "Live data" : "Preview data"}</div>
      </header>

      <div className="flex border-b border-white/[0.08] pt-6" role="tablist" aria-label="Competition account type">
        {(["demo", "real"] as const).map((type) => <button
          key={type}
          type="button"
          role="tab"
          aria-selected={accountType === type}
          onClick={() => setAccountType(type)}
          className={`relative min-w-[138px] px-4 pb-4 text-left text-[10px] font-semibold uppercase tracking-[0.17em] transition ${accountType === type ? "text-white" : "text-white/30 hover:text-white/60"}`}
        >
          {type} accounts
          {accountType === type && <motion.span layoutId="competition-tab" className="absolute inset-x-0 bottom-0 h-px bg-white" />}
        </button>)}
      </div>

      <section className="grid gap-y-6 border-b border-white/[0.08] py-8 sm:grid-cols-2 lg:grid-cols-4">
        <Metric value="Highest" label="Return wins" />
        <Metric value={`${competitionRules.maximumDailyDrawdownPercent}%`} label="Daily drawdown" limit="maximum" />
        <Metric value={`${competitionRules.maximumOverallDrawdownPercent}%`} label="Overall drawdown" limit="maximum" />
        <Metric value={`${competitionRules.maximumRiskPerTradePercent}%`} label="Risk per trade" limit="maximum" />
      </section>

      <AnimatePresence mode="wait">
        <motion.div key={accountType} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
          <section className="mt-11">
            <div className="flex items-center gap-3"><Trophy className="size-4 text-white/45" /><h2 className="text-sm font-semibold text-white/80">{accountLabel} account leaders</h2><span className="h-px flex-1 bg-white/[0.08]" /></div>
            <div className="mt-7 grid gap-4 lg:grid-cols-3 lg:items-start">
              <div className="order-2 lg:order-1"><PodiumLeader entry={leaders[1]} /></div>
              <div className="order-1 lg:order-2"><PodiumLeader entry={leaders[0]} featured /></div>
              <div className="order-3"><PodiumLeader entry={leaders[2]} /></div>
            </div>
          </section>

          <section className="mt-12 sm:mt-14">
        <div className="flex flex-col gap-3 border-b border-white/[0.09] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-sm font-semibold text-white/80">Full ranking</h2><p className="mt-1 text-[10px] text-white/25">Return ranks eligible traders; lowest overall drawdown breaks a tie.</p></div>
          <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.14em] text-white/28"><span className="flex items-center gap-1.5"><Users className="size-3" />{eligibleCount} eligible</span><span className="flex items-center gap-1.5"><GraduationCap className="size-3" />Education tracked separately</span></div>
        </div>
        <div className="overflow-x-auto"><div className="min-w-[940px]">
          <div className="grid grid-cols-[55px_minmax(180px,1fr)_105px_105px_105px_105px_105px_135px] gap-3 border-b border-white/[0.07] px-3 py-3 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/22"><span>Rank</span><span>Trader</span><span>Return</span><span>Daily DD</span><span>Overall DD</span><span>Max risk</span><span>Learning</span><span>Status</span></div>
          <div className="divide-y divide-white/[0.065]">{entries.map((entry, index) => <motion.div key={entry.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + index * 0.025 }} className={`grid grid-cols-[55px_minmax(180px,1fr)_105px_105px_105px_105px_105px_135px] items-center gap-3 px-3 py-4 text-xs transition hover:bg-white/[0.025] ${entry.status === "breached" ? "opacity-45" : ""}`}>
            <span className="font-display text-lg text-white/38">{String(entry.rank).padStart(2, "0")}</span>
            <span className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full border border-white/10 text-[9px] font-semibold text-white/55">{entry.initials}</span><span className="font-medium text-white/75">{entry.displayName}</span></span>
            <span className="font-mono text-white">+{entry.returnPercent.toFixed(2)}%</span>
            <span className="font-mono text-white/52">{entry.maximumDailyDrawdownPercent.toFixed(2)}%</span>
            <span className="font-mono text-white/52">{entry.maximumOverallDrawdownPercent.toFixed(2)}%</span>
            <span className="font-mono text-white/52">{entry.maximumRiskPerTradePercent.toFixed(2)}%</span>
            <span className="font-mono text-white/52">{entry.educationPoints + entry.seminarPoints} pts</span>
            <Status entry={entry} />
          </motion.div>)}</div>
        </div></div>
          </section>
        </motion.div>
      </AnimatePresence>
    </motion.section>
  </MemberLayout>;
}
