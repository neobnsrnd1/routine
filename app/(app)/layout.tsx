import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { AppHeader } from "@/components/app-header";
import { PageContainer } from "@/components/page-container";
import { LoadingState } from "@/components/loading-state";
async function AuthenticatedLayout({ children }: { children: React.ReactNode }) { if (!hasEnvVars) redirect("/auth/login"); const supabase = await createClient(); const { data, error } = await supabase.auth.getClaims(); if (error || !data?.claims) redirect("/auth/login"); return <AppShell><AppHeader /><PageContainer>{children}</PageContainer></AppShell>; }
export default function AppLayout({ children }: { children: React.ReactNode }) { return <Suspense fallback={<LoadingState label="Loading..." />}><AuthenticatedLayout>{children}</AuthenticatedLayout></Suspense>; }
