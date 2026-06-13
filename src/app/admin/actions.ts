"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { sendBroadcastNotification } from "@/lib/firebase/notifications";

export async function broadcastNotificationToAllUsers(formData: FormData) {
  const session = await getSession();

  if (!session) {
    return {
      ok: false as const,
      reason: "error" as const,
      message: "Unauthorized.",
    };
  }

  const title = String(formData.get("title") ?? "");
  const body = String(formData.get("body") ?? "");

  const result = await sendBroadcastNotification({ title, body });

  if (result.ok) {
    revalidatePath("/admin");
  }

  return result;
}
