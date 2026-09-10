"use client";

import { useActionState, useState } from "react";
import {
  archiveHabit,
  updateHabit,
  type ArchiveHabitState,
  type UpdateHabitState,
} from "@/lib/habits/actions";
import type { Habit } from "@/lib/habits/types";
import { FormMessage } from "@/components/form-message";

const initialState: UpdateHabitState = { status: "idle", message: "" };
const initialArchiveState: ArchiveHabitState = { status: "idle", message: "" };

type EditableHabit = Habit & { has_completions: boolean };

export function HabitEditForm({ habit }: { habit: EditableHabit }) {
  const [state, action, pending] = useActionState(updateHabit, initialState);
  const [archiveState, archiveAction, archivePending] = useActionState(
    archiveHabit,
    initialArchiveState,
  );
  const locked = habit.has_completions;
  const [schedule, setSchedule] = useState(habit.schedule_type);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(habit.days_of_week ?? []);
  const [targetPerWeek, setTargetPerWeek] = useState(habit.target_per_week ?? 3);
  return (
    <form
      key={state.resetKey ?? habit.updated_at}
      action={action}
      className="mt-3 space-y-2 rounded-md border p-3"
    >
      <input type="hidden" name="habit_id" value={habit.id} />
      <input
        name="name"
        defaultValue={habit.name}
        maxLength={100}
        required
        className="h-9 w-full rounded-md border px-3 text-sm"
      />
      <select
        name="schedule_type"
        value={schedule}
        onChange={(event) => setSchedule(event.target.value as EditableHabit["schedule_type"])}
        disabled={locked}
        className="h-9 w-full rounded-md border px-3 text-sm"
      >
        <option value="daily">매일</option>
        <option value="specific_days">특정 요일</option>
        <option value="weekly_target">주 N회</option>
      </select>
      {locked && (
        <>
          <input type="hidden" name="schedule_type" value={habit.schedule_type} />
          <input type="hidden" name="start_date" value={habit.start_date} />
          {(habit.days_of_week ?? []).map((day) => (
            <input key={day} type="hidden" name="days_of_week" value={day} />
          ))}
          {habit.target_per_week && (
            <input type="hidden" name="target_per_week" value={habit.target_per_week} />
          )}
        </>
      )}
      {!locked && (
        <input
          name="start_date"
          type="date"
          defaultValue={habit.start_date}
          required
          className="h-9 w-full rounded-md border px-3 text-sm"
        />
      )}
      {!locked && schedule === "specific_days" && (
        <div className="flex flex-wrap gap-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
            <label key={day} className="text-sm">
              <input
                type="checkbox"
                name="days_of_week"
                value={index}
                checked={daysOfWeek.includes(index)}
                onChange={() =>
                  setDaysOfWeek((current) =>
                    current.includes(index)
                      ? current.filter((value) => value !== index)
                      : [...current, index],
                  )
                }
              />{" "}
              {day}
            </label>
          ))}
        </div>
      )}
      {!locked && schedule === "weekly_target" && (
        <select
          name="target_per_week"
          value={targetPerWeek}
          onChange={(event) => setTargetPerWeek(Number(event.target.value))}
          className="h-9 w-full rounded-md border px-3 text-sm"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((value) => (
            <option key={value} value={value}>
              {value}회
            </option>
          ))}
        </select>
      )}
      <button type="submit" disabled={pending} className="rounded-md border px-3 py-1.5 text-sm">
        {pending ? "저장 중..." : "수정 저장"}
      </button>
      <button
        type="submit"
        formAction={archiveAction}
        disabled={archivePending}
        onClick={(event) => {
          if (!window.confirm("이 습관을 보관하시겠습니까?")) event.preventDefault();
        }}
        className="rounded-md border px-3 py-1.5 text-sm text-destructive"
      >
        {archivePending ? "보관 중..." : "보관"}
      </button>
      {locked && (
        <p className="text-xs text-muted-foreground">
          완료 기록이 있는 습관은 반복 설정을 변경할 수 없습니다.
        </p>
      )}
      <FormMessage message={state.message} status={state.status === "error" ? "error" : "success"} />
      <FormMessage
        message={archiveState.message}
        status={archiveState.status === "error" ? "error" : "success"}
      />
    </form>
  );
}
