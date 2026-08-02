export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export function isMemberOnline(lastSeenAt: string | null | undefined, now = Date.now()) {
  if (!lastSeenAt) return false;
  const seenAt = new Date(lastSeenAt).getTime();
  return Number.isFinite(seenAt) && now - seenAt <= ONLINE_WINDOW_MS;
}

export function formatMemberActivity(lastSeenAt: string | null | undefined, now = Date.now()) {
  if (!lastSeenAt) return "Never active";
  if (isMemberOnline(lastSeenAt, now)) return "Online now";

  const elapsed = Math.max(0, now - new Date(lastSeenAt).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `Last seen ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `Last seen ${days} day${days === 1 ? "" : "s"} ago`;
}
