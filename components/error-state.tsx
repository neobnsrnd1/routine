import type { ReactNode } from "react";
export function ErrorState({ message, action }: { message: string; action?: ReactNode }) { return <div role="alert" className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"><p>{message}</p>{action && <div className="shrink-0">{action}</div>}</div>; }
