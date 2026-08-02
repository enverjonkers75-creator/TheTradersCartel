import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Menu, Plus, ShieldCheck, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Course", href: "/dashboard/course", icon: GraduationCap },
  { label: "Journal", href: "/dashboard/journal", icon: BookOpen },
];

function Brand() {
  return <img src="/logo-v2.png" alt="TheTradersCartel" className="h-auto w-[190px] object-contain object-left" />;
}

export function MemberLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const initials = profile?.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "TC";
  const admin = profile?.role === "owner" || profile?.role === "developer";

  useEffect(() => {
    if (!profile || profile.status !== "active") return;
    const touch = async () => {
      if (document.visibilityState !== "visible") return;
      const { error } = await supabase.rpc("touch_member_activity");
      if (!error) await queryClient.invalidateQueries({ queryKey: ["admin-members"] });
    };
    void touch();
    const handleActivity = () => void touch();
    const timer = window.setInterval(handleActivity, 60_000);
    window.addEventListener("focus", handleActivity);
    document.addEventListener("visibilitychange", handleActivity);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", handleActivity);
      document.removeEventListener("visibilitychange", handleActivity);
    };
  }, [profile]);

  async function handleSignOut() {
    await supabase.rpc("mark_member_offline");
    await signOut();
  }

  const nav = <>
    <p className="px-3 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/25">Workspace</p>
    <nav className="mt-4 space-y-1">
      {items.map(({ label, href, icon: Icon }) => {
        const active = href === "/dashboard" ? location === href : location.startsWith(href);
        return <Link key={href} href={href} onClick={() => setOpen(false)} className={`group flex items-center gap-3 rounded-md px-3 py-3 text-sm transition ${active ? "bg-white/[0.09] text-white" : "text-white/42 hover:bg-white/[0.045] hover:text-white/80"}`}>
          <Icon className={`size-[17px] ${active ? "text-white" : "text-white/35"}`} />
          <span>{label}</span>
          {active && <span className="ml-auto size-1.5 rounded-full bg-white/75" />}
        </Link>;
      })}
    </nav>
    {admin && <>
      <p className="mt-9 px-3 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/25">Administration</p>
      <nav className="mt-4">
        <Link href="/admin/members" onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm transition ${location.startsWith("/admin") ? "bg-white/[0.09] text-white" : "text-white/42 hover:bg-white/[0.045] hover:text-white/80"}`}>
          <ShieldCheck className="size-[17px]" />Member approvals
        </Link>
      </nav>
    </>}
  </>;

  const profileBlock = <div className="flex items-center gap-3 px-2">
    <div className="grid size-9 place-items-center rounded-full bg-[#d8d8d8] text-xs font-bold text-black">{initials}</div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm text-white/90">{profile?.full_name}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-[0.17em] text-white/32">{profile?.role === "student" ? "Member" : profile?.role}</p>
    </div>
    <button aria-label="Sign out" onClick={() => void handleSignOut()} className="text-white/30 transition hover:text-white"><LogOut className="size-4" /></button>
  </div>;

  return <div className="min-h-screen bg-[#050505] font-sans text-white selection:bg-white selection:text-black">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-white/[0.08] bg-[#080808] px-5 py-6 lg:flex">
      <div className="px-2"><Brand /></div>
      <div className="mt-14">{nav}</div>
      <div className="mt-auto border-t border-white/[0.08] pt-5">{profileBlock}</div>
    </aside>

    <AnimatePresence>{open && <>
      <motion.button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
      <motion.aside className="fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col border-r border-white/10 bg-[#080808] px-5 py-6 lg:hidden" initial={{ x: -286 }} animate={{ x: 0 }} exit={{ x: -286 }} transition={{ type: "spring", damping: 30, stiffness: 340 }}>
        <div className="flex items-center justify-between px-2"><Brand /><button aria-label="Close navigation" onClick={() => setOpen(false)} className="text-white/50"><X className="size-5" /></button></div>
        <div className="mt-12">{nav}</div>
        <div className="mt-auto border-t border-white/10 pt-5">{profileBlock}</div>
      </motion.aside>
    </>}</AnimatePresence>

    <main className="min-h-screen lg:pl-[260px]">
      <header className="sticky top-0 z-30 flex h-[68px] items-center border-b border-white/[0.08] bg-[#050505]/92 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
        <button aria-label="Open navigation" onClick={() => setOpen(true)} className="mr-3 grid size-10 place-items-center text-white/60 lg:hidden"><Menu className="size-5" /></button>
        <div className="lg:hidden"><Brand /></div>
        <div className="ml-auto">
          <Link href="/dashboard/journal?new=1" className="flex h-10 items-center gap-2 rounded-md bg-[#d8d8d8] px-3.5 text-xs font-semibold text-black transition hover:bg-white sm:px-5">
            <Plus className="size-4" /><span className="hidden sm:inline">Log trade</span><span className="sm:hidden">Trade</span>
          </Link>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-7 sm:py-10 lg:px-10 lg:py-12">{children}</div>
    </main>
  </div>;
}
