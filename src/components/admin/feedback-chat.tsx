"use client";

import { signInWithCustomToken } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  getAdminFirebaseTokenAction,
  sendFeedbackReplyAction,
} from "@/app/admin/feedback/actions";
import { formatDateTime } from "@/lib/format";
import { getClientAuth, getClientDatabase } from "@/lib/firebase/client";
import type { FeedbackThreadRecord } from "@/lib/firebase/feedback";

const FEEDBACK_PATH = "feedbackThreads";

type FeedbackMessage = {
  id: string;
  senderRole: "user" | "admin";
  text: string;
  createdAt: string | null;
};

function displayName(thread: FeedbackThreadRecord): string {
  return thread.fullName ?? thread.username ?? thread.uid;
}

function sortThreads(threads: FeedbackThreadRecord[]): FeedbackThreadRecord[] {
  return [...threads].sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0;
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return b.lastMessageAt.localeCompare(a.lastMessageAt);
  });
}

export function FeedbackChat({
  initialThreads,
}: {
  initialThreads: FeedbackThreadRecord[];
}) {
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [threads, setThreads] = useState(initialThreads);
  const [selectedUid, setSelectedUid] = useState<string | null>(
    initialThreads[0]?.uid ?? null,
  );
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, startSending] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function signIn() {
      const result = await getAdminFirebaseTokenAction();
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setAuthError(result.message ?? "Could not authenticate live chat.");
        return;
      }

      try {
        await signInWithCustomToken(getClientAuth(), result.token);
        if (!cancelled) {
          setAuthReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setAuthError(
            error instanceof Error ? error.message : "Could not sign in.",
          );
        }
      }
    }

    signIn();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    const threadsRef = ref(getClientDatabase(), FEEDBACK_PATH);

    const unsubscribe = onValue(threadsRef, (snapshot) => {
      const next: FeedbackThreadRecord[] = [];

      snapshot.forEach((child) => {
        const uid = child.key;
        if (!uid) {
          return true;
        }

        const meta = child.child("meta").val() ?? {};

        next.push({
          id: uid,
          uid,
          fullName:
            typeof meta.fullName === "string" ? meta.fullName : null,
          username:
            typeof meta.username === "string" ? meta.username : null,
          lastMessage:
            typeof meta.lastMessage === "string" ? meta.lastMessage : null,
          lastMessageAt:
            typeof meta.lastMessageAt === "number"
              ? new Date(meta.lastMessageAt).toISOString()
              : null,
          lastSenderRole:
            meta.lastSenderRole === "admin" || meta.lastSenderRole === "user"
              ? meta.lastSenderRole
              : null,
          unreadByAdmin: meta.unreadByAdmin === true,
        });

        return false;
      });

      const sorted = sortThreads(next);
      setThreads(sorted);
      setSelectedUid((current) => current ?? sorted[0]?.uid ?? null);
    });

    return unsubscribe;
  }, [authReady]);

  useEffect(() => {
    if (!authReady || !selectedUid) {
      return;
    }

    const messagesRef = ref(
      getClientDatabase(),
      `${FEEDBACK_PATH}/${selectedUid}/messages`,
    );

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const next: FeedbackMessage[] = [];

      snapshot.forEach((child) => {
        const data = child.val() ?? {};
        next.push({
          id: child.key ?? "",
          senderRole: data.senderRole === "admin" ? "admin" : "user",
          text: typeof data.text === "string" ? data.text : "",
          createdAt:
            typeof data.createdAt === "number"
              ? new Date(data.createdAt).toISOString()
              : null,
        });
        return false;
      });

      next.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return a.createdAt.localeCompare(b.createdAt);
      });

      setMessages(next);
    });

    return () => {
      unsubscribe();
      setMessages([]);
    };
  }, [authReady, selectedUid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.uid === selectedUid) ?? null,
    [threads, selectedUid],
  );

  function handleSend() {
    if (!selectedUid || !draft.trim()) {
      return;
    }

    const text = draft.trim();
    setSendError(null);
    startSending(async () => {
      const result = await sendFeedbackReplyAction(selectedUid, text);
      if (!result.ok) {
        setSendError(result.message ?? "Could not send reply.");
        return;
      }
      setDraft("");
    });
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No feedback threads yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="w-64 shrink-0 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">
        {threads.map((thread) => {
          const active = thread.uid === selectedUid;
          return (
            <button
              key={thread.uid}
              type="button"
              onClick={() => setSelectedUid(thread.uid)}
              className={`block w-full border-b border-zinc-100 px-4 py-3 text-left transition-colors dark:border-zinc-800/60 ${
                active
                  ? "bg-zinc-100 dark:bg-zinc-800"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {displayName(thread)}
                </p>
                {thread.unreadByAdmin && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {thread.lastMessage ?? "No messages yet"}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {authError && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            Live updates unavailable: {authError}
          </div>
        )}

        {selectedThread ? (
          <>
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {displayName(selectedThread)}
              </p>
              <p className="font-mono text-xs text-zinc-500">
                {selectedThread.uid}
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderRole === "admin" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                      message.senderRole === "admin"
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        message.senderRole === "admin"
                          ? "text-blue-100"
                          : "text-zinc-500"
                      }`}
                    >
                      {formatDateTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
              {sendError && (
                <p className="mb-2 text-xs text-red-600 dark:text-red-400">
                  {sendError}
                </p>
              )}
              <div className="flex gap-2">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={2}
                  placeholder="Reply to this user…"
                  className="flex-1 resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || !draft.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            Select a thread to view the conversation.
          </div>
        )}
      </div>
    </div>
  );
}
