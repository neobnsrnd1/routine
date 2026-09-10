import Link from "next/link";
import { Suspense } from "react";
import { getActiveHabits } from "@/lib/habits/queries";
import { formatHabitSchedule } from "@/lib/habits/schedule";
import { HabitList } from "@/components/habit-list";
import { HabitActions } from "@/components/habit-actions";
import { HabitsPageContent } from "@/components/habits-page-content";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

async function ActiveHabits() {
  const result = await getActiveHabits();
  if (!result.success)
    return (
      <p role="alert" className="text-sm text-destructive">
        {result.message}
      </p>
    );
  if (result.habits.length === 0)
    return (
      <EmptyState
        title="아직 루틴이 없어요."
        description="첫 번째 루틴을 만들어 시작해보세요."
        action={
          <Button asChild>
            <Link href="/habits?create=1">루틴 만들기</Link>
          </Button>
        }
      />
    );
  return (
    <HabitList
      habits={result.habits.map((habit) => ({
        id: habit.id,
        name: habit.name,
        frequency: formatHabitSchedule(habit),
        edit: <HabitActions habit={habit} />,
      }))}
    />
  );
}

async function HabitsContent({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const params = await searchParams;
  return (
    <HabitsPageContent
      key={params.create === "1" ? "create" : "closed"}
      initialOpen={params.create === "1"}
    >
      <Suspense
        fallback={
          <p role="status" className="text-sm text-muted-foreground">
            루틴 목록을 불러오는 중...
          </p>
        }
      >
        <ActiveHabits />
      </Suspense>
    </HabitsPageContent>
  );
}

export default function HabitsPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-sm text-muted-foreground">
          루틴 화면을 불러오는 중...
        </p>
      }
    >
      <HabitsContent searchParams={searchParams} />
    </Suspense>
  );
}
