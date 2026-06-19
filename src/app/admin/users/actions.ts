"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { getPostsByUserId, type PostRecord } from "@/lib/firebase/posts";
import { getReportsForUser, type ReportRecord } from "@/lib/firebase/reports";
import { getUserById, setUserBlocked, type UserRecord } from "@/lib/firebase/users";

export type UserDetailPayload = {
  user: UserRecord;
  posts: PostRecord[];
  reportsAgainst: ReportRecord[];
  reportsFiled: ReportRecord[];
};

export async function fetchUserDetail(userId: string) {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      reason: "error" as const,
      message: "Unauthorized.",
    };
  }

  const userResult = await getUserById(userId);
  if (!userResult.ok) {
    return userResult;
  }

  const [postsResult, reportsResult] = await Promise.all([
    getPostsByUserId(userId),
    getReportsForUser(userResult.user),
  ]);

  if (!postsResult.ok) {
    return postsResult;
  }

  if (!reportsResult.ok) {
    return reportsResult;
  }

  return {
    ok: true as const,
    detail: {
      user: userResult.user,
      posts: postsResult.posts,
      reportsAgainst: reportsResult.reportsAgainst,
      reportsFiled: reportsResult.reportsFiled,
    } satisfies UserDetailPayload,
  };
}

export async function setUserBlockedAction(userId: string, blocked: boolean) {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, reason: "error" as const, message: "Unauthorized." };
  }

  const result = await setUserBlocked(userId, blocked);
  if (result.ok) revalidatePath("/admin/users");
  return result;
}
