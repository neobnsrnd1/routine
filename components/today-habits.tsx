"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { completeHabit, getTodayHabits, uncompleteHabit } from "@/lib/habits/completions";
import { createCompletionNote, updateCompletionNote } from "@/lib/habits/note-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { FormMessage } from "@/components/form-message";

function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatToday(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(`${date}T00:00:00`));
}
type TodayHabit = {
  id: string;
  name: string;
  completed: boolean;
  schedule_type: string;
  streakCount: number;
  weeklyTarget?: number;
  completionId: string | null;
  note: { note: string; updated_at: string } | null;
};
function scheduleLabel(habit: TodayHabit) {
  if (habit.schedule_type === "weekly_target") return `주 ${habit.weeklyTarget ?? 0}회 목표`;
  if (habit.schedule_type === "specific_days") return "정해진 요일";
  return "매일";
}

export function TodayHabits() {
  const [date, setDate] = useState(localDate);
  const [habits, setHabits] = useState<TodayHabit[]>([]);
  const [message, setMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [editingCompletionId, setEditingCompletionId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [notePendingId, setNotePendingId] = useState<string | null>(null);
  const [noteError, setNoteError] = useState("");
  const noteTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pendingMutationRef = useRef(new Set<string>());
  const loadRequestRef = useRef(0);
  const displayedDateRef = useRef(date);
  useLayoutEffect(() => {
    displayedDateRef.current = date;
  }, [date]);

  useEffect(() => {
    const requestId = ++loadRequestRef.current;
    let active = true;
    const load = async () => {
      try {
        const r = await getTodayHabits(date);
        if (!active || requestId !== loadRequestRef.current) return;
        if (r.success) {
          setHabits(r.habits);
          setEditingCompletionId(null);
          setMessage("");
        } else setMessage(r.message);
      } catch {
        if (active && requestId === loadRequestRef.current)
          setMessage("오늘의 루틴을 불러오지 못했어요.");
      } finally {
        if (active && requestId === loadRequestRef.current) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [date]);
  const closeEditor = () => {
    const id = editingCompletionId;
    setEditingCompletionId(null);
    setNoteDraft("");
    setNoteError("");
    if (id) requestAnimationFrame(() => noteTriggerRefs.current[id]?.focus());
  };
  const openEditor = (habit: TodayHabit) => {
    if (!habit.completionId) return;
    setEditingCompletionId(habit.completionId);
    setNoteDraft(habit.note?.note ?? "");
    setNoteError("");
  };
  const saveNote = async (habit: TodayHabit) => {
    if (!habit.completionId || notePendingId) return;
    setNotePendingId(habit.completionId);
    setNoteError("");
    try {
      const result = habit.note
        ? await updateCompletionNote(habit.completionId, noteDraft)
        : await createCompletionNote(habit.completionId, noteDraft);
      if (result.success) {
        setHabits((current) =>
          current.map((item) =>
            item.id === habit.id
              ? { ...item, note: { note: noteDraft.trim(), updated_at: new Date().toISOString() } }
              : item,
          ),
        );
        closeEditor();
      } else setNoteError(result.message);
    } catch {
      setNoteError("메모 저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setNotePendingId(null);
    }
  };
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && localDate() !== date) {
        setLoading(true);
        setDate(localDate());
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [date]);

  const toggle = (habit: TodayHabit) => {
    if (pendingMutationRef.current.has(habit.id)) return;
    setActionMessage("");
    pendingMutationRef.current.add(habit.id);
    setPendingIds((current) => new Set(current).add(habit.id));
    const currentDate = localDate();
    if (currentDate !== date) {
      setLoading(true);
      setDate(currentDate);
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(habit.id);
        return next;
      });
      pendingMutationRef.current.delete(habit.id);
      return;
    }
    const previousCompleted = habit.completed;
    const rollback = () => {
      if (currentDate !== displayedDateRef.current) return;
      setHabits((current) =>
        current.map((item) =>
          item.id === habit.id ? { ...item, completed: previousCompleted } : item,
        ),
      );
    };
    if (habit.completed && editingCompletionId === habit.completionId) closeEditor();
    setHabits((current) =>
      current.map((item) =>
        item.id === habit.id ? { ...item, completed: !previousCompleted } : item,
      ),
    );
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const request = habit.completed
      ? uncompleteHabit(habit.id, currentDate, zone)
      : completeHabit(habit.id, currentDate, zone);
    request
      .then(async (result) => {
        if (!result.success) {
          rollback();
          if (currentDate === displayedDateRef.current) setActionMessage(result.message);
          return;
        }
      })
      .catch(() => {
        rollback();
        if (currentDate !== displayedDateRef.current) return;
        setActionMessage("완료 상태를 변경하지 못했어요. 다시 시도해 주세요.");
      })
      .finally(() => {
        pendingMutationRef.current.delete(habit.id);
        setPendingIds((current) => {
          const next = new Set(current);
          next.delete(habit.id);
          return next;
        });

        if (pendingMutationRef.current.size === 0 && currentDate === displayedDateRef.current) {
          const reconciliationId = ++loadRequestRef.current;
          void getTodayHabits(currentDate)
            .then((refreshed) => {
              if (
                reconciliationId !== loadRequestRef.current ||
                currentDate !== displayedDateRef.current
              )
                return;
              if (refreshed.success) setHabits(refreshed.habits);
              else setActionMessage("변경사항은 저장됐지만 최신 상태를 다시 불러오지 못했어요.");
            })
            .catch(() => {
              if (
                reconciliationId === loadRequestRef.current &&
                currentDate === displayedDateRef.current
              )
                setActionMessage("변경사항은 저장됐지만 최신 상태를 다시 불러오지 못했어요.");
            });
        }
      });
  };

  if (loading) return <LoadingState label="오늘의 루틴을 불러오는 중..." />;
  if (message) return <ErrorState message={message} />;
  const done = habits.filter((habit) => habit.completed).length;
  const percentage = habits.length ? Math.round((done / habits.length) * 100) : 0;
  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-muted-foreground">{formatToday(date)}</p>
      {habits.length === 0 ? (
        <EmptyState
          title="오늘 표시할 루틴이 없어요."
          description="루틴을 만들거나 일정을 확인해보세요."
          action={
            <Button asChild>
              <Link href="/habits">루틴 관리하기</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">오늘의 진행</CardTitle>
                <span className="text-2xl font-semibold tabular-nums">{percentage}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {done} / {habits.length} 완료
                </span>
                {done === habits.length && (
                  <span className="font-medium text-foreground">
                    오늘의 루틴을 모두 완료했어요.
                  </span>
                )}
              </div>
              <div
                role="progressbar"
                aria-label="오늘의 루틴 완료 진행률"
                aria-valuemin={0}
                aria-valuemax={habits.length}
                aria-valuenow={done}
                className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"
              >
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <section aria-labelledby="today-habits-title" className="space-y-3">
            <h2 id="today-habits-title" className="font-semibold">
              오늘의 루틴
            </h2>
            <ul className="divide-y rounded-xl border bg-card">
              {habits.map((habit) => {
                const pending = pendingIds.has(habit.id);
                return (
                  <li
                    key={habit.id}
                    className={`flex items-center gap-3 p-4 sm:p-5 ${habit.completed ? "bg-muted/30" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(habit)}
                      disabled={pending || notePendingId === habit.completionId}
                      aria-label={`${habit.name} ${habit.completed ? "완료 취소" : "완료 처리"}`}
                      aria-pressed={habit.completed}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60"
                    >
                      {habit.completed ? (
                        <CheckCircle2 aria-hidden="true" className="h-6 w-6 text-primary" />
                      ) : (
                        <Circle aria-hidden="true" className="h-6 w-6 text-muted-foreground" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`break-words font-medium ${habit.completed ? "text-muted-foreground line-through" : ""}`}
                      >
                        {habit.name}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>{scheduleLabel(habit)}</span>
                        {habit.streakCount > 0 && <span>{habit.streakCount}일 연속</span>}
                      </div>
                      {habit.completed && habit.completionId && (
                        <div className="mt-2 space-y-2">
                          {habit.note && editingCompletionId !== habit.completionId && (
                            <p className="line-clamp-2 break-words text-sm text-muted-foreground">
                              {habit.note.note}
                            </p>
                          )}
                          {editingCompletionId !== habit.completionId && (
                            <button
                              ref={(element) => {
                                noteTriggerRefs.current[habit.completionId!] = element;
                              }}
                              type="button"
                              onClick={() => openEditor(habit)}
                              className="min-h-11 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {habit.note ? "수정" : "메모 추가"}
                            </button>
                          )}
                          {editingCompletionId === habit.completionId && (
                            <div className="space-y-2">
                              <textarea
                                autoFocus
                                value={noteDraft}
                                onChange={(event) =>
                                  setNoteDraft(
                                    Array.from(event.target.value).slice(0, 1000).join(""),
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Escape" && !notePendingId) closeEditor();
                                }}
                                aria-label={`${habit.name} 메모`}
                                aria-describedby={noteError ? `note-error-${habit.id}` : undefined}
                                className="min-h-24 w-full resize-y rounded-md border bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              />
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span>{Array.from(noteDraft).length} / 1000</span>
                                {noteError && (
                                  <span
                                    id={`note-error-${habit.id}`}
                                    role="alert"
                                    className="text-destructive"
                                  >
                                    {noteError}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => void saveNote(habit)}
                                  disabled={
                                    notePendingId === habit.completionId || !noteDraft.trim()
                                  }
                                >
                                  {notePendingId === habit.completionId ? "저장 중..." : "저장"}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={closeEditor}
                                  disabled={notePendingId === habit.completionId}
                                >
                                  취소
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <FormMessage message={actionMessage} status="error" />
          </section>
        </>
      )}
    </div>
  );
}
