"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { deletePostById } from "@/lib/firebase/posts";

export async function deletePostAction(postId: string) {
  const session = await getSession();

  if (!session) {
    return {
      ok: false as const,
      reason: "error" as const,
      message: "Unauthorized.",
    };
  }

  const result = await deletePostById(postId);

  if (result.ok) {
    revalidatePath("/admin/posts");
    revalidatePath("/admin/reports");
    revalidatePath("/admin");
  }

  return result;
}
