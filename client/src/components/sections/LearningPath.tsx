import { motion } from "framer-motion";

const levels = [
  {
    number: "01",
    level: "Beginner",
    title: "Build the language",
    description: "Start with the tools and ideas every trader needs before placing a trade.",
    topics: ["What trading is", "Candlesticks", "TradingView", "MetaTrader 5", "Market fundamentals"],
  },
  {
    number: "02",
    level: "Intermediate",
    title: "Read the market",
    description: "Move from isolated candles to understanding how price forms and moves.",
    topics: ["Market structure", "Trend and range", "Supply and demand", "Top down analysis", "Risk management"],
  },
  {
    number: "03",
    level: "Advanced",
    title: "Refine the execution",
    description: "Turn analysis into a repeatable process with advanced chart work and review.",
    topics: ["Liquidity", "Advanced charting", "Entry refinement", "Trade management", "Backtesting and journaling"],
  },
];

export function LearningPath() {
  return <section id="learning-path" className="relative overflow-hidden border-t border-white/5 bg-black py-24 sm:py-32">
    <div className="pointer-events-none absolute -right-32 top-0 size-[520px] rounded-full bg-white/[0.035] blur-[120px]" />
    <div className="container relative mx-auto px-4">
      <div className="grid gap-10 border-b border-white/10 pb-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div><p className="text-xs uppercase tracking-[0.3em] text-white/35">Three week progression</p><h2 className="mt-5 max-w-2xl text-5xl font-bold uppercase leading-[0.92] sm:text-6xl">Start where<br />you are.</h2></div>
        <p className="max-w-xl text-base leading-7 text-white/45 lg:justify-self-end">Every mentorship package follows the same complete learning path. One focused week per level, from first principles to confident chart execution.</p>
      </div>
      <div className="divide-y divide-white/10">
        {levels.map((item, index) => <motion.article key={item.level} className="group grid gap-7 py-11 md:grid-cols-[90px_0.8fr_1.2fr] md:items-start md:gap-10" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, delay: index * 0.08 }}>
          <p className="font-display text-5xl text-white/12 transition-colors duration-500 group-hover:text-white/35">{item.number}</p>
          <div><div className="flex items-center gap-3"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">{item.level}</p><span className="border border-white/15 px-2 py-1 text-[9px] uppercase tracking-widest text-white/30">1 week</span></div><h3 className="mt-4 text-3xl font-semibold uppercase">{item.title}</h3><p className="mt-4 max-w-md text-sm leading-6 text-white/40">{item.description}</p></div>
          <ol className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
            {item.topics.map((topic, topicIndex) => <li key={topic} className="flex items-center gap-4 border-b border-white/[0.07] py-4 text-sm text-white/60"><span className="font-mono text-[10px] text-white/25">{String(topicIndex + 1).padStart(2, "0")}</span>{topic}</li>)}
          </ol>
        </motion.article>)}
      </div>
    </div>
  </section>;
}
