"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  setUserBlockedAction,
  type UserDetailPayload,
} from "@/app/admin/users/actions";
import { formatDateTime } from "@/lib/format";
import type { PostRecord } from "@/lib/firebase/posts";
import type { ReportRecord } from "@/lib/firebase/reports";
import type { UserRecord } from "@/lib/firebase/users";

type UserDetailDialogProps = {
  detail: UserDetailPayload | null;
  loading: boolean;
  error: string | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
};

function getUserInitials(user: UserRecord): string {
  return (
    user.fullName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ??
    user.username?.slice(0, 2).toUpperCase() ??
    "?"
  );
}

function UserAvatar({ user }: { user: UserRecord }) {
  const initials = getUserInitials(user);

  if (user.profileImageUri) {
    return (
      <Image
        src={user.profileImageUri}
        alt={user.fullName ?? user.username ?? "User"}
        width={256}
        height={256}
        className="size-32 rounded-full object-cover"
        unoptimized
      />
    );
  }

  return (
    <div className="flex size-32 items-center justify-center rounded-full bg-zinc-200 text-3xl font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
      {initials}
    </div>
  );
}

function ReportStatusBadge({ status }: { status: string | null }) {
  const label = status ?? "pending";
  const normalized = label.toLowerCase();
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    resolved:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    dismissed: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
        styles[normalized] ??
        "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
      }`}
    >
      {label}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
        {value ?? "—"}
      </p>
    </div>
  );
}

function PostCard({ post }: { post: PostRecord }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      {post.imageUri ? (
        <div className="aspect-square bg-zinc-100 dark:bg-zinc-900">
          <Image
            src={post.imageUri}
            alt={post.caption ?? "Post"}
            width={240}
            height={240}
            className="size-full object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex aspect-square items-center justify-center bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-900">
          No image
        </div>
      )}
      <div className="space-y-1 p-2">
        <p className="line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">
          {post.caption ?? "No caption"}
        </p>
        <p className="text-xs text-zinc-500">
          {post.likes ?? 0} likes · {formatDateTime(post.createdAt)}
        </p>
      </div>
    </div>
  );
}

function ReportItem({ report }: { report: ReportRecord }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2">
        <ReportStatusBadge status={report.status} />
        {report.kind && (
          <span className="text-xs capitalize text-zinc-500">{report.kind}</span>
        )}
        <span className="text-xs text-zinc-500">
          {formatDateTime(report.createdAt)}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
        {report.text ?? "No reason provided"}
      </p>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
        {report.postId && <span className="font-mono">Post: {report.postId}</span>}
        {report.reporterUid && (
          <span className="font-mono">Reporter: {report.reporterUid}</span>
        )}
      </div>
    </div>
  );
}

function BlockToggle({
  user,
  onUpdated,
}: {
  user: UserRecord;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    const nextBlocked = !user.isBlocked;
    const label = nextBlocked ? "block" : "unblock";
    if (
      !window.confirm(
        `Are you sure you want to ${label} @${user.username ?? user.id}?`,
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await setUserBlockedAction(user.id, nextBlocked);
      if (!result.ok) {
        setError(result.message ?? "Action failed.");
        return;
      }
      router.refresh();
      onUpdated();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
          user.isBlocked
            ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
        }`}
      >
        {isPending
          ? user.isBlocked
            ? "Unblocking…"
            : "Blocking…"
          : user.isBlocked
            ? "Blocked · Unblock"
            : "Block user"}
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function UserDetailDialog({
  detail,
  loading,
  error,
  open,
  onClose,
  onRefresh,
}: UserDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "against" | "filed">(
    "posts",
  );

  if (!open) {
    return null;
  }

  const currentUser = detail?.user;
  const posts = detail?.posts ?? [];
  const reportsAgainst = detail?.reportsAgainst ?? [];
  const reportsFiled = detail?.reportsFiled ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            User details
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {loading && !detail ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Loading user details…
            </p>
          ) : error && !detail ? (
            <p className="py-8 text-center text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : currentUser ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex shrink-0 justify-center sm:justify-start">
                  <UserAvatar user={currentUser} />
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {currentUser.fullName ?? "—"}
                    </h4>
                    {currentUser.username && (
                      <p className="text-sm text-zinc-500">
                        @{currentUser.username}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailField label="Mobile" value={currentUser.mobile} />
                    <DetailField label="Gender" value={currentUser.gender} />
                    <DetailField label="Country" value={currentUser.countryCode} />
                    <DetailField label="Date of birth" value={currentUser.dob} />
                    <DetailField
                      label="Joined"
                      value={formatDateTime(currentUser.createdAt)}
                    />
                    <DetailField label="User ID" value={currentUser.id} />
                  </div>
                  <BlockToggle user={currentUser} onUpdated={onRefresh} />
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "posts", label: "Posts", count: posts.length },
                      {
                        id: "against",
                        label: "Reported against",
                        count: reportsAgainst.length,
                      },
                      {
                        id: "filed",
                        label: "Reports filed",
                        count: reportsFiled.length,
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  {activeTab === "posts" &&
                    (posts.length === 0 ? (
                      <p className="text-sm text-zinc-500">No posts yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {posts.map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                    ))}

                  {activeTab === "against" &&
                    (reportsAgainst.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        No reports against this user.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {reportsAgainst.map((report) => (
                          <ReportItem key={report.id} report={report} />
                        ))}
                      </div>
                    ))}

                  {activeTab === "filed" &&
                    (reportsFiled.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        This user has not filed any reports.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {reportsFiled.map((report) => (
                          <ReportItem key={report.id} report={report} />
                        ))}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
