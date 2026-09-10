"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { FormMessage } from "@/components/form-message";

type EditableHabit = Habit & { has_completions: boolean };

export function HabitActions({ habit }: { habit: EditableHabit }) {
  const [editing, setEditing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const [archiveState, archiveAction, archivePending] = useActionState<ArchiveHabitState, FormData>(
    archiveHabit,
    { status: "idle", message: "" },
  );
  const archiveForm = useRef<HTMLFormElement>(null);
  const archive = () => {
    if (window.confirm("이 루틴을 보관할까요? 기존 완료 기록은 유지됩니다."))
      archiveForm.current?.requestSubmit();
  };
  const closeEditing = () => {
    setEditing(false);
    requestAnimationFrame(() => menuTriggerRef.current?.focus());
  };
  useEffect(() => {
    if (!editing || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const getFocusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("disabled"));
    const focusable = getFocusable();
    (focusable[0] ?? dialog).focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeEditing();
        return;
      }
      if (event.key !== "Tab") return;
      const current = getFocusable();
      if (!current.length) {
        event.preventDefault();
        return;
      }
      const first = current[0];
      const last = current[current.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editing]);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={menuTriggerRef}
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            aria-label={`${habit.name} 메뉴 열기`}
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              setEditing(true);
            }}
          >수정</DropdownMenuItem>
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
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-title-${habit.id}`}
            className="my-auto w-full max-w-lg rounded-xl border bg-card p-5 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id={`edit-title-${habit.id}`} className="font-semibold">
                루틴 수정
              </h2>
              <Button type="button" variant="ghost" size="sm" onClick={closeEditing}>
                닫기
              </Button>
            </div>
            <HabitEditForm habit={habit} />
          </div>
        </div>
      )}
      {archiveState.message && (
        <div className="mt-2">
          <FormMessage
            message={archiveState.message}
            status={archiveState.status === "error" ? "error" : "success"}
          />
        </div>
      )}
    </>
  );
}
