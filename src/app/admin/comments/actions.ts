"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { deleteCommentById } from "@/lib/firebase/comments";

export async function deleteCommentAction(commentId: string) {
  const session = await getSession();

  if (!session) {
    return {
      ok: false as const,
      reason: "error" as const,
      message: "Unauthorized.",
    };
  }

  const result = await deleteCommentById(commentId);

  if (result.ok) {
    revalidatePath("/admin/comments");
    revalidatePath("/admin");
  }

  return result;
}
