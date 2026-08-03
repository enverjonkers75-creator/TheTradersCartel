import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const passwordRule = z.string().min(10).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/);
const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("signup"),
    email: z.string().email().max(254),
    password: passwordRule,
    fullName: z.string().trim().min(2).max(120),
    website: z.string().max(0).optional(),
  }),
  z.object({ action: z.literal("recovery"), email: z.string().email().max(254) }),
]);

const attempts = new Map<string, { count: number; resetAt: number }>();

function allowRequest(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60_000 });
    return true;
  }
  if (current.count >= 8) return false;
  current.count += 1;
  return true;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;",
  })[character] || character);
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MEMBERSHIP_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Authentication email delivery is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  if (!allowRequest(ip)) return res.status(429).json({ success: false, message: "Too many attempts. Wait 15 minutes and try again." });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ success: false, message: "Invalid request" }); }
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Check the information and try again." });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecret) return res.status(503).json({ success: false, message: "Member registration is temporarily unavailable." });

  const siteUrl = (process.env.PUBLIC_SITE_URL || "https://thetraderscartel.co.za").replace(/\/$/, "");
  const admin = createClient(supabaseUrl, supabaseSecret, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    if (parsed.data.action === "signup") {
      if (parsed.data.website) return res.status(200).json({ success: true });
      const email = parsed.data.email.trim().toLowerCase();
      const { data, error } = await admin.auth.admin.generateLink({
        type: "signup",
        email,
        password: parsed.data.password,
        options: {
          data: { full_name: parsed.data.fullName.trim() },
          redirectTo: `${siteUrl}/pending`,
        },
      });
      if (error) {
        const duplicate = /already|registered|exists/i.test(error.message);
        return res.status(duplicate ? 409 : 503).json({ success: false, message: duplicate ? "An account already exists for this email. Sign in or reset your password." : "We could not create the account. Please try again shortly." });
      }
      try {
        await sendEmail(
          email,
          "Confirm your Traders Cartel account",
          `<div style="background:#080808;color:#f5f5f5;padding:32px;font-family:Arial,sans-serif"><h1 style="font-size:24px">Confirm your email</h1><p>Hi ${escapeHtml(parsed.data.fullName.trim())}, confirm your email address to send your membership to the owner for approval.</p><p style="margin-top:28px"><a href="${escapeHtml(data.properties.action_link)}" style="display:inline-block;background:#fff;color:#000;padding:12px 18px;text-decoration:none;font-weight:700">Confirm email</a></p><p style="color:#888;font-size:12px;margin-top:24px">If you did not create this account, you can ignore this email.</p></div>`,
        );
      } catch (emailError) {
        if (data.user?.id) await admin.auth.admin.deleteUser(data.user.id);
        throw emailError;
      }
      return res.status(200).json({ success: true });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${siteUrl}/reset-password` },
    });
    if (!error) {
      await sendEmail(
        email,
        "Reset your Traders Cartel password",
        `<div style="background:#080808;color:#f5f5f5;padding:32px;font-family:Arial,sans-serif"><h1 style="font-size:24px">Reset your password</h1><p>Use the secure link below to choose a new password.</p><p style="margin-top:28px"><a href="${escapeHtml(data.properties.action_link)}" style="display:inline-block;background:#fff;color:#000;padding:12px 18px;text-decoration:none;font-weight:700">Reset password</a></p><p style="color:#888;font-size:12px;margin-top:24px">If you did not request this, you can ignore this email.</p></div>`,
      );
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Authentication email error:", error instanceof Error ? error.message : error);
    return res.status(503).json({ success: false, message: "Email delivery is temporarily unavailable. Please try again shortly." });
  }
}
