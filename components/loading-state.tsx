export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <p role="status" aria-live="polite" className="py-8 text-sm text-muted-foreground">
      {label}
    </p>
  );
}
