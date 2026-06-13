import type { Metadata } from "next";
import Link from "next/link";

import { ReportList } from "@/components/admin/report-list";
import { getReports } from "@/lib/firebase/reports";

export const metadata: Metadata = {
  title: "Reports",
};

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const result = await getReports();

  if (result.ok === false && result.reason === "not_configured") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Reports
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
            Reports
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Could not load reports from Firestore.
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
          {result.message}
        </div>
      </div>
    );
  }

  const pendingCount = result.reports.filter(
    (report) => report.status?.toLowerCase() === "pending",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Reports
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {result.reports.length} report{result.reports.length === 1 ? "" : "s"}{" "}
          from the Firestore{" "}
          <code className="font-mono text-xs">Reports</code> collection
          {pendingCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {" "}
              · {pendingCount} pending
            </span>
          )}
          .
        </p>
      </div>
      <ReportList reports={result.reports} />
    </div>
  );
}
