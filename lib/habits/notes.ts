import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CompletionHistoryRow, CompletionNote } from "./types";
type CompletionRecord = { id: string; completed_date: string };
export async function getCompletionHistoryWithNotes(params: {
  habitId: string;
  userId: string;
  startDate?: string;
  endDate?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("habit_completions")
    .select("id, completed_date")
    .eq("habit_id", params.habitId)
    .eq("user_id", params.userId)
    .order("completed_date", { ascending: true });
  if (params.startDate) query = query.gte("completed_date", params.startDate);
  if (params.endDate) query = query.lte("completed_date", params.endDate);
  const { data: completions, error } = await query.returns<CompletionRecord[]>();
  if (error || !completions) return { success: false as const, error };
  if (!completions.length) return { success: true as const, rows: [] as CompletionHistoryRow[] };
  const { data: notes, error: notesError } = await supabase
    .from("habit_completion_notes")
    .select("completion_id, note, created_at, updated_at")
    .eq("user_id", params.userId)
    .in(
      "completion_id",
      completions.map((row) => row.id),
    )
    .returns<CompletionNote[]>();
  if (notesError || !notes) return { success: false as const, error: notesError };
  const byCompletion = new Map(notes.map((note) => [note.completion_id, note]));
  return {
    success: true as const,
    rows: completions.map((row) => ({
      completion_id: row.id,
      completed_date: row.completed_date,
      note: byCompletion.get(row.id) ?? null,
    })),
  };
}
export async function getCompletionNoteFlags(completionIds: string[], userId: string) {
  if (!completionIds.length) return { success: true as const, noteIds: new Set<string>() };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habit_completion_notes")
    .select("completion_id")
    .eq("user_id", userId)
    .in("completion_id", completionIds);
  if (error || !data) return { success: false as const, error };
  return { success: true as const, noteIds: new Set(data.map((row) => row.completion_id)) };
}

export async function getCompletionNotesByIds(completionIds: string[], userId: string) {
  if (!completionIds.length) return { success: true as const, rows: [] as CompletionNote[] };
  const supabase = await createClient();
  const { data: notes, error: notesError } = await supabase
    .from("habit_completion_notes")
    .select("completion_id, note, created_at, updated_at")
    .eq("user_id", userId)
    .in("completion_id", completionIds)
    .returns<CompletionNote[]>();
  if (notesError || !notes) return { success: false as const, error: notesError };
  return { success: true as const, rows: notes };
}

export async function getTodayCompletionNotes(habitIds: string[], date: string, userId: string) {
  if (!habitIds.length) return { success: true as const, rows: [] as CompletionNote[] };
  const supabase = await createClient();
  const { data: completions, error } = await supabase
    .from("habit_completions")
    .select("id")
    .eq("user_id", userId)
    .in("habit_id", habitIds)
    .eq("completed_date", date);
  if (error || !completions) return { success: false as const, error };
  return getCompletionNotesByIds(
    completions.map((row) => row.id),
    userId,
  );
}
