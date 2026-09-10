"use server";
import { createClient } from "@/lib/supabase/server";
import { getAllCompletionRows } from "./completion-rows";
export type CalendarCompletion = { habitId: string; name: string };
export async function getCalendarMonth(year: number, month: number) {
  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  )
    return {
      success: false as const,
      message: "캘린더 기록을 불러오지 못했습니다.",
    };
  try {
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getClaims();
    const userId = auth?.claims?.sub;
    if (authError || !userId)
      return {
        success: false as const,
        message: "캘린더 기록을 불러오지 못했습니다.",
      };
    const mm = String(month).padStart(2, "0"),
      start = `${year}-${mm}-01`,
      end = `${year}-${mm}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
    const completionRows = await getAllCompletionRows({
      supabase,
      userId,
      startDate: start,
      endDate: end,
    });
    if (!completionRows.success)
      return {
        success: false as const,
        message: "캘린더 기록을 불러오지 못했습니다.",
      };
    const rows = completionRows.rows;
    const ids = [...new Set(rows.map((r) => r.habit_id))];
    const { data: habits, error: habitError } = ids.length
      ? await supabase.from("habits").select("id,name").eq("user_id", userId).in("id", ids)
      : { data: [] as { id: string; name: string }[], error: null };
    if (habitError || !habits)
      return {
        success: false as const,
        message: "캘린더 기록을 불러오지 못했습니다.",
      };
    const names = new Map(habits.map((h) => [h.id, h.name]));
    const days: Record<string, CalendarCompletion[]> = {};
    for (const row of rows) {
      const name = names.get(row.habit_id);
      if (name) (days[row.completed_date] ??= []).push({ habitId: row.habit_id, name });
    }
    return { success: true as const, days };
  } catch (error) {
    console.error(
      "Unexpected error while loading calendar",
      error instanceof Error ? error.name : "UnknownError",
    );
    return {
      success: false as const,
      message: "캘린더 기록을 불러오지 못했습니다.",
    };
  }
}
