import type { Timestamp } from "firebase-admin/firestore";

import { getAdminFirestore } from "./admin";
import { isFirebaseAdminConfigured } from "./config";

const POSTS_COLLECTION = "Posts";
const LIKES_COLLECTION = "Likes";
const COMMENTS_COLLECTION = "Comments";

export type PostRecord = {
  id: string;
  uid: string | null;
  username: string | null;
  fullName: string | null;
  caption: string | null;
  imageUri: string | null;
  profileImageUri: string | null;
  likes: number | null;
  createdAt: string | null;
};

export type PostsResult =
  | { ok: true; posts: PostRecord[] }
  | { ok: false; reason: "not_configured" | "error"; message?: string };

export type PostResult =
  | { ok: true; post: PostRecord }
  | { ok: false; reason: "not_configured" | "not_found" | "error"; message?: string };

export type DeletePostResult =
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

function mapPostDoc(id: string, data: Record<string, unknown>): PostRecord {
  const likes = data.likes;
  return {
    id,
    uid: pickString(data, "uid"),
    username: pickString(data, "username"),
    fullName: pickString(data, "fullName", "name"),
    caption: pickString(data, "caption"),
    imageUri: pickString(data, "imageUri", "imageUrl"),
    profileImageUri: pickString(data, "profileImageUri"),
    likes: typeof likes === "number" ? likes : null,
    createdAt: serializeTimestamp(
      data.createdAt ?? data.created_at ?? data.created,
    ),
  };
}

export async function getPostsByUserId(userId: string): Promise<PostsResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const snapshot = await getAdminFirestore()
      .collection(POSTS_COLLECTION)
      .where("uid", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const posts = snapshot.docs.map((doc) => mapPostDoc(doc.id, doc.data()));

    return { ok: true, posts };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getPosts(): Promise<PostsResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const snapshot = await getAdminFirestore()
      .collection(POSTS_COLLECTION)
      .get();

    const posts = snapshot.docs
      .map((doc) => mapPostDoc(doc.id, doc.data()))
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

    return { ok: true, posts };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getPostById(postId: string): Promise<PostResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const doc = await getAdminFirestore()
      .collection(POSTS_COLLECTION)
      .doc(postId)
      .get();

    if (!doc.exists) {
      return { ok: false, reason: "not_found", message: "Post not found." };
    }

    return { ok: true, post: mapPostDoc(doc.id, doc.data()!) };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deletePostById(postId: string): Promise<DeletePostResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const db = getAdminFirestore();
    const postRef = db.collection(POSTS_COLLECTION).doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return { ok: false, reason: "not_found", message: "Post not found." };
    }

    const [likesSnap, commentsSnap] = await Promise.all([
      db.collection(LIKES_COLLECTION).where("postId", "==", postId).get(),
      db.collection(COMMENTS_COLLECTION).where("postId", "==", postId).get(),
    ]);

    const batch = db.batch();
    batch.delete(postRef);
    likesSnap.docs.forEach((doc) => batch.delete(doc.ref));
    commentsSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
