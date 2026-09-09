import { TodayHabits } from "@/components/today-habits";

export default function DashboardPage() {
  return <div className="space-y-8"><div className="space-y-2"><h1 className="text-3xl font-semibold tracking-tight">Today</h1><p className="text-muted-foreground">오늘의 습관 실행을 확인하세요.</p></div><section aria-label="오늘 진행률" className="space-y-3"><TodayHabits /></section></div>;
}
