export function formatDateTime(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
