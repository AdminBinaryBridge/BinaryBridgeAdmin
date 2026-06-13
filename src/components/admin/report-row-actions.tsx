"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  deleteReportedPost,
  fetchReportedPost,
} from "@/app/admin/reports/actions";
import { formatDateTime } from "@/lib/format";
import type { PostRecord } from "@/lib/firebase/posts";
import type { ReportRecord } from "@/lib/firebase/reports";

type PostViewDialogProps = {
  post: PostRecord;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
};

function PostViewDialog({
  post,
  open,
  onClose,
  onDelete,
  deleting,
}: PostViewDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Reported post
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 p-4">
          {post.imageUri ? (
            <div className="overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
              <Image
                src={post.imageUri}
                alt={post.caption ?? "Post image"}
                width={512}
                height={512}
                className="h-auto max-h-80 w-full object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="rounded-lg bg-zinc-100 p-8 text-center text-sm text-zinc-500 dark:bg-zinc-900">
              No image on this post
            </div>
          )}
          <div className="space-y-2 text-sm">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {post.fullName ?? "Unknown user"}
              {post.username ? (
                <span className="font-normal text-zinc-500">
                  {" "}
                  @{post.username}
                </span>
              ) : null}
            </p>
            <p className="text-zinc-600 dark:text-zinc-300">
              {post.caption ?? "No caption"}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
              <span>{post.likes ?? 0} likes</span>
              <span>{formatDateTime(post.createdAt)}</span>
              <span className="font-mono" title={post.id}>
                {post.id}
              </span>
            </div>
          </div>
          <div className="flex gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete post"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ReportRowActionsProps = {
  report: ReportRecord;
};

export function ReportRowActions({ report }: ReportRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingPost, setLoadingPost] = useState(false);
  const [post, setPost] = useState<PostRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!report.postId) {
    return <span className="text-xs text-zinc-400">No post</span>;
  }

  const handleView = async () => {
    setLoadingPost(true);
    setError(null);

    const result = await fetchReportedPost(report.postId!);

    setLoadingPost(false);

    if (result.ok === false) {
      setError(result.message ?? "Could not load post.");
      return;
    }

    setPost(result.post);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        "Delete this post permanently? Related likes and comments will also be removed.",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteReportedPost(report.postId!);

      if (result.ok === false) {
        setError(result.message ?? "Could not delete post.");
        return;
      }

      setDialogOpen(false);
      setPost(null);
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleView}
            disabled={loadingPost || isPending}
            className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {loadingPost ? "Loading…" : "View post"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending || loadingPost}
            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Deleting…" : "Delete post"}
          </button>
        </div>
        {error && (
          <p className="max-w-[10rem] text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
      {post && (
        <PostViewDialog
          post={post}
          open={dialogOpen}
          onClose={() => {
            if (!isPending) {
              setDialogOpen(false);
            }
          }}
          onDelete={handleDelete}
          deleting={isPending}
        />
      )}
    </>
  );
}
