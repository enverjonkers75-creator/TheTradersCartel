export type LeaderboardEntry = {
  id: string;
  rank: number;
  displayName: string;
  initials: string;
  returnPercent: number;
  netPnl: number;
  currency: "ZAR";
  winRate: number;
  trades: number;
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
    { id: "preview-1", rank: 1, displayName: "Aaliyah M", initials: "AM", returnPercent: 24.8, netPnl: 18640, currency: "ZAR", winRate: 72.4, trades: 58 },
    { id: "preview-2", rank: 2, displayName: "Daniel K", initials: "DK", returnPercent: 21.3, netPnl: 15975, currency: "ZAR", winRate: 68.1, trades: 47 },
    { id: "preview-3", rank: 3, displayName: "Mikhail S", initials: "MS", returnPercent: 18.9, netPnl: 14175, currency: "ZAR", winRate: 65.7, trades: 52 },
    { id: "preview-4", rank: 4, displayName: "Tariq J", initials: "TJ", returnPercent: 16.4, netPnl: 12300, currency: "ZAR", winRate: 63.2, trades: 38 },
    { id: "preview-5", rank: 5, displayName: "Nicole R", initials: "NR", returnPercent: 14.7, netPnl: 11025, currency: "ZAR", winRate: 61.8, trades: 55 },
    { id: "preview-6", rank: 6, displayName: "Keenan B", initials: "KB", returnPercent: 12.6, netPnl: 9450, currency: "ZAR", winRate: 59.4, trades: 69 },
    { id: "preview-7", rank: 7, displayName: "Zahra E", initials: "ZE", returnPercent: 10.8, netPnl: 8100, currency: "ZAR", winRate: 58.6, trades: 41 },
    { id: "preview-8", rank: 8, displayName: "Liam P", initials: "LP", returnPercent: 9.3, netPnl: 6975, currency: "ZAR", winRate: 56.9, trades: 44 },
  ],
};
