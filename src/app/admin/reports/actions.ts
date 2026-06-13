"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { deletePostById, getPostById } from "@/lib/firebase/posts";

export async function fetchReportedPost(postId: string) {
  const session = await getSession();

  if (!session) {
    return {
      ok: false as const,
      reason: "error" as const,
      message: "Unauthorized.",
    };
  }

  return getPostById(postId);
}

export async function deleteReportedPost(postId: string) {
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
    revalidatePath("/admin/reports");
    revalidatePath("/admin");
  }

  return result;
}
