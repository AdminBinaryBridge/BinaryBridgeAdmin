import type { Metadata } from "next";
import Link from "next/link";

import { BroadcastNotificationForm } from "@/components/admin/broadcast-notification-form";
import { UserList } from "@/components/admin/user-list";
import { getFirestoreStatus } from "@/lib/firebase/status";
import { getReports } from "@/lib/firebase/reports";
import { getUsers } from "@/lib/firebase/users";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

function FirestoreStatusCard({
  status,
}: {
  status: Awaited<ReturnType<typeof getFirestoreStatus>>;
}) {
  if (status.state === "not_configured") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
          Firestore
        </p>
        <p className="mt-2 text-sm font-medium text-amber-900 dark:text-amber-100">
          Not configured
        </p>
        <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-200/70">
          Add Firebase Admin credentials — see{" "}
          <a href="/admin/settings" className="underline">
            Settings
          </a>{" "}
          for setup steps.
        </p>
      </div>
    );
  }

  if (status.state === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-400">
          Firestore
        </p>
        <p className="mt-2 text-sm font-medium text-red-900 dark:text-red-100">
          Connection failed
        </p>
        <p className="mt-1 text-xs text-red-800/80 dark:text-red-200/70">
          {status.message}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        Firestore
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">
        {status.collectionCount}
      </p>
      <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/70">
        Collections in {status.projectId}
      </p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [firestoreStatus, usersResult, reportsResult] = await Promise.all([
    getFirestoreStatus(),
    getUsers(),
    getReports(),
  ]);

  const userCountNumber =
    usersResult.ok === true ? usersResult.users.length : 0;
  const userCount =
    usersResult.ok === true ? usersResult.users.length.toString() : "—";
  const reportCount =
    reportsResult.ok === true ? reportsResult.reports.length.toString() : "—";
  const pendingReports =
    reportsResult.ok === true
      ? reportsResult.reports.filter(
          (r) => r.status?.toLowerCase() === "pending",
        ).length
      : 0;
  const recentUsers =
    usersResult.ok === true ? usersResult.users.slice(0, 5) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Admin overview. User data is loaded from Firestore on the server.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FirestoreStatusCard status={firestoreStatus} />
        <Link
          href="/admin/users"
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Users
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {userCount}
          </p>
          <p className="mt-1 text-xs text-zinc-500">View full user list →</p>
        </Link>
        <Link
          href="/admin/reports"
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Reports
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {reportCount}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {pendingReports > 0
              ? `${pendingReports} pending · View all →`
              : "View all reports →"}
          </p>
        </Link>
      </div>
      <BroadcastNotificationForm userCount={userCountNumber} />
      {recentUsers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Recent users
            </h3>
            <Link
              href="/admin/users"
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              View all →
            </Link>
          </div>
          <UserList users={recentUsers} compact />
        </section>
      )}
    </div>
  );
}
