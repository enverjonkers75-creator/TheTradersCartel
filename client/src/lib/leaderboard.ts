export const competitionRules = {
  maximumDailyDrawdownPercent: 5,
  maximumOverallDrawdownPercent: 10,
  maximumRiskPerTradePercent: 1,
} as const;

export type CompetitionStatus = "eligible" | "breached" | "awaiting_connection";
export type CompetitionAccountType = "demo" | "real";

export type LeaderboardEntry = {
  id: string;
  rank: number;
  displayName: string;
  initials: string;
  returnPercent: number;
  maximumDailyDrawdownPercent: number;
  maximumOverallDrawdownPercent: number;
  maximumRiskPerTradePercent: number;
  educationPoints: number;
  seminarPoints: number;
  status: CompetitionStatus;
};

export type LeaderboardFeed = {
  accountType: CompetitionAccountType;
  status: "preview" | "live";
  updatedAt: string | null;
  entries: LeaderboardEntry[];
};

type UnrankedEntry = Omit<LeaderboardEntry, "rank" | "status">;

export function getCompetitionStatus(entry: UnrankedEntry): CompetitionStatus {
  return entry.maximumDailyDrawdownPercent > competitionRules.maximumDailyDrawdownPercent
    || entry.maximumOverallDrawdownPercent > competitionRules.maximumOverallDrawdownPercent
    || entry.maximumRiskPerTradePercent > competitionRules.maximumRiskPerTradePercent
    ? "breached"
    : "eligible";
}

export function rankCompetition(entries: UnrankedEntry[]): LeaderboardEntry[] {
  return entries
    .map((entry) => ({ ...entry, status: getCompetitionStatus(entry) }))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "eligible" ? -1 : 1;
      return b.returnPercent - a.returnPercent
        || a.maximumOverallDrawdownPercent - b.maximumOverallDrawdownPercent;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

// Demonstration data only. The server-side MetaTrader adapter will replace these
// metrics once read-only demo-account connections are configured.
const demoLeaderboardFeed: LeaderboardFeed = {
  accountType: "demo",
  status: "preview",
  updatedAt: null,
  entries: rankCompetition([
    { id: "preview-1", displayName: "Aaliyah M", initials: "AM", returnPercent: 14.82, maximumDailyDrawdownPercent: 2.14, maximumOverallDrawdownPercent: 4.32, maximumRiskPerTradePercent: 0.8, educationPoints: 90, seminarPoints: 20 },
    { id: "preview-2", displayName: "Daniel K", initials: "DK", returnPercent: 12.46, maximumDailyDrawdownPercent: 1.92, maximumOverallDrawdownPercent: 3.88, maximumRiskPerTradePercent: 0.72, educationPoints: 75, seminarPoints: 30 },
    { id: "preview-3", displayName: "Mikhail S", initials: "MS", returnPercent: 10.91, maximumDailyDrawdownPercent: 2.76, maximumOverallDrawdownPercent: 5.16, maximumRiskPerTradePercent: 0.94, educationPoints: 100, seminarPoints: 10 },
    { id: "preview-4", displayName: "Tariq J", initials: "TJ", returnPercent: 9.73, maximumDailyDrawdownPercent: 1.44, maximumOverallDrawdownPercent: 2.97, maximumRiskPerTradePercent: 0.65, educationPoints: 65, seminarPoints: 20 },
    { id: "preview-5", displayName: "Nicole R", initials: "NR", returnPercent: 8.58, maximumDailyDrawdownPercent: 3.31, maximumOverallDrawdownPercent: 6.74, maximumRiskPerTradePercent: 0.89, educationPoints: 85, seminarPoints: 30 },
    { id: "preview-6", displayName: "Keenan B", initials: "KB", returnPercent: 7.84, maximumDailyDrawdownPercent: 2.48, maximumOverallDrawdownPercent: 4.91, maximumRiskPerTradePercent: 0.76, educationPoints: 70, seminarPoints: 10 },
    { id: "preview-7", displayName: "Zahra E", initials: "ZE", returnPercent: 15.64, maximumDailyDrawdownPercent: 5.42, maximumOverallDrawdownPercent: 7.25, maximumRiskPerTradePercent: 0.9, educationPoints: 95, seminarPoints: 20 },
    { id: "preview-8", displayName: "Liam P", initials: "LP", returnPercent: 11.37, maximumDailyDrawdownPercent: 2.62, maximumOverallDrawdownPercent: 5.83, maximumRiskPerTradePercent: 1.18, educationPoints: 80, seminarPoints: 10 },
  ]),
};

const realLeaderboardFeed: LeaderboardFeed = {
  accountType: "real",
  status: "preview",
  updatedAt: null,
  entries: rankCompetition([
    { id: "real-preview-1", displayName: "Samantha J", initials: "SJ", returnPercent: 9.64, maximumDailyDrawdownPercent: 1.84, maximumOverallDrawdownPercent: 3.77, maximumRiskPerTradePercent: 0.68, educationPoints: 85, seminarPoints: 30 },
    { id: "real-preview-2", displayName: "Yusuf A", initials: "YA", returnPercent: 8.92, maximumDailyDrawdownPercent: 2.06, maximumOverallDrawdownPercent: 4.13, maximumRiskPerTradePercent: 0.74, educationPoints: 95, seminarPoints: 20 },
    { id: "real-preview-3", displayName: "Chad W", initials: "CW", returnPercent: 7.76, maximumDailyDrawdownPercent: 1.56, maximumOverallDrawdownPercent: 3.21, maximumRiskPerTradePercent: 0.61, educationPoints: 70, seminarPoints: 20 },
    { id: "real-preview-4", displayName: "Fatima R", initials: "FR", returnPercent: 6.85, maximumDailyDrawdownPercent: 2.48, maximumOverallDrawdownPercent: 4.86, maximumRiskPerTradePercent: 0.82, educationPoints: 100, seminarPoints: 30 },
    { id: "real-preview-5", displayName: "Jason L", initials: "JL", returnPercent: 5.93, maximumDailyDrawdownPercent: 3.02, maximumOverallDrawdownPercent: 5.92, maximumRiskPerTradePercent: 0.96, educationPoints: 60, seminarPoints: 10 },
    { id: "real-preview-6", displayName: "Thando N", initials: "TN", returnPercent: 4.81, maximumDailyDrawdownPercent: 2.37, maximumOverallDrawdownPercent: 4.48, maximumRiskPerTradePercent: 0.71, educationPoints: 80, seminarPoints: 20 },
    { id: "real-preview-7", displayName: "Riya P", initials: "RP", returnPercent: 10.28, maximumDailyDrawdownPercent: 4.11, maximumOverallDrawdownPercent: 10.34, maximumRiskPerTradePercent: 0.88, educationPoints: 90, seminarPoints: 30 },
    { id: "real-preview-8", displayName: "Mason D", initials: "MD", returnPercent: 7.18, maximumDailyDrawdownPercent: 2.89, maximumOverallDrawdownPercent: 5.61, maximumRiskPerTradePercent: 1.12, educationPoints: 75, seminarPoints: 10 },
  ]),
};

export const leaderboardFeeds: Record<CompetitionAccountType, LeaderboardFeed> = {
  demo: demoLeaderboardFeed,
  real: realLeaderboardFeed,
};

// Backwards-compatible alias for existing consumers and tests.
export const leaderboardFeed = leaderboardFeeds.demo;
