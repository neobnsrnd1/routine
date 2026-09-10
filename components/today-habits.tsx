"use client";
import { useEffect, useState, useTransition } from "react";
import { completeHabit, getTodayHabits, uncompleteHabit } from "@/lib/habits/completions";
function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
type TodayHabit = {
  id: string;
  name: string;
  completed: boolean;
  schedule_type: string;
  streakCount: number;
  weeklyCompletedCount?: number;
  weeklyTarget?: number;
};
export function TodayHabits() {
  const [date, setDate] = useState(localDate);
  const [habits, setHabits] = useState<TodayHabit[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    let active = true;
    getTodayHabits(date).then((r) => {
      if (!active) return;
      if (r.success) {
        setHabits(r.habits);
        setMessage("");
      } else setMessage(r.message);
    });
    return () => {
      active = false;
    };
  }, [date]);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const current = localDate();
      if (current !== date) setDate(current);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [date]);
  const toggle = (h: TodayHabit) =>
    startTransition(async () => {
      const currentDate = localDate();
      if (currentDate !== date) {
        setDate(currentDate);
        return;
      }
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = h.completed
        ? await uncompleteHabit(h.id, currentDate, zone)
        : await completeHabit(h.id, currentDate, zone);
      if (!result.success) {
        setMessage(result.message);
        return;
      }
      const refreshed = await getTodayHabits(currentDate);
      if (refreshed.success) setHabits(refreshed.habits);
      else setMessage(refreshed.message);
    });
  const done = habits.filter((h) => h.completed).length;
  if (message)
    return (
      <p role="alert" className="text-sm text-destructive">
        {message}
      </p>
    );
  return (
    <>
      <p className="text-sm font-medium">
        {done} / {habits.length} completed
      </p>
      <progress
        aria-label="오늘 습관 완료 진행률"
        value={done}
        max={habits.length || 1}
        className="h-2 w-full accent-primary"
      />
      <ul className="divide-y rounded-xl border bg-card">
        {habits.map((h) => (
          <li key={h.id} className="flex items-center gap-3 p-5">
            <button
              type="button"
              onClick={() => toggle(h)}
              disabled={pending}
              aria-label={`${h.name} ${h.completed ? "완료 취소" : "완료 처리"}`}
              aria-pressed={h.completed}
              className="h-5 w-5 rounded-full border"
            >
              {h.completed ? "✓" : ""}
            </button>
            <span className="flex-1">
              {h.name}
              {h.weeklyTarget !== undefined && (
                <span className="ml-2 text-sm text-muted-foreground">
                  주 {h.weeklyTarget}회 · 이번 주 {h.weeklyCompletedCount}/{h.weeklyTarget}
                </span>
              )}
              <span className="ml-2 text-sm text-muted-foreground">
                {h.streakCount}
                {h.schedule_type === "daily"
                  ? "일"
                  : h.schedule_type === "weekly_target"
                    ? "주"
                    : "회"}{" "}
                연속
              </span>
            </span>
            <span className="text-sm text-muted-foreground">{h.completed ? "완료" : "미완료"}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
