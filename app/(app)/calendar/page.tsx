import { CalendarView } from "@/components/calendar-view";
import { PageHeader } from "@/components/page-header";

export default function CalendarPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Calendar" description="월별 루틴 기록을 확인하세요." />
      <CalendarView />
    </div>
  );
}
