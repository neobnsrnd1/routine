import { HabitList } from "@/components/habit-list";

export default function HabitsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">My Habits</h1>
        <p className="text-muted-foreground">꾸준히 이어갈 나만의 습관을 모아보세요.</p>
      </div>
      <HabitList />
      <p className="text-sm text-muted-foreground">예시 목록입니다. 습관 추가·수정·삭제 기능은 준비 중입니다.</p>
    </div>
  );
}
