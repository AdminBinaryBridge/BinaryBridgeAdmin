import type { Metadata } from "next";
import Link from "next/link";

import { BroadcastNotificationForm } from "@/components/admin/broadcast-notification-form";
import { BroadcastHistory } from "@/components/admin/broadcast-history";
import {
  FlagIcon,
  GlobeIcon,
  ImageIcon,
  UsersIcon,
} from "@/components/admin/icons";
import { computeDashboardMetrics } from "@/lib/admin/dashboard-metrics";
import { getFirestoreStatus } from "@/lib/firebase/status";
import { getAdminBroadcastHistory } from "@/lib/firebase/notifications";
import { getPosts } from "@/lib/firebase/posts";
import { getReports } from "@/lib/firebase/reports";
import { getUsers } from "@/lib/firebase/users";
import { getSiteVisitStats } from "@/lib/firebase/visits";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

function MetricCard({
  label,
  value,
  hint,
  href,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  href?: string;
  accent?: "default" | "warning" | "danger";
  icon: (props: import("react").SVGProps<SVGSVGElement>) => React.JSX.Element;
}) {
  const accentStyles = {
    default:
      "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 hover:border-violet-300 hover:shadow-md dark:hover:border-violet-800",
    warning:
      "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 hover:border-amber-300 hover:shadow-md dark:hover:border-amber-800",
    danger:
      "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 hover:border-red-300 hover:shadow-md dark:hover:border-red-800",
  };

  const chipStyles = {
    default:
      "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    warning:
      "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    danger:
      "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  };

  const className = `group rounded-lg border p-4 shadow-sm transition-all ${accentStyles[accent ?? "default"]}`;

  const content = (
    <>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${chipStyles[accent ?? "default"]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function FirestoreBanner({
  status,
}: {
  status: Awaited<ReturnType<typeof getFirestoreStatus>>;
}) {
  if (status.state === "connected") {
    return null;
  }

  if (status.state === "not_configured") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        Firestore is not configured. Add Firebase Admin credentials in{" "}
        <Link href="/admin/settings" className="underline">
          Settings
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
      Firestore connection failed: {status.message}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [
    firestoreStatus,
    usersResult,
    reportsResult,
    postsResult,
    broadcastHistoryResult,
    visitStatsResult,
  ] = await Promise.all([
    getFirestoreStatus(),
    getUsers(),
    getReports(),
    getPosts(),
    getAdminBroadcastHistory(),
    getSiteVisitStats(),
  ]);

  const dataReady =
    usersResult.ok && reportsResult.ok && postsResult.ok;

  const metrics = dataReady
    ? computeDashboardMetrics(
        usersResult.users,
        postsResult.posts,
        reportsResult.reports,
      )
    : null;

  const userCountNumber = metrics?.users.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Overview of users, content, and moderation activity.
        </p>
      </div>

      <FirestoreBanner status={firestoreStatus} />

      {metrics ? (
        <>
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              <span className="h-4 w-1 rounded-full bg-violet-500" />
              Overview
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Total users"
                value={metrics.users.total}
                hint={`${metrics.users.today} joined today · View all →`}
                href="/admin/users"
                icon={UsersIcon}
              />
              <MetricCard
                label="New this week"
                value={metrics.users.week}
                hint="Signups in the last 7 days"
                href="/admin/users"
                icon={UsersIcon}
              />
              <MetricCard
                label="Total posts"
                value={metrics.posts.total}
                hint={`${metrics.posts.week} posted this week · Browse →`}
                href="/admin/posts"
                icon={ImageIcon}
              />
              <MetricCard
                label="Pending reports"
                value={metrics.reports.pending}
                hint={
                  metrics.reports.pending > 0
                    ? "Needs review · Open queue →"
                    : "Queue is clear · View all →"
                }
                href="/admin/reports"
                accent={metrics.reports.pending > 0 ? "warning" : "default"}
                icon={FlagIcon}
              />
              {visitStatsResult.ok && (
                <MetricCard
                  label="Website visits"
                  value={visitStatsResult.stats.total}
                  hint={`${visitStatsResult.stats.today} today · View details →`}
                  href="/admin/visits"
                  icon={GlobeIcon}
                />
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              <span className="h-4 w-1 rounded-full bg-red-500" />
              Moderation
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Blocked users"
                value={metrics.users.blocked}
                hint="Active blocks on accounts"
                href="/admin/users"
                accent={metrics.users.blocked > 0 ? "danger" : "default"}
                icon={UsersIcon}
              />
              <MetricCard
                label="Resolved reports"
                value={metrics.reports.resolved}
                hint="Marked as handled"
                href="/admin/reports"
                icon={FlagIcon}
              />
              <MetricCard
                label="Dismissed reports"
                value={metrics.reports.dismissed}
                hint="No action taken"
                href="/admin/reports"
                icon={FlagIcon}
              />
              <MetricCard
                label="All reports"
                value={metrics.reports.total}
                hint="Total in Firestore"
                href="/admin/reports"
                icon={FlagIcon}
              />
            </div>
          </section>
        </>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
          Could not load dashboard metrics from Firestore.
        </div>
      )}

      <BroadcastNotificationForm userCount={userCountNumber} />
      {broadcastHistoryResult.ok && (
        <BroadcastHistory broadcasts={broadcastHistoryResult.broadcasts} />
      )}
    </div>
  );
}
