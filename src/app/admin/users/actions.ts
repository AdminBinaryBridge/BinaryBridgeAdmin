"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { setUserBlocked } from "@/lib/firebase/users";

export async function setUserBlockedAction(userId: string, blocked: boolean) {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, reason: "error" as const, message: "Unauthorized." };
  }

  const result = await setUserBlocked(userId, blocked);
  if (result.ok) revalidatePath("/admin/users");
  return result;
}
