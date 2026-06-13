import type { Timestamp } from "firebase-admin/firestore";

import { getAdminFirestore } from "./admin";
import { isFirebaseAdminConfigured } from "./config";

const USERS_COLLECTION = "User";

export type UserRecord = {
  id: string;
  fullName: string | null;
  username: string | null;
  mobile: string | null;
  gender: string | null;
  countryCode: string | null;
  dob: string | null;
  profileImageUri: string | null;
  createdAt: string | null;
};

export type UsersResult =
  | { ok: true; users: UserRecord[] }
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

function formatMobile(data: Record<string, unknown>): string | null {
  const mobile = pickString(data, "mobile", "phone", "phoneNumber");
  if (!mobile) {
    return null;
  }

  const dialCode = pickString(data, "countryDialCode", "dialCode");
  if (dialCode && !mobile.startsWith("+")) {
    return `${dialCode}${mobile}`;
  }

  return mobile;
}

function mapUserDoc(id: string, data: Record<string, unknown>): UserRecord {
  return {
    id,
    fullName: pickString(data, "fullName", "displayName", "name"),
    username: pickString(data, "username", "userName"),
    mobile: formatMobile(data),
    gender: pickString(data, "gender"),
    countryCode: pickString(data, "countryCode", "country"),
    dob: pickString(data, "dob", "dateOfBirth"),
    profileImageUri: pickString(data, "profileImageUri", "photoURL", "avatar"),
    createdAt: serializeTimestamp(
      data.createdAt ?? data.created_at ?? data.created,
    ),
  };
}

export async function getUsers(): Promise<UsersResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const snapshot = await getAdminFirestore()
      .collection(USERS_COLLECTION)
      .get();

    const users = snapshot.docs
      .map((doc) => mapUserDoc(doc.id, doc.data()))
      .sort((a, b) => {
        if (!a.createdAt && !b.createdAt) {
          return a.username?.localeCompare(b.username ?? "") ?? 0;
        }
        if (!a.createdAt) {
          return 1;
        }
        if (!b.createdAt) {
          return -1;
        }
        return b.createdAt.localeCompare(a.createdAt);
      });

    return { ok: true, users };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
