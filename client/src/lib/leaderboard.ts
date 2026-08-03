export type LeaderboardEntry = {
  id: string;
  displayName: string;
  initials: string;
  activity: Record<LeaderboardPeriod, LeaderboardActivity>;
};

export type LeaderboardPeriod = "week" | "month";

export type LeaderboardActivity = {
  trades: number;
  totalLots: number;
};

export type LeaderboardFeed = {
  status: "preview" | "live";
  updatedAt: string | null;
  entries: LeaderboardEntry[];
};

// Replace this feed with the broker/API response when access is available.
// Keeping the page dependent on this shape avoids a visual rebuild later.
export const leaderboardFeed: LeaderboardFeed = {
  status: "preview",
  updatedAt: null,
  entries: [
    { id: "preview-1", displayName: "Aaliyah M", initials: "AM", activity: { week: { trades: 18, totalLots: 7.4 }, month: { trades: 58, totalLots: 23.8 } } },
    { id: "preview-2", displayName: "Daniel K", initials: "DK", activity: { week: { trades: 16, totalLots: 6.8 }, month: { trades: 47, totalLots: 19.2 } } },
    { id: "preview-3", displayName: "Mikhail S", initials: "MS", activity: { week: { trades: 14, totalLots: 5.9 }, month: { trades: 52, totalLots: 21.5 } } },
    { id: "preview-4", displayName: "Tariq J", initials: "TJ", activity: { week: { trades: 13, totalLots: 5.2 }, month: { trades: 38, totalLots: 16.1 } } },
    { id: "preview-5", displayName: "Nicole R", initials: "NR", activity: { week: { trades: 12, totalLots: 4.8 }, month: { trades: 55, totalLots: 22.4 } } },
    { id: "preview-6", displayName: "Keenan B", initials: "KB", activity: { week: { trades: 11, totalLots: 4.4 }, month: { trades: 69, totalLots: 27.6 } } },
    { id: "preview-7", displayName: "Zahra E", initials: "ZE", activity: { week: { trades: 9, totalLots: 3.7 }, month: { trades: 41, totalLots: 17.3 } } },
    { id: "preview-8", displayName: "Liam P", initials: "LP", activity: { week: { trades: 8, totalLots: 3.3 }, month: { trades: 44, totalLots: 18.5 } } },
  ],
};
