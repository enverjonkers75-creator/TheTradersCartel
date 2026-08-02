import { z } from "zod";

export const emotions = ["neutral", "calm", "confident", "anxious", "fearful", "greedy", "frustrated", "fomo", "revenge", "tired"] as const;
export const emotionSchema = z.enum(emotions);
export const currencySchema = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a three-letter currency code");

export const tradingAccountSchema = z.object({
  name: z.string().trim().min(2).max(80),
  broker: z.string().trim().max(100).optional().default(""),
  currency: currencySchema,
  startingBalance: z.coerce.number().min(0),
  isPrimary: z.boolean().default(false),
});

export const tradeSchema = z.object({
  accountId: z.string().uuid(),
  symbol: z.string().trim().min(2).max(20).transform((value) => value.toUpperCase()),
  side: z.enum(["buy", "sell"]),
  lotSize: z.coerce.number().positive(),
  openedAt: z.string().min(1),
  closedAt: z.string().min(1),
  entryPrice: z.coerce.number().positive(),
  exitPrice: z.coerce.number().positive(),
  stopLoss: z.coerce.number().positive(),
  takeProfit: z.coerce.number().positive(),
  grossPnl: z.coerce.number(),
  commission: z.coerce.number().default(0),
  swap: z.coerce.number().default(0),
  netPnl: z.coerce.number(),
  setup: z.string().trim().min(2).max(120),
  reason: z.string().trim().min(5).max(2000),
  emotion: emotionSchema,
  followedPlan: z.boolean(),
  reflection: z.string().trim().max(3000).optional().default(""),
}).superRefine((trade, ctx) => {
  if (new Date(trade.closedAt) < new Date(trade.openedAt)) ctx.addIssue({ code: "custom", path: ["closedAt"], message: "Close time must be after open time" });
  if (trade.side === "buy" && trade.stopLoss >= trade.entryPrice) ctx.addIssue({ code: "custom", path: ["stopLoss"], message: "A buy stop loss must be below entry" });
  if (trade.side === "buy" && trade.takeProfit <= trade.entryPrice) ctx.addIssue({ code: "custom", path: ["takeProfit"], message: "A buy take profit must be above entry" });
  if (trade.side === "sell" && trade.stopLoss <= trade.entryPrice) ctx.addIssue({ code: "custom", path: ["stopLoss"], message: "A sell stop loss must be above entry" });
  if (trade.side === "sell" && trade.takeProfit >= trade.entryPrice) ctx.addIssue({ code: "custom", path: ["takeProfit"], message: "A sell take profit must be below entry" });
});

export type TradeInput = z.infer<typeof tradeSchema>;

export function calculateTradeMetrics(input: Pick<TradeInput, "side" | "entryPrice" | "exitPrice" | "stopLoss" | "takeProfit">) {
  const direction = input.side === "buy" ? 1 : -1;
  const risk = Math.abs(input.entryPrice - input.stopLoss);
  const reward = Math.abs(input.takeProfit - input.entryPrice);
  const achieved = (input.exitPrice - input.entryPrice) * direction;
  return {
    riskAmount: risk,
    rewardAmount: reward,
    riskReward: risk > 0 ? reward / risk : null,
    achievedR: risk > 0 ? achieved / risk : null,
  };
}

export function groupForZarBalance(balance: number): 1 | 2 | 3 {
  if (balance < 0) throw new Error("Balance cannot be negative");
  if (balance < 20_000) return 1;
  if (balance < 50_000) return 2;
  return 3;
}

export type AnalyticsTrade = { net_pnl: number; setup: string; followed_plan: boolean; closed_at: string };

export function calculateAnalytics(trades: AnalyticsTrade[]) {
  const wins = trades.filter((trade) => Number(trade.net_pnl) > 0);
  const losses = trades.filter((trade) => Number(trade.net_pnl) < 0);
  const grossWins = wins.reduce((sum, trade) => sum + Number(trade.net_pnl), 0);
  const grossLosses = Math.abs(losses.reduce((sum, trade) => sum + Number(trade.net_pnl), 0));
  const setupTotals = trades.reduce<Record<string, number>>((totals, trade) => {
    totals[trade.setup] = (totals[trade.setup] ?? 0) + Number(trade.net_pnl);
    return totals;
  }, {});
  const strongestSetup = Object.entries(setupTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    netPnl: trades.reduce((sum, trade) => sum + Number(trade.net_pnl), 0),
    wins: wins.length,
    losses: losses.length,
    winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
    profitFactor: grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? null : 0,
    planAdherence: trades.length ? (trades.filter((trade) => trade.followed_plan).length / trades.length) * 100 : 0,
    strongestSetup,
  };
}

export function calculateEquityCurve(startingBalance: number, trades: AnalyticsTrade[]) {
  let equity = Number(startingBalance);
  let peak = equity;
  let maxDrawdown = 0;
  return [...trades].sort((a, b) => +new Date(a.closed_at) - +new Date(b.closed_at)).map((trade) => {
    equity += Number(trade.net_pnl);
    peak = Math.max(peak, equity);
    const drawdown = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    return { date: trade.closed_at, equity, drawdown, maxDrawdown };
  });
}

export const quickJournalSchema = z.object({
  symbol: z.string().trim().min(2).max(20).transform((value) => value.toUpperCase()),
  side: z.enum(["buy", "sell"]),
  pnlAmount: z.coerce.number().finite(),
  currency: currencySchema,
  tradedAt: z.string().min(1),
  notes: z.string().trim().max(2000).optional().default(""),
});

export type QuickJournalInput = z.infer<typeof quickJournalSchema>;
export type QuickJournalEntry = {
  pnl_amount: number;
  currency: string;
  traded_at: string;
};

export function validateJournalScreenshot(file: Pick<File, "type" | "size"> | null | undefined) {
  if (!file) return null;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 8 * 1024 * 1024) {
    return "Screenshot must be JPG, PNG or WebP and under 8 MB.";
  }
  return null;
}

export function calculateQuickJournalAnalytics(entries: QuickJournalEntry[]) {
  const ordered = [...entries].sort((a, b) => +new Date(b.traded_at) - +new Date(a.traded_at));
  const wins = ordered.filter((entry) => Number(entry.pnl_amount) > 0).length;
  const losses = ordered.filter((entry) => Number(entry.pnl_amount) < 0).length;
  const breakeven = ordered.length - wins - losses;
  const decided = wins + losses;
  const newest = ordered[0];
  const streakDirection = newest && Number(newest.pnl_amount) !== 0
    ? Number(newest.pnl_amount) > 0 ? "W" : "L"
    : null;
  let streak = 0;
  if (streakDirection) {
    for (const entry of ordered) {
      const result = Number(entry.pnl_amount) > 0 ? "W" : Number(entry.pnl_amount) < 0 ? "L" : "BE";
      if (result !== streakDirection) break;
      streak += 1;
    }
  }
  return {
    netPnl: ordered.reduce((total, entry) => total + Number(entry.pnl_amount), 0),
    wins,
    losses,
    breakeven,
    tradeCount: ordered.length,
    winRate: decided ? (wins / decided) * 100 : 0,
    streak,
    streakDirection,
  };
}

export function calculateCumulativePnl(entries: QuickJournalEntry[]) {
  let cumulative = 0;
  return [...entries]
    .sort((a, b) => +new Date(a.traded_at) - +new Date(b.traded_at))
    .map((entry) => {
      cumulative += Number(entry.pnl_amount);
      return { date: entry.traded_at, pnl: Number(entry.pnl_amount), cumulative };
    });
}
