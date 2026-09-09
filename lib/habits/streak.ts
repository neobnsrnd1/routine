import type { Habit } from "./types";

type Completion = { habit_id: string; completed_date: string };
const day = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();
const addDays = (date: string, amount: number) => { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10); };
const monday = (date: string) => addDays(date, -((day(date) + 6) % 7));

export function calculateDailyStreak(habit: Habit, completions: Completion[], today: string) {
  const done = new Set(completions.filter((row) => row.habit_id === habit.id).map((row) => row.completed_date));
  let cursor = done.has(today) ? today : addDays(today, -1); let count = 0;
  while (done.has(cursor) && cursor >= habit.start_date) { count++; cursor = addDays(cursor, -1); }
  return count;
}

export function calculateSpecificDaysStreak(habit: Habit, completions: Completion[], today: string) {
  const done = new Set(completions.filter((row) => row.habit_id === habit.id).map((row) => row.completed_date));
  const weekdays = new Set(habit.days_of_week ?? []); let cursor = today; let count = 0;
  if (!weekdays.has(day(today)) || !done.has(today)) cursor = addDays(today, -1);
  while (cursor >= habit.start_date) { if (weekdays.has(day(cursor))) { if (!done.has(cursor)) break; count++; } cursor = addDays(cursor, -1); }
  return count;
}

export function calculateWeeklyTargetStreak(habit: Habit, completions: Completion[], today: string) {
  const done = new Set(completions.filter((row) => row.habit_id === habit.id && row.completed_date >= habit.start_date).map((row) => row.completed_date));
  const target = habit.target_per_week ?? 0; let week = monday(today); let count = 0;
  const currentWeekCount = Array.from({ length: 7 }, (_, index) => done.has(addDays(week, index))).filter(Boolean).length;
  if (currentWeekCount < target) week = addDays(week, -7);
  while (addDays(week, 6) >= habit.start_date) { const total = Array.from({ length: 7 }, (_, index) => done.has(addDays(week, index))).filter(Boolean).length; if (total < target) break; count++; week = addDays(week, -7); }
  return count;
}

export function calculateHabitStreak(habit: Habit, completions: Completion[], today: string) {
  if (habit.schedule_type === "daily") return calculateDailyStreak(habit, completions, today);
  if (habit.schedule_type === "specific_days") return calculateSpecificDaysStreak(habit, completions, today);
  return calculateWeeklyTargetStreak(habit, completions, today);
}
