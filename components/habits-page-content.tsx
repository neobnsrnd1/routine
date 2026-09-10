"use client";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const handleToggleForm = () => {
    if (showForm) {
      setShowForm(false);
      router.replace("/habits", { scroll: false });
      return;
    }

    setShowForm(true);
  };
  return (
    <div className="space-y-8">
      <PageHeader
        title="Habits"
        description="나만의 루틴을 만들고 관리하세요."
        action={
          <Button type="button" onClick={handleToggleForm}>
            {showForm ? "닫기" : "+ 루틴 추가"}
          </Button>
        }
      />
      {showForm && <HabitForm />}
      {children}
    </div>
  );
}
