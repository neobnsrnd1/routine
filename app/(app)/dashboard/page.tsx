import { HabitList } from "@/components/habit-list";
import { demoHabits } from "@/lib/demo-habits";

export default function DashboardPage() {
  const completed = demoHabits.filter((habit) => habit.completed).length;
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
        <p className="text-muted-foreground">오늘의 작은 실천을 확인하세요.</p>
      </div>
      <section aria-label="오늘의 진행률" className="space-y-3">
        <p className="text-sm font-medium">{completed} / {demoHabits.length} completed</p>
        <progress aria-label="오늘의 습관 완료율" value={completed} max={demoHabits.length} className="h-2 w-full overflow-hidden rounded-full accent-primary" />
      </section>
      <HabitList showCompletion />
      <p className="text-sm text-muted-foreground">예시 습관입니다. 완료 상태는 아직 변경하거나 저장할 수 없습니다.</p>
    </div>
  );
}
