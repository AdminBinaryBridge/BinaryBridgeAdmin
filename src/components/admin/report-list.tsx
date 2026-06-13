import { formatDateTime } from "@/lib/format";
import type { ReportRecord } from "@/lib/firebase/reports";

import { ReportRowActions } from "./report-row-actions";

function StatusBadge({ status }: { status: string | null }) {
  const label = status ?? "unknown";
  const normalized = label.toLowerCase();

  const styles: Record<string, string> = {
    pending:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    resolved:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    rejected: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    dismissed: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  const className =
    styles[normalized] ??
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${className}`}
    >
      {label}
    </span>
  );
}

function KindBadge({ kind }: { kind: string | null }) {
  return (
    <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {kind ?? "—"}
    </span>
  );
}

type ReportListProps = {
  reports: ReportRecord[];
};

export function ReportList({ reports }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No reports found in the Firestore{" "}
          <code className="font-mono">Reports</code> collection.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              {[
                "Status",
                "Kind",
                "Reported user",
                "Reason",
                "Post",
                "Reporter",
                "Reported",
                "Created",
                "Actions",
                "ID",
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
            {reports.map((report) => (
              <tr
                key={report.id}
                className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={report.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <KindBadge kind={report.kind} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                  {report.reportedUsername ? `@${report.reportedUsername}` : "—"}
                </td>
                <td className="max-w-xs px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                  <p className="line-clamp-2" title={report.text ?? undefined}>
                    {report.text ?? "—"}
                  </p>
                </td>
                <td
                  className="max-w-[8rem] truncate px-4 py-3 font-mono text-xs text-zinc-500"
                  title={report.postId ?? undefined}
                >
                  {report.postId ?? "—"}
                </td>
                <td
                  className="max-w-[8rem] truncate px-4 py-3 font-mono text-xs text-zinc-500"
                  title={report.reporterUid ?? undefined}
                >
                  {report.reporterUid ?? "—"}
                </td>
                <td
                  className="max-w-[8rem] truncate px-4 py-3 font-mono text-xs text-zinc-500"
                  title={report.postUid ?? undefined}
                >
                  {report.postUid ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {formatDateTime(report.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <ReportRowActions report={report} />
                </td>
                <td
                  className="max-w-[8rem] truncate px-4 py-3 font-mono text-xs text-zinc-500"
                  title={report.id}
                >
                  {report.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
