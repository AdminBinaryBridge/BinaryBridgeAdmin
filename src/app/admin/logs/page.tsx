import type { Metadata } from "next";
import Link from "next/link";

import { LogList } from "@/components/admin/log-list";
import { getLogs } from "@/lib/firebase/logs";

export const metadata: Metadata = {
  title: "Logs",
};

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const result = await getLogs();

  if (result.ok === false && result.reason === "not_configured") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Logs
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
            Logs
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Could not load logs from Firestore.
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
          {result.message}
        </div>
      </div>
    );
  }

  const errorCount = result.logs.filter((log) => log.level === "error").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Logs
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Most recent {result.logs.length} entries from the Firestore{" "}
          <code className="font-mono text-xs">Logs</code> collection, written
          by the app on every Firebase read/write
          {errorCount > 0 && (
            <span className="text-red-600 dark:text-red-400">
              {" "}
              · {errorCount} error{errorCount === 1 ? "" : "s"}
            </span>
          )}
          .
        </p>
      </div>
      <LogList logs={result.logs} />
    </div>
  );
}
