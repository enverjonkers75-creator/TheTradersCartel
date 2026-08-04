import { z } from "zod";
import { authenticateRequest, createAdminClient, createCredentialLink, createProviderAccount, removeProviderAccount, syncCompetitionAccount, type CompetitionAccountRow } from "../server/metaapi";

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), accountType: z.enum(["demo", "real"]), platform: z.enum(["mt4", "mt5"]), server: z.string().trim().min(2).max(120) }),
  z.object({ action: z.literal("configuration_link"), accountId: z.string().uuid() }),
  z.object({ action: z.literal("sync"), accountId: z.string().uuid() }),
  z.object({ action: z.literal("sync_all") }),
  z.object({ action: z.literal("disconnect"), accountId: z.string().uuid() }),
]);

function sendError(res: any, error: unknown) {
  const status = Number((error as { status?: number })?.status || 500);
  const safeStatus = status >= 400 && status < 600 ? status : 500;
  const message = error instanceof Error ? error.message : "Trading account request failed";
  console.error("Trading account API error:", message);
  return res.status(safeStatus).json({ success: false, message });
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ success: false, message: "Invalid request" }); }
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Check the account information and try again" });

  try {
    const admin = createAdminClient();
    const actor = await authenticateRequest(req, admin);
    const isAdmin = actor.role === "owner" || actor.role === "developer";

    if (parsed.data.action === "start") {
      const { data: existing } = await admin.from("competition_accounts").select("id,connection_status").eq("user_id", actor.id).eq("account_type", parsed.data.accountType).maybeSingle();
      if (existing) return res.status(409).json({ success: false, message: `Disconnect the existing ${parsed.data.accountType} account before connecting another one.` });
      const provider = await createProviderAccount({ userId: actor.id, fullName: actor.full_name, accountType: parsed.data.accountType, platform: parsed.data.platform, server: parsed.data.server });
      const { data: account, error } = await admin.from("competition_accounts").insert({
        user_id: actor.id,
        provider_account_id: provider.id,
        account_type: parsed.data.accountType,
        platform: parsed.data.platform,
        server: parsed.data.server,
        connection_status: "awaiting_credentials",
      }).select("*").single();
      if (error) {
        await removeProviderAccount(provider.id).catch(() => undefined);
        throw error;
      }
      const link = await createCredentialLink(provider.id);
      return res.status(201).json({ success: true, account, configurationLink: link.configurationLink });
    }

    if (parsed.data.action === "sync_all") {
      if (!isAdmin) return res.status(403).json({ success: false, message: "Administrator access required" });
      const { data, error } = await admin.from("competition_accounts").select("*").limit(25);
      if (error) throw error;
      const results = await Promise.allSettled((data || []).map((account) => syncCompetitionAccount(admin, account as CompetitionAccountRow)));
      return res.status(200).json({ success: true, synced: results.filter((result) => result.status === "fulfilled").length, failed: results.filter((result) => result.status === "rejected").length });
    }

    const { data: account, error } = await admin.from("competition_accounts").select("*").eq("id", parsed.data.accountId).single();
    if (error || !account) return res.status(404).json({ success: false, message: "Trading account not found" });
    if (account.user_id !== actor.id && !isAdmin) return res.status(403).json({ success: false, message: "You cannot manage this account" });

    if (parsed.data.action === "configuration_link") {
      const link = await createCredentialLink(account.provider_account_id);
      return res.status(200).json({ success: true, configurationLink: link.configurationLink });
    }
    if (parsed.data.action === "sync") {
      const result = await syncCompetitionAccount(admin, account as CompetitionAccountRow);
      return res.status(200).json({ success: true, result });
    }

    await removeProviderAccount(account.provider_account_id);
    const { error: deleteError } = await admin.from("competition_accounts").delete().eq("id", account.id);
    if (deleteError) throw deleteError;
    return res.status(200).json({ success: true });
  } catch (error) {
    return sendError(res, error);
  }
}
