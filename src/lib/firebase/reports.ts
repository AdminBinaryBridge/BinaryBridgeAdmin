import type { Timestamp } from "firebase-admin/firestore";

import { getAdminFirestore } from "./admin";
import { isFirebaseAdminConfigured } from "./config";

const REPORTS_COLLECTION = "Reports";

export type ReportRecord = {
  id: string;
  kind: string | null;
  reportedUsername: string | null;
  text: string | null;
  postId: string | null;
  postUid: string | null;
  reporterUid: string | null;
  status: string | null;
  createdAt: string | null;
};

export type ReportsResult =
  | { ok: true; reports: ReportRecord[] }
  | { ok: false; reason: "not_configured" | "error"; message?: string };

function serializeTimestamp(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as Timestamp).toDate === "function"
  ) {
    return (value as Timestamp).toDate().toISOString();
  }

  if (
    value &&
    typeof value === "object" &&
    "_seconds" in value &&
    typeof (value as { _seconds: number })._seconds === "number"
  ) {
    return new Date((value as { _seconds: number })._seconds * 1000).toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
}

function pickString(
  data: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function mapReportDoc(id: string, data: Record<string, unknown>): ReportRecord {
  return {
    id,
    kind: pickString(data, "kind", "type"),
    reportedUsername: pickString(data, "reportedUsername", "reportedUser"),
    text: pickString(data, "text", "reason", "description"),
    postId: pickString(data, "postId"),
    postUid: pickString(data, "postUid", "reportedUid"),
    reporterUid: pickString(data, "reporterUid"),
    status: pickString(data, "status"),
    createdAt: serializeTimestamp(
      data.createdAt ?? data.created_at ?? data.created,
    ),
  };
}

export async function getReports(): Promise<ReportsResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const snapshot = await getAdminFirestore()
      .collection(REPORTS_COLLECTION)
      .get();

    const reports = snapshot.docs
      .map((doc) => mapReportDoc(doc.id, doc.data()))
      .sort((a, b) => {
        if (!a.createdAt && !b.createdAt) {
          return a.id.localeCompare(b.id);
        }
        if (!a.createdAt) {
          return 1;
        }
        if (!b.createdAt) {
          return -1;
        }
        return b.createdAt.localeCompare(a.createdAt);
      });

    return { ok: true, reports };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
