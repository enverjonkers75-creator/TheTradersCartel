import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { emotions, calculateTradeMetrics, tradeSchema } from "@shared/member";
import { supabase } from "@/lib/supabase";
import type { Trade, TradingAccount } from "@/lib/member-types";

const input = "mt-2 h-11 w-full rounded-md border border-white/[0.11] bg-black px-3 text-sm text-white outline-none focus:border-white/45";
const label = "text-[9px] font-semibold uppercase tracking-[0.17em] text-white/35";

function localDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function TradeForm({ open, onClose, accounts, userId, trade }: { open: boolean; onClose: () => void; accounts: TradingAccount[]; userId: string; trade?: Trade | null }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [file, setFile] = useState<File | null>(null);
  useEffect(() => { if (open) setError(""); }, [open, trade]);
  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const parsed = tradeSchema.safeParse({ accountId: form.get("accountId"), symbol: form.get("symbol"), side: form.get("side"), lotSize: form.get("lotSize"), openedAt: form.get("openedAt"), closedAt: form.get("closedAt"), entryPrice: form.get("entryPrice"), exitPrice: form.get("exitPrice"), stopLoss: form.get("stopLoss"), takeProfit: form.get("takeProfit"), grossPnl: form.get("grossPnl"), commission: form.get("commission"), swap: form.get("swap"), netPnl: form.get("netPnl"), setup: form.get("setup"), reason: form.get("reason"), emotion: form.get("emotion"), followedPlan: form.get("followedPlan") === "true", reflection: form.get("reflection") });
    if (!parsed.success) { setBusy(false); setError(parsed.error.issues[0]?.message || "Check the trade details."); return; }
    const value = parsed.data; const metrics = calculateTradeMetrics(value);
    const row = { user_id: userId, account_id: value.accountId, symbol: value.symbol, side: value.side, lot_size: value.lotSize, opened_at: new Date(value.openedAt).toISOString(), closed_at: new Date(value.closedAt).toISOString(), entry_price: value.entryPrice, exit_price: value.exitPrice, stop_loss: value.stopLoss, take_profit: value.takeProfit, gross_pnl: value.grossPnl, commission: value.commission, swap: value.swap, net_pnl: value.netPnl, setup: value.setup, reason: value.reason, emotion: value.emotion, followed_plan: value.followedPlan, reflection: value.reflection || null, risk_amount: metrics.riskAmount, reward_amount: metrics.rewardAmount, risk_reward: metrics.riskReward, achieved_r: metrics.achievedR, updated_at: new Date().toISOString() };
    const result = trade ? await supabase.from("trades").update(row).eq("id", trade.id).select("id").single() : await supabase.from("trades").insert(row).select("id").single();
    if (result.error) { setBusy(false); setError(result.error.message); return; }
    if (file) {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > 8 * 1024 * 1024) { setBusy(false); setError("Screenshot must be JPG, PNG or WebP and under 8 MB."); return; }
      const path = `${userId}/${result.data.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const uploaded = await supabase.storage.from("journal-media").upload(path, file);
      if (uploaded.error) { setBusy(false); setError(uploaded.error.message); return; }
      await supabase.from("trade_attachments").insert({ trade_id: result.data.id, user_id: userId, storage_path: path, mime_type: file.type, size_bytes: file.size });
    }
    await queryClient.invalidateQueries({ queryKey: ["trades"] }); setBusy(false); onClose();
  }

  const now = localDate();
  return <div className="fixed inset-0 z-[70] grid place-items-end bg-black/80 backdrop-blur-sm sm:place-items-center sm:p-5" onMouseDown={onClose}><form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border border-white/15 bg-[#080808] p-6 sm:max-w-3xl sm:rounded-xl sm:p-8"><div className="flex items-start justify-between"><div><h2 className="font-sans text-xl font-semibold normal-case tracking-normal">{trade ? "Edit trade" : "Log a closed trade"}</h2><p className="mt-1 text-sm text-white/35">Record the execution and the decision behind it.</p></div><button type="button" aria-label="Close trade form" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-white/5 text-white/50"><X className="size-4" /></button></div>{error && <p role="alert" className="mt-5 border-l border-white/40 pl-3 text-xs text-white/60">{error}</p>}<div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <label className={`${label} sm:col-span-2`}>Trading account<select name="accountId" required defaultValue={trade?.account_id || accounts.find((account) => account.is_primary)?.id || accounts[0]?.id} className={input}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select></label>
    <label className={`${label} sm:col-span-2`}>Symbol<input name="symbol" required defaultValue={trade?.symbol || ""} placeholder="XAUUSD" className={input} /></label>
    <label className={label}>Side<select name="side" defaultValue={trade?.side || "buy"} className={input}><option value="buy">Buy</option><option value="sell">Sell</option></select></label>
    <label className={label}>Lot size<input name="lotSize" type="number" step="any" min="0" required defaultValue={trade?.lot_size || ""} className={input} /></label>
    <label className={`${label} sm:col-span-2 lg:col-span-1`}>Opened<input name="openedAt" type="datetime-local" required defaultValue={localDate(trade?.opened_at) || now} className={input} /></label>
    <label className={`${label} sm:col-span-2 lg:col-span-1`}>Closed<input name="closedAt" type="datetime-local" required defaultValue={localDate(trade?.closed_at) || now} className={input} /></label>
    <label className={label}>Entry<input name="entryPrice" type="number" step="any" required defaultValue={trade?.entry_price || ""} className={input} /></label><label className={label}>Exit<input name="exitPrice" type="number" step="any" required defaultValue={trade?.exit_price || ""} className={input} /></label><label className={label}>Stop loss<input name="stopLoss" type="number" step="any" required defaultValue={trade?.stop_loss || ""} className={input} /></label><label className={label}>Take profit<input name="takeProfit" type="number" step="any" required defaultValue={trade?.take_profit || ""} className={input} /></label>
    <label className={label}>Gross P&amp;L<input name="grossPnl" type="number" step="any" required defaultValue={trade?.gross_pnl ?? ""} className={input} /></label><label className={label}>Commission<input name="commission" type="number" step="any" required defaultValue={trade?.commission ?? 0} className={input} /></label><label className={label}>Swap<input name="swap" type="number" step="any" required defaultValue={trade?.swap ?? 0} className={input} /></label><label className={label}>Broker net P&amp;L<input name="netPnl" type="number" step="any" required defaultValue={trade?.net_pnl ?? ""} className={input} /></label>
    <label className={`${label} sm:col-span-2`}>Setup<input name="setup" required defaultValue={trade?.setup || ""} placeholder="NY breakout" className={input} /></label><label className={`${label} sm:col-span-2`}>Emotion<select name="emotion" defaultValue={trade?.emotion || "neutral"} className={input}>{emotions.map((emotion) => <option key={emotion} value={emotion}>{emotion[0].toUpperCase() + emotion.slice(1)}</option>)}</select></label>
    <label className={`${label} sm:col-span-2 lg:col-span-4`}>Why did you take this trade?<textarea name="reason" required defaultValue={trade?.reason || ""} className="mt-2 min-h-24 w-full rounded-md border border-white/10 bg-black p-3 text-sm outline-none focus:border-white/45" /></label>
    <label className={`${label} sm:col-span-2`}>Did you follow your plan?<select name="followedPlan" defaultValue={String(trade?.followed_plan ?? true)} className={input}><option value="true">Yes</option><option value="false">No</option></select></label><label className={`${label} sm:col-span-2`}>Screenshot<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-xs text-white/40 file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white" /></label>
    <label className={`${label} sm:col-span-2 lg:col-span-4`}>Reflection (optional)<textarea name="reflection" defaultValue={trade?.reflection || ""} className="mt-2 min-h-20 w-full rounded-md border border-white/10 bg-black p-3 text-sm outline-none focus:border-white/45" /></label>
  </div><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="h-11 border border-white/10 px-5 text-xs text-white/50">Cancel</button><button disabled={busy} className="h-11 bg-white px-6 text-xs font-semibold text-black disabled:opacity-50">{busy ? "Saving…" : "Save trade"}</button></div></form></div>;
}
