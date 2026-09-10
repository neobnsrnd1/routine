"use client";
import { useEffect, useMemo, useState } from "react";
import {
  getCalendarMonth,
  type CalendarCompletion,
} from "@/lib/habits/calendar";
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const pad = (n: number) => String(n).padStart(2, "0");
export function CalendarView() {
  const [initial] = useState(today),
    [year, setYear] = useState(0),
    [month, setMonth] = useState(0),
    [selected, setSelected] = useState(""),
    [days, setDays] = useState<Record<string, CalendarCompletion[]>>({}),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    queueMicrotask(() => {
      const parts = initial.split("-").map(Number);
      setYear(parts[0]);
      setMonth(parts[1]);
      setSelected(initial);
    });
  }, [initial]);
  useEffect(() => {
    if (!year || !month) return;
    let active = true;
    getCalendarMonth(year, month).then((r) => {
      if (!active) return;
      if (r.success) {
        setDays(r.days);
        setError("");
      } else setError(r.message);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [year, month]);
  const cells = useMemo(() => {
    if (!year || !month) return [];
    const first = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7,
      count = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return [
      ...Array(first).fill(null),
      ...Array.from({ length: count }, (_, i) => i + 1),
    ];
  }, [year, month]);
  const move = (n: number) => {
    const d = new Date(Date.UTC(year, month - 1 + n, 1));
    setLoading(true);
    setError("");
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth() + 1);
    setSelected(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-01`);
  };
  const records = days[selected] ?? [];
  if (!year || !month) return <p role="status">Loading...</p>;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          Prev
        </button>
        <h2 className="text-xl font-semibold">
          {year}-{pad(month)}
        </h2>
        <button
          type="button"
          onClick={() => move(1)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          Next
        </button>
      </div>
      {loading ? (
        <p role="status">Loading...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="p-2 font-medium">
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              const date = day
                  ? `${year}-${pad(month)}-${pad(day)}`
                  : `empty-${i}`,
                items = day ? (days[date] ?? []) : [];
              return (
                <button
                  key={date}
                  type="button"
                  disabled={!day}
                  onClick={() => day && setSelected(date)}
                  className={`flex min-h-16 min-w-0 flex-col items-start justify-between rounded-md border p-2 text-left whitespace-nowrap ${date === today() ? "border-primary bg-primary/10 font-semibold" : ""} ${date === selected ? "bg-accent ring-1 ring-ring" : ""}`}
                >
                  {day && (
                    <>
                      <span>{day}</span>
                      {items.length > 0 && (
                        <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-chart-1">
                          <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                          {items.length}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
          <section className="rounded-xl border bg-card p-5">
            <h3 className="font-medium">{selected}</h3>
            <p className="mt-1 text-sm">완료 {records.length}</p>
            {records.length ? (
              <ul className="mt-3 list-disc pl-5 text-sm">
                {records.map((r) => (
                  <li key={r.habitId}>{r.name}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm">완료 기록이 없습니다.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
