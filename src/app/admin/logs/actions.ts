"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { setLogResolved } from "@/lib/firebase/logs";

export async function setLogResolvedAction(logId: string, resolved: boolean) {
  const session = await getSession();

  if (!session) {
    return {
      ok: false as const,
      reason: "error" as const,
      message: "Unauthorized.",
    };
  }

  const result = await setLogResolved(logId, resolved);

  if (result.ok) {
    revalidatePath("/admin/logs");
  }

  return result;
}
