"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Today" },
  { href: "/habits", label: "Habits" },
  { href: "/calendar", label: "Calendar" },
  { href: "/stats", label: "Stats" },
];

export function AppNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="주요 메뉴" className="flex w-full gap-1 sm:w-auto">
      {links.map(({ href, label }) => (
        <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none",
            pathname === href ? "bg-secondary text-foreground" : "text-muted-foreground",
          )}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
