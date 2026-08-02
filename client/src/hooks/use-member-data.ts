import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Trade, TradingAccount } from "@/lib/member-types";
import type { CourseLessonProgress, JournalEntry } from "@/lib/member-types";

export function useAccounts(userId?: string) {
  return useQuery({
    queryKey: ["accounts", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("trading_accounts").select("*").eq("user_id", userId!).order("is_primary", { ascending: false }).order("created_at");
      if (error) throw error;
      return (data ?? []) as TradingAccount[];
    },
  });
}

export function useTrades(userId?: string, accountId?: string) {
  return useQuery({
    queryKey: ["trades", userId, accountId],
    enabled: Boolean(userId),
    queryFn: async () => {
      let query = supabase.from("trades").select("*").eq("user_id", userId!).order("closed_at", { ascending: false });
      if (accountId) query = query.eq("account_id", accountId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Trade[];
    },
  });
}

export function useJournalEntries(userId?: string) {
  return useQuery({
    queryKey: ["journal-entries", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", userId!)
        .order("traded_at", { ascending: false });
      if (error) throw error;
      return data as JournalEntry[];
    },
  });
}

export function useCourseProgress(userId?: string) {
  return useQuery({
    queryKey: ["course-progress", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_lesson_progress")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as CourseLessonProgress[];
    },
  });
}
