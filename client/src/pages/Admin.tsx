import { useEffect, useMemo, useState } from "react";
import { BellRing, Check, Circle, Clock3, ShieldCheck, UserRoundCheck, UserRoundX } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MemberLayout } from "@/components/member/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { MemberStatus, Profile } from "@/lib/member-types";
import { formatMemberActivity, isMemberOnline } from "@/lib/presence";

type AdminProfile = Profile & { created_at: string; approved_at: string | null; last_seen_at: string | null };
type Filter = "all" | "online" | MemberStatus;

const statusLabel: Record<MemberStatus, string> = { pending: "Pending", active: "Approved", rejected: "Rejected", suspended: "Suspended" };

export default function AdminPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [now, setNow] = useState(Date.now());
  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const [profilesResult, presenceResult] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("member_presence").select("user_id,last_seen_at"),
      ]);
      if (profilesResult.error) throw profilesResult.error;
      if (presenceResult.error) throw presenceResult.error;
      const presence = new Map((presenceResult.data ?? []).map((item) => [item.user_id, item.last_seen_at]));
      return (profilesResult.data ?? []).map((member) => ({ ...member, last_seen_at: presence.get(member.id) ?? null })) as AdminProfile[];
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const filtered = useMemo(() => members.filter((member) => {
    if (filter === "all") return true;
    if (filter === "online") return isMemberOnline(member.last_seen_at, now);
    return member.status === filter;
  }), [members, filter, now]);
  const students = members.filter((member) => member.role === "student");
  const onlineCount = members.filter((member) => isMemberOnline(member.last_seen_at, now)).length;
  const pendingCount = students.filter((member) => member.status === "pending").length;

  async function changeStatus(member: AdminProfile, next: "active" | "rejected" | "suspended") {
    setBusyId(member.id);
    setMessage("");
    const { error: rpcError } = await supabase.rpc("set_member_status", { target_user: member.id, next_status: next });
    setBusyId("");
    if (rpcError) return setMessage(rpcError.message);
    let emailSent = false;
    if (next === "active") {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const response = await fetch("/api/membership-email", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionData.session.access_token}` },
          body: JSON.stringify({ action: "approved", targetUser: member.id }),
        });
        emailSent = response.ok;
      }
    }
    setMessage(`${member.full_name || member.email} is now ${next}.${next === "active" ? emailSent ? " Their approval email was sent." : " Approval succeeded, but the email sender is not connected yet." : ""}`);
    await queryClient.invalidateQueries({ queryKey: ["admin-members"] });
  }

  return <MemberLayout>
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/32">Private administration</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">Member approvals</h1><p className="mt-2 text-sm text-white/38">Control access without viewing anyone’s private journal.</p></div><ShieldCheck className="size-7 text-white/35" /></div>
    {message && <p role="status" className="mt-6 border-l border-white/35 pl-3 text-xs text-white/60">{message}</p>}
    {pendingCount > 0 && <div className="mt-7 flex items-start gap-4 border border-white/12 bg-white/[0.045] p-5"><BellRing className="mt-0.5 size-5 text-white/70" /><div><p className="text-sm font-medium text-white">{pendingCount === 1 ? "A new member is waiting for approval" : `${pendingCount} new members are waiting for approval`}</p><p className="mt-1 text-xs leading-5 text-white/35">Review the pending list below. Approval gives immediate access to the dashboard, journal and course.</p></div></div>}

    <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-5">
      <button onClick={() => setFilter("pending")} className={`border-t pt-4 text-left transition ${filter === "pending" ? "border-white/60" : "border-white/[0.08] hover:border-white/25"}`}><span className="text-2xl font-semibold">{pendingCount}</span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30">Pending</span></button>
      <button onClick={() => setFilter("online")} className={`border-t pt-4 text-left transition ${filter === "online" ? "border-emerald-400/70" : "border-white/[0.08] hover:border-emerald-400/35"}`}><span className="flex items-center gap-2 text-2xl font-semibold"><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />{onlineCount}</span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30">Online now</span></button>
      {(["active", "rejected", "suspended"] as MemberStatus[]).map((status) => <button key={status} onClick={() => setFilter(status)} className={`border-t pt-4 text-left transition ${filter === status ? "border-white/60" : "border-white/[0.08] hover:border-white/25"}`}><span className="text-2xl font-semibold">{students.filter((member) => member.status === status).length}</span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30">{statusLabel[status]}</span></button>)}
    </div>

    <div className="mt-10 flex items-center justify-between border-y border-white/[0.07] py-4"><p className="text-xs text-white/35">{filtered.length} {filter === "all" ? "accounts" : filter}</p><button onClick={() => setFilter("all")} className={`text-[10px] uppercase tracking-wider ${filter === "all" ? "text-white" : "text-white/30 hover:text-white"}`}>Show all</button></div>

    {isLoading ? <div className="h-44 animate-pulse bg-white/[0.015]" /> : error ? <p className="py-12 text-sm text-white/45">Member records could not be loaded.</p> : filtered.length === 0 ? <div className="py-16 text-center"><Check className="mx-auto size-6 text-white/30" /><p className="mt-4 text-sm text-white/35">No {filter === "all" ? "member accounts" : filter === "online" ? "members online right now" : filter + " members"}.</p></div> : <div className="divide-y divide-white/[0.07] border-b border-white/[0.07]">{filtered.map((member) => { const online = isMemberOnline(member.last_seen_at, now); return <article key={member.id} className="grid gap-4 py-5 lg:grid-cols-[1fr_0.65fr_0.55fr_auto] lg:items-center"><div><div className="flex items-center gap-2"><p className="text-sm font-medium">{member.full_name || "Unnamed member"}</p>{member.role !== "student" && <span className="rounded-full border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-wider text-white/35">{member.role}</span>}</div><p className="mt-1 text-[10px] text-white/28">{member.email}</p></div><div><p className={`flex items-center gap-2 text-xs ${online ? "text-emerald-300" : "text-white/35"}`}><Circle className={`size-2.5 ${online ? "fill-emerald-400 text-emerald-400" : "fill-white/10 text-white/10"}`} />{formatMemberActivity(member.last_seen_at, now)}</p><p className="mt-1 text-[9px] text-white/20">Updates every 30 seconds</p></div><div><p className="text-xs text-white/50">{statusLabel[member.status]}</p><p className="mt-1 flex items-center gap-1 text-[9px] text-white/22"><Clock3 className="size-3" />Joined {new Date(member.created_at).toLocaleDateString("en-ZA")}</p></div>{member.role === "student" ? <div className="flex flex-wrap justify-start gap-2 lg:justify-end">{member.status === "pending" && <><button disabled={busyId === member.id} onClick={() => changeStatus(member, "rejected")} className="flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-[10px] text-white/45 disabled:opacity-40"><UserRoundX className="size-3" />Reject</button><button disabled={busyId === member.id} onClick={() => changeStatus(member, "active")} className="flex h-9 items-center gap-2 rounded-md bg-[#d8d8d8] px-3 text-[10px] font-semibold text-black disabled:opacity-40"><UserRoundCheck className="size-3" />Approve</button></>}{member.status === "active" && <button disabled={busyId === member.id} onClick={() => changeStatus(member, "suspended")} className="flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-[10px] text-white/45 disabled:opacity-40"><UserRoundX className="size-3" />Suspend</button>}{(member.status === "suspended" || member.status === "rejected") && <button disabled={busyId === member.id} onClick={() => changeStatus(member, "active")} className="flex h-9 items-center gap-2 rounded-md border border-white/15 px-3 text-[10px] disabled:opacity-40"><UserRoundCheck className="size-3" />Reactivate</button>}</div> : <p className="text-right text-[10px] text-white/25">Protected administrator</p>}</article>; })}</div>}

    <p className="mt-8 text-[10px] leading-5 text-white/24">Signed in as {profile?.email}. Approval actions are recorded in the database audit log.</p>
  </MemberLayout>;
}
