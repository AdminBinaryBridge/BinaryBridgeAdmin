import type { Timestamp } from "firebase-admin/firestore";

import { getAdminFirestore } from "./admin";
import { isFirebaseAdminConfigured } from "./config";

const REPORTS_COLLECTION = "Reports";

export type ReportStatus = "pending" | "resolved" | "dismissed";

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

export type ReportMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "not_found" | "error"; message?: string };

const VALID_STATUSES: ReportStatus[] = ["pending", "resolved", "dismissed"];

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

export type UserReportsResult =
  | {
      ok: true;
      reportsAgainst: ReportRecord[];
      reportsFiled: ReportRecord[];
    }
  | { ok: false; reason: "not_configured" | "error"; message?: string };

export async function getReportsForUser(user: {
  id: string;
  username: string | null;
}): Promise<UserReportsResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const db = getAdminFirestore();
    const [againstByUidSnap, filedSnap, againstByUsernameSnap] =
      await Promise.all([
        db
          .collection(REPORTS_COLLECTION)
          .where("postUid", "==", user.id)
          .orderBy("createdAt", "desc")
          .get(),
        db
          .collection(REPORTS_COLLECTION)
          .where("reporterUid", "==", user.id)
          .orderBy("createdAt", "desc")
          .get(),
        user.username
          ? db
              .collection(REPORTS_COLLECTION)
              .where("reportedUsername", "==", user.username)
              .orderBy("createdAt", "desc")
              .get()
          : Promise.resolve(null),
      ]);

    const reportsAgainstMap = new Map<string, ReportRecord>();

    for (const doc of againstByUidSnap.docs) {
      reportsAgainstMap.set(doc.id, mapReportDoc(doc.id, doc.data()));
    }

    if (againstByUsernameSnap) {
      for (const doc of againstByUsernameSnap.docs) {
        reportsAgainstMap.set(doc.id, mapReportDoc(doc.id, doc.data()));
      }
    }

    const reportsFiled = filedSnap.docs.map((doc) =>
      mapReportDoc(doc.id, doc.data()),
    );

    return {
      ok: true,
      reportsAgainst: [...reportsAgainstMap.values()],
      reportsFiled,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getReports(): Promise<ReportsResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const snapshot = await getAdminFirestore()
      .collection(REPORTS_COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    const reports = snapshot.docs.map((doc) =>
      mapReportDoc(doc.id, doc.data()),
    );

    return { ok: true, reports };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
): Promise<ReportMutationResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, reason: "error", message: "Invalid report status." };
  }

  try {
    const ref = getAdminFirestore().collection(REPORTS_COLLECTION).doc(reportId);
    const doc = await ref.get();

    if (!doc.exists) {
      return { ok: false, reason: "not_found", message: "Report not found." };
    }

    await ref.update({ status });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
