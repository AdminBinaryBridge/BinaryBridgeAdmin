"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "@/app/login/actions";

type LoginFormProps = {
  nextPath: string;
};

const initialState: LoginState = {};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-xs font-medium uppercase tracking-wide text-zinc-500"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-xs font-medium uppercase tracking-wide text-zinc-500"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>
      {state.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
