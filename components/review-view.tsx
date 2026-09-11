"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { getReviewDataAction } from "@/lib/habits/review-actions";
import type { ReviewData, ReviewPeriodType } from "@/lib/habits/review";

const localDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

const addDays = (value: string, amount: number) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

const addMonthsFromStart = (value: string, amount: number) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount, 1);
  return date.toISOString().slice(0, 10);
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));

export function ReviewView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = localDate();
  const periodParam = searchParams.get("period");
  const referenceParam = searchParams.get("reference");
  const period: ReviewPeriodType = periodParam === "monthly" ? "monthly" : "weekly";
  const referenceDate = referenceParam && isValidDate(referenceParam) ? referenceParam : today;
  const requestKey = `${period}:${referenceDate}`;
  const [data, setData] = useState<ReviewData | null>(null);
  const [dataKey, setDataKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const result = await getReviewDataAction(
          period,
          referenceDate,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        );
        if (!active) return;
        if (result.success) {
          setData(result.data);
          setDataKey(requestKey);
          setError("");
        } else {
          setDataKey(requestKey);
          setError(result.message);
        }
      } catch {
        if (active) {
          setDataKey(requestKey);
          setError("리뷰 데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [period, referenceDate, requestKey]);

  const selectPeriod = (nextPeriod: ReviewPeriodType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", nextPeriod);
    params.set("reference", referenceDate);
    router.push(`${pathname}?${params.toString()}`);
  };

  const movePeriod = (amount: number) => {
    if (!data || dataKey !== requestKey) return;
    const nextReference =
      period === "weekly"
        ? addDays(data.period.startDate, amount * 7)
        : addMonthsFromStart(data.period.startDate, amount);
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    params.set("reference", nextReference);
    router.push(`${pathname}?${params.toString()}`);
  };

  const isDataCurrent = dataKey === requestKey;
  const isCurrentPeriod = isDataCurrent && data?.period.endDate === today;
  const showLoading = loading || !isDataCurrent;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="리뷰 기간 선택">
        <Button
          type="button"
          className="min-h-11"
          variant={period === "weekly" ? "secondary" : "outline"}
          aria-pressed={period === "weekly"}
          onClick={() => selectPeriod("weekly")}
        >
          주간
        </Button>
        <Button
          type="button"
          className="min-h-11"
          variant={period === "monthly" ? "secondary" : "outline"}
          aria-pressed={period === "monthly"}
          onClick={() => selectPeriod("monthly")}
        >
          월간
        </Button>
      </div>
      {showLoading ? (
        <LoadingState label="리뷰 데이터를 불러오는 중..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : data && isDataCurrent ? (
        <>
          <section aria-labelledby="review-period" className="space-y-2">
            <div className="flex flex-wrap gap-2" role="group" aria-label="리뷰 기간 이동">
              <Button
                type="button"
                className="min-h-11"
                variant="outline"
                onClick={() => movePeriod(-1)}
              >
                이전 {period === "weekly" ? "주" : "달"}
              </Button>
              <Button
                type="button"
                className="min-h-11"
                variant="outline"
                disabled={isCurrentPeriod}
                onClick={() => movePeriod(1)}
              >
                다음 {period === "weekly" ? "주" : "달"}
              </Button>
            </div>
            <h2 id="review-period" className="font-semibold">
              {isCurrentPeriod
                ? period === "weekly"
                  ? "이번 주"
                  : "이번 달"
                : period === "weekly"
                  ? "주간 리뷰"
                  : `${data.period.startDate.slice(0, 4)}년 ${Number(data.period.startDate.slice(5, 7))}월`}
            </h2>
            <p className="break-words text-sm text-muted-foreground">
              {formatDate(data.period.startDate)} – {formatDate(data.period.endDate)}
            </p>
          </section>
          <section aria-label="리뷰 요약" className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">완료</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {data.summary.completionCount}회
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">활동한 날</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {data.summary.completionDayCount}일
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">메모</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{data.summary.noteCount}개</p>
            </div>
          </section>
          {data.summary.completionCount === 0 && (
            <p className="text-sm text-muted-foreground">이 기간에는 아직 완료 기록이 없어요.</p>
          )}
          <ReviewHabitBreakdown data={data} />
          <ReviewNoteTimeline
            key={`${data.period.type}-${data.period.startDate}-${data.period.endDate}`}
            data={data}
          />
        </>
      ) : null}
    </div>
  );
}

function ReviewNoteTimeline({ data }: { data: ReviewData }) {
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());
  const toggleNoteExpanded = (completionId: string) => {
    setExpandedNoteIds((current) => {
      const next = new Set(current);
      if (next.has(completionId)) next.delete(completionId);
      else next.add(completionId);
      return next;
    });
  };

  return (
    <section aria-labelledby="review-notes-title" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="review-notes-title" className="font-semibold">
          메모 기록
        </h2>
        <span className="text-sm text-muted-foreground">{data.summary.noteCount}개</span>
      </div>
      {data.notes.length > 0 ? (
        <ul className="divide-y rounded-xl border bg-card">
          {data.notes.map((item) => {
            const isExpanded = expandedNoteIds.has(item.completionId);
            return (
              <li key={item.completionId} className="space-y-2 p-4">
                <time className="text-sm text-muted-foreground" dateTime={item.completedDate}>
                  {formatDate(item.completedDate)}
                </time>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/habits/${item.habitId}`}
                    className="min-w-0 break-words font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.habitName}
                  </Link>
                  {item.archived && (
                    <span className="shrink-0 text-xs text-muted-foreground">보관됨</span>
                  )}
                </div>
                <p
                  id={`review-note-${item.completionId}`}
                  className={
                    isExpanded
                      ? "whitespace-pre-wrap break-words text-sm text-muted-foreground"
                      : "line-clamp-3 whitespace-pre-wrap break-words text-sm text-muted-foreground"
                  }
                >
                  {item.note}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-11"
                  aria-expanded={isExpanded}
                  aria-controls={`review-note-${item.completionId}`}
                  onClick={() => toggleNoteExpanded(item.completionId)}
                >
                  {isExpanded ? "메모 접기" : "메모 더보기"}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        data.summary.completionCount > 0 && (
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            이 기간에 작성된 메모가 없어요.
          </p>
        )
      )}
    </section>
  );
}

function ReviewHabitBreakdown({ data }: { data: ReviewData }) {
  return (
    <section aria-labelledby="review-habits-title" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="review-habits-title" className="font-semibold">
          루틴별 기록
        </h2>
        <span className="text-sm text-muted-foreground">현재 사용 중인 루틴</span>
      </div>
      {data.habits.length > 0 ? (
        <ul className="divide-y rounded-xl border bg-card">
          {data.habits.map((habit) => (
            <li
              key={habit.habitId}
              className="flex flex-wrap items-center justify-between gap-2 p-4"
            >
              <Link
                href={`/habits/${habit.habitId}`}
                className="min-w-0 break-words font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {habit.name}
              </Link>
              <p className="shrink-0 text-sm text-muted-foreground">
                완료 {habit.completionCount}회 · 메모 {habit.noteCount}개
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          현재 사용 중인 루틴이 없어요.
        </p>
      )}
    </section>
  );
}
