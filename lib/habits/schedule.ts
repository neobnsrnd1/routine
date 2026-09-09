import type { Habit } from "./types";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

export function formatHabitSchedule(
  habit: Pick<Habit, "schedule_type" | "days_of_week" | "target_per_week">,
): string {
  switch (habit.schedule_type) {
    case "daily":
      return "매일";
    case "specific_days":
      return [...(habit.days_of_week ?? [])]
        .sort((a, b) => a - b)
        .map((day) => weekdays[day])
        .join(" · ");
    case "weekly_target":
      return `주 ${habit.target_per_week}회`;
  }
}
