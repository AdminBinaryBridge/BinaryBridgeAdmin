"use client";

import { Fragment, useMemo, useState } from "react";

import { formatDateTime } from "@/lib/format";
import type { LogLevel, LogRecord } from "@/lib/firebase/logs";

function LevelBadge({ level }: { level: LogLevel }) {
  const styles: Record<LogLevel, string> = {
    error: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    warn: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    success:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    info: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[level]}`}
    >
      {level}
    </span>
  );
}

type LogFilter = "all" | LogLevel;

const FILTER_OPTIONS: { value: LogFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "error", label: "Errors" },
  { value: "warn", label: "Warnings" },
  { value: "success", label: "Success" },
  { value: "info", label: "Info" },
];

type LogListProps = {
  logs: LogRecord[];
};

export function LogList({ logs }: LogListProps) {
  const [filter, setFilter] = useState<LogFilter>("error");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    return {
      all: logs.length,
      error: logs.filter((l) => l.level === "error").length,
      warn: logs.filter((l) => l.level === "warn").length,
      success: logs.filter((l) => l.level === "success").length,
      info: logs.filter((l) => l.level === "info").length,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      if (filter !== "all" && log.level !== filter) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        log.identifier?.toLowerCase().includes(q) ||
        log.message?.toLowerCase().includes(q) ||
        log.uid?.toLowerCase().includes(q) ||
        log.errorMessage?.toLowerCase().includes(q)
      );
    });
  }, [filter, logs, query]);

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No entries found in the Firestore{" "}
          <code className="font-mono">Logs</code> collection yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === option.value
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {option.label} ({counts[option.value]})
          </button>
        ))}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search identifier, message, uid…"
          className="ml-auto w-full max-w-xs rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      {filteredLogs.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No logs match this filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  {[
                    "Level",
                    "Identifier",
                    "Message",
                    "UID",
                    "Platform",
                    "Time",
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
                {filteredLogs.map((log) => {
                  const expanded = expandedId === log.id;
                  const hasDetail = !!(log.meta || log.errorMessage);

                  return (
                    <>
                      <tr
                        key={log.id}
                        onClick={() =>
                          hasDetail &&
                          setExpandedId(expanded ? null : log.id)
                        }
                        className={`${hasDetail ? "cursor-pointer" : ""} hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 ${
                          log.level === "error"
                            ? "bg-red-50/30 dark:bg-red-950/10"
                            : ""
                        }`}
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          <LevelBadge level={log.level} />
                        </td>
                        <td
                          className="max-w-[16rem] truncate px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300"
                          title={log.identifier ?? undefined}
                        >
                          {log.identifier ?? "—"}
                        </td>
                        <td className="max-w-sm px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                          <p
                            className="line-clamp-2"
                            title={log.message ?? undefined}
                          >
                            {log.message ?? "—"}
                            {log.errorMessage ? ` — ${log.errorMessage}` : ""}
                          </p>
                        </td>
                        <td
                          className="max-w-[8rem] truncate px-4 py-3 font-mono text-xs text-zinc-500"
                          title={log.uid ?? undefined}
                        >
                          {log.uid ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                          {log.platform ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                          {formatDateTime(log.createdAt ?? log.clientTime)}
                        </td>
                      </tr>
                      {expanded && (
                        <tr key={`${log.id}-detail`}>
                          <td
                            colSpan={6}
                            className="bg-zinc-50 px-4 py-3 dark:bg-zinc-900"
                          >
                            {log.errorCode && (
                              <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">
                                <span className="font-medium">Error code:</span>{" "}
                                {log.errorCode}
                              </p>
                            )}
                            {log.meta && (
                              <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-zinc-100 p-3 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                {JSON.stringify(log.meta, null, 2)}
                              </pre>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
