import type { Timestamp } from "firebase-admin/firestore";

import { getAdminFirestore } from "./admin";
import { isFirebaseAdminConfigured } from "./config";

const COMMENTS_COLLECTION = "Comments";

export type CommentRecord = {
  id: string;
  postId: string | null;
  uid: string | null;
  username: string | null;
  fullName: string | null;
  text: string | null;
  createdAt: string | null;
};

export type CommentsResult =
  | { ok: true; comments: CommentRecord[] }
  | { ok: false; reason: "not_configured" | "error"; message?: string };

export type DeleteCommentResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "not_found" | "error"; message?: string };

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

function mapCommentDoc(id: string, data: Record<string, unknown>): CommentRecord {
  return {
    id,
    postId: pickString(data, "postId"),
    uid: pickString(data, "uid"),
    username: pickString(data, "username"),
    fullName: pickString(data, "fullName", "name"),
    text: pickString(data, "text", "comment", "body"),
    createdAt: serializeTimestamp(
      data.createdAt ?? data.created_at ?? data.created,
    ),
  };
}

export async function getComments(): Promise<CommentsResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const snapshot = await getAdminFirestore()
      .collection(COMMENTS_COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    const comments = snapshot.docs.map((doc) =>
      mapCommentDoc(doc.id, doc.data()),
    );

    return { ok: true, comments };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteCommentById(
  commentId: string,
): Promise<DeleteCommentResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const ref = getAdminFirestore().collection(COMMENTS_COLLECTION).doc(commentId);
    const doc = await ref.get();

    if (!doc.exists) {
      return { ok: false, reason: "not_found", message: "Comment not found." };
    }

    await ref.delete();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
