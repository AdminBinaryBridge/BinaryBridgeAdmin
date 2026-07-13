import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { getSession } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-300">
        <div className="flex items-center gap-2.5 border-b border-zinc-800 px-4 py-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-sm shadow-violet-900/40">
            B
          </span>
          <Link href="/admin" className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight text-white">
              Binary Bridge
            </span>
            <span className="block text-[11px] text-zinc-500">
              Admin panel
            </span>
          </Link>
        </div>
        <AdminNav />
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <h1 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Live
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {session?.email && (
              <span className="hidden rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 sm:inline dark:bg-zinc-800 dark:text-zinc-300">
                {session.email}
              </span>
            )}
            <LogoutButton />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
