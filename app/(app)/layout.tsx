import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { AppNavigation } from "@/components/app-navigation";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  if (!hasEnvVars) redirect("/auth/login");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login");

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/dashboard" className="text-xl font-semibold">Routine</Link>
          <div className="flex items-center gap-2 sm:order-3">
            <ThemeSwitcher />
            <LogoutButton />
          </div>
          <AppNavigation />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:py-12">{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p role="status" className="p-6 text-sm text-muted-foreground">화면을 불러오는 중...</p>}>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  );
}
