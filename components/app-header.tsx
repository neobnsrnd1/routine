import Link from "next/link";
import { AppNavigation } from "@/components/app-navigation";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
export function AppHeader() {
  return (
    <header className="border-b bg-background/95 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/dashboard"
          className="shrink-0 text-lg font-semibold tracking-tight sm:text-xl"
        >
          Routine
        </Link>
        <div className="flex-1 sm:flex sm:justify-center">
          <AppNavigation />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ThemeSwitcher />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
