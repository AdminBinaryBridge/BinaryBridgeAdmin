import type { Query, Timestamp } from "firebase-admin/firestore";

import { getAdminFirestore } from "./admin";
import { isFirebaseAdminConfigured } from "./config";

const LOGS_COLLECTION = "Logs";

// Most recent logs fetched per request. The client (RNBinaryBridge app) writes
// one entry per Firebase read/write/error, so this collection grows fast -
// callers should filter by level/identifier rather than paging through all of it.
const DEFAULT_LOG_LIMIT = 300;

export type LogLevel = "info" | "success" | "warn" | "error";

export type LogRecord = {
  id: string;
  level: LogLevel;
  identifier: string | null;
  message: string | null;
  meta: Record<string, unknown> | null;
  errorMessage: string | null;
  errorCode: string | null;
  uid: string | null;
  platform: string | null;
  clientTime: string | null;
  createdAt: string | null;
};

export type LogsResult =
  | { ok: true; logs: LogRecord[] }
  | { ok: false; reason: "not_configured" | "error"; message?: string };

const VALID_LEVELS: LogLevel[] = ["info", "success", "warn", "error"];

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
  key: string,
): string | null {
  const value = data[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeLevel(value: unknown): LogLevel {
  if (typeof value === "string" && VALID_LEVELS.includes(value as LogLevel)) {
    return value as LogLevel;
  }
  return "info";
}

function mapLogDoc(id: string, data: Record<string, unknown>): LogRecord {
  const meta = data.meta;

  return {
    id,
    level: normalizeLevel(data.level),
    identifier: pickString(data, "identifier"),
    message: pickString(data, "message"),
    meta:
      meta && typeof meta === "object" && !Array.isArray(meta)
        ? (meta as Record<string, unknown>)
        : null,
    errorMessage: pickString(data, "errorMessage"),
    errorCode: pickString(data, "errorCode"),
    uid: pickString(data, "uid"),
    platform: pickString(data, "platform"),
    clientTime: pickString(data, "clientTime"),
    createdAt: serializeTimestamp(data.createdAt),
  };
}

export async function getLogs(options?: {
  limit?: number;
  level?: LogLevel;
}): Promise<LogsResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    let ref: Query = getAdminFirestore()
      .collection(LOGS_COLLECTION)
      .orderBy("createdAt", "desc");

    if (options?.level) {
      ref = ref.where("level", "==", options.level);
    }

    const snapshot = await ref
      .limit(options?.limit ?? DEFAULT_LOG_LIMIT)
      .get();

    const logs = snapshot.docs.map((doc) => mapLogDoc(doc.id, doc.data()));

    return { ok: true, logs };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
