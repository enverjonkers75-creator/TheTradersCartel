import { describe, expect, it } from "vitest";
import { calculateAnalytics, calculateCumulativePnl, calculateEquityCurve, calculateQuickJournalAnalytics, calculateTradeMetrics, groupForZarBalance, validateJournalScreenshot } from "@shared/member";
import { courseLessons, getCourseCompletion, isCourseLessonUnlocked } from "@/lib/course";

describe("groupForZarBalance", () => {
  it.each([[0,1],[19999.99,1],[20000,2],[49999.99,2],[50000,3],[1000000,3]])("assigns %s to group %s", (balance, group) => expect(groupForZarBalance(balance)).toBe(group));
});

describe("trade calculations", () => {
  it("calculates long risk and achieved R", () => expect(calculateTradeMetrics({ side: "buy", entryPrice: 100, exitPrice: 106, stopLoss: 98, takeProfit: 108 })).toEqual({ riskAmount: 2, rewardAmount: 8, riskReward: 4, achievedR: 3 }));
  it("calculates short risk and achieved R", () => expect(calculateTradeMetrics({ side: "sell", entryPrice: 100, exitPrice: 94, stopLoss: 102, takeProfit: 92 })).toEqual({ riskAmount: 2, rewardAmount: 8, riskReward: 4, achievedR: 3 }));
});

describe("analytics", () => {
  const trades = [
    { net_pnl: 100, setup: "Breakout", followed_plan: true, closed_at: "2026-01-01" },
    { net_pnl: -25, setup: "Pullback", followed_plan: false, closed_at: "2026-01-02" },
  ];
  it("derives real metrics", () => expect(calculateAnalytics(trades)).toMatchObject({ netPnl: 75, wins: 1, losses: 1, winRate: 50, profitFactor: 4, planAdherence: 50, strongestSetup: "Breakout" }));
  it("builds cumulative equity and drawdown", () => expect(calculateEquityCurve(1000, trades)).toEqual([
    { date: "2026-01-01", equity: 1100, drawdown: 0, maxDrawdown: 0 },
    { date: "2026-01-02", equity: 1075, drawdown: 2.272727272727273, maxDrawdown: 2.272727272727273 },
  ]));
});

describe("quick journal analytics", () => {
  it("excludes breakeven from win rate and resets the active streak", () => {
    const entries = [
      { pnl_amount: 75, currency: "ZAR", traded_at: "2026-08-01T12:00:00Z" },
      { pnl_amount: 0, currency: "ZAR", traded_at: "2026-08-02T12:00:00Z" },
      { pnl_amount: -20, currency: "ZAR", traded_at: "2026-08-03T12:00:00Z" },
      { pnl_amount: -10, currency: "ZAR", traded_at: "2026-08-04T12:00:00Z" },
    ];
    const result = calculateQuickJournalAnalytics(entries);
    expect(result).toMatchObject({ netPnl: 45, wins: 1, losses: 2, breakeven: 1, tradeCount: 4, streak: 2, streakDirection: "L" });
    expect(result.winRate).toBeCloseTo(100 / 3);
  });

  it("shows no active streak when the newest trade is breakeven", () => {
    const entries = [
      { pnl_amount: 50, currency: "USD", traded_at: "2026-08-01T12:00:00Z" },
      { pnl_amount: 0, currency: "USD", traded_at: "2026-08-02T12:00:00Z" },
    ];
    expect(calculateQuickJournalAnalytics(entries)).toMatchObject({ streak: 0, streakDirection: null, winRate: 100 });
  });

  it("sorts trades before building cumulative P&L", () => {
    const entries = [
      { pnl_amount: -25, currency: "ZAR", traded_at: "2026-08-02T12:00:00Z" },
      { pnl_amount: 100, currency: "ZAR", traded_at: "2026-08-01T12:00:00Z" },
    ];
    expect(calculateCumulativePnl(entries)).toEqual([
      { date: "2026-08-01T12:00:00Z", pnl: 100, cumulative: 100 },
      { date: "2026-08-02T12:00:00Z", pnl: -25, cumulative: 75 },
    ]);
  });
});

describe("journal screenshot validation", () => {
  it("accepts supported images up to 8 MB", () => {
    expect(validateJournalScreenshot({ type: "image/webp", size: 8 * 1024 * 1024 })).toBeNull();
  });
  it("rejects unsupported files and oversized images", () => {
    expect(validateJournalScreenshot({ type: "application/pdf", size: 1024 })).toMatch(/JPG/);
    expect(validateJournalScreenshot({ type: "image/png", size: 8 * 1024 * 1024 + 1 })).toMatch(/8 MB/);
  });
});

describe("course sequencing", () => {
  it("starts with only the introduction unlocked", () => {
    const completed = new Set<string>();
    expect(isCourseLessonUnlocked(0, completed)).toBe(true);
    expect(isCourseLessonUnlocked(1, completed)).toBe(false);
  });

  it("unlocks only the lesson immediately after a completed lesson", () => {
    const completed = new Set([courseLessons[0].key]);
    expect(isCourseLessonUnlocked(1, completed)).toBe(true);
    expect(isCourseLessonUnlocked(2, completed)).toBe(false);
  });

  it("ignores unknown progress when calculating completion", () => {
    expect(getCourseCompletion(new Set([courseLessons[0].key, "removed-lesson"]))).toEqual({
      completedCount: 1,
      percentage: 11,
    });
  });
});
