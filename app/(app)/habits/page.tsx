import { HabitList } from "@/components/habit-list";
import { Suspense } from "react";
import { getActiveHabits } from "@/lib/habits/queries";
import { formatHabitSchedule } from "@/lib/habits/schedule";
import { HabitForm } from "@/components/habit-form";
import { HabitEditForm } from "@/components/habit-edit-form";

async function ActiveHabits() {
  const result = await getActiveHabits();

  if (!result.success) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {result.message}
      </p>
    );
  }

  if (result.habits.length === 0) {
    return <p className="text-sm text-muted-foreground">아직 등록한 습관이 없습니다.</p>;
  }

  return (
    <HabitList
      habits={result.habits.map((habit) => ({
        id: habit.id,
        name: habit.name,
        frequency: formatHabitSchedule(habit),
        edit: <HabitEditForm habit={habit} />,
      }))}
    />
  );
}

export default function HabitsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">My Habits</h1>
        <p className="text-muted-foreground">꾸준히 이어갈 나만의 습관을 모아보세요.</p>
      </div>
      <HabitForm />
      <Suspense
        fallback={
          <p role="status" className="text-sm text-muted-foreground">
            습관 목록을 불러오는 중...
          </p>
        }
      >
        <ActiveHabits />
      </Suspense>
    </div>
  );
}
