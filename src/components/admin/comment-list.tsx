"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteCommentAction } from "@/app/admin/comments/actions";
import { formatDateTime } from "@/lib/format";
import type { CommentRecord } from "@/lib/firebase/comments";

type CommentListProps = {
  comments: CommentRecord[];
};

function matchesSearch(comment: CommentRecord, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const haystack = [
    comment.text,
    comment.fullName,
    comment.username,
    comment.uid,
    comment.postId,
    comment.id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function DeleteCommentButton({ comment }: { comment: CommentRecord }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (
      !window.confirm(
        "Delete this comment permanently? This cannot be undone.",
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteCommentAction(comment.id);
      if (!result.ok) {
        setError(result.message ?? "Could not delete comment.");
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

export function CommentList({ comments }: CommentListProps) {
  const [search, setSearch] = useState("");

  const filteredComments = useMemo(
    () => comments.filter((comment) => matchesSearch(comment, search)),
    [comments, search],
  );

  if (comments.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No comments found in the Firestore{" "}
          <code className="font-mono">Comments</code> collection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search comment text, author, post ID…"
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-800 sm:max-w-sm"
      />
      <p className="text-xs text-zinc-500">
        Showing {filteredComments.length} of {comments.length}
      </p>
      {filteredComments.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No comments match your search.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  {[
                    "Comment",
                    "Author",
                    "Post",
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
                {filteredComments.map((comment) => (
                  <tr
                    key={comment.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                  >
                    <td className="max-w-md px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <p className="line-clamp-3" title={comment.text ?? undefined}>
                        {comment.text ?? "—"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {comment.fullName ?? "—"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {comment.username
                          ? `@${comment.username}`
                          : comment.uid ?? "—"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {comment.postId ? (
                        <Link
                          href="/admin/posts"
                          className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
                          title={comment.postId}
                        >
                          {comment.postId.slice(0, 8)}…
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                      {formatDateTime(comment.createdAt)}
                    </td>
                    <td
                      className="max-w-[10rem] truncate px-4 py-3 font-mono text-xs text-zinc-500"
                      title={comment.id}
                    >
                      {comment.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <DeleteCommentButton comment={comment} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
