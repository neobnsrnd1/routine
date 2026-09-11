"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { HabitScheduleType } from "./types";

export type CreateHabitState = {
  status: "idle" | "success" | "error";
  message: string;
  resetKey?: string;
};
export type UpdateHabitState = {
  status: "idle" | "success" | "error";
  message: string;
  resetKey?: string;
};
export type ArchiveHabitState = { status: "idle" | "success" | "error"; message: string };

const initialState: CreateHabitState = { status: "idle", message: "" };
const habitIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ReorderHabitsResult = { success: true } | { success: false; message: string };

export async function reorderHabits(habitIds: string[]): Promise<ReorderHabitsResult> {
  if (!Array.isArray(habitIds) || habitIds.some((id) => typeof id !== "string"))
    return { success: false, message: "루틴 순서가 올바르지 않습니다." };
  if (habitIds.some((id) => !habitIdPattern.test(id)) || new Set(habitIds).size !== habitIds.length)
    return { success: false, message: "루틴 순서가 올바르지 않습니다." };
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getClaims();
    if (authError || !authData?.claims?.sub)
      return { success: false, message: "로그인 상태를 확인해 주세요." };
    const { error } = await supabase.rpc("reorder_habits", { habit_ids: habitIds });
    if (error)
      return { success: false, message: "루틴 순서를 저장하지 못했습니다. 다시 시도해 주세요." };
    revalidatePath("/habits");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, message: "루틴 순서를 저장하지 못했습니다. 다시 시도해 주세요." };
  }
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function parseSchedule(formData: FormData) {
  const scheduleType = String(formData.get("schedule_type") ?? "") as HabitScheduleType;
  let daysOfWeek: number[] | null = null;
  let targetPerWeek: number | null = null;
  if (scheduleType === "specific_days") {
    const values = formData.getAll("days_of_week").map((value) => Number(value));
    if (
      !values.length ||
      values.some((value) => !Number.isInteger(value) || value < 0 || value > 6) ||
      new Set(values).size !== values.length
    )
      return null;
    daysOfWeek = values.sort((a, b) => a - b);
  } else if (scheduleType === "weekly_target") {
    const value = Number(formData.get("target_per_week"));
    if (!Number.isInteger(value) || value < 1 || value > 7) return null;
    targetPerWeek = value;
  } else if (scheduleType !== "daily") return null;
  return { scheduleType, daysOfWeek, targetPerWeek };
}

export async function archiveHabit(
  _previousState: ArchiveHabitState,
  formData: FormData,
): Promise<ArchiveHabitState> {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getClaims();
    const userId = authData?.claims?.sub;
    const habitId = String(formData.get("habit_id") ?? "");
    if (authError || !userId)
      return { status: "error", message: "로그인 상태를 확인할 수 없습니다." };
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(habitId))
      return { status: "error", message: "보관할 습관을 찾을 수 없습니다." };

    const { data, error } = await supabase
      .from("habits")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", habitId)
      .eq("user_id", userId)
      .is("archived_at", null)
      .select("id")
      .maybeSingle();
    if (error) return { status: "error", message: "습관을 보관하지 못했습니다." };
    if (!data) return { status: "error", message: "보관할 습관을 찾을 수 없습니다." };
    revalidatePath("/habits");
    revalidatePath("/dashboard");
    return { status: "success", message: "습관이 보관되었습니다." };
  } catch (error) {
    console.error(
      "Unexpected error while archiving habit",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { status: "error", message: "습관을 보관하지 못했습니다." };
  }
}

