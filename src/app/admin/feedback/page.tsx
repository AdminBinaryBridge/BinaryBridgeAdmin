import type { Metadata } from "next";
import Link from "next/link";

import { FeedbackChat } from "@/components/admin/feedback-chat";
import { getFeedbackThreads } from "@/lib/firebase/feedback";

export const metadata: Metadata = {
  title: "Feedback",
};

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const result = await getFeedbackThreads();

  if (result.ok === false && result.reason === "not_configured") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Feedback
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Firestore is not configured yet.
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          Add your Firebase Admin credentials, then restart the dev server. See{" "}
          <Link href="/admin/settings" className="underline">
            Settings
          </Link>
          .
        </div>
      </div>
    );
  }

  if (result.ok === false) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Feedback
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Could not load feedback threads from Firestore.
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
          {result.message}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Feedback
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Chat with users who submitted feedback from the app.
        </p>
      </div>
      <FeedbackChat initialThreads={result.threads} />
    </div>
  );
}
