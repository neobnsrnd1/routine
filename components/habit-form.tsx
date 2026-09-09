"use client";

import { useActionState, useState } from "react";
import { createHabit, type CreateHabitState } from "@/lib/habits/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const days = ["일", "월", "화", "수", "목", "금", "토"];
const initialState: CreateHabitState = { status: "idle", message: "" };

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function HabitForm() {
  const [state, formAction, pending] = useActionState(
    createHabit,
    initialState,
  );

  return (
    <HabitFormFields
      key={state.resetKey ?? "habit-form"}
      state={state}
      formAction={formAction}
      pending={pending}
    />
  );
}

type HabitFormFieldsProps = {
  state: CreateHabitState;
  formAction: (payload: FormData) => void;
  pending: boolean;
};

function HabitFormFields({ state, formAction, pending }: HabitFormFieldsProps) {
  const [schedule, setSchedule] = useState("daily");
  const [startDate, setStartDate] = useState(localToday);

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-xl border bg-card p-5"
    >
      <div className="space-y-2">
        <Label htmlFor="habit-name">습관 이름</Label>
        <Input
          id="habit-name"
          name="name"
          maxLength={100}
          required
          placeholder="예: 아침 산책"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="schedule-type">반복 방식</Label>
        <select
          id="schedule-type"
          name="schedule_type"
          value={schedule}
          onChange={(event) => setSchedule(event.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="daily">매일</option>
          <option value="specific_days">특정 요일</option>
          <option value="weekly_target">주 N회</option>
        </select>
      </div>
      {schedule === "specific_days" && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">요일 선택</legend>
          <div className="flex flex-wrap gap-3">
            {days.map((day, index) => (
              <label key={day} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="days_of_week" value={index} />
                {day}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {schedule === "weekly_target" && (
        <div className="space-y-2">
          <Label htmlFor="target-per-week">주간 횟수</Label>
          <select
            id="target-per-week"
            name="target_per_week"
            defaultValue="3"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((value) => (
              <option key={value} value={value}>
                {value}회
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="start-date">시작일</Label>
        <Input
          id="start-date"
          name="start_date"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          required
        />
      </div>
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm text-destructive"
              : "text-sm text-muted-foreground"
          }
        >
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "저장 중..." : "습관 저장"}
      </Button>
    </form>
  );
}
