import { useEffect, useMemo, useState } from "react";
import { Edit3, Image as ImageIcon, Plus, Search, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { MemberLayout } from "@/components/member/MemberLayout";
import { JournalEntryForm } from "@/components/member/JournalEntryForm";
import { useAuth } from "@/contexts/AuthContext";
import { useJournalEntries } from "@/hooks/use-member-data";
import { supabase } from "@/lib/supabase";
import type { JournalEntry } from "@/lib/member-types";

function money(value: number, currency: string) {
  try { return new Intl.NumberFormat("en-ZA", { style: "currency", currency }).format(value); }
  catch { return `${currency} ${value.toFixed(2)}`; }
}

function ScreenshotLink({ path }: { path: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    supabase.storage.from("journal-screenshots").createSignedUrl(path, 3600).then(({ data }) => {
      if (active) setUrl(data?.signedUrl || "");
    });
    return () => { active = false; };
  }, [path]);
  if (!url) return <span className="grid size-9 place-items-center text-white/18"><ImageIcon className="size-4" /></span>;
  return <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open trade screenshot" className="grid size-9 place-items-center text-white/35 transition hover:bg-white/5 hover:text-white"><ImageIcon className="size-4" /></a>;
}

export default function JournalPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: entries = [], isLoading } = useJournalEntries(profile?.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") setFormOpen(true);
  }, []);

  const currencies = useMemo(() => Array.from(new Set(entries.map((entry) => entry.currency))).sort(), [entries]);
  useEffect(() => {
    if (currency && !currencies.includes(currency)) setCurrency("");
  }, [currencies, currency]);
  const filtered = useMemo(() => entries.filter((entry) =>
    (!currency || entry.currency === currency) &&
    (!search || `${entry.symbol} ${entry.side} ${entry.notes}`.toLowerCase().includes(search.toLowerCase()))
  ), [entries, currency, search]);

  async function remove(entry: JournalEntry) {
    if (!window.confirm(`Delete ${entry.symbol} from your journal?`)) return;
    setMessage("");
    const { error } = await supabase.from("journal_entries").delete().eq("id", entry.id);
    if (error) return setMessage(error.message);
    if (entry.screenshot_path) await supabase.storage.from("journal-screenshots").remove([entry.screenshot_path]);
    await queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
  }

  return <MemberLayout>
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/32">Private journal</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">Trade history</h1><p className="mt-2 text-sm text-white/38">A simple record of every decision and result.</p></div>
      <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex h-11 items-center justify-center gap-2 rounded-md bg-[#d8d8d8] px-5 text-xs font-semibold text-black transition hover:bg-white"><Plus className="size-4" />Log trade</button>
    </div>
    {message && <p className="mt-6 border-l border-white/30 pl-3 text-xs text-white/55">{message}</p>}

    <div className="mt-9 flex flex-col gap-3 border-y border-white/[0.07] py-4 sm:flex-row">
      <label className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-white/25" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search symbol or notes" className="h-10 w-full rounded-md bg-white/[0.035] pl-10 pr-3 text-xs outline-none focus:bg-white/[0.055]" /></label>
      {currencies.length > 1 && <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="h-10 rounded-md border border-white/10 bg-black px-3 text-xs"><option value="">All currencies</option>{currencies.map((item) => <option key={item}>{item}</option>)}</select>}
    </div>

    <div className="mt-4">
      {isLoading ? <div className="h-40 animate-pulse bg-white/[0.02]" /> : filtered.length === 0 ? <div className="border-b border-white/[0.07] py-16 text-center"><p className="text-sm text-white/35">No journal entries match this view.</p><button onClick={() => setFormOpen(true)} className="mt-4 text-xs text-white/60 hover:text-white">Log your first trade</button></div> : <div className="divide-y divide-white/[0.07] border-b border-white/[0.07]">
        {filtered.map((entry) => <article key={entry.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_0.85fr_auto] sm:items-center">
          <div><p className="text-sm font-semibold">{entry.symbol} <span className="ml-2 text-[9px] uppercase tracking-wider text-white/30">{entry.side}</span></p><p className="mt-1 text-[10px] text-white/28">{new Date(entry.traded_at).toLocaleString("en-ZA")}</p></div>
          <div><p className={`font-mono text-sm ${Number(entry.pnl_amount) > 0 ? "text-white" : Number(entry.pnl_amount) < 0 ? "text-white/45" : "text-white/65"}`}>{money(Number(entry.pnl_amount), entry.currency)}</p><p className="mt-1 line-clamp-1 text-[10px] text-white/28">{entry.notes || "No notes"}</p></div>
          <div className="flex justify-end gap-1">{entry.screenshot_path && <ScreenshotLink path={entry.screenshot_path} />}<button aria-label="Edit journal entry" onClick={() => { setEditing(entry); setFormOpen(true); }} className="grid size-9 place-items-center text-white/35 transition hover:bg-white/5 hover:text-white"><Edit3 className="size-4" /></button><button aria-label="Delete journal entry" onClick={() => remove(entry)} className="grid size-9 place-items-center text-white/35 transition hover:bg-white/5 hover:text-white"><Trash2 className="size-4" /></button></div>
        </article>)}
      </div>}
    </div>
    {profile && <JournalEntryForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} userId={profile.id} entry={editing} />}
  </MemberLayout>;
}
