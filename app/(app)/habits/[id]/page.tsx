import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { HabitDetail } from "@/components/habit-detail";
async function HabitAccessGate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) notFound();
  const { data, error } = await supabase
    .from("habits")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) notFound();
  return <HabitDetail id={id} />;
}

export default function HabitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p role="status">Loading...</p>}>
      <HabitAccessGate params={params} />
    </Suspense>
  );
}
