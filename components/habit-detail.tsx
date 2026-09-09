"use client";
import { useEffect, useState } from "react";
import { getHabitDetail } from "@/lib/habits/detail";
import { formatHabitSchedule } from "@/lib/habits/schedule";
import type { Habit } from "@/lib/habits/types";
type Props = { id: string };
type DetailData = {
  habit: Habit;
  streakCount: number;
  rate7: { rate: number };
  rate30: { rate: number };
  rows: { completed_date: string }[];
};
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const add = (v: string, n: number) => {
  const d = new Date(`${v}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const dow = (v: string) => new Date(`${v}T00:00:00Z`).getUTCDay();
export function HabitDetail({ id }: Props) {
  const [data, setData] = useState<DetailData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const date = localDate();
    getHabitDetail(
      id,
      date,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ).then((r) => {
      if (r.success) setData(r);
      else setError(r.message);
    });
  }, [id]);
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">Loading...</p>;
  const h = data.habit,
    rate7 = Math.round(data.rate7.rate * 100),
    rate30 = Math.round(data.rate30.rate * 100),
    done = new Set(data.rows.map((r) => r.completed_date)),
    dates: Array<string> = [];
  for (let i = 0; i < 30; i++) {
    const date = add(localDate(), -i);
    if (date >= h.start_date) dates.push(date);
  }
  const unit =
    h.schedule_type === "daily"
      ? "일"
      : h.schedule_type === "weekly_target"
        ? "주"
        : "회";
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">{h.name}</h1>
        <p className="text-muted-foreground">{formatHabitSchedule(h)}</p>
        <p className="text-sm">시작일: {h.start_date}</p>
        {h.archived_at && (
          <span className="text-sm text-muted-foreground">Archived</span>
        )}
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded border p-4">
          {data.streakCount}
          {unit} 연속
        </div>
        <div className="rounded border p-4">
          최근 7일 {rate7}%
          <div className="mt-2 h-2 rounded bg-muted">
            <div
              className="h-2 rounded bg-primary"
              style={{ width: `${rate7}%` }}
            />
          </div>
        </div>
        <div className="rounded border p-4">
          최근 30일 {rate30}%
          <div className="mt-2 h-2 rounded bg-muted">
            <div
              className="h-2 rounded bg-primary"
              style={{ width: `${rate30}%` }}
            />
          </div>
        </div>
      </section>
      <section>
        <h2 className="font-semibold">최근 30일</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {dates.map((date) => {
            const completed = done.has(date);
            const scheduled =
              h.schedule_type !== "specific_days" ||
              (h.days_of_week ?? []).includes(dow(date));
            const status = !scheduled
              ? "예정 없음"
              : completed
                ? "완료"
                : "미완료";
            return (
              <li key={date} className="rounded border p-2">
                {date} · {status}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
