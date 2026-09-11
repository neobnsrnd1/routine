"use client";

import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/form-message";
import { reorderHabits } from "@/lib/habits/actions";
import { useState, type ReactNode } from "react";
import Link from "next/link";

type HabitListItem = {
  id: string;
  name: string;
  frequency: string;
  completed?: boolean;
  edit?: ReactNode;
};

type HabitListProps = {
  habits: readonly HabitListItem[];
  showCompletion?: boolean;
};

export function HabitList({ habits, showCompletion = false }: HabitListProps) {
  const [orderedHabits, setOrderedHabits] = useState(() => [...habits]);
  const [reorderPending, setReorderPending] = useState(false);
  const [reorderError, setReorderError] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const serverHabitsById = new Map(habits.map((habit) => [habit.id, habit]));
  const serverIds = new Set(habits.map((habit) => habit.id));
  const localIds = new Set(orderedHabits.map((habit) => habit.id));
  const sameHabitSet =
    serverIds.size === localIds.size && [...localIds].every((id) => serverIds.has(id));
  const visibleHabits = sameHabitSet
    ? orderedHabits.map((habit) => serverHabitsById.get(habit.id) ?? habit)
    : reorderPending
      ? [
          ...orderedHabits
            .filter((habit) => serverHabitsById.has(habit.id))
            .map((habit) => serverHabitsById.get(habit.id) ?? habit),
          ...habits.filter((habit) => !localIds.has(habit.id)),
        ]
      : [...habits];

  const move = async (index: number, direction: -1 | 1) => {
    if (reorderPending) return;
    const target = index + direction;
    if (index < 0 || target < 0 || target >= visibleHabits.length) return;
    const previous = visibleHabits;
    const next = [...visibleHabits];
    [next[index], next[target]] = [next[target], next[index]];
    setOrderedHabits(next);
    setReorderError("");
    setAnnouncement(`${previous[index].name}을(를) ${target + 1}번째 위치로 이동했습니다.`);
    setReorderPending(true);
    try {
      const result = await reorderHabits(next.map((habit) => habit.id));
      if (!result.success) {
        setOrderedHabits(previous);
        setReorderError(result.message);
        setAnnouncement("루틴 순서를 저장하지 못했습니다.");
      }
    } catch {
      setOrderedHabits(previous);
      setReorderError("루틴 순서를 저장하지 못했습니다. 다시 시도해 주세요.");
      setAnnouncement("루틴 순서를 저장하지 못했습니다.");
    } finally {
      setReorderPending(false);
    }
  };

  return (
    <>
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
      <ul className="divide-y rounded-xl border bg-card">
        {visibleHabits.map((habit, index) => (
          <li key={habit.id} className="flex flex-wrap items-center gap-3 p-5">
            {showCompletion &&
              (habit.completed ? (
                <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Circle aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" />
              ))}
            <div className="min-w-0 flex-1 basis-32">
              <Link
                href={`/habits/${habit.id}`}
                className="break-words font-medium hover:underline"
              >
                {habit.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{habit.frequency}</p>
            </div>
            {showCompletion && (
              <Badge variant={habit.completed ? "secondary" : "outline"}>
                {habit.completed ? "완료" : "미완료"}
              </Badge>
            )}
            {habit.edit}
            <div
              className="flex shrink-0 items-center gap-1"
              role="group"
              aria-label={`${habit.name} 순서 변경`}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={() => void move(index, -1)}
                disabled={reorderPending || index === 0}
                aria-label={`${habit.name} 위로 이동`}
              >
                <ChevronUp aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={() => void move(index, 1)}
                disabled={reorderPending || index === visibleHabits.length - 1}
                aria-label={`${habit.name} 아래로 이동`}
              >
                <ChevronDown aria-hidden="true" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <FormMessage message={reorderError} status="error" />
    </>
  );
}
