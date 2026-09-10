"use client";
import { useEffect, useState } from "react";
import { getStats } from "@/lib/habits/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
type CardData = {
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
  cards: CardData[];
};
const today = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
const formatDay = (date: string) =>
  new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(new Date(date + "T00:00:00"));
export function StatsView() {
  const [date, setDate] = useState(today),
    [data, setData] = useState<Data | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await getStats(date, Intl.DateTimeFormat().resolvedOptions().timeZone);
        if (!active) return;
        if (result.success) {
          setData(result);
          setError("");
        } else setError(result.message);
      } catch {
        if (active) setError("통계 정보를 불러오지 못했어요.");
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [date]);
  useEffect(() => {
    const onVisible = () => {
      const current = today();
      if (document.visibilityState === "visible" && current !== date) setDate(current);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [date]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="통계 정보를 불러오는 중..." />;
  if (data.activeCount === 0)
    return (
      <EmptyState
        title="활성 루틴이 없어요."
        description="루틴을 만들고 기록을 시작하면 통계를 확인할 수 있어요."
      />
    );
  const maxActivity = Math.max(...data.activity.map((item) => item.count), 1);
  return (
    <div className="space-y-8">
      <section aria-label="핵심 요약" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["활성 루틴", data.activeCount],
          ["오늘 완료", data.completedToday],
          ["최근 30일 평균", `${Math.round(data.averageRate * 100)}%`],
          ["최근 30일 완료 기록", data.last30Count],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section aria-labelledby="activity-title" className="space-y-3">
        <h2 id="activity-title" className="font-semibold">
          최근 7일 흐름
        </h2>
        <div className="space-y-2 rounded-xl border bg-card p-4">
          {data.activity.map((item) => (
            <div
              key={item.date}
              className="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-3 text-sm"
            >
              <span className="text-muted-foreground">{formatDay(item.date)}</span>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(item.count / maxActivity) * 100}%` }}
                />
              </div>
              <span
                className="text-right tabular-nums text-muted-foreground"
                aria-label={`완료 기록 ${item.count}개`}
              >
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="habits-title" className="space-y-3">
        <h2 id="habits-title" className="font-semibold">
          루틴별 성과
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.cards.map((card) => {
            const rate = Math.round(card.rate30 * 100);
            return (
              <Card key={card.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="break-words text-base">{card.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{card.schedule}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-sm text-muted-foreground">최근 30일 달성률</span>
                    <span className="text-xl font-semibold tabular-nums">{rate}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${card.name} 최근 30일 달성률`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={rate}
                    className="h-2 overflow-hidden rounded-full bg-secondary"
                  >
                    <div className="h-full bg-primary" style={{ width: `${rate}%` }} />
                  </div>
                  <p className="text-sm text-muted-foreground">현재 {card.streakCount}일 연속</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
