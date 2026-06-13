import type { Metadata } from "next";

import { LoginForm } from "@/app/login/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/admin") ? params.next : "/admin";

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 space-y-1 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Binary Bridge
          </p>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Admin sign in
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sign in to access the admin panel.
          </p>
        </div>
        <LoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}
