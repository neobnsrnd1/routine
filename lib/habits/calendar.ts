"use server";

import { createClient } from "@/lib/supabase/server";
import { getCompletionNotesByIds } from "./notes";

export type CalendarCompletion = {
  completionId: string;
  habitId: string;
  name: string;
  note: string | null;
};

export async function getCalendarMonth(year: number, month: number) {
  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  )
    return { success: false as const, message: "캘린더 기록을 불러오지 못했습니다." };
  try {
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getClaims();
    const userId = auth?.claims?.sub;
    if (authError || !userId)
      return { success: false as const, message: "캘린더 기록을 불러오지 못했습니다." };
    const mm = String(month).padStart(2, "0");
    const start = `${year}-${mm}-01`;
    const end = `${year}-${mm}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
    const { data: rows, error } = await supabase
      .from("habit_completions")
      .select("id, habit_id, completed_date")
      .eq("user_id", userId)
      .gte("completed_date", start)
      .lte("completed_date", end)
      .order("completed_date", { ascending: true });
    if (error || !rows)
      return { success: false as const, message: "캘린더 기록을 불러오지 못했습니다." };
    if (!rows.length)
      return { success: true as const, days: {} as Record<string, CalendarCompletion[]> };
    const ids = [...new Set(rows.map((row) => row.habit_id))];
    const { data: habits, error: habitError } = await supabase
      .from("habits")
      .select("id,name")
      .eq("user_id", userId)
      .in("id", ids);
    if (habitError || !habits)
      return { success: false as const, message: "캘린더 기록을 불러오지 못했습니다." };
    const notes = await getCompletionNotesByIds(
      rows.map((row) => row.id),
      userId,
    );
    if (!notes.success)
      return { success: false as const, message: "캘린더 기록을 불러오지 못했습니다." };
    const names = new Map(habits.map((habit) => [habit.id, habit.name]));
    const noteByCompletion = new Map(notes.rows.map((note) => [note.completion_id, note.note]));
    const days: Record<string, CalendarCompletion[]> = {};
    for (const row of rows) {
      const name = names.get(row.habit_id);
      if (name)
        (days[row.completed_date] ??= []).push({
          completionId: row.id,
          habitId: row.habit_id,
          name,
          note: noteByCompletion.get(row.id) ?? null,
        });
    }
    return { success: true as const, days };
  } catch (error) {
    console.error(
      "Unexpected error while loading calendar",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { success: false as const, message: "캘린더 기록을 불러오지 못했습니다." };
  }
}
