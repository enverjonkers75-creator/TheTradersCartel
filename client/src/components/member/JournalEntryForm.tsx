import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { quickJournalSchema, validateJournalScreenshot } from "@shared/member";
import { supabase } from "@/lib/supabase";
import type { JournalEntry } from "@/lib/member-types";

const inputClass = "mt-2 h-11 w-full rounded-md border border-white/[0.11] bg-black px-3 text-sm text-white outline-none transition focus:border-white/45";
const labelClass = "text-[9px] font-semibold uppercase tracking-[0.17em] text-white/38";

function localDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function JournalEntryForm({ open, onClose, userId, entry }: { open: boolean; onClose: () => void; userId: string; entry?: JournalEntry | null }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) { setError(""); setFile(null); }
  }, [open, entry]);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const parsed = quickJournalSchema.safeParse({
      symbol: form.get("symbol"),
      side: form.get("side"),
      pnlAmount: form.get("pnlAmount"),
      currency: form.get("currency"),
      tradedAt: form.get("tradedAt"),
      notes: form.get("notes"),
    });
    if (!parsed.success) {
      setBusy(false);
      setError(parsed.error.issues[0]?.message || "Check the journal details.");
      return;
    }
    const screenshotError = validateJournalScreenshot(file);
    if (screenshotError) {
      setBusy(false);
      setError(screenshotError);
      return;
    }

    const value = parsed.data;
    const row = {
      user_id: userId,
      symbol: value.symbol,
      side: value.side,
      pnl_amount: value.pnlAmount,
      currency: value.currency,
      traded_at: new Date(value.tradedAt).toISOString(),
      notes: value.notes,
      updated_at: new Date().toISOString(),
    };
    const saved = entry
      ? await supabase.from("journal_entries").update(row).eq("id", entry.id).select("id,screenshot_path").single()
      : await supabase.from("journal_entries").insert(row).select("id,screenshot_path").single();
    if (saved.error) {
      setBusy(false);
      setError(saved.error.message);
      return;
    }

    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${userId}/${saved.data.id}/${crypto.randomUUID()}-${safeName}`;
      const uploaded = await supabase.storage.from("journal-screenshots").upload(path, file, { contentType: file.type });
      if (uploaded.error) {
        if (!entry) await supabase.from("journal_entries").delete().eq("id", saved.data.id);
        setBusy(false);
        setError(uploaded.error.message);
        return;
      }
      const updated = await supabase.from("journal_entries").update({ screenshot_path: path }).eq("id", saved.data.id);
      if (updated.error) {
        await supabase.storage.from("journal-screenshots").remove([path]);
        setBusy(false);
        setError(updated.error.message);
        return;
      }
      if (entry?.screenshot_path) await supabase.storage.from("journal-screenshots").remove([entry.screenshot_path]);
    }

    await queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
    setBusy(false);
    onClose();
  }

  return <div className="fixed inset-0 z-[70] grid place-items-end bg-black/80 backdrop-blur-sm sm:place-items-center sm:p-5" onMouseDown={onClose}>
    <form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border border-white/15 bg-[#0a0a0a] p-6 shadow-2xl sm:max-w-2xl sm:rounded-xl sm:p-8">
      <div className="flex items-start justify-between">
        <div><h2 className="text-xl font-semibold tracking-[-0.03em]">{entry ? "Edit journal entry" : "Log a trade"}</h2><p className="mt-1 text-sm text-white/35">Keep it quick. Record the result and what mattered.</p></div>
        <button type="button" aria-label="Close journal form" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-white/5 text-white/50"><X className="size-4" /></button>
      </div>
      {error && <p role="alert" className="mt-5 border-l border-white/40 pl-3 text-xs text-white/60">{error}</p>}
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>Symbol<input name="symbol" required defaultValue={entry?.symbol || ""} placeholder="XAUUSD" className={inputClass} /></label>
        <label className={labelClass}>Side<select name="side" defaultValue={entry?.side || "buy"} className={inputClass}><option value="buy">Buy</option><option value="sell">Sell</option></select></label>
        <label className={labelClass}>Profit or loss<input name="pnlAmount" type="number" step="any" required defaultValue={entry?.pnl_amount ?? ""} placeholder="250.00 or -120.00" className={inputClass} /></label>
        <label className={labelClass}>Currency<input name="currency" required minLength={3} maxLength={3} defaultValue={entry?.currency || "ZAR"} className={`${inputClass} uppercase`} /></label>
        <label className={`${labelClass} sm:col-span-2`}>Trade date and time<input name="tradedAt" type="datetime-local" required defaultValue={localDate(entry?.traded_at)} className={inputClass} /></label>
        <label className={`${labelClass} sm:col-span-2`}>Notes<textarea name="notes" defaultValue={entry?.notes || ""} placeholder="What happened? What will you repeat or change?" className="mt-2 min-h-28 w-full rounded-md border border-white/[0.11] bg-black p-3 text-sm text-white outline-none focus:border-white/45" /></label>
        <label className={`${labelClass} sm:col-span-2`}>Chart screenshot <span className="normal-case tracking-normal text-white/25">(optional)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-xs text-white/40 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white" /></label>
      </div>
      <div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="h-11 rounded-md border border-white/10 px-5 text-xs text-white/50">Cancel</button><button disabled={busy} className="h-11 rounded-md bg-[#d8d8d8] px-6 text-xs font-semibold text-black transition hover:bg-white disabled:opacity-50">{busy ? "Saving…" : "Save entry"}</button></div>
    </form>
  </div>;
}
