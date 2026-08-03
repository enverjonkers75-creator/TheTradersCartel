import { motion } from "framer-motion";
import { Clock3, Medal, PlugZap, Trophy } from "lucide-react";
import { MemberLayout } from "@/components/member/MemberLayout";
import { leaderboardFeed, type LeaderboardEntry } from "@/lib/leaderboard";

const money = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

const placeLabel = ["First", "Second", "Third"];

function Leader({ entry, featured = false }: { entry: LeaderboardEntry; featured?: boolean }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: entry.rank * 0.06 }}
      className={`relative border-y px-5 py-6 sm:px-6 ${featured ? "border-white/25 bg-white/[0.055] lg:-translate-y-3" : "border-white/[0.09] bg-white/[0.018]"}`}
    >
      <div className="flex items-start justify-between">
        <div className={`grid size-12 place-items-center rounded-full border text-xs font-semibold ${featured ? "border-white/35 bg-white text-black" : "border-white/12 bg-white/[0.04] text-white/65"}`}>
          {entry.initials}
        </div>
        <div className="text-right">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25">{placeLabel[entry.rank - 1]} place</p>
          <p className={`mt-1 font-display text-3xl font-semibold ${featured ? "text-white" : "text-white/45"}`}>0{entry.rank}</p>
        </div>
      </div>
      <div className="mt-8">
        <p className="text-sm font-semibold text-white/90">{entry.displayName}</p>
        <p className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-white">+{entry.returnPercent.toFixed(1)}%</p>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25">Account return</p>
      </div>
      <div className="mt-7 grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-4">
        <div><p className="text-xs font-medium text-white/70">{money.format(entry.netPnl)}</p><p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-white/22">Net P&amp;L</p></div>
        <div><p className="text-xs font-medium text-white/70">{entry.winRate.toFixed(1)}%</p><p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-white/22">Win rate</p></div>
        <div><p className="text-xs font-medium text-white/70">{entry.trades}</p><p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-white/22">Trades</p></div>
      </div>
    </motion.article>
  );
}

export default function LeaderboardPage() {
  const leaders = leaderboardFeed.entries.slice(0, 3);

  return (
    <MemberLayout>
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex flex-col gap-6 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/30">Member performance</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Leaderboard</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/38">One ranking based on percentage return, ready for verified broker results.</p>
          </div>
          <div className="flex items-center gap-2 border border-white/10 bg-white/[0.035] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/38">
            <Clock3 className="size-3.5" /> Preview data
          </div>
        </div>

        <div className="mt-7 flex items-start gap-3 border-y border-white/[0.08] bg-white/[0.018] px-4 py-4 sm:px-5">
          <PlugZap className="mt-0.5 size-4 shrink-0 text-white/38" />
          <div><p className="text-xs font-medium text-white/65">Live rankings will activate when the trading API is connected.</p><p className="mt-1 text-[10px] leading-5 text-white/26">The names and results below are design previews and do not represent member performance.</p></div>
        </div>

        <section className="mt-11">
          <div className="flex items-center gap-3"><Trophy className="size-4 text-white/45" /><h2 className="text-sm font-semibold normal-case tracking-normal text-white/80">Top performers</h2><span className="h-px flex-1 bg-white/[0.08]" /></div>
          <div className="mt-7 grid gap-4 lg:grid-cols-3 lg:items-start">
            <div className="order-2 lg:order-1"><Leader entry={leaders[1]} /></div>
            <div className="order-1 lg:order-2"><Leader entry={leaders[0]} featured /></div>
            <div className="order-3"><Leader entry={leaders[2]} /></div>
          </div>
        </section>

        <section className="mt-12 sm:mt-14">
          <div className="flex items-end justify-between border-b border-white/[0.09] pb-4">
            <div><h2 className="text-sm font-semibold normal-case tracking-normal text-white/80">Full ranking</h2><p className="mt-1 text-[10px] text-white/25">Ordered by account return</p></div>
            <Medal className="size-4 text-white/30" />
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[70px_minmax(180px,1.3fr)_0.75fr_0.9fr_0.75fr_0.6fr] gap-4 border-b border-white/[0.07] px-3 py-3 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/22">
                <span>Rank</span><span>Trader</span><span>Return</span><span>Net P&amp;L</span><span>Win rate</span><span className="text-right">Trades</span>
              </div>
              <div className="divide-y divide-white/[0.065]">
                {leaderboardFeed.entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.16 + index * 0.025 }}
                    className="grid grid-cols-[70px_minmax(180px,1.3fr)_0.75fr_0.9fr_0.75fr_0.6fr] items-center gap-4 px-3 py-4 text-xs transition hover:bg-white/[0.025]"
                  >
                    <span className="font-display text-lg text-white/38">{String(entry.rank).padStart(2, "0")}</span>
                    <span className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-[9px] font-semibold text-white/55">{entry.initials}</span><span className="font-medium text-white/75">{entry.displayName}</span></span>
                    <span className="font-mono text-white">+{entry.returnPercent.toFixed(1)}%</span>
                    <span className="font-mono text-white/52">{money.format(entry.netPnl)}</span>
                    <span className="font-mono text-white/52">{entry.winRate.toFixed(1)}%</span>
                    <span className="text-right font-mono text-white/40">{entry.trades}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.08] py-5 text-center"><p className="text-[10px] text-white/25">Your verified position will appear here automatically once live data is connected.</p></div>
        </section>
      </motion.section>
    </MemberLayout>
  );
}
