import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Habit } from "./types";
import { getAllCompletionRows } from "./completion-rows";

type HabitsResult =
  | { success: true; habits: (Habit & { has_completions: boolean })[] }
  | { success: false; message: string };

export async function getActiveHabits(): Promise<HabitsResult> {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getClaims();
    const userId = authData?.claims?.sub;

    if (authError || !userId) {
      return { success: false, message: "로그인 상태를 확인할 수 없습니다. 다시 로그인해 주세요." };
    }

    const { data, error } = await supabase
      .from("habits")
      .select(
        "id, user_id, name, schedule_type, days_of_week, target_per_week, sort_order, start_date, archived_at, created_at, updated_at",
      )
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .returns<Habit[]>();

    if (error || data === null) {
      return {
        success: false,
        message: "습관 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    const habitIds = data.map((habit) => habit.id);
    const completions = await getAllCompletionRows({
      supabase,
      userId,
      habitIds,
    });

    if (!completions.success) {
      return {
        success: false,
        message: "습관 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    const completedHabitIds = new Set(completions.rows.map((completion) => completion.habit_id));
    return {
      success: true,
      habits: data.map((habit) => ({ ...habit, has_completions: completedHabitIds.has(habit.id) })),
    };
  } catch {
    return {
      success: false,
      message: "습관 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
