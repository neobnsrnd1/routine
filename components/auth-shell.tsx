import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight sm:text-xl">
            Routine
          </Link>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:px-6 sm:py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
