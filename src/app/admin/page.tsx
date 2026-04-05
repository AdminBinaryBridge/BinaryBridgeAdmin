import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Overview and quick actions will live here. Connect your API and auth
          next.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["Users", "Activity", "Health"].map((title) => (
          <div
            key={title}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {title}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              —
            </p>
            <p className="mt-1 text-xs text-zinc-500">Wire up data source</p>
          </div>
        ))}
      </div>
    </div>
  );
}
