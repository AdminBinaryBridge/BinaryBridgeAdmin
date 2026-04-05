import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Settings
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Environment variables, integrations, and team preferences can be
        configured here.
      </p>
    </div>
  );
}
