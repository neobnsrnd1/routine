import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CompletionNote, Habit } from "./types";

const COMPLETION_PAGE_SIZE = 500;
const NOTE_CHUNK_SIZE = 300;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type ReviewPeriodType = "weekly" | "monthly";

export type ReviewPeriod = {
  type: ReviewPeriodType;
  startDate: string;
  endDate: string;
};

export type ReviewData = {
  period: ReviewPeriod;
  summary: {
    completionCount: number;
    completionDayCount: number;
    noteCount: number;
  };
  habits: {
    habitId: string;
    name: string;
    completionCount: number;
    noteCount: number;
  }[];
  notes: {
    completionId: string;
    habitId: string;
    habitName: string;
    completedDate: string;
    note: string;
    archived: boolean;
  }[];
};

type ReviewResult = { success: true; data: ReviewData } | { success: false; message: string };
type CompletionWithHabit = { id: string; habit_id: string; completed_date: string };

const errorMessage = "리뷰 데이터를 불러오지 못했습니다.";

const addDays = (value: string, amount: number) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

const isValidDate = (value: string) => {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

const todayInTimeZone = (timeZone: string) => {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return null;
  }
};

function getPeriod(type: ReviewPeriodType, referenceDate: string, today: string): ReviewPeriod {
  const cappedReferenceDate = referenceDate > today ? today : referenceDate;
  if (type === "monthly") {
    const monthStart = `${cappedReferenceDate.slice(0, 7)}-01`;
    const monthEnd = new Date(
      Date.UTC(Number(cappedReferenceDate.slice(0, 4)), Number(cappedReferenceDate.slice(5, 7)), 0),
    )
      .toISOString()
      .slice(0, 10);
    return {
      type,
      startDate: monthStart,
      endDate: monthEnd < today ? monthEnd : today,
    };
  }

  const weekday = new Date(`${cappedReferenceDate}T00:00:00Z`).getUTCDay();
  const startDate = addDays(cappedReferenceDate, -((weekday + 6) % 7));
  const weekEnd = addDays(startDate, 6);
  return {
    type,
    startDate,
    endDate: weekEnd < today ? weekEnd : today,
  };
}

function habitOrder(a: Habit, b: Habit) {
  return (
    (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER) ||
    a.created_at.localeCompare(b.created_at) ||
    a.id.localeCompare(b.id)
  );
}

async function getReviewNotes(completionIds: string[], userId: string) {
  if (!completionIds.length) return { success: true as const, rows: [] as CompletionNote[] };
  const supabase = await createClient();
  const rows: CompletionNote[] = [];
  for (let offset = 0; offset < completionIds.length; offset += NOTE_CHUNK_SIZE) {
    const ids = completionIds.slice(offset, offset + NOTE_CHUNK_SIZE);
    const { data, error } = await supabase
      .from("habit_completion_notes")
      .select("completion_id, note, created_at, updated_at")
      .eq("user_id", userId)
      .in("completion_id", ids)
      .returns<CompletionNote[]>();
    if (error || !data) return { success: false as const };
    rows.push(...data);
  }
  return { success: true as const, rows };
}

async function getReviewCompletions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  startDate: string,
  endDate: string,
) {
  const rows: CompletionWithHabit[] = [];
  for (let offset = 0; ; offset += COMPLETION_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("habit_completions")
      .select("id,habit_id,completed_date")
      .eq("user_id", userId)
      .gte("completed_date", startDate)
      .lte("completed_date", endDate)
      .order("completed_date", { ascending: true })
      .order("habit_id", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + COMPLETION_PAGE_SIZE - 1);
    if (error || !data) return { success: false as const };
    rows.push(...(data as CompletionWithHabit[]));
    if (data.length < COMPLETION_PAGE_SIZE) return { success: true as const, rows };
  }
}

