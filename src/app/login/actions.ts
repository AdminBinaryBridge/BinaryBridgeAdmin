"use server";

import { redirect } from "next/navigation";

import { verifyAdminCredentials } from "@/lib/auth/credentials";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (!verifyAdminCredentials(email, password)) {
    return { error: "Invalid email or password." };
  }

  const token = await createSessionToken(email.trim().toLowerCase());
  await setSessionCookie(token);

  redirect(nextPath.startsWith("/admin") ? nextPath : "/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
