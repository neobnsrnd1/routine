export type HabitScheduleType = "daily" | "specific_days" | "weekly_target";

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  schedule_type: HabitScheduleType;
  days_of_week: number[] | null;
  target_per_week: number | null;
  sort_order?: number;
  start_date: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CompletionNote = {
  completion_id: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export type CompletionHistoryRow = {
  completion_id: string;
  completed_date: string;
  note: CompletionNote | null;
};
