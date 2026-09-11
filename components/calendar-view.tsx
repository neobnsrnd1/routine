"use client";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getCalendarMonth, type CalendarCompletion } from "@/lib/habits/calendar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";

const today = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
const pad = (n: number) => String(n).padStart(2, "0");
const formatMonth = (year: number, month: number) =>
  new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(value + "T00:00:00"));

export function CalendarView() {
  const [initial] = useState(today);
  const [year, setYear] = useState(() => Number(initial.slice(0, 4))),
    [month, setMonth] = useState(() => Number(initial.slice(5, 7))),
    [selected, setSelected] = useState(initial);
  const [days, setDays] = useState<Record<string, CalendarCompletion[]>>({}),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    if (!year || !month) return;
    let active = true;
    const load = async () => {
      try {
        const result = await getCalendarMonth(year, month);
        if (!active) return;
        if (result.success) {
          setDays(result.days);
          setError("");
        } else setError(result.message);
      } catch {
        if (active) setError("달력 기록을 불러오지 못했어요.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [year, month]);
  const cells = useMemo(() => {
    if (!year || !month) return [];
    const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  }, [year, month]);
  const move = (offset: number) => {
    const value = new Date(Date.UTC(year, month - 1 + offset, 1));
    setLoading(true);
    setError("");
    setYear(value.getUTCFullYear());
    setMonth(value.getUTCMonth() + 1);
    setSelected([value.getUTCFullYear(), pad(value.getUTCMonth() + 1), "01"].join("-"));
  };
  const goToToday = () => {
    const current = today();
    setLoading(true);
    setError("");
    setYear(Number(current.slice(0, 4)));
    setMonth(Number(current.slice(5, 7)));
    setSelected(current);
  };
  const records = days[selected] ?? [];
  const noteCount = records.filter((record) => record.note !== null).length;
  if (!year || !month) return <LoadingState label="달력을 불러오는 중..." />;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => move(-1)}
            aria-label="이전 달"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <h2 className="min-w-0 text-center text-xl font-semibold" aria-live="polite">
            {formatMonth(year, month)}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => move(1)}
            aria-label="다음 달"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
        <Button type="button" variant="outline" className="min-h-11" onClick={goToToday}>
          오늘
        </Button>
      </div>
      {loading ? (
        <LoadingState label="달력 기록을 불러오는 중..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-sm" aria-label="월별 완료 기록">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <div key={day} className="p-1.5 font-medium text-muted-foreground sm:p-2">
                {day}
              </div>
            ))}
            {cells.map((day, index) => {
              const value = day ? [year, pad(month), pad(day)].join("-") : "empty-" + index;
              const items = day ? (days[value] ?? []) : [];
              const noteCount = items.filter((item) => item.note !== null).length;
              const isToday = value === today(),
                isSelected = value === selected;
              const label = day
                ? formatDate(value) +
                  (items.length ? ", 완료 기록 " + items.length + "개" : ", 완료 기록 없음") +
                  (noteCount > 0 ? ", 메모 있음" : "") +
                  (isSelected ? ", 선택됨" : "") +
                  (isToday ? ", 오늘" : "")
                : undefined;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!day}
                  onClick={() => day && setSelected(value)}
                  aria-label={label}
                  aria-current={isToday ? "date" : undefined}
                  aria-pressed={day ? isSelected : undefined}
                  className={
                    "flex min-h-14 min-w-0 flex-col items-center justify-between rounded-md border p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-16 sm:p-2 " +
                    (isToday ? "border-primary font-semibold " : "") +
                    (isSelected ? "bg-accent ring-1 ring-ring" : "bg-card")
                  }
                >
                  {day && (
                    <>
                      <span>{day}</span>
                      {items.length ? (
                        <span className="flex items-center gap-1 text-xs font-semibold">
                          <Check aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                          {items.length}
                          {noteCount > 0 && (
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-1.5 rounded-full bg-primary"
                            />
                          )}
                        </span>
                      ) : (
                        <span aria-hidden="true" className="text-muted-foreground">
                          ·
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
          <div
            className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"
            aria-label="달력 범례"
          >
            <span className="flex items-center gap-1">
              <Check aria-hidden="true" className="h-3.5 w-3.5 text-primary" /> 완료 기록 있음
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true">·</span> 기록 없음
            </span>
          </div>
          <div
            className="flex items-center gap-1 text-xs text-muted-foreground"
            aria-label="메모 범례"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" /> 메모 있음
          </div>
          <section aria-labelledby="selected-date" className="rounded-xl border bg-card p-5">
            <h3 id="selected-date" className="font-medium">
              {formatDate(selected)}
            </h3>
            {records.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                완료 {records.length}개{noteCount > 0 ? ` · 메모 ${noteCount}개` : ""}
              </p>
            )}
            {records.length ? (
              <ul className="mt-3 divide-y">
                {records.map((record) => (
                  <li
                    key={record.habitId}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/habits/${record.habitId}`}
                        className="break-words font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {record.name}
                      </Link>
                      {record.note && (
                        <p className="line-clamp-2 break-words whitespace-pre-wrap text-xs text-muted-foreground">
                          {record.note}
                        </p>
                      )}
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                      <Check aria-hidden="true" className="h-4 w-4 text-primary" />
                      완료
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3">
                <EmptyState
                  title="이 날짜의 완료 기록이 없어요."
                  description="완료한 루틴이 있으면 여기에 표시됩니다."
                />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
