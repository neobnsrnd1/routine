"use client";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { HabitForm } from "@/components/habit-form";
export function HabitsPageContent({
  children,
  initialOpen = false,
}: {
  children: ReactNode;
  initialOpen?: boolean;
}) {
  const [showForm, setShowForm] = useState(initialOpen);
  return (
    <div className="space-y-8">
      <PageHeader
        title="Habits"
        description="나만의 루틴을 만들고 관리하세요."
        action={
          <Button type="button" onClick={() => setShowForm((value) => !value)}>
            {showForm ? "닫기" : "+ 루틴 추가"}
          </Button>
        }
      />
      {showForm && <HabitForm />}
      {children}
    </div>
  );
}
