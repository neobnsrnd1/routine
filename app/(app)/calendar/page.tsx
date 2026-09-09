import { CalendarView } from "@/components/calendar-view";

export default function CalendarPage() {
  return <div className="space-y-8"><div className="space-y-2"><h1 className="text-3xl font-semibold tracking-tight">Calendar</h1><p className="text-muted-foreground">습관 완료 기록을 날짜별로 확인하세요.</p></div><CalendarView /></div>;
}
