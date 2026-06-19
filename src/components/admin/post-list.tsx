"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { deletePostAction } from "@/app/admin/posts/actions";
import { formatDateTime } from "@/lib/format";
import type { PostRecord } from "@/lib/firebase/posts";

type PostListProps = {
  posts: PostRecord[];
};

function PostThumbnail({ post }: { post: PostRecord }) {
  if (post.imageUri) {
    return (
      <Image
        src={post.imageUri}
        alt={post.caption ?? "Post image"}
        width={48}
        height={48}
        className="size-12 rounded-lg object-cover"
        unoptimized
      />
    );
  }

  return (
    <div className="flex size-12 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-800">
      —
    </div>
  );
}

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
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, deleting]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        disabled={deleting}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Post details
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
                className="h-auto max-h-[70vh] w-full object-contain"
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

function DeletePostButton({ post }: { post: PostRecord }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (
      !window.confirm(
        `Delete this post by @${post.username ?? post.uid ?? post.id}? Related likes and comments will also be removed.`,
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deletePostAction(post.id);
      if (!result.ok) {
        setError(result.message ?? "Could not delete post.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <p className="max-w-[8rem] text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function PostList({ posts }: PostListProps) {
  const [selectedPost, setSelectedPost] = useState<PostRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDeleteFromDialog() {
    if (!selectedPost) {
      return;
    }

    if (
      !window.confirm(
        "Delete this post permanently? Related likes and comments will also be removed.",
      )
    ) {
      return;
    }

    const postId = selectedPost.id;
    startTransition(async () => {
      const result = await deletePostAction(postId);
      if (result.ok) {
        setSelectedPost(null);
        router.refresh();
      }
    });
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No posts found in the Firestore{" "}
          <code className="font-mono">Posts</code> collection.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                {[
                  "Post",
                  "Author",
                  "Caption",
                  "Likes",
                  "Created",
                  "ID",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {posts.map((post) => (
                <tr
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <PostThumbnail post={post} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {post.fullName ?? "—"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {post.username ? `@${post.username}` : post.uid ?? "—"}
                    </p>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                    {post.caption ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
                    {post.likes ?? 0}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                    {formatDateTime(post.createdAt)}
                  </td>
                  <td
                    className="max-w-[10rem] truncate px-4 py-3 font-mono text-xs text-zinc-500"
                    title={post.id}
                  >
                    {post.id}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-3"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <DeletePostButton post={post} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedPost && (
        <PostViewDialog
          post={selectedPost}
          open
          onClose={() => {
            if (!isPending) {
              setSelectedPost(null);
            }
          }}
          onDelete={handleDeleteFromDialog}
          deleting={isPending}
        />
      )}
    </>
  );
}
