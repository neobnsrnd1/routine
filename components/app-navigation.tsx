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

function NavigationLinks({ pathname, mobile = false }: { pathname: string; mobile?: boolean }) {
  return (
    <>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={cn(
            cn(
              "rounded-md text-center text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              mobile ? "min-h-11 flex-1 px-2 py-3" : "px-4 py-2",
            ),
            isActive(pathname, href) ? "bg-secondary text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </>
  );
}

export function DesktopNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="주요 메뉴" className="hidden items-center justify-center gap-1 sm:flex">
      <NavigationLinks pathname={pathname} />
    </nav>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="주요 메뉴"
      className="flex border-b bg-background/95 px-2 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur sm:hidden"
    >
      <NavigationLinks pathname={pathname} mobile />
    </nav>
  );
}
