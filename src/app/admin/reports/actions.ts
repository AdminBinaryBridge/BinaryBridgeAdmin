"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { deletePostById, getPostById } from "@/lib/firebase/posts";
import {
  updateReportStatus,
  type ReportStatus,
} from "@/lib/firebase/reports";

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

export async function deleteReportedPost(postId: string, reportId?: string) {
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
    if (reportId) {
      await updateReportStatus(reportId, "resolved");
    }
    revalidatePath("/admin/reports");
    revalidatePath("/admin/posts");
    revalidatePath("/admin");
  }

  return result;
}

export async function updateReportStatusAction(
  reportId: string,
  status: ReportStatus,
) {
  const session = await getSession();

  if (!session) {
    return {
      ok: false as const,
      reason: "error" as const,
      message: "Unauthorized.",
    };
  }

  const result = await updateReportStatus(reportId, status);

  if (result.ok) {
    revalidatePath("/admin/reports");
    revalidatePath("/admin");
  }

  return result;
}
