import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Image as ImageIcon, Search } from "lucide-react";
import { Link, useRoute } from "wouter";
import { MemberLayout } from "@/components/member/MemberLayout";
import { useJournalEntries } from "@/hooks/use-member-data";
import { supabase } from "@/lib/supabase";

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

export default function AdminMemberJournalPage() {
  const [, params] = useRoute("/admin/members/:memberId/journal");
  const memberId = params?.memberId;
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("");
  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ["admin-member", memberId],
    enabled: Boolean(memberId),
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id,email,full_name,role,status").eq("id", memberId!).single();
      if (error) throw error;
      return data;
    },
  });
  const { data: entries = [], isLoading: entriesLoading, error } = useJournalEntries(memberId);
  const currencies = useMemo(() => Array.from(new Set(entries.map((entry) => entry.currency))).sort(), [entries]);
  const filtered = useMemo(() => entries.filter((entry) =>
    (!currency || entry.currency === currency) &&
    (!search || `${entry.symbol} ${entry.side} ${entry.notes}`.toLowerCase().includes(search.toLowerCase()))
  ), [entries, currency, search]);

  return <MemberLayout>
    <Link href="/admin/members" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 transition hover:text-white"><ArrowLeft className="size-3.5" />Member approvals</Link>
    <div className="mt-7 flex flex-col justify-between gap-5 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-end">
      <div><p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/30">Read-only journal review</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">{memberLoading ? "Loading member…" : member?.full_name || "Member journal"}</h1><p className="mt-2 text-sm text-white/38">{member?.email || "Reviewing private journal entries"}</p></div>
      <div className="flex items-center gap-3 text-white/35"><BookOpen className="size-5" /><span className="text-xs">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span></div>
    </div>

    <div className="mt-7 flex flex-col gap-3 border-y border-white/[0.07] py-4 sm:flex-row">
      <label className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-white/25" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search symbol or notes" className="h-10 w-full rounded-md bg-white/[0.035] pl-10 pr-3 text-xs outline-none focus:bg-white/[0.055]" /></label>
      {currencies.length > 1 && <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="h-10 rounded-md border border-white/10 bg-black px-3 text-xs"><option value="">All currencies</option>{currencies.map((item) => <option key={item}>{item}</option>)}</select>}
    </div>

    <div className="mt-4">
      {entriesLoading ? <div className="h-40 animate-pulse bg-white/[0.02]" /> : error ? <div className="border-b border-white/[0.07] py-16 text-center"><p className="text-sm text-white/35">This journal could not be loaded.</p></div> : filtered.length === 0 ? <div className="border-b border-white/[0.07] py-16 text-center"><p className="text-sm text-white/35">No journal entries match this view.</p></div> : <div className="divide-y divide-white/[0.07] border-b border-white/[0.07]">
        {filtered.map((entry) => <article key={entry.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_0.85fr_auto] sm:items-center">
          <div><p className="text-sm font-semibold">{entry.symbol} <span className="ml-2 text-[9px] uppercase tracking-wider text-white/30">{entry.side}</span></p><p className="mt-1 text-[10px] text-white/28">{new Date(entry.traded_at).toLocaleString("en-ZA")}</p></div>
          <div><p className={`font-mono text-sm ${Number(entry.pnl_amount) > 0 ? "text-white" : Number(entry.pnl_amount) < 0 ? "text-white/45" : "text-white/65"}`}>{money(Number(entry.pnl_amount), entry.currency)}</p><p className="mt-1 text-[10px] leading-5 text-white/32">{entry.notes || "No notes"}</p></div>
          <div className="flex justify-end">{entry.screenshot_path && <ScreenshotLink path={entry.screenshot_path} />}</div>
        </article>)}
      </div>}
    </div>
    <p className="mt-7 text-[10px] leading-5 text-white/24">Owner and developer access is view-only. Members retain full control of their own entries.</p>
  </MemberLayout>;
}