export async function updateHabit(
  _previousState: UpdateHabitState,
  formData: FormData,
): Promise<UpdateHabitState> {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getClaims();
    const userId = authData?.claims?.sub;
    const habitId = String(formData.get("habit_id") ?? "");
    if (authError || !userId)
      return { status: "error", message: "로그인 상태를 확인할 수 없습니다." };
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(habitId))
      return { status: "error", message: "수정할 습관을 찾을 수 없습니다." };
    const name = String(formData.get("name") ?? "").trim();
    const startDate = String(formData.get("start_date") ?? "");
    const schedule = parseSchedule(formData);
    if (!name || name.length > 100)
      return { status: "error", message: "습관 이름은 1~100자로 입력해 주세요." };
    if (!schedule || !validDate(startDate))
      return { status: "error", message: "입력값을 확인해 주세요." };
    const { data: current, error: currentError } = await supabase
      .from("habits")
      .select("id, schedule_type, days_of_week, target_per_week, start_date")
      .eq("id", habitId)
      .eq("user_id", userId)
      .maybeSingle();
    if (currentError || !current)
      return { status: "error", message: "수정할 습관을 찾을 수 없습니다." };
    const { count, error: completionError } = await supabase
      .from("habit_completions")
      .select("id", { count: "exact", head: true })
      .eq("habit_id", habitId)
      .eq("user_id", userId);
    if (completionError) return { status: "error", message: "습관을 수정하지 못했습니다." };
    const scheduleChanged =
      current.schedule_type !== schedule.scheduleType ||
      JSON.stringify(current.days_of_week ?? null) !== JSON.stringify(schedule.daysOfWeek) ||
      current.target_per_week !== schedule.targetPerWeek ||
      current.start_date !== startDate;
    if ((count ?? 0) > 0 && scheduleChanged)
      return {
        status: "error",
        message: "완료 기록이 있는 습관은 반복 설정을 변경할 수 없습니다.",
      };
    const { data: updated, error } = await supabase
      .from("habits")
      .update({
        name,
        schedule_type: schedule.scheduleType,
        days_of_week: schedule.daysOfWeek,
        target_per_week: schedule.targetPerWeek,
        start_date: startDate,
      })
      .eq("id", habitId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (error) {
      if (scheduleChanged) {
        const { count: currentCompletionCount } = await supabase
          .from("habit_completions")
          .select("id", { count: "exact", head: true })
          .eq("habit_id", habitId)
          .eq("user_id", userId);
        if ((currentCompletionCount ?? 0) > 0)
          return {
            status: "error",
            message: "완료 기록이 있는 습관은 반복 설정을 변경할 수 없습니다.",
          };
      }
      return { status: "error", message: "습관을 수정하지 못했습니다." };
    }
    if (!updated) return { status: "error", message: "수정할 습관을 찾을 수 없습니다." };
    revalidatePath("/habits");
    revalidatePath("/dashboard");
    return { status: "success", message: "습관이 수정되었습니다.", resetKey: crypto.randomUUID() };
  } catch (error) {
    console.error(
      "Unexpected error while updating habit",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { status: "error", message: "습관을 수정하지 못했습니다." };
  }
}

export async function createHabit(
  _previousState: CreateHabitState = initialState,
  formData: FormData,
): Promise<CreateHabitState> {
  try {
    void _previousState;
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getClaims();
    const userId = authData?.claims?.sub;
    if (authError || !userId)
      return { status: "error", message: "로그인 상태를 확인할 수 없습니다." };

    const name = String(formData.get("name") ?? "").trim();
    const scheduleType = String(formData.get("schedule_type") ?? "") as HabitScheduleType;
    const startDate = String(formData.get("start_date") ?? "");
    if (!name || name.length > 100)
      return { status: "error", message: "습관 이름은 1~100자로 입력해 주세요." };
    if (!validDate(startDate))
      return { status: "error", message: "유효한 시작일을 입력해 주세요." };

    let daysOfWeek: number[] | null = null;
    let targetPerWeek: number | null = null;
    if (scheduleType === "specific_days") {
      const values = formData.getAll("days_of_week").map((value) => Number(value));
      if (
        !values.length ||
        values.some((value) => !Number.isInteger(value) || value < 0 || value > 6) ||
        new Set(values).size !== values.length
      ) {
        return { status: "error", message: "반복할 요일을 하나 이상 선택해 주세요." };
      }
      daysOfWeek = values.sort((a, b) => a - b);
    } else if (scheduleType === "weekly_target") {
      const value = Number(formData.get("target_per_week"));
      if (!Number.isInteger(value) || value < 1 || value > 7)
        return { status: "error", message: "주간 횟수는 1~7 사이로 선택해 주세요." };
      targetPerWeek = value;
    } else if (scheduleType !== "daily") {
      return { status: "error", message: "올바른 반복 방식을 선택해 주세요." };
    }

    const { error } = await supabase.from("habits").insert({
      user_id: userId,
      name,
      schedule_type: scheduleType,
      days_of_week: daysOfWeek,
      target_per_week: targetPerWeek,
      start_date: startDate,
    });
    if (error) {
      console.error("Failed to create habit", error);
      return {
        status: "error",
        message: "습관을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }
    revalidatePath("/habits");
    revalidatePath("/dashboard");
    return { status: "success", message: "습관이 등록되었습니다.", resetKey: crypto.randomUUID() };
  } catch (error) {
    console.error(
      "Unexpected error while creating habit",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { status: "error", message: "습관을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
