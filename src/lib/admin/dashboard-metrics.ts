import type { PostRecord } from "@/lib/firebase/posts";
import type { ReportRecord } from "@/lib/firebase/reports";
import type { UserRecord } from "@/lib/firebase/users";

export type DashboardMetrics = {
  users: {
    total: number;
    today: number;
    week: number;
    blocked: number;
  };
  posts: {
    total: number;
    week: number;
  };
  reports: {
    total: number;
    pending: number;
    resolved: number;
    dismissed: number;
  };
};

function normalizeReportStatus(status: string | null): string {
  return status?.toLowerCase() ?? "pending";
}

function isOnOrAfter(iso: string | null, threshold: Date): boolean {
  if (!iso) {
    return false;
  }

  const date = new Date(iso);
  return !Number.isNaN(date.getTime()) && date >= threshold;
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function computeDashboardMetrics(
  users: UserRecord[],
  posts: PostRecord[],
  reports: ReportRecord[],
): DashboardMetrics {
  const todayStart = startOfToday();
  const weekStart = daysAgo(7);

  return {
    users: {
      total: users.length,
      today: users.filter((user) => isOnOrAfter(user.createdAt, todayStart))
        .length,
      week: users.filter((user) => isOnOrAfter(user.createdAt, weekStart))
        .length,
      blocked: users.filter((user) => user.isBlocked).length,
    },
    posts: {
      total: posts.length,
      week: posts.filter((post) => isOnOrAfter(post.createdAt, weekStart)).length,
    },
    reports: {
      total: reports.length,
      pending: reports.filter(
        (report) => normalizeReportStatus(report.status) === "pending",
      ).length,
      resolved: reports.filter(
        (report) => normalizeReportStatus(report.status) === "resolved",
      ).length,
      dismissed: reports.filter(
        (report) => normalizeReportStatus(report.status) === "dismissed",
      ).length,
    },
  };
}
