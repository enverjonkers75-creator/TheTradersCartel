import { useMemo, useState } from "react";
import { Check, Clock3, ShieldCheck, UserRoundCheck, UserRoundX } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MemberLayout } from "@/components/member/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { MemberStatus, Profile } from "@/lib/member-types";

type AdminProfile = Profile & { created_at: string; approved_at: string | null };
type Filter = "all" | MemberStatus;

const statusLabel: Record<MemberStatus, string> = { pending: "Pending", active: "Active", rejected: "Rejected", suspended: "Suspended" };

export default function AdminPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const result = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (result.error) throw result.error;
      return result.data as AdminProfile[];
    },
  });
  const filtered = useMemo(() => members.filter((member) => filter === "all" || member.status === filter), [members, filter]);
  const students = members.filter((member) => member.role === "student");

  async function changeStatus(member: AdminProfile, next: "active" | "rejected" | "suspended") {
    setBusyId(member.id);
    setMessage("");
    const { error: rpcError } = await supabase.rpc("set_member_status", { target_user: member.id, next_status: next });
    setBusyId("");
    if (rpcError) return setMessage(rpcError.message);
    setMessage(`${member.full_name || member.email} is now ${next}.`);
    await queryClient.invalidateQueries({ queryKey: ["admin-members"] });
  }

  return <MemberLayout>
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/32">Private administration</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">Member approvals</h1><p className="mt-2 text-sm text-white/38">Control access without viewing anyone’s private journal.</p></div><ShieldCheck className="size-7 text-white/35" /></div>
    {message && <p role="status" className="mt-6 border-l border-white/35 pl-3 text-xs text-white/60">{message}</p>}

    <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">{(["pending", "active", "rejected", "suspended"] as MemberStatus[]).map((status) => <button key={status} onClick={() => setFilter(status)} className={`border-t pt-4 text-left transition ${filter === status ? "border-white/60" : "border-white/[0.08] hover:border-white/25"}`}><span className="text-2xl font-semibold">{students.filter((member) => member.status === status).length}</span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30">{statusLabel[status]}</span></button>)}</div>

    <div className="mt-10 flex items-center justify-between border-y border-white/[0.07] py-4"><p className="text-xs text-white/35">{filtered.length} {filter === "all" ? "accounts" : filter}</p><button onClick={() => setFilter("all")} className={`text-[10px] uppercase tracking-wider ${filter === "all" ? "text-white" : "text-white/30 hover:text-white"}`}>Show all</button></div>

    {isLoading ? <div className="h-44 animate-pulse bg-white/[0.015]" /> : error ? <p className="py-12 text-sm text-white/45">Member records could not be loaded.</p> : filtered.length === 0 ? <div className="py-16 text-center"><Check className="mx-auto size-6 text-white/30" /><p className="mt-4 text-sm text-white/35">No {filter === "all" ? "member accounts" : filter + " members"}.</p></div> : <div className="divide-y divide-white/[0.07] border-b border-white/[0.07]">{filtered.map((member) => <article key={member.id} className="grid gap-4 py-5 lg:grid-cols-[1fr_0.55fr_auto] lg:items-center"><div><div className="flex items-center gap-2"><p className="text-sm font-medium">{member.full_name || "Unnamed member"}</p>{member.role !== "student" && <span className="rounded-full border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-wider text-white/35">{member.role}</span>}</div><p className="mt-1 text-[10px] text-white/28">{member.email}</p></div><div><p className="text-xs text-white/50">{statusLabel[member.status]}</p><p className="mt-1 flex items-center gap-1 text-[9px] text-white/22"><Clock3 className="size-3" />Joined {new Date(member.created_at).toLocaleDateString("en-ZA")}</p></div>{member.role === "student" ? <div className="flex flex-wrap justify-start gap-2 lg:justify-end">{member.status === "pending" && <><button disabled={busyId === member.id} onClick={() => changeStatus(member, "rejected")} className="flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-[10px] text-white/45 disabled:opacity-40"><UserRoundX className="size-3" />Reject</button><button disabled={busyId === member.id} onClick={() => changeStatus(member, "active")} className="flex h-9 items-center gap-2 rounded-md bg-[#d8d8d8] px-3 text-[10px] font-semibold text-black disabled:opacity-40"><UserRoundCheck className="size-3" />Approve</button></>}{member.status === "active" && <button disabled={busyId === member.id} onClick={() => changeStatus(member, "suspended")} className="flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-[10px] text-white/45 disabled:opacity-40"><UserRoundX className="size-3" />Suspend</button>}{(member.status === "suspended" || member.status === "rejected") && <button disabled={busyId === member.id} onClick={() => changeStatus(member, "active")} className="flex h-9 items-center gap-2 rounded-md border border-white/15 px-3 text-[10px] disabled:opacity-40"><UserRoundCheck className="size-3" />Reactivate</button>}</div> : <p className="text-right text-[10px] text-white/25">Protected administrator</p>}</article>)}</div>}

    <p className="mt-8 text-[10px] leading-5 text-white/24">Signed in as {profile?.email}. Approval actions are recorded in the database audit log.</p>
  </MemberLayout>;
}
