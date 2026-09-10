export function FormMessage({
  message,
  status,
}: {
  message: string;
  status: "error" | "success" | "info";
}) {
  if (!message) return null;

  return (
    <p
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? undefined : "polite"}
      className={status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
    >
      {message}
    </p>
  );
}
