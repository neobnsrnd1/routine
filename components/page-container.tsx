import type { ReactNode } from "react";
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:py-12 sm:pb-12">
      {children}
    </main>
  );
}
