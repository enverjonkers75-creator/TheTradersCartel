import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON body",
      });
    }
  }

  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errors: parsed.error.flatten(),
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecret) {
    return res.status(503).json({
      success: false,
      message: "Contact backend is not configured",
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseSecret, { auth: { persistSession: false } });
    const { error } = await supabase.from("contact_submissions").insert(parsed.data);
    if (error) throw error;

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("Contact submission error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit message",
    });
  }
}
