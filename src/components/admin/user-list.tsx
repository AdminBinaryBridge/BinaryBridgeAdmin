"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";

import { formatDateTime } from "@/lib/format";
import type { UserRecord } from "@/lib/firebase/users";
import { setUserBlockedAction, fetchUserDetail, type UserDetailPayload } from "@/app/admin/users/actions";
import { UserDetailDialog } from "@/components/admin/user-detail-dialog";

type UserListProps = {
  users: UserRecord[];
  compact?: boolean;
};

type UserStatusFilter = "all" | "active" | "blocked";
type UserSort = "newest" | "oldest" | "name";

function matchesSearch(user: UserRecord, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const haystack = [
    user.fullName,
    user.username,
    user.mobile,
    user.id,
    user.countryCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function sortUsers(users: UserRecord[], sort: UserSort): UserRecord[] {
  const sorted = [...users];

  if (sort === "name") {
    return sorted.sort((a, b) => {
      const nameA = (a.fullName ?? a.username ?? a.id).toLowerCase();
      const nameB = (b.fullName ?? b.username ?? b.id).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  if (sort === "oldest") {
    return sorted.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }

  return sorted.sort((a, b) => {
    if (!a.createdAt && !b.createdAt) return 0;
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

type UserListFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: UserStatusFilter;
  onStatusFilterChange: (value: UserStatusFilter) => void;
  sort: UserSort;
  onSortChange: (value: UserSort) => void;
  shownCount: number;
  totalCount: number;
  blockedCount: number;
};

function UserListFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sort,
  onSortChange,
  shownCount,
  totalCount,
  blockedCount,
}: UserListFiltersProps) {
  const statusOptions: { value: UserStatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "blocked", label: "Blocked" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search name, username, mobile, or ID…"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-800 sm:max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="shrink-0">Sort</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as UserSort)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onStatusFilterChange(option.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === option.value
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {option.label}
            {option.value === "all"
              ? ` (${totalCount})`
              : option.value === "blocked" && blockedCount > 0
                ? ` (${blockedCount})`
                : ""}
          </button>
        ))}
        <span className="text-xs text-zinc-500">
          Showing {shownCount} of {totalCount}
        </span>
      </div>
    </div>
  );
}

function getUserInitials(user: UserRecord): string {
  return (
    user.fullName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ??
    user.username?.slice(0, 2).toUpperCase() ??
    "?"
  );
}

function UserAvatar({
  user,
  size = "sm",
}: {
  user: UserRecord;
  size?: "sm" | "lg";
}) {
  const initials = getUserInitials(user);
  const sizeClass = size === "lg" ? "size-32 text-3xl" : "size-9 text-xs";

  if (user.profileImageUri) {
    const imageSize = size === "lg" ? 256 : 36;
    return (
      <Image
        src={user.profileImageUri}
        alt={user.fullName ?? user.username ?? "User"}
        width={imageSize}
        height={imageSize}
        className={`${sizeClass} rounded-full object-cover`}
        unoptimized
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 ${sizeClass}`}
    >
      {initials}
    </div>
  );
}

function BlockToggle({ user }: { user: UserRecord }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    const nextBlocked = !user.isBlocked;
    const label = nextBlocked ? "block" : "unblock";
    if (!window.confirm(`Are you sure you want to ${label} @${user.username ?? user.id}?`)) return;

    setError(null);
    startTransition(async () => {
      const result = await setUserBlockedAction(user.id, nextBlocked);
      if (!result.ok) setError(result.message ?? "Action failed.");
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
          user.isBlocked
            ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        }`}
      >
        {isPending
          ? user.isBlocked ? "Unblocking…" : "Blocking…"
          : user.isBlocked ? "Blocked · Unblock" : "Block"}
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function UserList({ users, compact = false }: UserListProps) {
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetailPayload | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [sort, setSort] = useState<UserSort>("newest");

  async function openUserDetail(user: UserRecord) {
    setSelectedUser(user);
    setUserDetail(null);
    setDetailError(null);
    setDetailLoading(true);

    const result = await fetchUserDetail(user.id);

    setDetailLoading(false);

    if (!result.ok) {
      setDetailError(result.message ?? "Could not load user details.");
      return;
    }

    setUserDetail(result.detail);
  }

  async function refreshUserDetail() {
    if (!selectedUser) {
      return;
    }

    setDetailLoading(true);
    setDetailError(null);

    const result = await fetchUserDetail(selectedUser.id);

    setDetailLoading(false);

    if (!result.ok) {
      setDetailError(result.message ?? "Could not load user details.");
      return;
    }

    setUserDetail(result.detail);
    setSelectedUser(result.detail.user);
  }

  function closeUserDetail() {
    setSelectedUser(null);
    setUserDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  }

  const blockedCount = useMemo(
    () => users.filter((user) => user.isBlocked).length,
    [users],
  );

  const filteredUsers = useMemo(() => {
    const filtered = users.filter((user) => {
      if (statusFilter === "active" && user.isBlocked) {
        return false;
      }
      if (statusFilter === "blocked" && !user.isBlocked) {
        return false;
      }
      return matchesSearch(user, search);
    });

    return sortUsers(filtered, sort);
  }, [users, search, statusFilter, sort]);

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
      <div className="space-y-4">
        <UserListFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sort={sort}
          onSortChange={setSort}
          shownCount={filteredUsers.length}
          totalCount={users.length}
          blockedCount={blockedCount}
        />
        {filteredUsers.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No users match your search or filters.
            </p>
          </div>
        ) : (
        <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => void openUserDetail(user)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
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
            </button>
          ))}
        </div>
        )}
        {selectedUser && (
          <UserDetailDialog
            key={selectedUser.id}
            detail={userDetail}
            loading={detailLoading}
            error={detailError}
            open
            onClose={closeUserDetail}
            onRefresh={() => void refreshUserDetail()}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <UserListFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sort={sort}
        onSortChange={setSort}
        shownCount={filteredUsers.length}
        totalCount={users.length}
        blockedCount={blockedCount}
      />
      {filteredUsers.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No users match your search or filters.
          </p>
        </div>
      ) : (
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              {["User", "Username", "Mobile", "Gender", "Country", "Joined", "ID", "Action"].map(
                (heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                onClick={() => void openUserDetail(user)}
                className={`cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 ${
                  user.isBlocked ? "bg-red-50/40 dark:bg-red-950/10" : ""
                }`}
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
                <td
                  className="whitespace-nowrap px-4 py-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  <BlockToggle user={user} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      )}
      {selectedUser && (
        <UserDetailDialog
          key={selectedUser.id}
          detail={userDetail}
          loading={detailLoading}
          error={detailError}
          open
          onClose={closeUserDetail}
          onRefresh={() => void refreshUserDetail()}
        />
      )}
    </div>
  );
}
