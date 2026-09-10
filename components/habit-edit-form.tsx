"use client";

import { useActionState, useState } from "react";
import { updateHabit, type UpdateHabitState } from "@/lib/habits/actions";
import type { Habit } from "@/lib/habits/types";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: UpdateHabitState = { status: "idle", message: "" };
const days = ["일", "월", "화", "수", "목", "금", "토"];
type EditableHabit = Habit & { has_completions: boolean };

export function HabitEditForm({ habit }: { habit: EditableHabit }) {
  const [state, action, pending] = useActionState(updateHabit, initialState);
  const locked = habit.has_completions;
  const [schedule, setSchedule] = useState(habit.schedule_type);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(habit.days_of_week ?? []);
  const [targetPerWeek, setTargetPerWeek] = useState(habit.target_per_week ?? 3);
  const [daysError, setDaysError] = useState("");
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!locked && schedule === "specific_days" && daysOfWeek.length === 0) {
      event.preventDefault();
      setDaysError("최소 하나의 요일을 선택해 주세요.");
      return;
    }
    setDaysError("");
  };
  return (
    <form key={state.resetKey ?? habit.updated_at} action={action} onSubmit={handleSubmit} className="mt-3 space-y-5 rounded-md border p-4">
      <input type="hidden" name="habit_id" value={habit.id} />
      <div className="space-y-2">
        <Label htmlFor={`habit-name-${habit.id}`}>루틴 이름</Label>
        <Input id={`habit-name-${habit.id}`} name="name" defaultValue={habit.name} maxLength={100} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`schedule-type-${habit.id}`}>반복 방식</Label>
        <select id={`schedule-type-${habit.id}`} name="schedule_type" value={schedule} onChange={(event) => { setSchedule(event.target.value as EditableHabit["schedule_type"]); setDaysError(""); }} disabled={locked} className="min-h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50">
          <option value="daily">매일</option>
          <option value="specific_days">특정 요일</option>
          <option value="weekly_target">주 N회</option>
        </select>
        <p className="text-sm text-muted-foreground">{locked ? "완료 기록이 있는 루틴은 기록 일관성을 위해 반복 설정과 시작일을 변경할 수 없어요. 이름은 수정할 수 있습니다." : "반복 방식을 선택하세요."}</p>
      </div>
      {locked && <><input type="hidden" name="schedule_type" value={habit.schedule_type} /><input type="hidden" name="start_date" value={habit.start_date} />{(habit.days_of_week ?? []).map((day) => <input key={day} type="hidden" name="days_of_week" value={day} />)}{habit.target_per_week && <input type="hidden" name="target_per_week" value={habit.target_per_week} />}</>}
      {!locked && <div className="space-y-2"><Label htmlFor={`start-date-${habit.id}`}>시작일</Label><Input id={`start-date-${habit.id}`} name="start_date" type="date" defaultValue={habit.start_date} required /><p className="text-sm text-muted-foreground">이 날짜부터 Today에 루틴이 표시돼요.</p></div>}
      {!locked && schedule === "specific_days" && <fieldset className="space-y-2" aria-invalid={daysError ? true : undefined} aria-describedby={daysError ? `habit-days-error-${habit.id}` : undefined}><legend className="text-sm font-medium">요일 선택</legend><div className="flex flex-wrap gap-2">{days.map((day, index) => { const checked = daysOfWeek.includes(index); return <label key={day} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm ${checked ? "border-primary bg-accent" : "bg-card"}`}><input type="checkbox" name="days_of_week" value={index} checked={checked} onChange={() => setDaysOfWeek((current) => checked ? current.filter((value) => value !== index) : [...current, index])} />{day}</label>; })}</div>{daysError && <p id={`habit-days-error-${habit.id}`} role="alert" className="text-sm text-destructive">{daysError}</p>}</fieldset>}
      {!locked && schedule === "weekly_target" && <div className="space-y-2"><Label htmlFor={`target-per-week-${habit.id}`}>주간 목표 횟수</Label><select id={`target-per-week-${habit.id}`} name="target_per_week" value={targetPerWeek} onChange={(event) => setTargetPerWeek(Number(event.target.value))} className="min-h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">{[1, 2, 3, 4, 5, 6, 7].map((value) => <option key={value} value={value}>{value}회</option>)}</select><p className="text-sm text-muted-foreground">한 주에 완료한 날짜 수를 기준으로 계산되며, 같은 날 여러 번 완료해도 한 번으로 계산돼요.</p></div>}
      <Button type="submit" disabled={pending}>{pending ? "저장 중..." : "수정 저장"}</Button>
      <FormMessage message={state.message} status={state.status === "error" ? "error" : "success"} />
    </form>
  );
}
