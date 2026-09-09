import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";
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
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {habits.map((habit) => (
        <li key={habit.id} className="flex flex-wrap items-center gap-3 p-5">
          {showCompletion && (habit.completed
            ? <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
            : <Circle aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" />)}
          <div className="min-w-0 flex-1 basis-32">
            <Link href={`/habits/${habit.id}`} className="break-words font-medium hover:underline">{habit.name}</Link>
            <p className="mt-1 text-sm text-muted-foreground">{habit.frequency}</p>
          </div>
          {showCompletion && <Badge variant={habit.completed ? "secondary" : "outline"}>{habit.completed ? "완료" : "미완료"}</Badge>}
          {habit.edit}
        </li>
      ))}
    </ul>
  );
}
