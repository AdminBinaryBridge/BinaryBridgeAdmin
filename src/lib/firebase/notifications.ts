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

type UserTarget = {
  uid: string;
  token: string | null;
};

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
