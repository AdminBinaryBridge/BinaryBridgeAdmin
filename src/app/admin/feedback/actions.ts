"use server";

import { getSession } from "@/lib/auth/session";
import {
  mintAdminFirebaseToken,
  sendAdminFeedbackReply,
  type AdminTokenResult,
  type MutationResult,
} from "@/lib/firebase/feedback";

async function requireSession(): Promise<MutationResult | null> {
  const session = await getSession();

  if (!session) {
    return { ok: false, reason: "error", message: "Unauthorized." };
  }

  return null;
}

export async function sendFeedbackReplyAction(
  uid: string,
  text: string,
): Promise<MutationResult> {
  const unauthorized = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  return sendAdminFeedbackReply(uid, text);
}

export async function getAdminFirebaseTokenAction(): Promise<AdminTokenResult> {
  const session = await getSession();

  if (!session) {
    return { ok: false, reason: "error", message: "Unauthorized." };
  }

  return mintAdminFirebaseToken();
}
