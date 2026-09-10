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

function isActive(pathname: string, href: string) {
  return href === "/habits"
    ? pathname === href || pathname.startsWith(`${href}/`)
    : pathname === href;
}

export function AppNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur sm:static sm:w-auto sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none"
    >
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={cn(
            "min-h-11 flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-9 sm:flex-none sm:px-4",
            isActive(pathname, href) ? "bg-secondary text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
