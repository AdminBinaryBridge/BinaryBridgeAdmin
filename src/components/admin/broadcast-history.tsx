import { formatDateTime } from "@/lib/format";
import type { BroadcastHistoryEntry } from "@/lib/firebase/notifications";

type BroadcastHistoryProps = {
  broadcasts: BroadcastHistoryEntry[];
};

export function BroadcastHistory({ broadcasts }: BroadcastHistoryProps) {
  if (broadcasts.length === 0) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Broadcast history
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Past admin notifications sent to all users.
          </p>
        </div>
        <p className="p-4 text-sm text-zinc-500">No broadcasts sent yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Broadcast history
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Past admin notifications sent to all users.
        </p>
      </div>
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {broadcasts.map((broadcast) => (
          <div key={broadcast.id} className="space-y-1 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {broadcast.title || "Untitled"}
              </p>
              <span className="text-xs text-zinc-500">
                {formatDateTime(broadcast.sentAt)}
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {broadcast.body || "—"}
            </p>
            <p className="text-xs text-zinc-500">
              Sent to {broadcast.recipientCount} user
              {broadcast.recipientCount === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
