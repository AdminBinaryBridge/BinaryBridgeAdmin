"use client";

import { useState, useTransition } from "react";

import { broadcastNotificationToAllUsers } from "@/app/admin/actions";

type BroadcastNotificationFormProps = {
  userCount: number;
};

export function BroadcastNotificationForm({
  userCount,
}: BroadcastNotificationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    if (
      !window.confirm(
        `Send this notification to all ${userCount} users? Push alerts will go to devices with FCM tokens.`,
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("title", title);
    formData.set("body", body);

    startTransition(async () => {
      const response = await broadcastNotificationToAllUsers(formData);

      if (response.ok === false) {
        setResult({ type: "error", message: response.message });
        return;
      }

      setResult({
        type: "success",
        message: `Sent to ${response.totalUsers} users · ${response.pushSent} push delivered · ${response.pushFailed} push failed · ${response.notificationsCreated} in-app notifications created.`,
      });
      setTitle("");
      setBody("");
    });
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Broadcast notification
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Sends a push notification to all users with an FCM token and creates an
          in-app notification for every user.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="space-y-1.5">
          <label
            htmlFor="broadcast-title"
            className="text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Title
          </label>
          <input
            id="broadcast-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Announcement title"
            maxLength={120}
            required
            disabled={isPending}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="broadcast-body"
            className="text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Message
          </label>
          <textarea
            id="broadcast-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write your message to all users…"
            maxLength={500}
            rows={4}
            required
            disabled={isPending}
            className="w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending || userCount === 0}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isPending ? "Sending…" : `Send to all users (${userCount})`}
          </button>
          <p className="text-xs text-zinc-500">
            Users without an FCM token still receive the in-app notification.
          </p>
        </div>
        {result && (
          <div
            className={
              result.type === "success"
                ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
                : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100"
            }
          >
            {result.message}
          </div>
        )}
      </form>
    </section>
  );
}
