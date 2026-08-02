import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pending") }),
  z.object({ action: z.literal("approved"), targetUser: z.string().uuid() }),
]);

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  })[character] || character);
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MEMBERSHIP_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Membership email delivery is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecret) return res.status(503).json({ success: false, message: "Member backend is not configured" });

  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ success: false, message: "Authentication required" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ success: false, message: "Invalid request" }); }
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid request" });

  try {
    const supabase = createClient(supabaseUrl, supabaseSecret, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return res.status(401).json({ success: false, message: "Invalid session" });

    const { data: actor, error: actorError } = await supabase.from("profiles").select("id,email,full_name,role,status").eq("id", authData.user.id).single();
    if (actorError || !actor) return res.status(403).json({ success: false, message: "Member profile unavailable" });

    if (parsed.data.action === "pending") {
      if (actor.role !== "student" || actor.status !== "pending") return res.status(403).json({ success: false, message: "Pending membership required" });
      const ownerEmail = process.env.MEMBERSHIP_OWNER_EMAIL || "imaadjacobs123@gmail.com";
      await sendEmail(
        ownerEmail,
        "New member awaiting approval",
        `<div style="background:#080808;color:#f5f5f5;padding:32px;font-family:Arial,sans-serif"><h1 style="font-size:24px">New member signup</h1><p><strong>${escapeHtml(actor.full_name)}</strong> (${escapeHtml(actor.email)}) has verified their email and is waiting for approval.</p><p><a href="https://thetraderscartel.co.za/admin/members" style="color:#fff">Review member approvals</a></p></div>`,
      );
    } else {
      if (!["owner", "developer"].includes(actor.role) || actor.status !== "active") return res.status(403).json({ success: false, message: "Administrator access required" });
      const { data: member, error: memberError } = await supabase.from("profiles").select("email,full_name,status,role").eq("id", parsed.data.targetUser).single();
      if (memberError || !member || member.role !== "student" || member.status !== "active") return res.status(409).json({ success: false, message: "The member is not approved" });
      await sendEmail(
        member.email,
        "Your Traders Cartel membership is approved",
        `<div style="background:#080808;color:#f5f5f5;padding:32px;font-family:Arial,sans-serif"><h1 style="font-size:24px">You are approved</h1><p>Hi ${escapeHtml(member.full_name)}, your Traders Cartel membership has been approved. You can now access your dashboard, journal and course.</p><p><a href="https://thetraderscartel.co.za/login" style="color:#fff">Sign in to your account</a></p></div>`,
      );
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Membership email error:", error instanceof Error ? error.message : error);
    return res.status(503).json({ success: false, message: "Membership email could not be sent" });
  }
}
