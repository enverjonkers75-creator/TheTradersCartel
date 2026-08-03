export const competitionRules = {
  maximumDailyDrawdownPercent: 5,
  maximumOverallDrawdownPercent: 10,
  maximumRiskPerTradePercent: 1,
} as const;

export type CompetitionStatus = "eligible" | "breached";
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

export type UnrankedLeaderboardEntry = Omit<LeaderboardEntry, "rank" | "status"> & { ruleBreaches?: string[] };

export function getCompetitionStatus(entry: UnrankedLeaderboardEntry): CompetitionStatus {
  return (entry.ruleBreaches?.length || 0) > 0
    || entry.maximumDailyDrawdownPercent > competitionRules.maximumDailyDrawdownPercent
    || entry.maximumOverallDrawdownPercent > competitionRules.maximumOverallDrawdownPercent
    || entry.maximumRiskPerTradePercent > competitionRules.maximumRiskPerTradePercent
    ? "breached"
    : "eligible";
}

export function rankCompetition(entries: UnrankedLeaderboardEntry[]): LeaderboardEntry[] {
  return entries
    .map(({ ruleBreaches: _ruleBreaches, ...entry }) => ({ ...entry, status: getCompetitionStatus({ ...entry, ruleBreaches: _ruleBreaches }) }))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "eligible" ? -1 : 1;
      return b.returnPercent - a.returnPercent
        || a.maximumOverallDrawdownPercent - b.maximumOverallDrawdownPercent;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
