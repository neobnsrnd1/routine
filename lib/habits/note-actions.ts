"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type NoteActionResult =
  | { success: true }
  | {
      success: false;
      kind: "validation" | "auth" | "not_found" | "archived" | "conflict" | "error";
      message: string;
    };
const idOf = (v: unknown) => {
  const id = String(v ?? "").trim();
  return uuid.test(id) ? id : null;
};
const noteOf = (v: unknown) => {
  const note = String(v ?? "").trim();
  if (!note) return { note: null, message: "메모를 입력해 주세요." };
  if (Array.from(note).length > 1000)
    return { note: null, message: "메모는 1,000자 이하로 입력해 주세요." };
  return { note, message: "" };
};
async function auth() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub, authError: error };
}
const revalidate = (habitId: string) => {
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath(`/habits/${habitId}`);
};
export async function createCompletionNote(
  idValue: string,
  rawNote: string,
): Promise<NoteActionResult> {
  const id = idOf(idValue),
    { note, message } = noteOf(rawNote);
  if (!id) return { success: false, kind: "validation", message: "완료 기록을 찾을 수 없습니다." };
  if (!note) return { success: false, kind: "validation", message };
  try {
    const { supabase, userId, authError } = await auth();
    if (authError || !userId)
      return { success: false, kind: "auth", message: "로그인 상태를 확인해 주세요." };
    const { data: completion, error } = await supabase
      .from("habit_completions")
      .select("id, habit_id, habits!inner(archived_at)")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return { success: false, kind: "error", message: "메모 저장에 실패했습니다." };
    if (!completion)
      return { success: false, kind: "not_found", message: "완료 기록을 찾을 수 없습니다." };
    const habit = Array.isArray(completion.habits) ? completion.habits[0] : completion.habits;
    if (habit?.archived_at)
      return {
        success: false,
        kind: "archived",
        message: "보관된 습관에는 새 메모를 추가할 수 없습니다.",
      };
    const { error: insertError } = await supabase
      .from("habit_completion_notes")
      .insert({ completion_id: id, user_id: userId, note });
    if (insertError)
      return insertError.code === "23505"
        ? { success: false, kind: "conflict", message: "이미 메모가 존재합니다." }
        : { success: false, kind: "error", message: "메모 저장에 실패했습니다." };
    revalidate(completion.habit_id);
    return { success: true };
  } catch {
    return { success: false, kind: "error", message: "메모 저장에 실패했습니다." };
  }
}
export async function updateCompletionNote(
  idValue: string,
  rawNote: string,
): Promise<NoteActionResult> {
  const id = idOf(idValue),
    { note, message } = noteOf(rawNote);
  if (!id) return { success: false, kind: "validation", message: "완료 기록을 찾을 수 없습니다." };
  if (!note) return { success: false, kind: "validation", message };
  try {
    const { supabase, userId, authError } = await auth();
    if (authError || !userId)
      return { success: false, kind: "auth", message: "로그인 상태를 확인해 주세요." };
    const { data, error } = await supabase
      .from("habit_completion_notes")
      .update({ note })
      .eq("completion_id", id)
      .eq("user_id", userId)
      .select("completion_id")
      .maybeSingle();
    if (error) return { success: false, kind: "error", message: "메모 저장에 실패했습니다." };
    if (!data) return { success: false, kind: "not_found", message: "메모를 찾을 수 없습니다." };
    const { data: completion } = await supabase
      .from("habit_completions")
      .select("habit_id")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (completion) revalidate(completion.habit_id);
    return { success: true };
  } catch {
    return { success: false, kind: "error", message: "메모 저장에 실패했습니다." };
  }
}
export async function deleteCompletionNote(idValue: string): Promise<NoteActionResult> {
  const id = idOf(idValue);
  if (!id) return { success: false, kind: "validation", message: "완료 기록을 찾을 수 없습니다." };
  try {
    const { supabase, userId, authError } = await auth();
    if (authError || !userId)
      return { success: false, kind: "auth", message: "로그인 상태를 확인해 주세요." };
    const { error } = await supabase
      .from("habit_completion_notes")
      .delete()
      .eq("completion_id", id)
      .eq("user_id", userId);
    if (error) return { success: false, kind: "error", message: "메모를 삭제하지 못했습니다." };
    const { data: completion } = await supabase
      .from("habit_completions")
      .select("habit_id")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (completion) revalidate(completion.habit_id);
    return { success: true };
  } catch {
    return { success: false, kind: "error", message: "메모를 삭제하지 못했습니다." };
  }
}
