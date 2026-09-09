"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { HabitScheduleType } from "./types";

export type CreateHabitState = {
  status: "idle" | "success" | "error";
  message: string;
  resetKey?: string;
};

const initialState: CreateHabitState = { status: "idle", message: "" };

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
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
    if (authError || !userId) return { status: "error", message: "로그인 상태를 확인할 수 없습니다." };

    const name = String(formData.get("name") ?? "").trim();
    const scheduleType = String(formData.get("schedule_type") ?? "") as HabitScheduleType;
    const startDate = String(formData.get("start_date") ?? "");
    if (!name || name.length > 100) return { status: "error", message: "습관 이름은 1~100자로 입력해 주세요." };
    if (!validDate(startDate)) return { status: "error", message: "유효한 시작일을 입력해 주세요." };

    let daysOfWeek: number[] | null = null;
    let targetPerWeek: number | null = null;
    if (scheduleType === "specific_days") {
      const values = formData.getAll("days_of_week").map((value) => Number(value));
      if (!values.length || values.some((value) => !Number.isInteger(value) || value < 0 || value > 6) || new Set(values).size !== values.length) {
        return { status: "error", message: "반복할 요일을 하나 이상 선택해 주세요." };
      }
      daysOfWeek = values.sort((a, b) => a - b);
    } else if (scheduleType === "weekly_target") {
      const value = Number(formData.get("target_per_week"));
      if (!Number.isInteger(value) || value < 1 || value > 7) return { status: "error", message: "주간 횟수는 1~7 사이로 선택해 주세요." };
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
      return { status: "error", message: "습관을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
    }
    revalidatePath("/habits");
    revalidatePath("/dashboard");
    return { status: "success", message: "습관이 등록되었습니다.", resetKey: crypto.randomUUID() };
  } catch (error) {
    console.error("Unexpected error while creating habit", error instanceof Error ? error.name : "UnknownError");
    return { status: "error", message: "습관을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
