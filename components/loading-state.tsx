import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <p role="status" aria-live="polite" className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
      <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
      {label}
    </p>
  );
}
