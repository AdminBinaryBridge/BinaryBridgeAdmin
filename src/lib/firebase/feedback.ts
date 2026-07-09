import {
  getAdminAuth,
  getAdminDatabase,
  getAdminFirestore,
  getAdminMessaging,
} from "./admin";
import { isFirebaseAdminConfigured } from "./config";

const FEEDBACK_PATH = "feedbackThreads";
const USERS_COLLECTION = "User";
const NOTIFICATIONS_COLLECTION = "Notifications";
const ADMIN_TOKEN_UID = "admin-panel";
const ADMIN_SENDER_UID = "admin";

export type FeedbackThreadRecord = {
  id: string;
  uid: string;
  fullName: string | null;
  username: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastSenderRole: "user" | "admin" | null;
  unreadByAdmin: boolean;
};

export type FeedbackThreadsResult =
  | { ok: true; threads: FeedbackThreadRecord[] }
  | { ok: false; reason: "not_configured" | "error"; message?: string };

export type MutationResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "validation" | "error"; message?: string };

export type AdminTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: "not_configured" | "error"; message?: string };

function pickString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function millisToIso(value: unknown): string | null {
  return typeof value === "number" ? new Date(value).toISOString() : null;
}

function toSenderRole(value: unknown): "user" | "admin" | null {
  return value === "admin" ? "admin" : value === "user" ? "user" : null;
}

export async function getFeedbackThreads(): Promise<FeedbackThreadsResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const snapshot = await getAdminDatabase().ref(FEEDBACK_PATH).get();

    const threads: FeedbackThreadRecord[] = [];
    snapshot.forEach((child) => {
      const uid = child.key;
      if (!uid) {
        return;
      }

      const meta = child.child("meta").val() ?? {};

      threads.push({
        id: uid,
        uid,
        fullName: pickString(meta.fullName),
        username: pickString(meta.username),
        lastMessage: pickString(meta.lastMessage),
        lastMessageAt: millisToIso(meta.lastMessageAt),
        lastSenderRole: toSenderRole(meta.lastSenderRole),
        unreadByAdmin: meta.unreadByAdmin === true,
      });
    });

    threads.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return b.lastMessageAt.localeCompare(a.lastMessageAt);
    });

    return { ok: true, threads };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendAdminFeedbackReply(
  uid: string,
  text: string,
): Promise<MutationResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const trimmed = text.trim();

  if (!trimmed) {
    return { ok: false, reason: "validation", message: "Message is required." };
  }

  if (trimmed.length > 2000) {
    return {
      ok: false,
      reason: "validation",
      message: "Message must be 2000 characters or fewer.",
    };
  }

  try {
    const db = getAdminDatabase();
    const threadRef = db.ref(FEEDBACK_PATH).child(uid);
    const now = Date.now();

    await threadRef.child("messages").push({
      text: trimmed,
      senderRole: "admin",
      senderUid: ADMIN_SENDER_UID,
      createdAt: now,
    });

    await threadRef.child("meta").update({
      lastMessage: trimmed,
      lastMessageAt: now,
      lastSenderRole: "admin",
      unreadByAdmin: false,
      unreadByUser: 1,
    });

    await notifyUserOfReply(uid, trimmed);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function notifyUserOfReply(uid: string, body: string): Promise<void> {
  const db = getAdminFirestore();
  const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
  const token = userDoc.data()?.fcmToken;

  await db.collection(NOTIFICATIONS_COLLECTION).doc().set({
    read: false,
    type: "feedback_reply",
    title: "Support replied",
    text: body,
    recipientUid: uid,
    actorUid: "admin",
    actorUsername: "admin",
    actorFullName: "Binary Bridge Admin",
    createdAt: Date.now(),
  });

  if (typeof token === "string" && token.trim()) {
    try {
      await getAdminMessaging().send({
        token: token.trim(),
        notification: { title: "Support replied", body },
        data: { type: "feedback_reply", title: "Support replied", body },
      });
    } catch {
      // Push delivery best-effort; the RTDB message/Firestore notification already landed.
    }
  }
}

export async function mintAdminFirebaseToken(): Promise<AdminTokenResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const token = await getAdminAuth().createCustomToken(ADMIN_TOKEN_UID, {
      admin: true,
    });

    return { ok: true, token };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
