import Link from "next/link";

import { LogoutButton } from "@/components/admin/logout-button";
import { getSession } from "@/lib/auth/session";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "User list" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-zinc-950 text-zinc-300 dark:border-zinc-800">
        <div className="border-b border-zinc-800 px-4 py-4">
          <Link
            href="/admin"
            className="text-sm font-semibold tracking-tight text-white"
          >
            Binary Bridge
          </Link>
          <p className="mt-0.5 text-xs text-zinc-500">Admin</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-zinc-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Admin panel
          </h1>
          <div className="flex items-center gap-3">
            {session?.email && (
              <span className="hidden text-xs text-zinc-500 sm:inline">
                {session.email}
              </span>
            )}
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
