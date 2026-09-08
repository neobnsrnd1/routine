import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">하루하루 쌓인 습관 기록을 돌아보세요.</p>
      </div>
      <section aria-label="캘린더 준비 중" className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 text-center">
        <CalendarDays aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
        <h2 className="font-medium">기록 캘린더를 준비하고 있어요</h2>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">앞으로 날짜별 습관 실천 기록을 이곳에서 확인할 수 있습니다.</p>
      </section>
    </div>
  );
}
