"use client";

import { useActionState, useState } from "react";
import { createHabit, type CreateHabitState } from "@/lib/habits/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/form-message";

const days = ["일", "월", "화", "수", "목", "금", "토"];
const initialState: CreateHabitState = { status: "idle", message: "" };

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function HabitForm() {
  const [state, formAction, pending] = useActionState(createHabit, initialState);

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
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [daysError, setDaysError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (schedule === "specific_days" && selectedDays.length === 0) {
      event.preventDefault();
      setDaysError("최소 하나의 요일을 선택해 주세요.");
      return;
    }
    setDaysError("");
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-card p-5">
      <div className="space-y-2">
        <Label htmlFor="habit-name">습관 이름</Label>
        <Input id="habit-name" name="name" maxLength={100} required placeholder="예: 아침 산책" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="schedule-type">반복 방식</Label>
        <select
          id="schedule-type"
          name="schedule_type"
          value={schedule}
          onChange={(event) => {
            setSchedule(event.target.value);
            setDaysError("");
          }}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="daily">매일</option>
          <option value="specific_days">특정 요일</option>
          <option value="weekly_target">주 N회</option>
        </select>
        <p className="text-sm text-muted-foreground">
          {schedule === "daily"
            ? "매일 Today에서 확인할 수 있어요."
            : schedule === "specific_days"
              ? "선택한 요일에만 Today에 표시돼요."
              : "요일과 관계없이 한 주에 완료한 날짜 수를 기준으로 계산해요."}
        </p>
      </div>
      {schedule === "specific_days" && (
        <fieldset
          className="space-y-2"
          aria-invalid={daysError ? true : undefined}
          aria-describedby={daysError ? "habit-days-error" : undefined}
        >
          <legend className="text-sm font-medium">요일 선택</legend>
          <div className="flex flex-wrap gap-2">
            {days.map((day, index) => {
              const checked = selectedDays.includes(index);
              return (
              <label
                key={day}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm ${checked ? "border-primary bg-accent" : "bg-card"}`}
              >
                <input
                  type="checkbox"
                  name="days_of_week"
                  value={index}
                  checked={checked}
                  onChange={() =>
                    setSelectedDays((current) =>
                      checked ? current.filter((value) => value !== index) : [...current, index],
                    )
                  }
                />
                {day}
              </label>
              );
            })}
          </div>
          {daysError && <p id="habit-days-error" role="alert" className="text-sm text-destructive">{daysError}</p>}
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
          <p className="text-sm text-muted-foreground">
            한 번 완료할 때마다 하루로 계산되며, 같은 날 여러 번 완료해도 한 번으로 계산돼요.
          </p>
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
        <p className="text-sm text-muted-foreground">이 날짜부터 Today에 루틴이 표시돼요.</p>
      </div>
      <FormMessage message={state.message} status={state.status === "error" ? "error" : "success"} />
      <Button type="submit" disabled={pending}>
        {pending ? "저장 중..." : "습관 저장"}
      </Button>
    </form>
  );
}
