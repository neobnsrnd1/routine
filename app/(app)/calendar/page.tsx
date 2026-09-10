import { CalendarView } from "@/components/calendar-view";
import { PageHeader } from "@/components/page-header";

export default function CalendarPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Calendar" description="습관 완료 기록을 날짜별로 확인하세요." />
      <CalendarView />
    </div>
  );
}
