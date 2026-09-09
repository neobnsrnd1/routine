export type HabitScheduleType = "daily" | "specific_days" | "weekly_target";

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  schedule_type: HabitScheduleType;
  days_of_week: number[] | null;
  target_per_week: number | null;
  start_date: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};
