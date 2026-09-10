"use client";

import { MoreHorizontal } from "lucide-react";
import { useRef, useState } from "react";
import type { Habit } from "@/lib/habits/types";
import { HabitEditForm } from "@/components/habit-edit-form";
import { archiveHabit, type ArchiveHabitState } from "@/lib/habits/actions";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EditableHabit = Habit & { has_completions: boolean };

export function HabitActions({ habit }: { habit: EditableHabit }) {
  const [editing, setEditing] = useState(false);
  const [archiveState, archiveAction, archivePending] = useActionState<ArchiveHabitState, FormData>(
    archiveHabit,
    { status: "idle", message: "" },
  );
  const archiveForm = useRef<HTMLFormElement>(null);
  const archive = () => {
    if (window.confirm("이 루틴을 보관할까요? 기존 완료 기록은 유지됩니다."))
      archiveForm.current?.requestSubmit();
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            aria-label={`${habit.name} 메뉴 열기`}
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(true)}>수정</DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            disabled={archivePending}
            onSelect={archive}
          >
            보관
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <form ref={archiveForm} action={archiveAction} className="hidden">
        <input type="hidden" name="habit_id" value={habit.id} />
      </form>
      {editing && (
        <div
          className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-background/50 p-4 sm:items-center"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-title-${habit.id}`}
            className="my-auto w-full max-w-lg rounded-xl border bg-card p-5 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id={`edit-title-${habit.id}`} className="font-semibold">
                루틴 수정
              </h2>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                닫기
              </Button>
            </div>
            <HabitEditForm habit={habit} />
          </div>
        </div>
      )}
      {archiveState.message && (
        <p
          role={archiveState.status === "error" ? "alert" : "status"}
          className={
            archiveState.status === "error"
              ? "mt-2 text-sm text-destructive"
              : "mt-2 text-sm text-muted-foreground"
          }
        >
          {archiveState.message}
        </p>
      )}
    </>
  );
}
