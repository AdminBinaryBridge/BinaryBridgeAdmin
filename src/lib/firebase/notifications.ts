import { FieldValue } from "firebase-admin/firestore";

import { getAdminFirestore, getAdminMessaging } from "./admin";
import { isFirebaseAdminConfigured } from "./config";

const USERS_COLLECTION = "User";
const NOTIFICATIONS_COLLECTION = "Notifications";
const FCM_BATCH_SIZE = 500;

export type BroadcastInput = {
  title: string;
  body: string;
};

export type BroadcastResult =
  | {
      ok: true;
      totalUsers: number;
      pushSent: number;
      pushFailed: number;
      notificationsCreated: number;
    }
  | { ok: false; reason: "not_configured" | "validation" | "error"; message: string };

export type BroadcastHistoryEntry = {
  id: string;
  title: string;
  body: string;
  sentAt: string | null;
  recipientCount: number;
};

export type BroadcastHistoryResult =
  | { ok: true; broadcasts: BroadcastHistoryEntry[] }
  | { ok: false; reason: "not_configured" | "error"; message?: string };

type UserTarget = {
  uid: string;
  token: string | null;
};

function serializeTimestamp(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
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

function minuteKey(iso: string | null): string {
  if (!iso) {
    return "unknown";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  date.setSeconds(0, 0);
  return date.toISOString();
}

async function getUserTargets(): Promise<UserTarget[]> {
  const snapshot = await getAdminFirestore().collection(USERS_COLLECTION).get();

  return snapshot.docs.map((doc) => {
    const token = doc.data().fcmToken;
    return {
      uid: doc.id,
      token: typeof token === "string" && token.trim() ? token.trim() : null,
    };
  });
}

async function createNotificationDocs(
  userIds: string[],
  title: string,
  body: string,
): Promise<number> {
  const db = getAdminFirestore();
  let created = 0;

  for (let index = 0; index < userIds.length; index += FCM_BATCH_SIZE) {
    const chunk = userIds.slice(index, index + FCM_BATCH_SIZE);
    const batch = db.batch();

    for (const uid of chunk) {
      const ref = db.collection(NOTIFICATIONS_COLLECTION).doc();
      batch.set(ref, {
        read: false,
        type: "admin",
        title,
        text: body,
        recipientUid: uid,
        actorUid: "admin",
        actorUsername: "admin",
        actorFullName: "Binary Bridge Admin",
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    created += chunk.length;
  }

  return created;
}

async function sendPushNotifications(
  targets: UserTarget[],
  title: string,
  body: string,
): Promise<{ sent: number; failed: number }> {
  const tokenEntries = targets.filter(
    (target): target is UserTarget & { token: string } => Boolean(target.token),
  );

  const uniqueTokens = [...new Set(tokenEntries.map((target) => target.token))];

  if (uniqueTokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const messaging = getAdminMessaging();
  let sent = 0;
  let failed = 0;

  for (let index = 0; index < uniqueTokens.length; index += FCM_BATCH_SIZE) {
    const tokens = uniqueTokens.slice(index, index + FCM_BATCH_SIZE);
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        type: "admin",
        title,
        body,
      },
    });

    sent += response.successCount;
    failed += response.failureCount;
  }

  return { sent, failed };
}

export async function sendBroadcastNotification(
  input: BroadcastInput,
): Promise<BroadcastResult> {
  if (!isFirebaseAdminConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message: "Firebase Admin is not configured.",
    };
  }

  const title = input.title.trim();
  const body = input.body.trim();

  if (!title) {
    return {
      ok: false,
      reason: "validation",
      message: "Title is required.",
    };
  }

  if (!body) {
    return {
      ok: false,
      reason: "validation",
      message: "Message is required.",
    };
  }

  if (title.length > 120) {
    return {
      ok: false,
      reason: "validation",
      message: "Title must be 120 characters or fewer.",
    };
  }

  if (body.length > 500) {
    return {
      ok: false,
      reason: "validation",
      message: "Message must be 500 characters or fewer.",
    };
  }

  try {
    const targets = await getUserTargets();

    if (targets.length === 0) {
      return {
        ok: false,
        reason: "error",
        message: "No users found to notify.",
      };
    }

    const userIds = targets.map((target) => target.uid);
    const [pushResult, notificationsCreated] = await Promise.all([
      sendPushNotifications(targets, title, body),
      createNotificationDocs(userIds, title, body),
    ]);

    return {
      ok: true,
      totalUsers: targets.length,
      pushSent: pushResult.sent,
      pushFailed: pushResult.failed,
      notificationsCreated,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getAdminBroadcastHistory(): Promise<BroadcastHistoryResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const snapshot = await getAdminFirestore()
      .collection(NOTIFICATIONS_COLLECTION)
      .where("type", "==", "admin")
      .orderBy("createdAt", "desc")
      .get();

    const groups = new Map<string, BroadcastHistoryEntry>();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const title = typeof data.title === "string" ? data.title : "";
      const body =
        typeof data.text === "string"
          ? data.text
          : typeof data.body === "string"
            ? data.body
            : "";
      const sentAt = serializeTimestamp(data.createdAt);
      const groupKey = `${title}\0${body}\0${minuteKey(sentAt)}`;
      const existing = groups.get(groupKey);

      if (existing) {
        existing.recipientCount += 1;
        if (sentAt && (!existing.sentAt || sentAt > existing.sentAt)) {
          existing.sentAt = sentAt;
        }
        continue;
      }

      groups.set(groupKey, {
        id: groupKey,
        title,
        body,
        sentAt,
        recipientCount: 1,
      });
    }

    const broadcasts = [...groups.values()].sort((a, b) => {
      if (!a.sentAt && !b.sentAt) {
        return 0;
      }
      if (!a.sentAt) {
        return 1;
      }
      if (!b.sentAt) {
        return -1;
      }
      return b.sentAt.localeCompare(a.sentAt);
    });

    return { ok: true, broadcasts };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
