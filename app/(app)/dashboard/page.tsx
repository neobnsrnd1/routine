import { TodayHabits } from "@/components/today-habits";
import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return <div className="space-y-8"><PageHeader title="Today" description="오늘의 습관 실행을 확인하세요." /><section aria-label="오늘 진행률" className="space-y-3"><TodayHabits /></section></div>;
}