export async function getReviewData(
  type: ReviewPeriodType,
  referenceDate: string,
  timeZone: string,
): Promise<ReviewResult> {
  if (
    (type !== "weekly" && type !== "monthly") ||
    !isValidDate(referenceDate) ||
    !timeZone.trim() ||
    timeZone.length > 100
  )
    return { success: false, message: errorMessage };

  const today = todayInTimeZone(timeZone);
  if (!today) return { success: false, message: errorMessage };
  const period = getPeriod(type, referenceDate, today);

  try {
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getClaims();
    const userId = auth?.claims?.sub;
    if (authError || !userId) return { success: false, message: errorMessage };

    const completions = await getReviewCompletions(
      supabase,
      userId,
      period.startDate,
      period.endDate,
    );
    if (!completions.success) return { success: false, message: errorMessage };

    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select(
        "id,user_id,name,schedule_type,days_of_week,target_per_week,sort_order,start_date,archived_at,created_at,updated_at",
      )
      .eq("user_id", userId)
      .returns<Habit[]>();
    if (habitsError || !habits) return { success: false, message: errorMessage };

    const habitById = new Map(habits.map((habit) => [habit.id, habit]));
    const completionRows = completions.rows;
    const completionIds = completionRows.map((row) => row.id);
    const notesResult = await getReviewNotes(completionIds, userId);
    if (!notesResult.success) return { success: false, message: errorMessage };

    const noteByCompletion = new Map(notesResult.rows.map((note) => [note.completion_id, note]));
    const completionCountByHabit = new Map<string, number>();
    for (const row of completionRows) {
      completionCountByHabit.set(row.habit_id, (completionCountByHabit.get(row.habit_id) ?? 0) + 1);
    }
    const noteCountByHabit = new Map<string, number>();
    const completionById = new Map(completionRows.map((row) => [row.id, row]));
    for (const note of notesResult.rows) {
      const completion = completionById.get(note.completion_id);
      if (completion)
        noteCountByHabit.set(
          completion.habit_id,
          (noteCountByHabit.get(completion.habit_id) ?? 0) + 1,
        );
    }

    const activeHabits = habits
      .filter((habit) => !habit.archived_at && habit.start_date <= period.endDate)
      .sort(habitOrder);
    const noteTimeline = completionRows
      .map((row) => {
        const habit = habitById.get(row.habit_id);
        const note = noteByCompletion.get(row.id);
        if (!habit || !note) return null;
        return {
          completionId: row.id,
          habitId: row.habit_id,
          habitName: habit.name,
          completedDate: row.completed_date,
          note: note.note,
          archived: Boolean(habit.archived_at),
          sortOrder: habit.sort_order ?? Number.MAX_SAFE_INTEGER,
          habitCreatedAt: habit.created_at,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort(
        (a, b) =>
          b.completedDate.localeCompare(a.completedDate) ||
          a.sortOrder - b.sortOrder ||
          a.habitCreatedAt.localeCompare(b.habitCreatedAt) ||
          a.habitId.localeCompare(b.habitId) ||
          a.completionId.localeCompare(b.completionId),
      )
      .map((item) => ({
        completionId: item.completionId,
        habitId: item.habitId,
        habitName: item.habitName,
        completedDate: item.completedDate,
        note: item.note,
        archived: item.archived,
      }));

    return {
      success: true,
      data: {
        period,
        summary: {
          completionCount: completionRows.length,
          completionDayCount: new Set(completionRows.map((row) => row.completed_date)).size,
          noteCount: notesResult.rows.length,
        },
        habits: activeHabits.map((habit) => ({
          habitId: habit.id,
          name: habit.name,
          completionCount: completionCountByHabit.get(habit.id) ?? 0,
          noteCount: noteCountByHabit.get(habit.id) ?? 0,
        })),
        notes: noteTimeline,
      },
    };
  } catch (error) {
    console.error(
      "Unexpected error while loading review",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { success: false, message: errorMessage };
  }
}
