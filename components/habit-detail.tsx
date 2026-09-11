"use client";

import Link from "next/link";
import { ArrowLeft, Check, Circle, Minus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getHabitDetail } from "@/lib/habits/detail";
import { formatHabitSchedule } from "@/lib/habits/schedule";
import type { Habit } from "@/lib/habits/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import {
  createCompletionNote,
  deleteCompletionNote,
  updateCompletionNote,
} from "@/lib/habits/note-actions";
import type { CompletionHistoryRow } from "@/lib/habits/types";

type DetailData = {
  habit: Habit;
  streakCount: number;
  rate7: { rate: number };
  rate30: { rate: number };
  rows: { completed_date: string }[];
  history: CompletionHistoryRow[];
};
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const add = (value: string, days: number) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const dow = (value: string) => new Date(`${value}T00:00:00Z`).getUTCDay();
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" }).format(
    new Date(`${value}T00:00:00`),
  );
const localDateFromTimestamp = (value: string, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.year}-${values.month}-${values.day}`;
};

export function HabitDetail({ id }: { id: string }) {
  const [date, setDate] = useState(localDate);
  const [data, setData] = useState<DetailData | null>(null);
  const [error, setError] = useState("");
  const [editingCompletionId, setEditingCompletionId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [notePendingId, setNotePendingId] = useState<string | null>(null);
  const [noteError, setNoteError] = useState("");
  const [noteErrorCompletionId, setNoteErrorCompletionId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"all" | "notes">("all");
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());
  const noteTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const noteRowRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const historyFilterRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await getHabitDetail(
          id,
          date,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        );
        if (!active) return;
        if (result.success) {
          setData(result);
          setError("");
        } else setError(result.message);
      } catch {
        if (active) setError("루틴 상세 정보를 불러오지 못했어요.");
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [id, date]);
  const closeEditor = () => {
    const completionId = editingCompletionId;
    setEditingCompletionId(null);
    setNoteDraft("");
    setNoteError("");
    setNoteErrorCompletionId(null);
    if (completionId) requestAnimationFrame(() => noteTriggerRefs.current[completionId]?.focus());
  };
  const openEditor = (row: CompletionHistoryRow) => {
    setEditingCompletionId(row.completion_id);
    setNoteDraft(row.note?.note ?? "");
    setNoteError("");
    setNoteErrorCompletionId(null);
  };
  const saveNote = async (row: CompletionHistoryRow) => {
    if (notePendingId) return;
    setNotePendingId(row.completion_id);
    setNoteError("");
    try {
      const result = row.note
        ? await updateCompletionNote(row.completion_id, noteDraft)
        : await createCompletionNote(row.completion_id, noteDraft);
      if (!result.success) {
        setNoteError(result.message);
        setNoteErrorCompletionId(row.completion_id);
        return;
      }
      setData((current) =>
        current
          ? {
              ...current,
              history: current.history.map((item) =>
                item.completion_id === row.completion_id
                  ? {
                      ...item,
                      note: {
                        completion_id: row.completion_id,
                        note: noteDraft.trim(),
                        created_at: item.note?.created_at ?? new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                    }
                  : item,
              ),
            }
          : current,
      );
      closeEditor();
    } catch {
      setNoteError("메모 저장에 실패했습니다. 다시 시도해 주세요.");
      setNoteErrorCompletionId(row.completion_id);
    } finally {
      setNotePendingId(null);
    }
  };
  const removeNote = async (row: CompletionHistoryRow) => {
    if (
      notePendingId ||
      !window.confirm("메모를 삭제할까요?\n완료 기록은 유지되고 메모만 삭제됩니다.")
    )
      return;
    setNotePendingId(row.completion_id);
    setNoteError("");
    try {
      const result = await deleteCompletionNote(row.completion_id);
      if (!result.success) {
        setNoteError(result.message);
        setNoteErrorCompletionId(row.completion_id);
        return;
      }
      setData((current) =>
        current
          ? {
              ...current,
              history: current.history.map((item) =>
                item.completion_id === row.completion_id ? { ...item, note: null } : item,
              ),
            }
          : current,
      );
      setExpandedNoteIds((current) => {
        const next = new Set(current);
        next.delete(row.completion_id);
        return next;
      });
      if (editingCompletionId === row.completion_id) closeEditor();
      requestAnimationFrame(() => {
        if (historyFilter === "notes") historyFilterRefs.current.notes?.focus();
        else noteRowRefs.current[row.completion_id]?.focus();
      });
    } catch {
      setNoteError("메모를 삭제하지 못했습니다. 다시 시도해 주세요.");
      setNoteErrorCompletionId(row.completion_id);
    } finally {
      setNotePendingId(null);
    }
  };
  useEffect(() => {
    const onVisible = () => {
      const current = localDate();
      if (document.visibilityState === "visible" && current !== date) setDate(current);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [date]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="루틴 상세 정보를 불러오는 중..." />;

  const { habit, rows, history } = data;
  const completed = new Set(rows.map((row) => row.completed_date));
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const archivedDate = habit.archived_at
    ? localDateFromTimestamp(habit.archived_at, timeZone)
    : null;
  const dates = Array.from({ length: 30 }, (_, index) => add(date, -index)).filter(
    (value) => value >= habit.start_date,
  );
  const rate7 = Math.round(data.rate7.rate * 100);
  const rate30 = Math.round(data.rate30.rate * 100);
  const statusFor = (value: string) => {
    if (archivedDate && value > archivedDate) return "예정 없음";
    if (completed.has(value)) return "완료";
    if (habit.schedule_type === "weekly_target") return "기록 없음";
    if (habit.schedule_type === "specific_days" && !(habit.days_of_week ?? []).includes(dow(value)))
      return "예정 없음";
    return "미완료";
  };
  const recentRecords = [...history].sort((a, b) =>
    b.completed_date.localeCompare(a.completed_date),
  );
  const noteCount = recentRecords.filter((row) => row.note !== null).length;
  const filteredRecords =
    historyFilter === "notes" ? recentRecords.filter((row) => row.note !== null) : recentRecords;
  const toggleNoteExpanded = (completionId: string) => {
    setExpandedNoteIds((current) => {
      const next = new Set(current);
      if (next.has(completionId)) next.delete(completionId);
      else next.add(completionId);
      return next;
    });
  };
  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" className="-ml-3 min-h-11 px-3">
        <Link href="/habits">
          <ArrowLeft aria-hidden="true" />
          Habits
        </Link>
      </Button>
      <header className="space-y-3 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="break-words text-3xl font-semibold tracking-tight">{habit.name}</h1>
          {habit.archived_at && (
            <span className="rounded-md border px-2 py-1 text-xs font-medium">보관된 루틴</span>
          )}
        </div>
        <p className="text-muted-foreground">{formatHabitSchedule(habit)}</p>
        <p className="text-sm text-muted-foreground">시작일: {habit.start_date}</p>
        {habit.archived_at && (
          <p className="text-sm text-muted-foreground">
            기존 완료 기록은 유지되지만 Today에는 더 이상 표시되지 않아요.
          </p>
        )}
      </header>
      <section aria-label="루틴 요약" className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">현재 연속</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{data.streakCount}일</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">최근 7일</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{rate7}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">최근 30일</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{rate30}%</p>
          </CardContent>
        </Card>
      </section>
      <section aria-labelledby="history-title" className="space-y-3">
        <h2 id="history-title" className="font-semibold">
          최근 30일
        </h2>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {dates.map((value) => {
            const status = statusFor(value);
            return (
              <div
                key={value}
                className="flex aspect-square min-w-0 flex-col items-center justify-center rounded-md border bg-card text-muted-foreground"
              >
                <span className="sr-only">
                  {formatDate(value)} {status}
                </span>
                {status === "완료" ? (
                  <Check aria-hidden="true" className="h-4 w-4 text-primary" />
                ) : status === "미완료" ? (
                  <Circle aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Minus aria-hidden="true" className="h-4 w-4" />
                )}
                <span aria-hidden="true" className="text-[10px]">
                  {value.slice(8)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
      <section aria-labelledby="records-title" className="space-y-3">
        <h2 id="records-title" className="font-semibold">
          최근 기록
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            최근 기록 {recentRecords.length}개 · 메모 {noteCount}개
          </p>
          <div className="flex flex-wrap gap-2" aria-label="최근 기록 필터">
            <Button
              type="button"
              ref={(element) => {
                historyFilterRefs.current.all = element;
              }}
              variant={historyFilter === "all" ? "secondary" : "outline"}
              size="sm"
              aria-pressed={historyFilter === "all"}
              disabled={editingCompletionId !== null}
              onClick={() => setHistoryFilter("all")}
            >
              전체
            </Button>
            <Button
              type="button"
              ref={(element) => {
                historyFilterRefs.current.notes = element;
              }}
              variant={historyFilter === "notes" ? "secondary" : "outline"}
              size="sm"
              aria-pressed={historyFilter === "notes"}
              disabled={editingCompletionId !== null}
              onClick={() => setHistoryFilter("notes")}
            >
              메모 있음
            </Button>
          </div>
        </div>
        {recentRecords.length === 0 ? (
          <EmptyState
            title="아직 완료 기록이 없어요."
            description={
              habit.archived_at
                ? "보관되기 전 등록된 완료 기록이 없습니다."
                : "오늘부터 첫 기록을 만들어보세요."
            }
          />
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            최근 기록에 작성된 메모가 없습니다.
          </div>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {filteredRecords.map((row) => {
              const isExpanded = expandedNoteIds.has(row.completion_id);
              return (
                <li
                  ref={(element) => {
                    noteRowRefs.current[row.completion_id] = element;
                  }}
                  tabIndex={-1}
                  key={row.completion_id}
                  className="space-y-2 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{formatDate(row.completed_date)}</span>
                    {(!habit.archived_at || row.note) &&
                      editingCompletionId !== row.completion_id && (
                        <button
                          ref={(element) => {
                            noteTriggerRefs.current[row.completion_id] = element;
                          }}
                          type="button"
                          onClick={() => openEditor(row)}
                          disabled={notePendingId !== null}
                          className="min-h-11 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                        >
                          {row.note ? "수정" : "메모 추가"}
                        </button>
                      )}
                  </div>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Check aria-hidden="true" className="h-4 w-4 text-primary" />
                    완료
                  </span>
                  {row.note && editingCompletionId !== row.completion_id && (
                    <>
                      <p
                        id={`detail-note-${row.completion_id}`}
                        className={
                          isExpanded
                            ? "whitespace-pre-wrap break-words text-muted-foreground"
                            : "line-clamp-2 break-words text-muted-foreground"
                        }
                      >
                        {row.note.note}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-expanded={isExpanded}
                        aria-controls={`detail-note-${row.completion_id}`}
                        onClick={() => toggleNoteExpanded(row.completion_id)}
                      >
                        {isExpanded ? "메모 접기" : "메모 더보기"}
                      </Button>
                    </>
                  )}
                  {editingCompletionId === row.completion_id && (
                    <div className="space-y-2">
                      <textarea
                        autoFocus
                        value={noteDraft}
                        onChange={(event) =>
                          setNoteDraft(Array.from(event.target.value).slice(0, 1000).join(""))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Escape" && !notePendingId) closeEditor();
                        }}
                        aria-label={`${formatDate(row.completed_date)} 메모`}
                        aria-describedby={
                          noteError && noteErrorCompletionId === row.completion_id
                            ? `detail-note-error-${row.completion_id}`
                            : undefined
                        }
                        className="min-h-24 w-full resize-y rounded-md border bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>{Array.from(noteDraft).length} / 1000</span>
                        {noteError && noteErrorCompletionId === row.completion_id && (
                          <span
                            id={`detail-note-error-${row.completion_id}`}
                            role="alert"
                            className="text-destructive"
                          >
                            {noteError}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void saveNote(row)}
                          disabled={notePendingId === row.completion_id || !noteDraft.trim()}
                        >
                          저장
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={closeEditor}
                          disabled={notePendingId === row.completion_id}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  )}
                  {noteError &&
                    noteErrorCompletionId === row.completion_id &&
                    editingCompletionId !== row.completion_id && (
                      <p
                        id={`detail-note-error-${row.completion_id}`}
                        role="alert"
                        className="text-sm text-destructive"
                      >
                        {noteError}
                      </p>
                    )}
                  {row.note && editingCompletionId !== row.completion_id && (
                    <button
                      type="button"
                      onClick={() => void removeNote(row)}
                      disabled={notePendingId !== null}
                      className="min-h-11 text-sm text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      메모 삭제
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
