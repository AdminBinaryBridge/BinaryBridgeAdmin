"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ChatIcon,
  DashboardIcon,
  DocIcon,
  FlagIcon,
  GearIcon,
  GlobeIcon,
  ImageIcon,
  MailIcon,
  TagIcon,
  UsersIcon,
} from "@/components/admin/icons";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: DashboardIcon },
      { href: "/admin/visits", label: "Website visits", icon: GlobeIcon },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/users", label: "User list", icon: UsersIcon },
      { href: "/admin/posts", label: "Posts", icon: ImageIcon },
      { href: "/admin/comments", label: "Comments", icon: ChatIcon },
      { href: "/admin/categories", label: "Categories", icon: TagIcon },
    ],
  },
  {
    label: "Moderation",
    items: [
      { href: "/admin/reports", label: "Reports", icon: FlagIcon },
      { href: "/admin/feedback", label: "Feedback", icon: MailIcon },
      { href: "/admin/logs", label: "Logs", icon: DocIcon },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: GearIcon }],
  },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-violet-400 bg-violet-500/10 font-medium text-white"
                    : "border-transparent text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    active
                      ? "text-violet-400"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
