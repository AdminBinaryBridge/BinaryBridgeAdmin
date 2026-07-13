export function formatDateTime(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatTime(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatDateHeading(iso: string | null): string {
  if (!iso) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "full",
  }).format(new Date(iso));
}

export function dateKey(iso: string | null): string {
  if (!iso) {
    return "unknown";
  }

  return new Date(iso).toISOString().slice(0, 10);
}
