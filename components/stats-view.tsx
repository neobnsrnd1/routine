"use client";
import { useEffect, useState } from "react";
import { getStats } from "@/lib/habits/stats";
type Card = {
  id: string;
  name: string;
  schedule: string;
  scheduleType: string;
  streakCount: number;
  rate7: number;
  rate30: number;
  rate30Denominator: number;
};
type Data = {
  activeCount: number;
  completedToday: number;
  averageRate: number;
  last30Count: number;
  activity: { date: string; count: number }[];
  cards: Card[];
};
type ErrorState = { key: string; message: string } | null;
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function StatsView() {
  const [date, setDate] = useState(today);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<ErrorState>(null);
  useEffect(() => {
    let active = true;
    getStats(date, Intl.DateTimeFormat().resolvedOptions().timeZone).then((r) => {
      if (!active) return;
      if (r.success) setData(r);
      else setError({ key: date, message: r.message });
    });
    return () => {
      active = false;
    };
  }, [date]);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const current = today();
      if (current !== date) {
        setDate(current);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [date]);
  if (error?.key === date) return <p role="alert">{error.message}</p>;
  if (!data) return <p role="status">Loading...</p>;
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Active", data.activeCount],
          ["Today", data.completedToday],
          ["Average", `${Math.round(data.averageRate * 100)}%`],
          ["30 days", data.last30Count],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="mb-3 font-semibold">Recent 7 days</h2>
        <div className="grid grid-cols-7 gap-2">
          {data.activity.map((item) => (
            <div key={item.date} className="rounded border p-2 text-center text-xs">
              <div>{item.date.slice(5)}</div>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Habits</h2>
        {data.cards.map((card) => (
          <article key={card.id} className="rounded-xl border bg-card p-4">
            <p className="font-medium">{card.name}</p>
            <p className="text-sm text-muted-foreground">{card.schedule}</p>
            <p className="mt-2 text-sm">
              {card.streakCount}
              {card.scheduleType === "daily"
                ? "일"
                : card.scheduleType === "weekly_target"
                  ? "주"
                  : "회"}{" "}
              연속
            </p>
            <p className="mt-2 text-sm">최근 7일 {Math.round(card.rate7 * 100)}%</p>
            <div className="mt-1 h-2 rounded bg-muted">
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(card.rate7 * 100)}
                aria-label={`${card.name} 최근 7일 달성률`}
                className="h-2 rounded bg-primary"
                style={{ width: `${Math.round(card.rate7 * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-sm">최근 30일 {Math.round(card.rate30 * 100)}%</p>
            <div className="mt-1 h-2 rounded bg-muted">
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(card.rate30 * 100)}
                aria-label={`${card.name} 최근 30일 달성률`}
                className="h-2 rounded bg-primary"
                style={{ width: `${Math.round(card.rate30 * 100)}%` }}
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
