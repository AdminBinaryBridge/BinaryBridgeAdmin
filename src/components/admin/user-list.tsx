import Image from "next/image";

import { formatDateTime } from "@/lib/format";
import type { UserRecord } from "@/lib/firebase/users";

type UserListProps = {
  users: UserRecord[];
  compact?: boolean;
};

function UserAvatar({ user }: { user: UserRecord }) {
  const initials =
    user.fullName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ??
    user.username?.slice(0, 2).toUpperCase() ??
    "?";

  if (user.profileImageUri) {
    return (
      <Image
        src={user.profileImageUri}
        alt={user.fullName ?? user.username ?? "User"}
        width={36}
        height={36}
        className="size-9 rounded-full object-cover"
        unoptimized
      />
    );
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
      {initials}
    </div>
  );
}

export function UserList({ users, compact = false }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No users found in the Firestore{" "}
          <code className="font-mono">User</code> collection.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            <UserAvatar user={user} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {user.fullName ?? "—"}
              </p>
              <p className="truncate text-xs text-zinc-500">
                @{user.username ?? "—"}
              </p>
            </div>
            <p className="hidden text-xs text-zinc-500 sm:block">
              {formatDateTime(user.createdAt)}
            </p>
          </div>
        ))}
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
                "User",
                "Username",
                "Mobile",
                "Gender",
                "Country",
                "Joined",
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
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} />
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {user.fullName ?? "—"}
                      </p>
                      {user.dob && (
                        <p className="text-xs text-zinc-500">DOB: {user.dob}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {user.username ? `@${user.username}` : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {user.mobile ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-zinc-600 dark:text-zinc-300">
                  {user.gender ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm uppercase text-zinc-600 dark:text-zinc-300">
                  {user.countryCode ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {formatDateTime(user.createdAt)}
                </td>
                <td
                  className="max-w-[10rem] truncate px-4 py-3 font-mono text-xs text-zinc-500"
                  title={user.id}
                >
                  {user.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
