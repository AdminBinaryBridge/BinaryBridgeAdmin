import type { Metadata } from "next";
import Link from "next/link";

import { getSiteVisitStats } from "@/lib/firebase/visits";

export const metadata: Metadata = {
  title: "Website visits",
};

export const dynamic = "force-dynamic";

function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

export default async function AdminVisitsPage() {
  const result = await getSiteVisitStats();

  if (result.ok === false && result.reason === "not_configured") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Website visits
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
            Website visits
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Could not load visit stats from Firestore.
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
          {result.message}
        </div>
      </div>
    );
  }

  const { stats } = result;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Website visits
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Page loads logged from binarybridge.in, counted from the Firestore{" "}
          <code className="font-mono text-xs">SiteVisits</code> collection.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total visits" value={stats.total} hint="All-time page loads" />
        <StatCard label="Today" value={stats.today} hint="Since midnight" />
        <StatCard label="Last 7 days" value={stats.last7Days} hint="Rolling 7-day window" />
        <StatCard label="Last 30 days" value={stats.last30Days} hint="Rolling 30-day window" />
      </div>
    </div>
  );
}
