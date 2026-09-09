import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 500;

export type CompletionRow = {
  habit_id: string;
  completed_date: string;
};

type CompletionRowsParams = {
  supabase: SupabaseClient;
  userId: string;
  habitIds?: string[];
  startDate?: string;
  endDate?: string;
};

type CompletionRowsResult =
  | { success: true; rows: CompletionRow[] }
  | { success: false; error: unknown };

export async function getAllCompletionRows({
  supabase,
  userId,
  habitIds,
  startDate,
  endDate,
}: CompletionRowsParams): Promise<CompletionRowsResult> {
  if (habitIds?.length === 0) return { success: true, rows: [] };

  const rows: CompletionRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = supabase
      .from("habit_completions")
      .select("habit_id,completed_date")
      .eq("user_id", userId);
    if (habitIds) query = query.in("habit_id", habitIds);
    if (startDate) query = query.gte("completed_date", startDate);
    if (endDate) query = query.lte("completed_date", endDate);
    query = query
      .order("completed_date", { ascending: true })
      .order("habit_id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    const { data, error } = await query;
    if (error) return { success: false, error };
    rows.push(...((data ?? []) as CompletionRow[]));
    if (!data || data.length < PAGE_SIZE) return { success: true, rows };
  }
}
